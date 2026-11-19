<?php
/**
 * HEAL Clinic — Patient Clinical Photos API
 * POST /api/photos (multipart/form-data upload)
 * GET  /api/photos?patient_id=xxx
 */

Auth::require();
$db = db();
$userId = Auth::id();

switch (true) {

    // GET /api/photos?patient_id=xxx
    case ($method === 'GET' && empty($id)):
        $patientId = $_GET['patient_id'] ?? null;
        if (!$patientId) Response::error('patient_id is required', 400);

        $stmt = $db->prepare("
            SELECT p.*, s.full_name as taken_by_name
            FROM patient_photos p
            LEFT JOIN staff s ON p.taken_by = s.id
            WHERE p.patient_id = :pid
            ORDER BY p.taken_at DESC
        ");
        $stmt->execute([':pid' => $patientId]);
        Response::json($stmt->fetchAll());
        break;

    // POST /api/photos (File Upload)
    case ($method === 'POST' && empty($id)):
        $patientId = $_POST['patient_id'] ?? null;
        $photoType = $_POST['photo_type'] ?? 'Before';
        $sessionId = $_POST['package_session_id'] ?? null;
        $notes     = $_POST['notes'] ?? null;

        if (!$patientId) {
            Response::error('patient_id is required', 400);
        }

        if (empty($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
            Response::error('Photo file upload failed or missing', 400);
        }

        $file = $_FILES['photo'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $allowedTypes)) {
            Response::error('Invalid file format. Only JPG, PNG, and WebP images are allowed.', 400);
        }

        // Limit size to 10MB
        if ($file['size'] > 10 * 1024 * 1024) {
            Response::error('File size exceeds 10MB limit', 400);
        }

        $ext = match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            default      => 'jpg',
        };

        $photoId = bin2hex(random_bytes(16));
        $filename = $patientId . '_' . time() . '_' . $photoId . '.' . $ext;
        $uploadDir = HEAL_ROOT . '/uploads/photos/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $destination = $uploadDir . $filename;
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            Response::error('Failed to save uploaded image to disk', 500);
        }

        $photoUrl = '/uploads/photos/' . $filename;

        $stmt = $db->prepare("
            INSERT INTO patient_photos (
                id, patient_id, package_session_id, photo_type, photo_url,
                consent_obtained, taken_by, taken_at, notes
            ) VALUES (
                :id, :pid, :sid, :ptype, :url,
                1, :uid, NOW(), :notes
            )
        ");
        $stmt->execute([
            ':id'    => $photoId,
            ':pid'   => $patientId,
            ':sid'   => $sessionId,
            ':ptype' => $photoType,
            ':url'   => $photoUrl,
            ':uid'   => $userId,
            ':notes' => $notes,
        ]);

        Response::json([
            'id'        => $photoId,
            'photo_url' => $photoUrl,
            'message'   => 'Clinical photo uploaded successfully',
        ], 201);
        break;

    default:
        Response::error('Invalid request method for photos', 405);
}
