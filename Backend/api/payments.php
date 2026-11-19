<?php
/**
 * HEAL Clinic — Standalone Payments API
 * GET  /api/payments?bill_id=xxx
 * GET  /api/payments?patient_id=xxx
 * POST /api/payments
 */

Auth::require();
$db = db();
$branchId = Auth::branchId();
$userId = Auth::id();

switch (true) {

    // GET /api/payments
    case ($method === 'GET' && empty($id)):
        $billId = $_GET['bill_id'] ?? null;
        $patientId = $_GET['patient_id'] ?? null;

        if ($billId) {
            $stmt = $db->prepare("
                SELECT p.*, s.full_name as cashier_name
                FROM payments p
                LEFT JOIN staff s ON p.cashier_id = s.id
                WHERE p.bill_id = :bid
                ORDER BY p.created_at ASC
            ");
            $stmt->execute([':bid' => $billId]);
            Response::json($stmt->fetchAll());
        }

        if ($patientId) {
            $stmt = $db->prepare("
                SELECT p.*, b.bill_no, s.full_name as cashier_name
                FROM payments p
                JOIN bills b ON p.bill_id = b.id
                LEFT JOIN staff s ON p.cashier_id = s.id
                WHERE p.patient_id = :pid
                ORDER BY p.created_at DESC
            ");
            $stmt->execute([':pid' => $patientId]);
            Response::json($stmt->fetchAll());
        }

        Response::json([]);
        break;

    // POST /api/payments
    case ($method === 'POST' && empty($id)):
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $val = new Validator($data);
        $val->required('bill_id')->required('amount')->required('payment_mode');
        if ($val->hasErrors()) Response::validationError($val->getErrors());

        $billId = $data['bill_id'];
        $amount = (float)$data['amount'];
        if ($amount <= 0) Response::error('Payment amount must be greater than zero', 400);

        // Fetch bill
        $bStmt = $db->prepare("SELECT * FROM bills WHERE id = :id");
        $bStmt->execute([':id' => $billId]);
        $bill = $bStmt->fetch();
        if (!$bill) Response::error('Bill not found', 404);

        $payId = bin2hex(random_bytes(16));
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("
                INSERT INTO payments (
                    id, bill_id, patient_id, branch_id, cashier_id,
                    payment_date, payment_time, payment_mode, card_last4, upi_ref, amount
                ) VALUES (
                    :id, :bid, :pid, :branch_id, :cashier,
                    CURDATE(), CURTIME(), :mode, :last4, :ref, :amt
                )
            ");
            $stmt->execute([
                ':id'        => $payId,
                ':bid'       => $billId,
                ':pid'       => $bill['patient_id'],
                ':branch_id' => $branchId,
                ':cashier'   => $userId,
                ':mode'      => $data['payment_mode'],
                ':last4'     => $data['card_last4'] ?? null,
                ':ref'       => $data['upi_ref'] ?? null,
                ':amt'       => $amount,
            ]);

            // Update bill paid and balance amounts
            $newPaid = (float)$bill['amount_paid'] + $amount;
            $newBalance = max(0, (float)$bill['net_amount'] - $newPaid);
            $newStatus = ($newBalance <= 0) ? 'Paid' : 'Partial';

            $upBill = $db->prepare("
                UPDATE bills 
                SET amount_paid = :paid, balance_due = :due, payment_status = :status 
                WHERE id = :id
            ");
            $upBill->execute([
                ':paid'   => $newPaid,
                ':due'    => $newBalance,
                ':status' => $newStatus,
                ':id'     => $billId,
            ]);

            $db->commit();
            Response::json([
                'id'             => $payId,
                'amount_paid'    => $newPaid,
                'balance_due'    => $newBalance,
                'payment_status' => $newStatus,
                'message'        => 'Payment recorded successfully',
            ], 201);
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Failed to record payment: ' . $e->getMessage(), 500);
        }
        break;

    default:
        Response::error('Invalid request method for payments', 405);
}
