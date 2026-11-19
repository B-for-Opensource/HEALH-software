<?php
/**
 * HEAL Clinic — Departments Master API
 * GET  /api/departments
 * POST /api/departments
 */

Auth::require();
$db = db();
$branchId = Auth::branchId();

switch (true) {

    // GET /api/departments
    case ($method === 'GET' && empty($id)):
        $stmt = $db->query("SELECT * FROM departments WHERE is_active = 1 ORDER BY name ASC");
        Response::json($stmt->fetchAll());
        break;

    // POST /api/departments
    case ($method === 'POST' && empty($id)):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER]);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $val = new Validator($data);
        $val->required('name')->required('code');
        if ($val->hasErrors()) Response::validationError($val->getErrors());

        $deptId = bin2hex(random_bytes(16));
        $stmt = $db->prepare("
            INSERT INTO departments (id, branch_id, name, code, description, is_active)
            VALUES (:id, :bid, :name, :code, :desc, 1)
        ");
        $stmt->execute([
            ':id'   => $deptId,
            ':bid'  => $data['branch_id'] ?? $branchId,
            ':name' => $data['name'],
            ':code' => strtoupper($data['code']),
            ':desc' => $data['description'] ?? null,
        ]);
        Response::json(['id' => $deptId, 'message' => 'Department created successfully'], 201);
        break;

    default:
        Response::error('Invalid request method for departments', 405);
}
