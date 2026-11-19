<?php
/**
 * HEAL Clinic — Auth API
 * POST /api/auth/login
 * GET  /api/auth/me
 */

$action = $id ?? ''; // /auth/login -> $id = 'login'

switch ("$method:$action") {

    // -------------------------------------------------------------------------
    // POST /api/auth/login
    // -------------------------------------------------------------------------
    case 'POST:login':
        $v = Validator::json()
            ->required('username')
            ->required('password');
        $v->validate();

        $username = strtolower(trim($v->get('username')));
        $password = $v->get('password');

        $stmt = db()->prepare("
            SELECT s.*, b.name AS branch_name
            FROM staff s
            LEFT JOIN branches b ON b.id = s.branch_id
            WHERE s.username = :username AND s.is_active = 1
            LIMIT 1
        ");
        $stmt->execute([':username' => $username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::error('Invalid username or password.', 401);
        }

        // Build JWT payload
        $token = JWT::create([
            'id'          => $user['id'],
            'name'        => $user['name'],
            'username'    => $user['username'],
            'role'        => $user['role'],
            'branch_id'   => $user['branch_id'],
            'branch_name' => $user['branch_name'],
        ]);

        // Update last login
        db()->prepare("UPDATE staff SET last_login = NOW() WHERE id = :id")
            ->execute([':id' => $user['id']]);

        Response::json([
            'token' => $token,
            'user'  => [
                'id'          => $user['id'],
                'name'        => $user['name'],
                'role'        => $user['role'],
                'branch_id'   => $user['branch_id'],
                'branch_name' => $user['branch_name'],
            ],
        ]);
        break;

    // -------------------------------------------------------------------------
    // GET /api/auth/me  — returns current user from token
    // -------------------------------------------------------------------------
    case 'GET:me':
        Auth::require();
        $user = Auth::user();

        $stmt = db()->prepare("
            SELECT s.id, s.name, s.username, s.role, s.email, s.phone,
                   s.branch_id, b.name AS branch_name, s.last_login
            FROM staff s
            LEFT JOIN branches b ON b.id = s.branch_id
            WHERE s.id = :id
        ");
        $stmt->execute([':id' => $user['id']]);
        $profile = $stmt->fetch();

        if (!$profile) {
            Response::unauthorised('User not found.');
        }

        Response::json($profile);
        break;

    // -------------------------------------------------------------------------
    // POST /api/auth/change-password
    // -------------------------------------------------------------------------
    case 'POST:change-password':
        Auth::require();
        $v = Validator::json()
            ->required('current_password')
            ->required('new_password')
            ->string('new_password', 8, 100);
        $v->validate();

        $stmt = db()->prepare("SELECT password_hash FROM staff WHERE id = :id");
        $stmt->execute([':id' => Auth::id()]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($v->get('current_password'), $row['password_hash'])) {
            Response::error('Current password is incorrect.', 400);
        }

        $newHash = password_hash($v->get('new_password'), PASSWORD_BCRYPT);
        db()->prepare("UPDATE staff SET password_hash = :hash WHERE id = :id")
            ->execute([':hash' => $newHash, ':id' => Auth::id()]);

        Response::json(['message' => 'Password changed successfully.']);
        break;

    default:
        Response::error('Auth endpoint not found.', 404);
}
