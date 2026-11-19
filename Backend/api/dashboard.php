<?php
/**
 * HEAL Clinic — Live Dashboard Metrics API
 * GET /api/dashboard
 */

Auth::require();
$db = db();
$branchId = Auth::branchId();
$today = date('Y-m-d');

// Today's Appointments count
$stmt = $db->prepare("
    SELECT 
        COUNT(*) as total_patients,
        SUM(CASE WHEN status = 'Waiting' THEN 1 ELSE 0 END) as waiting_count,
        SUM(CASE WHEN status IN ('In-Consult', 'Called') THEN 1 ELSE 0 END) as in_consult_count,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_count
    FROM appointments 
    WHERE branch_id = :bid AND DATE(appointment_date) = :today
");
$stmt->execute([':bid' => $branchId, ':today' => $today]);
$apptMetrics = $stmt->fetch();

// Today's Collections & Revenue
$bStmt = $db->prepare("
    SELECT 
        COALESCE(SUM(net_amount), 0) as today_revenue,
        COALESCE(SUM(amount_paid), 0) as today_paid,
        COALESCE(SUM(balance_due), 0) as today_due
    FROM bills
    WHERE branch_id = :bid AND DATE(created_at) = :today AND status != 'Cancelled'
");
$bStmt->execute([':bid' => $branchId, ':today' => $today]);
$billMetrics = $bStmt->fetch();

// Today's Payments by Mode
$pStmt = $db->prepare("
    SELECT payment_mode, COALESCE(SUM(amount), 0) as total_mode
    FROM payments
    WHERE branch_id = :bid AND DATE(payment_date) = :today
    GROUP BY payment_mode
");
$pStmt->execute([':bid' => $branchId, ':today' => $today]);
$modeRows = $pStmt->fetchAll();

$cash = 0.0;
$upi  = 0.0;
$card = 0.0;
foreach ($modeRows as $r) {
    if ($r['payment_mode'] === 'Cash') $cash = (float)$r['total_mode'];
    if ($r['payment_mode'] === 'UPI')  $upi  = (float)$r['total_mode'];
    if ($r['payment_mode'] === 'Card') $card = (float)$r['total_mode'];
}

// Top Doctors today / this week
$docStmt = $db->prepare("
    SELECT s.full_name as name, d.name as department,
           COUNT(DISTINCT a.id) as patients,
           COALESCE(SUM(b.net_amount), 0) as revenue
    FROM staff s
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN appointments a ON a.doctor_id = s.id AND DATE(a.appointment_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    LEFT JOIN bills b ON b.doctor_id = s.id AND DATE(b.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND b.status != 'Cancelled'
    WHERE s.role = 'Doctor' AND s.branch_id = :bid
    GROUP BY s.id, s.full_name, d.name
    ORDER BY revenue DESC
    LIMIT 5
");
$docStmt->execute([':bid' => $branchId]);
$topDocs = $docStmt->fetchAll();

Response::json([
    'today_patients'   => (int)($apptMetrics['total_patients'] ?? 0),
    'waiting_count'    => (int)($apptMetrics['waiting_count'] ?? 0),
    'in_consult_count' => (int)($apptMetrics['in_consult_count'] ?? 0),
    'completed_count'  => (int)($apptMetrics['completed_count'] ?? 0),
    'today_revenue'    => (float)($billMetrics['today_revenue'] ?? 0),
    'today_paid'       => (float)($billMetrics['today_paid'] ?? 0),
    'today_due'        => (float)($billMetrics['today_due'] ?? 0),
    'cash_collections' => $cash,
    'upi_collections'  => $upi,
    'card_collections' => $card,
    'top_doctors'      => $topDocs,
]);
