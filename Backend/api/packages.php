<?php
/**
 * HEAL Clinic — Treatment Packages Master API
 * GET  /api/packages
 * GET  /api/packages/:id
 * POST /api/packages
 * PUT  /api/packages/:id
 */

Auth::require();
$db = db();

switch (true) {

    // GET /api/packages/:id
    case ($method === 'GET' && !empty($id)):
        $stmt = $db->prepare("SELECT * FROM treatment_packages WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $pkg = $stmt->fetch();
        if (!$pkg) Response::error('Package not found', 404);
        Response::json($pkg);
        break;

    // GET /api/packages
    case ($method === 'GET' && empty($id)):
        $stmt = $db->query("SELECT * FROM treatment_packages WHERE is_active = 1 ORDER BY category ASC, name ASC");
        Response::json($stmt->fetchAll());
        break;

    // POST /api/packages
    case ($method === 'POST' && empty($id)):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER]);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $val = new Validator($data);
        $val->required('name')->required('total_sessions')->required('package_price');
        if ($val->hasErrors()) Response::validationError($val->getErrors());

        $pkgId = bin2hex(random_bytes(16));
        $stmt = $db->prepare("
            INSERT INTO treatment_packages (
                id, code, name, category, total_sessions, validity_months,
                package_price, cgst_percent, sgst_percent, description, is_active
            ) VALUES (
                :id, :code, :name, :category, :total_sessions, :validity_months,
                :package_price, :cgst, :sgst, :description, 1
            )
        ");
        $stmt->execute([
            ':id'              => $pkgId,
            ':code'            => $data['code'] ?? ('PKG-' . rand(100, 999)),
            ':name'            => $data['name'],
            ':category'        => $data['category'] ?? 'Aesthetic',
            ':total_sessions'  => (int)$data['total_sessions'],
            ':validity_months' => !empty($data['validity_months']) ? (int)$data['validity_months'] : 12,
            ':package_price'   => (float)$data['package_price'],
            ':cgst'            => isset($data['cgst_percent']) ? (float)$data['cgst_percent'] : 9.0,
            ':sgst'            => isset($data['sgst_percent']) ? (float)$data['sgst_percent'] : 9.0,
            ':description'     => $data['description'] ?? null,
        ]);
        Response::json(['id' => $pkgId, 'message' => 'Treatment package created successfully'], 201);
        break;

    // PUT /api/packages/:id
    case ($method === 'PUT' && !empty($id)):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER]);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $stmt = $db->prepare("
            UPDATE treatment_packages SET
                name = :name, category = :category, total_sessions = :sessions,
                validity_months = :validity, package_price = :price,
                cgst_percent = :cgst, sgst_percent = :sgst, description = :desc,
                is_active = :active
            WHERE id = :id
        ");
        $stmt->execute([
            ':id'       => $id,
            ':name'     => $data['name'],
            ':category' => $data['category'] ?? 'Aesthetic',
            ':sessions' => (int)$data['total_sessions'],
            ':validity' => (int)($data['validity_months'] ?? 12),
            ':price'    => (float)$data['package_price'],
            ':cgst'     => (float)($data['cgst_percent'] ?? 9.0),
            ':sgst'     => (float)($data['sgst_percent'] ?? 9.0),
            ':desc'     => $data['description'] ?? null,
            ':active'   => isset($data['is_active']) ? (int)$data['is_active'] : 1,
        ]);
        Response::json(['message' => 'Treatment package updated']);
        break;

    default:
        Response::error('Invalid request method for packages', 405);
}
