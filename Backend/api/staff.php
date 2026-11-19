<?php
/**
 * HEAL Clinic — Staff & Doctors Master API
 * GET  /api/staff
 * GET  /api/staff/:id
 * POST /api/staff
 * PUT  /api/staff/:id
 */

Auth::require();
$db = db();
$branchId = Auth::branchId();

switch (true) {

    // GET /api/staff/:id
    case ($method === 'GET' && !empty($id)):
        $stmt = $db->prepare("
            SELECT s.id, s.branch_id, s.department_id, s.username, s.full_name,
                   s.role, s.doctor_reg_no, s.specialisation, s.phone, s.email,
                   s.is_active, s.created_at, d.name as department_name, b.name as branch_name
            FROM staff s
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN branches b ON s.branch_id = b.id
            WHERE s.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) Response::error('Staff member not found', 404);
        Response::json($row);
        break;

    // GET /api/staff
    case ($method === 'GET' && empty($id)):
        $role = $_GET['role'] ?? null;
        $query = "
            SELECT s.id, s.branch_id, s.department_id, s.username, s.full_name,
                   s.role, s.doctor_reg_no, s.specialisation, s.phone, s.email,
                   s.is_active, d.name as department_name, b.name as branch_name
            FROM staff s
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN branches b ON s.branch_id = b.id
            WHERE s.is_active = 1
        ";
        $params = [];
        if ($role) {
            $query .= " AND s.role = :role";
            $params[':role'] = $role;
        }
        $query .= " ORDER BY s.full_name ASC";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        Response::json($stmt->fetchAll());
        break;

    // POST /api/staff
    case ($method === 'POST' && empty($id)):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER]);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $val = new Validator($data);
        $val->required('username')->required('password')->required('full_name')->required('role');
        if ($val->hasErrors()) Response::validationError($val->getErrors());

        // Check duplicate username
        $check = $db->prepare("SELECT id FROM staff WHERE username = :u");
        $check->execute([':u' => $data['username']]);
        if ($check->fetch()) {
            Response::error('Username already taken', 409);
        }

        $staffId = bin2hex(random_bytes(16));
        $hash = password_hash($data['password'], PASSWORD_BCRYPT);

        $stmt = $db->prepare("
            INSERT INTO staff (
                id, branch_id, department_id, username, password_hash, full_name,
                role, doctor_reg_no, specialisation, phone, email, is_active
            ) VALUES (
                :id, :branch_id, :department_id, :username, :password_hash, :full_name,
                :role, :reg_no, :spec, :phone, :email, 1
            )
        ");
        $stmt->execute([
            ':id'            => $staffId,
            ':branch_id'     => $data['branch_id'] ?? $branchId,
            ':department_id' => $data['department_id'] ?? null,
            ':username'      => $data['username'],
            ':password_hash' => $hash,
            ':full_name'     => $data['full_name'],
            ':role'          => $data['role'],
            ':reg_no'        => $data['doctor_reg_no'] ?? null,
            ':spec'          => $data['specialisation'] ?? null,
            ':phone'         => $data['phone'] ?? null,
            ':email'         => $data['email'] ?? null,
        ]);
        Response::json(['id' => $staffId, 'message' => 'Staff member created successfully'], 201);
        break;

    // PUT /api/staff/:id
    case ($method === 'PUT' && !empty($id)):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER]);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $stmt = $db->prepare("
            UPDATE staff SET
                full_name = :full_name, role = :role, doctor_reg_no = :reg_no,
                specialisation = :spec, phone = :phone, email = :email, is_active = :active
            WHERE id = :id
        ");
        $stmt->execute([
            ':id'        => $id,
            ':full_name' => $data['full_name'],
            ':role'      => $data['role'],
            ':reg_no'    => $data['doctor_reg_no'] ?? null,
            ':spec'      => $data['specialisation'] ?? null,
            ':phone'     => $data['phone'] ?? null,
            ':email'     => $data['email'] ?? null,
            ':active'    => isset($data['is_active']) ? (int)$data['is_active'] : 1,
        ]);
        Response::json(['message' => 'Staff member updated']);
        break;

    default:
        Response::error('Invalid request method for staff', 405);
}
