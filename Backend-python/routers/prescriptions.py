from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/prescriptions", tags=["Prescriptions"])

@router.get("/{prescription_id}/pdf", response_class=HTMLResponse)
def get_prescription_pdf(prescription_id: str, db: Session = Depends(get_db)):
    rx = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")

    p = db.query(models.Patient).filter(models.Patient.id == rx.patient_id).first()
    doc = db.query(models.Staff).filter(models.Staff.id == rx.doctor_id).first()
    branch = db.query(models.Branch).filter(models.Branch.id == doc.branch_id).first() if doc else None
    items = db.query(models.PrescriptionItem).filter(models.PrescriptionItem.prescription_id == rx.id).order_by(models.PrescriptionItem.sort_order.asc()).all()

    patient_name = f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient"
    doc_name = doc.full_name if doc else "Doctor"
    reg_no = doc.doctor_reg_no if doc and doc.doctor_reg_no else "MCI/TCMC"
    branch_name = branch.name if branch else "HEAL Clinic"
    branch_addr = branch.address if branch else "Calicut, Kerala"

    rows_html = ""
    for idx, it in enumerate(items):
        rows_html += f"""
        <tr>
          <td>{idx + 1}</td>
          <td><strong>{it.medicine_name}</strong></td>
          <td>{it.dosage or '-'}</td>
          <td>{it.frequency or '-'}</td>
          <td>{it.timing or '-'}</td>
          <td>{it.duration_days} Days</td>
          <td style="color:#475569; font-style:italic;">{it.special_instructions or '-'}</td>
        </tr>
        """

    advice_html = ""
    if rx.general_advice:
        advice_html = f"""
        <div style="margin-top: 20px; font-size: 12px; background: #faf5ff; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #a855f7;">
          <strong>Doctor's Advice:</strong> {rx.general_advice}
        </div>
        """

    html = f"""<!DOCTYPE html>
    <html>
    <head>
      <title>Rx - {patient_name} - HEAL</title>
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; font-size: 13px; }}
        .header {{ border-bottom: 2px solid #7c3aed; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }}
        .clinic-title {{ font-size: 24px; font-weight: 800; color: #6d28d9; margin: 0; }}
        .clinic-sub {{ font-size: 12px; color: #64748b; margin: 2px 0 0 0; }}
        .patient-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 25px; display: flex; justify-content: space-between; }}
        .rx-symbol {{ font-size: 28px; font-weight: bold; color: #7c3aed; font-family: serif; margin-bottom: 10px; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; }}
        th {{ text-align: left; padding: 8px; border-bottom: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #64748b; }}
        td {{ padding: 10px 8px; border-bottom: 1px solid #f1f5f9; }}
        .footer {{ margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }}
        .doc-sign {{ text-align: right; border-top: 1px solid #94a3b8; width: 220px; padding-top: 8px; font-size: 12px; }}
        @media print {{ body {{ margin: 15mm; }} button {{ display: none; }} }}
      </style>
    </head>
    <body>
      <div style="text-align: right; margin-bottom: 15px;">
        <button onclick="window.print()" style="background:#7c3aed; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">Print Prescription</button>
      </div>
      <div class="header">
        <div>
          <h1 class="clinic-title">HEAL AESTHETIC & MEDICAL CLINIC</h1>
          <p class="clinic-sub">{branch_name} · {branch_addr}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: bold;">Dr. {doc_name}</p>
          <p style="margin: 0; font-size: 11px; color: #64748b;">Reg No: {reg_no}</p>
        </div>
      </div>

      <div class="patient-box">
        <div>
          <strong>{patient_name}</strong> ({p.gender if p else '-'}, {p.age_years if p else '-'} yrs)<br>
          <span style="color:#64748b;">OP No:</span> <strong>{p.op_no if p else '-'}</strong> · <span style="color:#64748b;">Phone:</span> {p.phone if p else '-'}
        </div>
        <div style="text-align: right;">
          <span style="color:#64748b;">Date:</span> {rx.rx_date.strftime('%d %b %Y') if rx.rx_date else '-'}
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
          {rows_html}
        </tbody>
      </table>

      {advice_html}

      <div class="footer">
        <div style="font-size: 10px; color: #94a3b8;">
          System generated prescription · Valid for 30 days from date of issue
        </div>
        <div class="doc-sign">
          Dr. {doc_name}<br>
          <span style="color:#64748b; font-size:11px;">Authorised Signature</span>
        </div>
      </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html)

@router.get("/{prescription_id}", response_model=schemas.ApiResponse)
def get_prescription(
    prescription_id: str,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    rx = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")

    items = db.query(models.PrescriptionItem).filter(models.PrescriptionItem.prescription_id == rx.id).order_by(models.PrescriptionItem.sort_order.asc()).all()

    return schemas.ApiResponse(
        success=True,
        data={
            "id": rx.id,
            "consultation_id": rx.consultation_id,
            "patient_id": rx.patient_id,
            "doctor_id": rx.doctor_id,
            "rx_date": rx.rx_date.isoformat() if rx.rx_date else None,
            "general_advice": rx.general_advice,
            "items": [{
                "id": it.id,
                "medicine_name": it.medicine_name,
                "dosage": it.dosage,
                "frequency": it.frequency,
                "timing": it.timing,
                "duration_days": it.duration_days,
                "quantity": it.quantity,
                "special_instructions": it.special_instructions
            } for it in items]
        }
    )

@router.post("", response_model=schemas.ApiResponse, status_code=201)
def create_prescription(
    req: schemas.PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    rx = models.Prescription(
        consultation_id=req.consultation_id,
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        rx_date=date.today(),
        general_advice=req.general_advice
    )
    db.add(rx)
    db.flush()

    for idx, item in enumerate(req.items or []):
        rx_item = models.PrescriptionItem(
            prescription_id=rx.id,
            medicine_id=item.medicine_id,
            medicine_name=item.medicine_name,
            dosage=item.dosage,
            frequency=item.frequency,
            timing=item.timing,
            duration_days=item.duration_days or 5,
            quantity=item.quantity or 10,
            route=item.route or "Oral",
            special_instructions=item.special_instructions,
            sort_order=idx
        )
        db.add(rx_item)

    db.commit()
    return schemas.ApiResponse(
        success=True,
        data={"id": rx.id},
        message="Prescription created successfully"
    )
