<?php
/**
 * HEAL Clinic — Prescriptions API
 * POST   /api/prescriptions
 * GET    /api/prescriptions/:id
 * GET    /api/prescriptions/:id/pdf
 */

Auth::require();
$db = db();
$userId = Auth::id();

switch (true) {

    // GET /api/prescriptions/:id/pdf (Printable HTML view)
    case ($method === 'GET' && !empty($id) && $action === 'pdf'):
        $stmt = $db->prepare("
            SELECT pr.*, 
                   p.first_name, p.last_name, p.op_no, p.gender, p.age_years, p.phone,
                   s.full_name as doctor_name, s.doctor_reg_no, s.specialisation,
                   b.name as branch_name, b.address as branch_address, b.phone as branch_phone
            FROM prescriptions pr
            JOIN patients p ON pr.patient_id = p.id
            JOIN staff s ON pr.doctor_id = s.id
            LEFT JOIN branches b ON s.branch_id = b.id
            WHERE pr.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $rx = $stmt->fetch();
        if (!$rx) {
            Response::error('Prescription not found', 404);
        }

        $itemsStmt = $db->prepare("SELECT * FROM prescription_items WHERE prescription_id = :id ORDER BY sort_order ASC");
        $itemsStmt->execute([':id' => $id]);
        $items = $itemsStmt->fetchAll();

        // Output printable HTML
        header('Content-Type: text/html; charset=UTF-8');
        ?>
        <!DOCTYPE html>
        <html>
        <head>
          <title>Rx - <?= htmlspecialchars($rx['first_name'] . ' ' . ($rx['last_name'] ?? '')) ?> - HEAL</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; font-size: 13px; }
            .header { border-bottom: 2px solid #7c3aed; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .clinic-title { font-size: 24px; font-weight: 800; color: #6d28d9; margin: 0; }
            .clinic-sub { font-size: 12px; color: #64748b; margin: 2px 0 0 0; }
            .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 25px; display: flex; justify-content: space-between; }
            .rx-symbol { font-size: 28px; font-weight: bold; color: #7c3aed; font-family: serif; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 8px; border-bottom: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #64748b; }
            td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
            .doc-sign { text-align: right; border-top: 1px solid #94a3b8; width: 220px; padding-top: 8px; font-size: 12px; }
            @media print { body { margin: 15mm; } button { display: none; } }
          </style>
        </head>
        <body>
          <div style="text-align: right; margin-bottom: 15px;">
            <button onclick="window.print()" style="background:#7c3aed; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">Print Prescription</button>
          </div>
          <div class="header">
            <div>
              <h1 class="clinic-title">HEAL AESTHETIC & MEDICAL CLINIC</h1>
              <p class="clinic-sub"><?= htmlspecialchars($rx['branch_name'] ?? 'Karanthoor') ?> · <?= htmlspecialchars($rx['branch_address'] ?? 'Calicut, Kerala') ?></p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-weight: bold;">Dr. <?= htmlspecialchars($rx['doctor_name']) ?></p>
              <p style="margin: 0; font-size: 11px; color: #64748b;">Reg No: <?= htmlspecialchars($rx['doctor_reg_no'] ?? 'MCI/TCMC') ?></p>
              <p style="margin: 0; font-size: 11px; color: #64748b;"><?= htmlspecialchars($rx['specialisation'] ?? 'Consultant') ?></p>
            </div>
          </div>

          <div class="patient-box">
            <div>
              <strong><?= htmlspecialchars($rx['first_name'] . ' ' . ($rx['last_name'] ?? '')) ?></strong> (<?= htmlspecialchars($rx['gender']) ?>, <?= (int)$rx['age_years'] ?> yrs)<br>
              <span style="color:#64748b;">OP No:</span> <strong><?= htmlspecialchars($rx['op_no']) ?></strong> · <span style="color:#64748b;">Phone:</span> <?= htmlspecialchars($rx['phone']) ?>
            </div>
            <div style="text-align: right;">
              <span style="color:#64748b;">Date:</span> <?= date('d M Y', strtotime($rx['rx_date'])) ?>
            </div>
          </div>

          <div class="rx-symbol">℞</div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine / Formulation</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Timing</th>
                <th>Duration</th>
                <th>Special Instructions</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($items as $idx => $it): ?>
              <tr>
                <td><?= $idx + 1 ?></td>
                <td><strong><?= htmlspecialchars($it['medicine_name']) ?></strong></td>
                <td><?= htmlspecialchars($it['dosage'] ?? '-') ?></td>
                <td><?= htmlspecialchars($it['frequency'] ?? '-') ?></td>
                <td><?= htmlspecialchars($it['timing'] ?? '-') ?></td>
                <td><?= (int)$it['duration_days'] ?> Days</td>
                <td style="color:#475569; font-style:italic;"><?= htmlspecialchars($it['special_instructions'] ?? '-') ?></td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>

          <?php if (!empty($rx['general_advice'])): ?>
          <div style="margin-top: 20px; font-size: 12px; background: #faf5ff; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #a855f7;">
            <strong>Doctor's Advice:</strong> <?= nl2br(htmlspecialchars($rx['general_advice'])) ?>
          </div>
          <?php endif; ?>

          <div class="footer">
            <div style="font-size: 10px; color: #94a3b8;">
              System generated prescription · Valid for 30 days from date of issue
            </div>
            <div class="doc-sign">
              Dr. <?= htmlspecialchars($rx['doctor_name']) ?><br>
              <span style="color:#64748b; font-size:11px;">Authorised Signature</span>
            </div>
          </div>
        </body>
        </html>
        <?php
        exit();

    // GET /api/prescriptions/:id
    case ($method === 'GET' && !empty($id)):
        $stmt = $db->prepare("SELECT * FROM prescriptions WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $rx = $stmt->fetch();
        if (!$rx) Response::error('Prescription not found', 404);

        $itemsStmt = $db->prepare("SELECT * FROM prescription_items WHERE prescription_id = :id ORDER BY sort_order ASC");
        $itemsStmt->execute([':id' => $id]);
        $rx['items'] = $itemsStmt->fetchAll();
        Response::json($rx);
        break;

    // POST /api/prescriptions
    case ($method === 'POST' && empty($id)):
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $val = new Validator($data);
        $val->required('patient_id')->required('doctor_id');
        if ($val->hasErrors()) Response::validationError($val->getErrors());

        $rxId = bin2hex(random_bytes(16));
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("
                INSERT INTO prescriptions (id, consultation_id, patient_id, doctor_id, rx_date, general_advice)
                VALUES (:id, :cid, :pid, :did, CURDATE(), :advice)
            ");
            $stmt->execute([
                ':id'     => $rxId,
                ':cid'    => $data['consultation_id'] ?? null,
                ':pid'    => $data['patient_id'],
                ':did'    => $data['doctor_id'],
                ':advice' => $data['general_advice'] ?? null,
            ]);

            // Insert items
            if (!empty($data['items']) && is_array($data['items'])) {
                $itemStmt = $db->prepare("
                    INSERT INTO prescription_items (
                        id, prescription_id, medicine_id, medicine_name, dosage,
                        frequency, timing, duration_days, quantity, special_instructions, sort_order
                    ) VALUES (
                        :id, :rxid, :mid, :mname, :dosage,
                        :freq, :timing, :duration, :qty, :inst, :sort
                    )
                ");

                foreach ($data['items'] as $sortIdx => $item) {
                    $itemId = bin2hex(random_bytes(16));
                    $itemStmt->execute([
                        ':id'       => $itemId,
                        ':rxid'     => $rxId,
                        ':mid'      => $item['medicine_id'] ?? null,
                        ':mname'    => $item['medicine_name'] ?? 'Medicine',
                        ':dosage'   => $item['dosage'] ?? null,
                        ':freq'     => $item['frequency'] ?? null,
                        ':timing'   => $item['timing'] ?? null,
                        ':duration' => !empty($item['duration_days']) ? (int)$item['duration_days'] : null,
                        ':qty'      => !empty($item['quantity']) ? (int)$item['quantity'] : null,
                        ':inst'     => $item['special_instructions'] ?? null,
                        ':sort'     => $sortIdx,
                    ]);
                }
            }

            $db->commit();
            Response::json(['id' => $rxId, 'message' => 'Prescription saved successfully'], 201);
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Failed to create prescription: ' . $e->getMessage(), 500);
        }
        break;

    default:
        Response::error('Invalid request method for prescriptions', 405);
}
