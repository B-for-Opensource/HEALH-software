<?php
/**
 * HEAL Clinic — Financial & Operational Reports API
 * GET /api/reports/collection
 * GET /api/reports/billing
 * GET /api/reports/doctor
 * GET /api/reports/trend
 */

Auth::require();
$db = db();
$branchId = Auth::branchId();

switch (true) {

    // GET /api/reports/collection
    case ($method === 'GET' && $id === 'collection'):
        $fromDate = $_GET['from_date'] ?? date('Y-m-d');
        $toDate   = $_GET['to_date'] ?? date('Y-m-d');
        $mode     = $_GET['payment_mode'] ?? null;

        $query = "
            SELECT b.id, b.bill_no, b.bill_date, b.patient_id, b.net_amount, b.amount_paid,
                   b.payment_status, b.status, b.created_at,
                   p.first_name, p.last_name, p.op_no,
                   s.full_name as doctor_name,
                   COALESCE((SELECT SUM(amount) FROM payments WHERE bill_id = b.id AND payment_mode = 'Cash'), 0) as cash_amount,
                   COALESCE((SELECT SUM(amount) FROM payments WHERE bill_id = b.id AND payment_mode = 'UPI'), 0) as upi_amount,
                   COALESCE((SELECT SUM(amount) FROM payments WHERE bill_id = b.id AND payment_mode = 'Card'), 0) as card_amount
            FROM bills b
            JOIN patients p ON b.patient_id = p.id
            LEFT JOIN staff s ON b.doctor_id = s.id
            WHERE b.branch_id = :bid
              AND DATE(b.created_at) BETWEEN :from AND :to
              AND b.status != 'Cancelled'
        ";

        if ($mode) {
            $query .= " AND EXISTS (SELECT 1 FROM payments py WHERE py.bill_id = b.id AND py.payment_mode = :pmode)";
        }

        $query .= " ORDER BY b.created_at DESC";

        $stmt = $db->prepare($query);
        $params = [
            ':bid'  => $branchId,
            ':from' => $fromDate,
            ':to'   => $toDate,
        ];
        if ($mode) $params[':pmode'] = $mode;

        $stmt->execute($params);
        Response::json($stmt->fetchAll());
        break;

    // GET /api/reports/trend
    case ($method === 'GET' && $id === 'trend'):
        // Last 7 days daily collection
        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $dayDate = date('Y-m-d', strtotime("-$i days"));
            $dayLabel = ($i === 0) ? 'Today' : date('D', strtotime($dayDate));

            $stmt = $db->prepare("
                SELECT COALESCE(SUM(amount_paid), 0) as total_rev, COUNT(*) as bill_count
                FROM bills
                WHERE branch_id = :bid 
                  AND DATE(created_at) = :d
                  AND status != 'Cancelled'
            ");
            $stmt->execute([':bid' => $branchId, ':d' => $dayDate]);
            $row = $stmt->fetch();

            $trend[] = [
                'day'      => $dayLabel,
                'date'     => $dayDate,
                'revenue'  => (float)($row['total_rev'] ?? 0),
                'patients' => (int)($row['bill_count'] ?? 0),
            ];
        }
        Response::json($trend);
        break;

    // GET /api/reports/doctor
    case ($method === 'GET' && $id === 'doctor'):
        $stmt = $db->prepare("
            SELECT s.id, s.full_name as doctor_name, d.name as department_name,
                   COUNT(DISTINCT a.id) as total_consults,
                   COALESCE(SUM(b.net_amount), 0) as total_revenue
            FROM staff s
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN appointments a ON a.doctor_id = s.id AND a.status = 'Completed'
            LEFT JOIN bills b ON b.doctor_id = s.id AND b.status != 'Cancelled'
            WHERE s.role = 'Doctor' AND s.branch_id = :bid
            GROUP BY s.id, s.full_name, d.name
            ORDER BY total_revenue DESC
        ");
        $stmt->execute([':bid' => $branchId]);
        Response::json($stmt->fetchAll());
        break;

    // GET /api/reports/billing
    case ($method === 'GET' && $id === 'billing'):
        $stmt = $db->prepare("
            SELECT DATE(created_at) as bill_date,
                   COUNT(*) as total_bills,
                   SUM(subtotal) as gross_amount,
                   SUM(discount_amount) as total_discount,
                   SUM(net_amount) as net_amount,
                   SUM(amount_paid) as collected_amount,
                   SUM(balance_due) as outstanding_amount
            FROM bills
            WHERE branch_id = :bid AND status != 'Cancelled'
            GROUP BY DATE(created_at)
            ORDER BY bill_date DESC
            LIMIT 30
        ");
        $stmt->execute([':bid' => $branchId]);
        Response::json($stmt->fetchAll());
        break;

    default:
        Response::error('Report endpoint not found', 404);
}
