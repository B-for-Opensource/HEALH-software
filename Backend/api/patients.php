<?php
/**
 * HEAL Clinic — Patients API
 * GET    /api/patients           - List patients (branch-scoped)
 * POST   /api/patients           - Register new patient
 * GET    /api/patients/:id       - Get single patient
 * PUT    /api/patients/:id       - Update patient
 * GET    /api/patients/:id/history - Visit history timeline
 * GET    /api/patients/search?q= - Search by name/phone/OP no
 */

Auth::require();
$db = db();
$branchId = Auth::branchId();

// Helpers
function generateOpNumber(PDO $db, string $branchId): string
{
    $stmt = $db->prepare("SELECT branch_code FROM branches WHERE id = :id");
    $stmt->execute([':id' => $branchId]);
    $branch = $stmt->fetch();
    $prefix = strtoupper($branch['branch_code'] ?? 'HEAL');

    $stmt = $db->prepare("
        SELECT COUNT(*) as cnt FROM patients WHERE branch_id = :bid
    ");
    $stmt->execute([':bid' => $branchId]);
    $count = (int)($stmt->fetch()['cnt'] ?? 0);
    return $prefix . '-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
}

// ---- Route ----
switch (true) {

    // GET /api/patients/search?q=
    case ($method === 'GET' && $id === 'search'):
        $q    = trim($_GET['q'] ?? '');
        $page = max(1, (int)($_GET['page'] ?? 1));
        $ps   = DEFAULT_PAGE_SIZE;

        if (strlen($q) < 2) {
            Response::json([]);
        }

        $like = "%$q%";
        $stmt = $db->prepare("
            SELECT id, op_no, first_name, last_name, phone, gender,
                   age_years, city, consultation_type, balance_advance
            FROM patients
            WHERE (first_name LIKE :q OR last_name LIKE :q OR phone LIKE :q OR op_no LIKE :q)
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':q', $like);
        $stmt->bindValue(':limit', $ps, PDO::PARAM_INT);
        $stmt->bindValue(':offset', ($page - 1) * $ps, PDO::PARAM_INT);
        $stmt->execute();
        Response::json($stmt->fetchAll());
        break;

    // GET /api/patients/:id/history
    case ($method === 'GET' && $id && $action === 'history'):
        $stmt = $db->prepare("
            SELECT
                a.id AS appointment_id,
                a.appointment_date,
                a.token_no,
                a.status,
                a.consultation_type,
                s.name AS doctor_name,
                c.id AS consultation_id,
                c.diagnosis,
                c.chief_complaints,
                c.review_date,
                (SELECT COUNT(*) FROM prescription_items pi2
                 JOIN prescriptions p2 ON p2.id = pi2.prescription_id
                 WHERE p2.consultation_id = c.id) AS rx_count
            FROM appointments a
            LEFT JOIN staff s ON s.id = a.doctor_id
            LEFT JOIN consultations c ON c.appointment_id = a.id
            WHERE a.patient_id = :pid
            ORDER BY a.appointment_date DESC
            LIMIT 50
        ");
        $stmt->execute([':pid' => $id]);
        Response::json($stmt->fetchAll());
        break;

    // GET /api/patients
    case ($method === 'GET' && !$id):
        $page = max(1, (int)($_GET['page'] ?? 1));
        $ps   = min(100, (int)($_GET['per_page'] ?? DEFAULT_PAGE_SIZE));

        // Count total
        $countStmt = $db->prepare("SELECT COUNT(*) as cnt FROM patients");
        $countStmt->execute();
        $total = (int)($countStmt->fetch()['cnt'] ?? 0);

        $stmt = $db->prepare("
            SELECT id, op_no, first_name, last_name, phone, gender,
                   age_years, city, consultation_type, blood_group,
                   balance_advance, created_at
            FROM patients
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':limit', $ps, PDO::PARAM_INT);
        $stmt->bindValue(':offset', ($page - 1) * $ps, PDO::PARAM_INT);
        $stmt->execute();
        Response::list($stmt->fetchAll(), $total, $page, $ps);
        break;

    // GET /api/patients/:id
    case ($method === 'GET' && $id):
        $stmt = $db->prepare("
            SELECT p.*,
                   b.name AS branch_name,
                   (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) AS visit_count,
                   (SELECT COUNT(*) FROM patient_packages pp WHERE pp.patient_id = p.id AND pp.status = 'Active') AS active_packages
            FROM patients p
            LEFT JOIN branches b ON b.id = p.branch_id
            WHERE p.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $patient = $stmt->fetch();

        if (!$patient) Response::notFound('Patient');
        Response::json($patient);
        break;

    // POST /api/patients — Register new patient
    case ($method === 'POST' && !$id):
        $v = Validator::json()
            ->required('first_name', 'First Name')
            ->required('phone',      'Phone Number')
            ->required('gender',     'Gender')
            ->phone('phone')
            ->email('email')
            ->in('gender', ['Male', 'Female', 'Other'])
            ->in('consultation_type', ['Aesthetic', 'Allopathy', 'Ayurveda', 'Homeopathy', 'Dental', '']);
        $v->validate();

        // Duplicate phone check
        $dupStmt = $db->prepare("SELECT id, op_no, first_name FROM patients WHERE phone = :phone LIMIT 1");
        $dupStmt->execute([':phone' => $v->get('phone')]);
        $existing = $dupStmt->fetch();
        if ($existing) {
            Response::error("Phone number already registered. Patient: {$existing['first_name']} (OP: {$existing['op_no']})", 409, [
                'existing_patient_id' => $existing['id'],
                'op_no'               => $existing['op_no'],
            ]);
        }

        $opNo = generateOpNumber($db, $branchId);
        $pid  = bin2hex(random_bytes(16));

        $stmt = $db->prepare("
            INSERT INTO patients (
                id, op_no, branch_id, first_name, last_name, phone, alt_phone,
                email, date_of_birth, age_years, gender, blood_group,
                relative_name, relation_type, address, city, district, pincode,
                consultation_type, known_allergies, created_by, created_at
            ) VALUES (
                :id, :op_no, :branch_id, :first_name, :last_name, :phone, :alt_phone,
                :email, :dob, :age, :gender, :blood_group,
                :relative_name, :relation_type, :address, :city, :district, :pincode,
                :consultation_type, :allergies, :created_by, NOW()
            )
        ");

        $stmt->execute([
            ':id'                => $pid,
            ':op_no'             => $opNo,
            ':branch_id'         => $branchId,
            ':first_name'        => trim($v->get('first_name')),
            ':last_name'         => trim($v->get('last_name', '')),
            ':phone'             => $v->get('phone'),
            ':alt_phone'         => $v->get('alt_phone'),
            ':email'             => $v->get('email'),
            ':dob'               => $v->get('date_of_birth') ?: null,
            ':age'               => $v->get('age_years') ?: null,
            ':gender'            => $v->get('gender'),
            ':blood_group'       => $v->get('blood_group'),
            ':relative_name'     => $v->get('relative_name'),
            ':relation_type'     => $v->get('relation_type'),
            ':address'           => $v->get('address'),
            ':city'              => $v->get('city'),
            ':district'          => $v->get('district'),
            ':pincode'           => $v->get('pincode'),
            ':consultation_type' => $v->get('consultation_type'),
            ':allergies'         => $v->get('known_allergies'),
            ':created_by'        => Auth::id(),
        ]);

        Response::created([
            'id'    => $pid,
            'op_no' => $opNo,
            'name'  => trim($v->get('first_name') . ' ' . $v->get('last_name', '')),
        ], "Patient registered successfully. OP No: $opNo");
        break;

    // PUT /api/patients/:id — Update patient
    case ($method === 'PUT' && $id):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER, ROLE_RECEPTIONIST]);
        $v = Validator::json()
            ->email('email')
            ->phone('phone');
        $v->validate();

        $allowed = ['first_name','last_name','phone','alt_phone','email',
                    'date_of_birth','age_years','gender','blood_group',
                    'relative_name','relation_type','address','city',
                    'district','pincode','consultation_type','known_allergies'];

        $set = [];
        $params = [':id' => $id];
        foreach ($allowed as $f) {
            $val = $v->get($f);
            if ($val !== null) {
                $set[] = "$f = :$f";
                $params[":$f"] = $val;
            }
        }

        if (empty($set)) {
            Response::error('No fields to update.', 400);
        }

        $db->prepare("UPDATE patients SET " . implode(', ', $set) . " WHERE id = :id")
           ->execute($params);

        Response::json(['message' => 'Patient updated successfully.']);
        break;

    default:
        Response::error('Patients endpoint not found.', 404);
}
