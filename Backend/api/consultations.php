<?php
/**
 * HEAL Clinic — Consultations API
 * POST   /api/consultations
 * GET    /api/consultations/:id
 * PUT    /api/consultations/:id
 * POST   /api/consultations/:id/finalize
 * GET    /api/consultations?appointment_id=xxx
 */

Auth::require();
$db = db();
$branchId = Auth::branchId();
$userId = Auth::id();

switch (true) {

    // GET /api/consultations/:id
    case ($method === 'GET' && !empty($id) && $action === null):
        $stmt = $db->prepare("
            SELECT c.*, 
                   p.first_name, p.last_name, p.op_no, p.gender, p.age_years, p.blood_group, p.phone,
                   s.full_name as doctor_name, s.doctor_reg_no
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            JOIN staff s ON c.doctor_id = s.id
            WHERE c.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $consult = $stmt->fetch();
        if (!$consult) {
            Response::error('Consultation record not found', 404);
        }

        // Fetch attached prescription if any
        $rxStmt = $db->prepare("SELECT * FROM prescriptions WHERE consultation_id = :cid");
        $rxStmt->execute([':cid' => $id]);
        $consult['prescription'] = $rxStmt->fetch() ?: null;
        if ($consult['prescription']) {
            $itemsStmt = $db->prepare("SELECT * FROM prescription_items WHERE prescription_id = :rxid ORDER BY sort_order ASC");
            $itemsStmt->execute([':rxid' => $consult['prescription']['id']]);
            $consult['prescription']['items'] = $itemsStmt->fetchAll();
        }

        Response::json($consult);
        break;

    // GET /api/consultations?appointment_id=xxx
    case ($method === 'GET' && empty($id)):
        $apptId = $_GET['appointment_id'] ?? null;
        $patientId = $_GET['patient_id'] ?? null;

        if ($apptId) {
            $stmt = $db->prepare("SELECT * FROM consultations WHERE appointment_id = :aid ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([':aid' => $apptId]);
            $res = $stmt->fetch();
            Response::json($res ?: null);
        }

        if ($patientId) {
            $stmt = $db->prepare("SELECT c.*, s.full_name as doctor_name FROM consultations c JOIN staff s ON c.doctor_id = s.id WHERE c.patient_id = :pid ORDER BY c.consult_date DESC");
            $stmt->execute([':pid' => $patientId]);
            Response::json($stmt->fetchAll());
        }

        Response::json([]);
        break;

    // POST /api/consultations
    case ($method === 'POST' && empty($id)):
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $val = new Validator($data);
        $val->required('patient_id')->required('doctor_id');
        if ($val->hasErrors()) {
            Response::validationError($val->getErrors());
        }

        $consultId = bin2hex(random_bytes(16));
        $isDraft = isset($data['is_draft']) ? (int)$data['is_draft'] : 1;
        $finalizedAt = ($isDraft === 0) ? date('Y-m-d H:i:s') : null;

        $stmt = $db->prepare("
            INSERT INTO consultations (
                id, appointment_id, patient_id, doctor_id, branch_id, consult_date,
                bp_systolic, bp_diastolic, pulse_rate, temperature_f, spo2_percent,
                weight_kg, height_cm, bmi, known_conditions, chief_complaints,
                complaint_duration, skin_type, examination_notes, diagnosis,
                treatment_plan, doctor_private_notes, review_after_days, review_date,
                review_instructions, is_draft, finalized_at
            ) VALUES (
                :id, :appointment_id, :patient_id, :doctor_id, :branch_id, NOW(),
                :bp_systolic, :bp_diastolic, :pulse_rate, :temperature_f, :spo2_percent,
                :weight_kg, :height_cm, :bmi, :known_conditions, :chief_complaints,
                :complaint_duration, :skin_type, :examination_notes, :diagnosis,
                :treatment_plan, :doctor_private_notes, :review_after_days, :review_date,
                :review_instructions, :is_draft, :finalized_at
            )
        ");

        $stmt->execute([
            ':id'                   => $consultId,
            ':appointment_id'       => $data['appointment_id'] ?? null,
            ':patient_id'           => $data['patient_id'],
            ':doctor_id'            => $data['doctor_id'],
            ':branch_id'            => $branchId,
            ':bp_systolic'          => !empty($data['bp_systolic']) ? (int)$data['bp_systolic'] : null,
            ':bp_diastolic'         => !empty($data['bp_diastolic']) ? (int)$data['bp_diastolic'] : null,
            ':pulse_rate'           => !empty($data['pulse_rate']) ? (int)$data['pulse_rate'] : null,
            ':temperature_f'        => !empty($data['temperature_f']) ? (float)$data['temperature_f'] : null,
            ':spo2_percent'         => !empty($data['spo2_percent']) ? (int)$data['spo2_percent'] : null,
            ':weight_kg'            => !empty($data['weight_kg']) ? (float)$data['weight_kg'] : null,
            ':height_cm'            => !empty($data['height_cm']) ? (float)$data['height_cm'] : null,
            ':bmi'                  => !empty($data['bmi']) ? (float)$data['bmi'] : null,
            ':known_conditions'     => $data['known_conditions'] ?? null,
            ':chief_complaints'     => $data['chief_complaints'] ?? null,
            ':complaint_duration'   => $data['complaint_duration'] ?? null,
            ':skin_type'            => $data['skin_type'] ?? null,
            ':examination_notes'    => $data['examination_notes'] ?? null,
            ':diagnosis'            => $data['diagnosis'] ?? null,
            ':treatment_plan'       => $data['treatment_plan'] ?? null,
            ':doctor_private_notes' => $data['doctor_private_notes'] ?? null,
            ':review_after_days'    => !empty($data['review_after_days']) ? (int)$data['review_after_days'] : null,
            ':review_date'          => !empty($data['review_date']) ? $data['review_date'] : null,
            ':review_instructions'  => $data['review_instructions'] ?? null,
            ':is_draft'             => $isDraft,
            ':finalized_at'         => $finalizedAt,
        ]);

        // If finalized and appointment_id present, update appointment status to Billing-Pending
        if ($isDraft === 0 && !empty($data['appointment_id'])) {
            $upAppt = $db->prepare("UPDATE appointments SET status = 'Billing-Pending' WHERE id = :aid");
            $upAppt->execute([':aid' => $data['appointment_id']]);
        }

        Response::json(['id' => $consultId, 'message' => 'Consultation saved successfully'], 201);
        break;

    // POST /api/consultations/:id/finalize
    case ($method === 'POST' && !empty($id) && $action === 'finalize'):
        $stmt = $db->prepare("
            UPDATE consultations 
            SET is_draft = 0, finalized_at = NOW() 
            WHERE id = :id
        ");
        $stmt->execute([':id' => $id]);

        // Move appointment to Billing-Pending
        $cStmt = $db->prepare("SELECT appointment_id FROM consultations WHERE id = :id");
        $cStmt->execute([':id' => $id]);
        $row = $cStmt->fetch();
        if ($row && !empty($row['appointment_id'])) {
            $db->prepare("UPDATE appointments SET status = 'Billing-Pending' WHERE id = :aid")
               ->execute([':aid' => $row['appointment_id']]);
        }

        Response::json(['message' => 'Consultation finalized successfully']);
        break;

    // PUT /api/consultations/:id
    case ($method === 'PUT' && !empty($id)):
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $stmt = $db->prepare("
            UPDATE consultations SET
                bp_systolic = :bp_sys, bp_diastolic = :bp_dia, pulse_rate = :pulse,
                temperature_f = :temp, spo2_percent = :spo2, weight_kg = :weight,
                height_cm = :height, bmi = :bmi, known_conditions = :kc,
                chief_complaints = :cc, examination_notes = :exam, diagnosis = :diag,
                treatment_plan = :plan, review_after_days = :rad, review_date = :rdate,
                review_instructions = :rinst
            WHERE id = :id
        ");
        $stmt->execute([
            ':id'     => $id,
            ':bp_sys' => $data['bp_systolic'] ?? null,
            ':bp_dia' => $data['bp_diastolic'] ?? null,
            ':pulse'  => $data['pulse_rate'] ?? null,
            ':temp'   => $data['temperature_f'] ?? null,
            ':spo2'   => $data['spo2_percent'] ?? null,
            ':weight' => $data['weight_kg'] ?? null,
            ':height' => $data['height_cm'] ?? null,
            ':bmi'    => $data['bmi'] ?? null,
            ':kc'     => $data['known_conditions'] ?? null,
            ':cc'     => $data['chief_complaints'] ?? null,
            ':exam'   => $data['examination_notes'] ?? null,
            ':diag'   => $data['diagnosis'] ?? null,
            ':plan'   => $data['treatment_plan'] ?? null,
            ':rad'    => $data['review_after_days'] ?? null,
            ':rdate'  => $data['review_date'] ?? null,
            ':rinst'  => $data['review_instructions'] ?? null,
        ]);
        Response::json(['message' => 'Consultation updated']);
        break;

    default:
        Response::error('Invalid request method for consultations', 405);
}
