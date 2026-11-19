<?php
/**
 * HEAL Clinic — Billing API
 * POST /api/bills                     - Create bill
 * GET  /api/bills?patient_id=&date=   - List bills
 * GET  /api/bills/:id                 - Get bill details
 * POST /api/bills/:id/pay             - Record payment
 * PUT  /api/bills/:id/cancel          - Cancel bill (admin)
 */

Auth::require();
$db = db();
$branchId = Auth::branchId();

function generateBillNo(PDO $db, string $branchId): string
{
    $stmt = $db->prepare("SELECT branch_code FROM branches WHERE id = :id");
    $stmt->execute([':id' => $branchId]);
    $branch = $stmt->fetch();
    $prefix = strtoupper($branch['branch_code'] ?? 'HEAL');
    $date   = date('Ymd');

    $stmt = $db->prepare("
        SELECT COUNT(*) as cnt FROM bills WHERE branch_id = :bid AND DATE(created_at) = CURDATE()
    ");
    $stmt->execute([':bid' => $branchId]);
    $count = (int)($stmt->fetch()['cnt'] ?? 0);

    return "$prefix-INV-$date-" . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
}

switch (true) {

    // GET /api/bills
    case ($method === 'GET' && !$id):
        $page     = max(1, (int)($_GET['page'] ?? 1));
        $ps       = DEFAULT_PAGE_SIZE;
        $dateFrom = $_GET['date_from'] ?? date('Y-m-d');
        $dateTo   = $_GET['date_to']   ?? date('Y-m-d');
        $pid      = $_GET['patient_id'] ?? null;
        $doctorId = $_GET['doctor_id']  ?? null;

        $where  = "WHERE b.branch_id = :bid AND DATE(b.created_at) BETWEEN :df AND :dt AND b.status = 'Active'";
        $params = [':bid' => $branchId, ':df' => $dateFrom, ':dt' => $dateTo];

        if ($pid)      { $where .= " AND b.patient_id = :pid"; $params[':pid'] = $pid; }
        if ($doctorId) { $where .= " AND b.doctor_id = :did";  $params[':did'] = $doctorId; }

        $countStmt = $db->prepare("SELECT COUNT(*) as cnt FROM bills b $where");
        $countStmt->execute($params);
        $total = (int)($countStmt->fetch()['cnt'] ?? 0);

        $stmt = $db->prepare("
            SELECT b.id, b.bill_no, b.bill_date, b.net_amount, b.amount_paid,
                   b.balance_due, b.payment_status,
                   CONCAT(p.first_name, ' ', COALESCE(p.last_name,'')) AS patient_name,
                   p.op_no, p.phone,
                   s.name AS doctor_name,
                   cs.name AS cashier_name
            FROM bills b
            JOIN patients p ON p.id = b.patient_id
            LEFT JOIN staff s ON s.id = b.doctor_id
            LEFT JOIN staff cs ON cs.id = b.cashier_id
            $where
            ORDER BY b.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $params[':limit']  = $ps;
        $params[':offset'] = ($page - 1) * $ps;
        $stmt->bindValue(':limit',  $ps,              PDO::PARAM_INT);
        $stmt->bindValue(':offset', ($page - 1) * $ps, PDO::PARAM_INT);
        foreach ([':bid',':df',':dt'] as $k) $stmt->bindValue($k, $params[$k]);
        if ($pid)      $stmt->bindValue(':pid', $pid);
        if ($doctorId) $stmt->bindValue(':did', $doctorId);
        $stmt->execute();

        Response::list($stmt->fetchAll(), $total, $page, $ps);
        break;

    // GET /api/bills/:id
    case ($method === 'GET' && $id && !$action):
        $stmt = $db->prepare("
            SELECT b.*,
                   CONCAT(p.first_name,' ',COALESCE(p.last_name,'')) AS patient_name,
                   p.op_no, p.phone, p.address,
                   s.name AS doctor_name,
                   br.name AS branch_name, br.address AS branch_address, br.phone AS branch_phone
            FROM bills b
            JOIN patients p ON p.id = b.patient_id
            LEFT JOIN staff s ON s.id = b.doctor_id
            JOIN branches br ON br.id = b.branch_id
            WHERE b.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $bill = $stmt->fetch();
        if (!$bill) Response::notFound('Bill');

        // Get line items
        $items = $db->prepare("SELECT * FROM bill_items WHERE bill_id = :id ORDER BY sort_order");
        $items->execute([':id' => $id]);
        $bill['items'] = $items->fetchAll();

        // Get payments
        $pays = $db->prepare("SELECT * FROM payments WHERE bill_id = :id ORDER BY created_at");
        $pays->execute([':id' => $id]);
        $bill['payments'] = $pays->fetchAll();

        Response::json($bill);
        break;

    // POST /api/bills — Create bill
    case ($method === 'POST' && !$id):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER, ROLE_CASHIER, ROLE_RECEPTIONIST]);

        $v = Validator::json()->required('patient_id', 'Patient');
        $v->validate();

        $items = $v->get('items', []);
        if (empty($items)) {
            Response::error('At least one billing item is required.', 400);
        }

        $billNo = generateBillNo($db, $branchId);
        $billId = bin2hex(random_bytes(16));

        // Calculate totals
        $subtotal = 0; $cgst = 0; $sgst = 0; $discountAmt = 0;
        foreach ($items as &$item) {
            $qty      = (float)($item['quantity']     ?? 1);
            $price    = (float)($item['unit_price']   ?? 0);
            $discI    = (float)($item['discount_amount'] ?? 0);
            $taxable  = ($qty * $price) - $discI;
            $cgstPct  = (float)($item['cgst_percent'] ?? 0);
            $sgstPct  = (float)($item['sgst_percent'] ?? 0);
            $cgstAmt  = round($taxable * $cgstPct / 100, 2);
            $sgstAmt  = round($taxable * $sgstPct / 100, 2);
            $lineTotal = $taxable + $cgstAmt + $sgstAmt;

            $item['taxable_amount'] = $taxable;
            $item['cgst_amount']    = $cgstAmt;
            $item['sgst_amount']    = $sgstAmt;
            $item['line_total']     = $lineTotal;

            $subtotal    += $qty * $price;
            $discountAmt += $discI;
            $cgst        += $cgstAmt;
            $sgst        += $sgstAmt;
        }
        unset($item);

        $taxable    = $subtotal - $discountAmt;
        $netAmount  = $taxable + $cgst + $sgst;
        $advApplied = min((float)($v->get('advance_applied') ?? 0), $netAmount);
        $amtPaid    = $advApplied; // Will be updated when payment recorded
        $balDue     = $netAmount - $amtPaid;

        // Insert bill
        $db->prepare("
            INSERT INTO bills (
                id, bill_no, patient_id, consultation_id, branch_id,
                cashier_id, doctor_id, subtotal, discount_amount,
                discount_remarks, taxable_amount, cgst_amount, sgst_amount,
                net_amount, advance_applied, amount_paid, balance_due,
                payment_status, bill_date, created_at
            ) VALUES (
                :id, :bill_no, :pid, :cid, :bid,
                :cashier, :doctor, :subtotal, :discount,
                :disc_rem, :taxable, :cgst, :sgst,
                :net, :advance, :paid, :due,
                :pay_status, CURDATE(), NOW()
            )
        ")->execute([
            ':id'       => $billId,
            ':bill_no'  => $billNo,
            ':pid'      => $v->get('patient_id'),
            ':cid'      => $v->get('consultation_id'),
            ':bid'      => $branchId,
            ':cashier'  => Auth::id(),
            ':doctor'   => $v->get('doctor_id'),
            ':subtotal' => $subtotal,
            ':discount' => $discountAmt,
            ':disc_rem' => $v->get('discount_remarks'),
            ':taxable'  => $taxable,
            ':cgst'     => $cgst,
            ':sgst'     => $sgst,
            ':net'      => $netAmount,
            ':advance'  => $advApplied,
            ':paid'     => $amtPaid,
            ':due'      => $balDue,
            ':pay_status' => $balDue <= 0 ? 'Paid' : ($amtPaid > 0 ? 'Partial' : 'Unpaid'),
        ]);

        // Insert line items
        $itemStmt = $db->prepare("
            INSERT INTO bill_items (
                id, bill_id, item_type, item_name, item_code,
                quantity, unit_price, discount_amount,
                taxable_amount, cgst_percent, sgst_percent,
                cgst_amount, sgst_amount, line_total, sort_order
            ) VALUES (
                :id, :bill_id, :type, :name, :code,
                :qty, :price, :disc,
                :taxable, :cgst_pct, :sgst_pct,
                :cgst_amt, :sgst_amt, :total, :sort
            )
        ");

        foreach ($items as $i => $item) {
            $itemStmt->execute([
                ':id'       => bin2hex(random_bytes(16)),
                ':bill_id'  => $billId,
                ':type'     => $item['item_type'] ?? 'Consultation',
                ':name'     => $item['item_name'],
                ':code'     => $item['item_code'] ?? null,
                ':qty'      => $item['quantity'] ?? 1,
                ':price'    => $item['unit_price'],
                ':disc'     => $item['discount_amount'] ?? 0,
                ':taxable'  => $item['taxable_amount'],
                ':cgst_pct' => $item['cgst_percent'] ?? 0,
                ':sgst_pct' => $item['sgst_percent'] ?? 0,
                ':cgst_amt' => $item['cgst_amount'],
                ':sgst_amt' => $item['sgst_amount'],
                ':total'    => $item['line_total'],
                ':sort'     => $i,
            ]);
        }

        Response::created([
            'id'      => $billId,
            'bill_no' => $billNo,
            'net_amount' => $netAmount,
            'balance_due' => $balDue,
        ], "Bill $billNo created.");
        break;

    // POST /api/bills/:id/pay
    case ($method === 'POST' && $id && $action === 'pay'):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER, ROLE_CASHIER, ROLE_RECEPTIONIST]);

        $v = Validator::json()
            ->required('payment_mode')
            ->required('amount')
            ->numeric('amount', 1)
            ->in('payment_mode', [PAY_CASH, PAY_CARD, PAY_UPI, PAY_NETBANKING, PAY_ADVANCE]);
        $v->validate();

        $payId = bin2hex(random_bytes(16));
        $db->prepare("
            INSERT INTO payments (id, bill_id, patient_id, branch_id, cashier_id,
                payment_date, payment_time, payment_mode, card_last4, upi_ref, amount, created_at)
            SELECT :pay_id, b.id, b.patient_id, b.branch_id, :cashier,
                CURDATE(), CURTIME(), :mode, :card4, :upi_ref, :amt, NOW()
            FROM bills b WHERE b.id = :bid
        ")->execute([
            ':pay_id'  => $payId,
            ':cashier' => Auth::id(),
            ':mode'    => $v->get('payment_mode'),
            ':card4'   => $v->get('card_last4'),
            ':upi_ref' => $v->get('upi_ref'),
            ':amt'     => (float)$v->get('amount'),
            ':bid'     => $id,
        ]);

        // Recalculate bill totals
        $db->prepare("
            UPDATE bills SET
                amount_paid = (SELECT COALESCE(SUM(amount),0) FROM payments WHERE bill_id = :id),
                balance_due = net_amount - (SELECT COALESCE(SUM(amount),0) FROM payments WHERE bill_id = :id2),
                payment_status = CASE
                    WHEN net_amount <= (SELECT COALESCE(SUM(amount),0) FROM payments WHERE bill_id = :id3) THEN 'Paid'
                    WHEN (SELECT COALESCE(SUM(amount),0) FROM payments WHERE bill_id = :id4) > 0 THEN 'Partial'
                    ELSE 'Unpaid'
                END
            WHERE id = :bid
        ")->execute([':id'=>$id, ':id2'=>$id, ':id3'=>$id, ':id4'=>$id, ':bid'=>$id]);

        Response::json(['message' => 'Payment recorded.', 'payment_id' => $payId]);
        break;

    // PUT /api/bills/:id/cancel
    case ($method === 'PUT' && $id && $action === 'cancel'):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER]);

        $v = Validator::json()->required('reason', 'Cancellation Reason');
        $v->validate();

        $db->prepare("
            UPDATE bills SET status = 'Cancelled', cancel_reason = :reason,
            cancelled_by = :uid, cancelled_at = NOW()
            WHERE id = :id
        ")->execute([':reason' => $v->get('reason'), ':uid' => Auth::id(), ':id' => $id]);

        // Audit log
        $db->prepare("
            INSERT INTO audit_log (id, user_id, user_name, branch_id, action, entity_type, entity_id, remarks, created_at)
            SELECT :lid, :uid, :uname, :bid, 'CANCEL', 'Bill', :eid, :rem, NOW()
        ")->execute([
            ':lid'   => bin2hex(random_bytes(16)),
            ':uid'   => Auth::id(),
            ':uname' => Auth::user()['name'],
            ':bid'   => $branchId,
            ':eid'   => $id,
            ':rem'   => 'Bill cancelled. Reason: ' . $v->get('reason'),
        ]);

        Response::json(['message' => 'Bill cancelled successfully.']);
        break;

    default:
        Response::error('Billing endpoint not found.', 404);
}
