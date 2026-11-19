<?php
/**
 * HEAL Clinic — Appointments & Token Queue API
 * POST /api/appointments         - Create token / appointment
 * GET  /api/appointments         - Live queue for today
 * GET  /api/appointments/followups - Review due today/tomorrow
 * PUT  /api/appointments/:id/status - Update status
 * DELETE /api/appointments/:id   - Cancel
 */

Auth::require();
$db = db();
$branchId = Auth::branchId();
$today = date('Y-m-d');

switch (true) {

    // GET /api/appointments/followups
    case ($method === 'GET' && $id === 'followups'):
        $stmt = $db->prepare("
            SELECT
                p.id AS patient_id, p.op_no, p.first_name, p.last_name, p.phone,
                c.review_date, c.review_instructions,
                s.name AS doctor_name,
                c.diagnosis
            FROM consultations c
            JOIN patients p ON p.id = c.patient_id
            JOIN staff s ON s.id = c.doctor_id
            WHERE c.review_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 2 DAY)
              AND c.branch_id = :bid
            ORDER BY c.review_date ASC
        ");
        $stmt->execute([':bid' => $branchId]);
        Response::json($stmt->fetchAll());
        break;

    // GET /api/appointments?date=&doctor_id=
    case ($method === 'GET' && !$id):
        $date     = $_GET['date'] ?? $today;
        $doctorId = $_GET['doctor_id'] ?? null;

        $sql = "
            SELECT
                a.id, a.token_no, a.status, a.appointment_date,
                a.visit_type, a.consultation_type, a.purpose,
                a.created_at,
                p.id AS patient_id, p.op_no,
                CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) AS patient_name,
                p.phone, p.age_years, p.gender,
                s.name AS doctor_name, s.id AS doctor_id,
                d.name AS department_name
            FROM appointments a
            JOIN patients p ON p.id = a.patient_id
            JOIN staff s ON s.id = a.doctor_id
            LEFT JOIN departments d ON d.id = a.department_id
            WHERE DATE(a.appointment_date) = :date
              AND a.branch_id = :bid
        ";
        $params = [':date' => $date, ':bid' => $branchId];

        if ($doctorId) {
            $sql .= " AND a.doctor_id = :did";
            $params[':did'] = $doctorId;
        }

        $sql .= " ORDER BY a.token_no ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        Response::json($stmt->fetchAll());
        break;

    // GET /api/appointments/:id
    case ($method === 'GET' && $id && !$action):
        $stmt = $db->prepare("
            SELECT a.*, 
                   CONCAT(p.first_name, ' ', COALESCE(p.last_name,'')) AS patient_name,
                   p.phone, p.op_no, p.age_years, p.gender,
                   s.name AS doctor_name
            FROM appointments a
            JOIN patients p ON p.id = a.patient_id
            JOIN staff s ON s.id = a.doctor_id
            WHERE a.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $appt = $stmt->fetch();
        if (!$appt) Response::notFound('Appointment');
        Response::json($appt);
        break;

    // POST /api/appointments — Create token
    case ($method === 'POST' && !$id):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER, ROLE_RECEPTIONIST]);

        $v = Validator::json()
            ->required('patient_id', 'Patient')
            ->required('doctor_id',  'Doctor');
        $v->validate();

        // Get next token number for this doctor today
        $tokenStmt = $db->prepare("
            SELECT COALESCE(MAX(token_no), 0) + 1 AS next_token
            FROM appointments
            WHERE doctor_id = :did
              AND DATE(appointment_date) = :today
              AND branch_id = :bid
        ");
        $tokenStmt->execute([
            ':did'   => $v->get('doctor_id'),
            ':today' => $today,
            ':bid'   => $branchId,
        ]);
        $nextToken = (int)($tokenStmt->fetch()['next_token'] ?? 1);

        $apptId = bin2hex(random_bytes(16));
        $apptDate = $v->get('appointment_date') ?? date('Y-m-d H:i:s');

        $stmt = $db->prepare("
            INSERT INTO appointments (
                id, token_no, patient_id, doctor_id, branch_id, department_id,
                appointment_date, visit_type, consultation_type, purpose,
                status, receptionist_id, created_at
            ) VALUES (
                :id, :token, :pid, :did, :bid, :dept_id,
                :appt_date, :visit_type, :consult_type, :purpose,
                'Waiting', :rec_id, NOW()
            )
        ");

        $stmt->execute([
            ':id'           => $apptId,
            ':token'        => $nextToken,
            ':pid'          => $v->get('patient_id'),
            ':did'          => $v->get('doctor_id'),
            ':bid'          => $branchId,
            ':dept_id'      => $v->get('department_id'),
            ':appt_date'    => $apptDate,
            ':visit_type'   => $v->get('visit_type', 'Walk-in'),
            ':consult_type' => $v->get('consultation_type'),
            ':purpose'      => $v->get('purpose'),
            ':rec_id'       => Auth::id(),
        ]);

        Response::created([
            'id'       => $apptId,
            'token_no' => $nextToken,
        ], "Token #{$nextToken} issued successfully.");
        break;

    // PUT /api/appointments/:id/status
    case ($method === 'PUT' && $id && $action === 'status'):
        $v = Validator::json()
            ->required('status')
            ->in('status', [
                STATUS_WAITING, STATUS_CALLED, STATUS_IN_CONSULT,
                STATUS_PROCEDURE, STATUS_BILLING_PENDING,
                STATUS_COMPLETED, STATUS_CANCELLED, STATUS_NO_SHOW,
            ]);
        $v->validate();

        $db->prepare("UPDATE appointments SET status = :status WHERE id = :id")
           ->execute([':status' => $v->get('status'), ':id' => $id]);

        Response::json(['message' => 'Status updated.', 'status' => $v->get('status')]);
        break;

    // DELETE /api/appointments/:id
    case ($method === 'DELETE' && $id):
        Auth::requireRole([ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER, ROLE_RECEPTIONIST]);
        $db->prepare("
            UPDATE appointments SET status = 'Cancelled', cancelled_by = :uid, cancelled_at = NOW()
            WHERE id = :id
        ")->execute([':uid' => Auth::id(), ':id' => $id]);
        Response::json(['message' => 'Appointment cancelled.']);
        break;

    default:
        Response::error('Appointments endpoint not found.', 404);
}
