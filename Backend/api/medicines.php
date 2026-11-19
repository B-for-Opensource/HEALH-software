<?php
/**
 * HEAL Clinic — Medicines Master API
 * GET  /api/medicines
 * GET  /api/medicines/search?q=xxx
 * POST /api/medicines
 * PUT  /api/medicines/:id
 */

Auth::require();
$db = db();

switch (true) {

    // GET /api/medicines/search?q=xxx
    case ($method === 'GET' && $id === 'search'):
        $q = trim($_GET['q'] ?? '');
        if (strlen($q) < 1) {
            Response::json([]);
        }

        $stmt = $db->prepare("
            SELECT * FROM medicines 
            WHERE is_active = 1 
              AND (name LIKE :q OR generic_name LIKE :q OR brand_name LIKE :q)
            ORDER BY name ASC 
            LIMIT 30
        ");
        $stmt->execute([':q' => "%$q%"]);
        Response::json($stmt->fetchAll());
        break;

    // GET /api/medicines
    case ($method === 'GET' && empty($id)):
        $stmt = $db->query("SELECT * FROM medicines WHERE is_active = 1 ORDER BY name ASC LIMIT 200");
        Response::json($stmt->fetchAll());
        break;

    // POST /api/medicines
    case ($method === 'POST' && empty($id)):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER, ROLE_DOCTOR]);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $val = new Validator($data);
        $val->required('name');
        if ($val->hasErrors()) Response::validationError($val->getErrors());

        $medId = bin2hex(random_bytes(16));
        $stmt = $db->prepare("
            INSERT INTO medicines (
                id, name, generic_name, brand_name, dosage_form, strength,
                unit, default_dosage, default_frequency, default_timing, route
            ) VALUES (
                :id, :name, :generic_name, :brand_name, :dosage_form, :strength,
                :unit, :default_dosage, :default_frequency, :default_timing, :route
            )
        ");
        $stmt->execute([
            ':id'                => $medId,
            ':name'              => $data['name'],
            ':generic_name'      => $data['generic_name'] ?? null,
            ':brand_name'        => $data['brand_name'] ?? null,
            ':dosage_form'       => $data['dosage_form'] ?? 'Tablet',
            ':strength'          => $data['strength'] ?? null,
            ':unit'              => $data['unit'] ?? 'Tab',
            ':default_dosage'    => $data['default_dosage'] ?? '1 Tab',
            ':default_frequency' => $data['default_frequency'] ?? '1-0-1',
            ':default_timing'    => $data['default_timing'] ?? 'After Food',
            ':route'             => $data['route'] ?? 'Oral',
        ]);
        Response::json(['id' => $medId, 'message' => 'Medicine added successfully'], 201);
        break;

    // PUT /api/medicines/:id
    case ($method === 'PUT' && !empty($id)):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER]);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $stmt = $db->prepare("
            UPDATE medicines SET
                name = :name, generic_name = :generic_name, brand_name = :brand_name,
                dosage_form = :dosage_form, strength = :strength, is_active = :is_active
            WHERE id = :id
        ");
        $stmt->execute([
            ':id'           => $id,
            ':name'         => $data['name'],
            ':generic_name' => $data['generic_name'] ?? null,
            ':brand_name'   => $data['brand_name'] ?? null,
            ':dosage_form'  => $data['dosage_form'] ?? 'Tablet',
            ':strength'     => $data['strength'] ?? null,
            ':is_active'    => isset($data['is_active']) ? (int)$data['is_active'] : 1,
        ]);
        Response::json(['message' => 'Medicine updated']);
        break;

    default:
        Response::error('Invalid request method for medicines', 405);
}
