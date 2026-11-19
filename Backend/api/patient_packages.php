<?php
/**
 * HEAL Clinic — Patient Packages API
 * GET  /api/patient-packages?patient_id=xxx
 * POST /api/patient-packages
 * PUT  /api/patient-packages/:id
 */

Auth::require();
$db = db();
$branchId = Auth::branchId();
$userId = Auth::id();

switch (true) {

    // GET /api/patient-packages?patient_id=xxx
    case ($method === 'GET' && empty($id)):
        $patientId = $_GET['patient_id'] ?? null;
        if (!$patientId) {
            Response::error('patient_id query parameter is required', 400);
        }

        $stmt = $db->prepare("
            SELECT pp.*, 
                   tp.name as package_name, tp.category, tp.code as package_code,
                   p.first_name, p.last_name, p.op_no
            FROM patient_packages pp
            JOIN treatment_packages tp ON pp.package_id = tp.id
            JOIN patients p ON pp.patient_id = p.id
            WHERE pp.patient_id = :pid
            ORDER BY pp.created_at DESC
        ");
        $stmt->execute([':pid' => $patientId]);
        Response::json($stmt->fetchAll());
        break;

    // POST /api/patient-packages
    case ($method === 'POST' && empty($id)):
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $val = new Validator($data);
        $val->required('patient_id')->required('package_id');
        if ($val->hasErrors()) Response::validationError($val->getErrors());

        // Get package template
        $pStmt = $db->prepare("SELECT * FROM treatment_packages WHERE id = :id");
        $pStmt->execute([':id' => $data['package_id']]);
        $pkgTemplate = $pStmt->fetch();
        if (!$pkgTemplate) Response::error('Invalid treatment package ID', 404);

        $ppId = bin2hex(random_bytes(16));
        $validityMonths = (int)($pkgTemplate['validity_months'] ?? 12);
        $expiryDate = date('Y-m-d', strtotime("+$validityMonths months"));

        $stmt = $db->prepare("
            INSERT INTO patient_packages (
                id, patient_id, package_id, sold_by, branch_id, purchase_date,
                expiry_date, total_sessions, sessions_used, amount_paid, bill_id, status, notes
            ) VALUES (
                :id, :patient_id, :package_id, :sold_by, :branch_id, CURDATE(),
                :expiry_date, :total_sessions, 0, :amount_paid, :bill_id, 'Active', :notes
            )
        ");

        $stmt->execute([
            ':id'             => $ppId,
            ':patient_id'     => $data['patient_id'],
            ':package_id'     => $data['package_id'],
            ':sold_by'        => $userId,
            ':branch_id'      => $branchId,
            ':expiry_date'    => $expiryDate,
            ':total_sessions' => (int)$pkgTemplate['total_sessions'],
            ':amount_paid'    => (float)($data['amount_paid'] ?? $pkgTemplate['package_price']),
            ':bill_id'        => $data['bill_id'] ?? null,
            ':notes'          => $data['notes'] ?? null,
        ]);

        Response::json(['id' => $ppId, 'message' => 'Package enrolled to patient successfully'], 201);
        break;

    // PUT /api/patient-packages/:id
    case ($method === 'PUT' && !empty($id)):
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $stmt = $db->prepare("UPDATE patient_packages SET status = :status, notes = :notes WHERE id = :id");
        $stmt->execute([
            ':id'     => $id,
            ':status' => $data['status'] ?? 'Active',
            ':notes'  => $data['notes'] ?? null,
        ]);
        Response::json(['message' => 'Package status updated']);
        break;

    default:
        Response::error('Invalid request method for patient-packages', 405);
}
