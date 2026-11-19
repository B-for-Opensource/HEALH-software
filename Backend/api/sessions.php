<?php
/**
 * HEAL Clinic — Package Sessions API
 * POST /api/sessions
 * GET  /api/sessions?patient_package_id=xxx
 */

Auth::require();
$db = db();
$branchId = Auth::branchId();
$userId = Auth::id();

switch (true) {

    // GET /api/sessions?patient_package_id=xxx
    case ($method === 'GET' && empty($id)):
        $ppId = $_GET['patient_package_id'] ?? null;
        if (!$ppId) Response::error('patient_package_id query parameter is required', 400);

        $stmt = $db->prepare("
            SELECT ps.*, s.full_name as performer_name, doc.full_name as doctor_name
            FROM package_sessions ps
            LEFT JOIN staff s ON ps.performed_by = s.id
            LEFT JOIN staff doc ON ps.doctor_id = doc.id
            WHERE ps.patient_package_id = :ppid
            ORDER BY ps.session_no ASC
        ");
        $stmt->execute([':ppid' => $ppId]);
        Response::json($stmt->fetchAll());
        break;

    // POST /api/sessions
    case ($method === 'POST' && empty($id)):
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $val = new Validator($data);
        $val->required('patient_package_id')->required('patient_id');
        if ($val->hasErrors()) Response::validationError($val->getErrors());

        $ppId = $data['patient_package_id'];

        // Check package status
        $ppStmt = $db->prepare("SELECT * FROM patient_packages WHERE id = :id");
        $ppStmt->execute([':id' => $ppId]);
        $pp = $ppStmt->fetch();
        if (!$pp) Response::error('Patient package not found', 404);

        if ($pp['sessions_used'] >= $pp['total_sessions']) {
            Response::error('All sessions in this package have already been completed.', 400);
        }

        $sessionId = bin2hex(random_bytes(16));
        $nextSessionNo = (int)$pp['sessions_used'] + 1;

        $db->beginTransaction();
        try {
            // Insert session record
            $stmt = $db->prepare("
                INSERT INTO package_sessions (
                    id, patient_package_id, patient_id, session_no, session_date,
                    performed_by, doctor_id, branch_id, room_no, device_used,
                    energy_level, areas_treated, patient_feedback, adverse_reaction,
                    next_session_date, status, notes
                ) VALUES (
                    :id, :ppid, :pid, :sno, :sdate,
                    :perf_by, :doc_id, :bid, :room, :device,
                    :energy, :areas, :feedback, :reaction,
                    :next_date, 'Completed', :notes
                )
            ");

            $stmt->execute([
                ':id'        => $sessionId,
                ':ppid'      => $ppId,
                ':pid'       => $data['patient_id'],
                ':sno'       => $nextSessionNo,
                ':sdate'     => $data['session_date'] ?? date('Y-m-d'),
                ':perf_by'   => $data['performed_by'] ?? $userId,
                ':doc_id'    => $data['doctor_id'] ?? null,
                ':bid'       => $branchId,
                ':room'      => $data['room_no'] ?? null,
                ':device'    => $data['device_used'] ?? null,
                ':energy'    => $data['energy_level'] ?? null,
                ':areas'     => $data['areas_treated'] ?? null,
                ':feedback'  => $data['patient_feedback'] ?? null,
                ':reaction'  => $data['adverse_reaction'] ?? 'None',
                ':next_date' => !empty($data['next_session_date']) ? $data['next_session_date'] : null,
                ':notes'     => $data['notes'] ?? null,
            ]);

            // Increment sessions_used and check completion
            $newUsed = $nextSessionNo;
            $newStatus = ($newUsed >= (int)$pp['total_sessions']) ? 'Completed' : 'Active';

            $upStmt = $db->prepare("
                UPDATE patient_packages 
                SET sessions_used = :used, status = :status 
                WHERE id = :id
            ");
            $upStmt->execute([
                ':used'   => $newUsed,
                ':status' => $newStatus,
                ':id'     => $ppId,
            ]);

            $db->commit();
            Response::json([
                'id'            => $sessionId,
                'session_no'    => $nextSessionNo,
                'sessions_used' => $newUsed,
                'status'        => $newStatus,
                'message'       => "Session #$nextSessionNo recorded successfully",
            ], 201);
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Failed to log session: ' . $e->getMessage(), 500);
        }
        break;

    default:
        Response::error('Invalid request method for sessions', 405);
}
