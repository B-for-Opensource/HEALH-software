from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id, resolve_org_id, log_audit, emit_outbox_event
from realtime import ws_manager

router = APIRouter(prefix="/api/pharmacy", tags=["Pharmacy & Inventory"])

@router.get("/prescriptions", response_model=schemas.ApiResponse)
def list_pharmacy_prescriptions(
    request: Request,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    q = db.query(models.Prescription).filter(models.Prescription.organisation_id == org_id)
    if current_user.role != "Super Admin":
        q = q.filter(models.Prescription.branch_id == branch_id)
    if status and status != "all":
        q = q.filter(models.Prescription.status == status)

    rxs = q.order_by(desc(models.Prescription.created_at)).limit(100).all()
    data = []
    for rx in rxs:
        p = db.query(models.Patient).filter(models.Patient.id == rx.patient_id).first()
        doc = db.query(models.Staff).filter(models.Staff.id == rx.doctor_id).first()
        items = db.query(models.PrescriptionItem).filter(models.PrescriptionItem.prescription_id == rx.id).all()
        data.append({
            "id": rx.id,
            "encounter_id": rx.encounter_id,
            "patient_id": rx.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "",
            "doctor_name": doc.full_name if doc else "Doctor",
            "rx_date": rx.rx_date.isoformat() if rx.rx_date else None,
            "status": rx.status,
            "general_advice": rx.general_advice,
            "items": [{
                "id": it.id,
                "medicine_id": it.medicine_id,
                "medicine_name": it.medicine_name,
                "generic_name": it.generic_name,
                "dosage_form": it.dosage_form,
                "dosage": it.dosage,
                "frequency": it.frequency,
                "duration_days": it.duration_days,
                "quantity": it.quantity,
                "dispensed_qty": it.dispensed_qty or 0,
                "remaining_qty": max(0, (it.quantity or 0) - (it.dispensed_qty or 0)),
                "unit": it.unit,
                "special_instructions": it.special_instructions,
            } for it in items],
        })
    return schemas.ApiResponse(success=True, data=data)

@router.get("/batches", response_model=schemas.ApiResponse)
def list_batches(request: Request, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    branch_id = resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    q = db.query(models.PharmacyBatch).filter(
        models.PharmacyBatch.organisation_id == org_id,
        models.PharmacyBatch.is_active == True
    )
    if current_user.role != "Super Admin":
        q = q.filter(models.PharmacyBatch.branch_id == branch_id)
    batches = q.order_by(asc(models.PharmacyBatch.expiry_date)).all()
    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": b.id, "branch_id": b.branch_id, "medicine_id": b.medicine_id,
            "medicine_name": b.medicine_name, "salt_name": b.salt_name,
            "batch_no": b.batch_no, "expiry_date": b.expiry_date.isoformat(),
            "quantity_available": b.quantity_available, "purchase_rate": b.purchase_rate,
            "mrp": b.mrp, "gst_percent": b.gst_percent, "is_schedule_h1": b.is_schedule_h1
        } for b in batches]
    )

@router.post("/batches", response_model=schemas.ApiResponse)
def add_batch(request: Request, payload: dict = Body(...), db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    branch_id = payload.get("branch_id") or resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    exp = date.fromisoformat(payload["expiry_date"])
    b = models.PharmacyBatch(
        organisation_id=org_id, branch_id=branch_id,
        medicine_id=payload.get("medicine_id"),
        medicine_name=payload["medicine_name"],
        salt_name=payload.get("salt_name"),
        batch_no=payload["batch_no"],
        expiry_date=exp,
        quantity_available=int(payload.get("quantity_available") or 0),
        purchase_rate=float(payload.get("purchase_rate") or 0.0),
        mrp=float(payload.get("mrp") or 0.0),
        gst_percent=float(payload.get("gst_percent") or 12.0),
        is_schedule_h1=bool(payload.get("is_schedule_h1", False)),
    )
    db.add(b)
    db.flush()
    db.add(models.StockMovement(
        organisation_id=org_id, branch_id=branch_id, batch_id=b.id,
        medicine_name=b.medicine_name, batch_no=b.batch_no,
        quantity_delta=b.quantity_available, transaction_type="GRN_INWARD",
        actor_user_id=current_user.id,
    ))
    log_audit(db, action="ADD_BATCH", entity_type="PharmacyBatch", entity_id=b.id, entity_ref=b.batch_no, user=current_user, branch_id=branch_id)
    db.commit()
    return schemas.ApiResponse(success=True, data={"id": b.id})

@router.post("/dispense", response_model=schemas.ApiResponse)
def dispense_medicines(
    request: Request,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    """
    Supports both:
    - Prescription dispensing (partial or complete)
    - Direct Walk-In Pharmacy Sale (creates DIRECT_PHARMACY encounter, no doctor consultation)
    Uses FEFO batch selection unless explicit batch_id + override_reason provided.
    Auto-deducts PharmacyBatch.quantity_available, creates StockMovement & PHARMACY Bill.
    """
    branch_id = payload.get("branch_id") or resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    patient_id = payload.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")

    prescription_id = payload.get("prescription_id")
    is_direct = bool(payload.get("is_direct_sale", False)) or not prescription_id
    encounter_id = payload.get("encounter_id")

    if not encounter_id:
        if prescription_id:
            rx = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
            encounter_id = rx.encounter_id if rx else None
        if not encounter_id:
            enc_count = db.query(models.Encounter).count()
            enc = models.Encounter(
                encounter_no=f"ENC-{str(enc_count + 1001).zfill(5)}",
                organisation_id=org_id,
                branch_id=branch_id,
                patient_id=patient_id,
                encounter_type="DIRECT_PHARMACY" if is_direct else "CONSULTATION",
                entry_source="PHARMACY" if is_direct else "RECEPTION",
                status="COMPLETED",
                completed_at=datetime.utcnow(),
                created_by=current_user.id,
            )
            db.add(enc)
            db.flush()
            encounter_id = enc.id

    items = payload.get("items") or []
    if not items:
        raise HTTPException(status_code=400, detail="At least one item is required to dispense")

    disp_count = db.query(models.PharmacyDispensation).count()
    disp = models.PharmacyDispensation(
        dispense_no=f"DSP-{str(disp_count + 1001).zfill(5)}",
        organisation_id=org_id,
        branch_id=branch_id,
        encounter_id=encounter_id,
        prescription_id=prescription_id,
        patient_id=patient_id,
        is_direct_sale=is_direct,
        pharmacist_id=current_user.id,
        status="DISPENSED",
        total_amount=0.0,
    )
    db.add(disp)
    db.flush()

    subtotal = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    bill_items_to_add = []

    for item in items:
        qty_req = int(item.get("dispense_qty") or item.get("quantity") or 0)
        if qty_req <= 0:
            continue

        # Validate partial Rx limit
        rx_item_id = item.get("prescription_item_id")
        if rx_item_id:
            rx_it = db.query(models.PrescriptionItem).filter(models.PrescriptionItem.id == rx_item_id).first()
            if rx_it:
                remaining = (rx_it.quantity or 0) - (rx_it.dispensed_qty or 0)
                if qty_req > remaining:
                    raise HTTPException(status_code=400, detail=f"Cannot dispense {qty_req} of {rx_it.medicine_name}; only {remaining} remaining.")
                rx_it.dispensed_qty = (rx_it.dispensed_qty or 0) + qty_req

        # FEFO batch selection or explicit override
        batch = None
        if item.get("batch_id"):
            batch = db.query(models.PharmacyBatch).filter(models.PharmacyBatch.id == item["batch_id"]).first()
        else:
            batch = db.query(models.PharmacyBatch).filter(
                models.PharmacyBatch.branch_id == branch_id,
                models.PharmacyBatch.medicine_name.ilike(f"%{item.get('medicine_name', '')}%"),
                models.PharmacyBatch.quantity_available >= qty_req,
                models.PharmacyBatch.is_active == True,
            ).order_by(asc(models.PharmacyBatch.expiry_date)).first()

        unit_price = float(item.get("unit_price") or (batch.mrp if batch else 0.0))
        gst_pct = float(item.get("gst_percent") or (batch.gst_percent if batch else 12.0))
        line_total = round(unit_price * qty_req, 2)
        taxable = round(line_total / (1 + gst_pct / 100.0), 2) if gst_pct > 0 else line_total
        gst_amt = round(line_total - taxable, 2)
        subtotal += taxable
        total_cgst += round(gst_amt / 2.0, 2)
        total_sgst += round(gst_amt / 2.0, 2)

        if batch:
            if batch.quantity_available < qty_req:
                raise HTTPException(status_code=400, detail=f"Insufficient stock in batch {batch.batch_no}")
            batch.quantity_available -= qty_req
            db.add(models.StockMovement(
                organisation_id=org_id,
                branch_id=branch_id,
                batch_id=batch.id,
                medicine_name=batch.medicine_name,
                batch_no=batch.batch_no,
                quantity_delta=-qty_req,
                transaction_type="DIRECT_SALE" if is_direct else "DISPENSE_RX",
                reference_id=disp.id,
                patient_id=patient_id,
                override_reason=item.get("override_reason"),
                actor_user_id=current_user.id,
            ))

        db.add(models.PharmacyDispensationItem(
            dispensation_id=disp.id,
            prescription_item_id=rx_item_id,
            batch_id=batch.id if batch else None,
            medicine_name=item.get("medicine_name") or (batch.medicine_name if batch else "Medicine"),
            batch_no=batch.batch_no if batch else None,
            dispensed_qty=qty_req,
            unit_price=unit_price,
            gst_percent=gst_pct,
            line_total=line_total,
        ))
        bill_items_to_add.append({
            "item_name": item.get("medicine_name") or (batch.medicine_name if batch else "Medicine"),
            "quantity": qty_req, "unit_price": unit_price, "taxable": taxable,
            "gst_pct": gst_pct, "gst_amt": gst_amt, "line_total": line_total
        })

    net_amount = round(sum(bi["line_total"] for bi in bill_items_to_add), 2)
    paid_amount = float(payload.get("amount_paid") if payload.get("amount_paid") is not None else net_amount)
    balance_due = max(0.0, round(net_amount - paid_amount, 2))

    # Separate Pharmacy Bill linked to same Patient & Encounter
    bill_count = db.query(models.Bill).count()
    bill = models.Bill(
        bill_no=f"PHM-{str(bill_count + 1001).zfill(5)}",
        organisation_id=org_id,
        encounter_id=encounter_id,
        department_scope="PHARMACY",
        patient_id=patient_id,
        branch_id=branch_id,
        cashier_id=current_user.id,
        subtotal=round(subtotal, 2),
        taxable_amount=round(subtotal, 2),
        cgst_amount=round(total_cgst, 2),
        sgst_amount=round(total_sgst, 2),
        net_amount=net_amount,
        amount_paid=paid_amount,
        balance_due=balance_due,
        payment_status="Paid" if balance_due == 0 else ("Partial" if paid_amount > 0 else "Unpaid"),
    )
    db.add(bill)
    db.flush()

    for idx, bi in enumerate(bill_items_to_add):
        db.add(models.BillItem(
            bill_id=bill.id, item_type="Medicine", item_name=bi["item_name"],
            quantity=bi["quantity"], unit_price=bi["unit_price"], taxable_amount=bi["taxable"],
            cgst_percent=bi["gst_pct"] / 2.0, sgst_percent=bi["gst_pct"] / 2.0,
            cgst_amount=bi["gst_amt"] / 2.0, sgst_amount=bi["gst_amt"] / 2.0,
            line_total=bi["line_total"], sort_order=idx
        ))
    if paid_amount > 0:
        db.add(models.Payment(
            bill_id=bill.id, patient_id=patient_id, branch_id=branch_id,
            cashier_id=current_user.id, payment_mode=payload.get("payment_mode", "Cash"), amount=paid_amount
        ))

    disp.bill_id = bill.id
    disp.total_amount = net_amount

    # Update Prescription status (PARTIAL vs DISPENSED)
    if prescription_id:
        rx = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
        if rx:
            all_items = db.query(models.PrescriptionItem).filter(models.PrescriptionItem.prescription_id == rx.id).all()
            if all((it.dispensed_qty or 0) >= (it.quantity or 0) for it in all_items):
                rx.status = "DISPENSED"
                disp.status = "DISPENSED"
            else:
                rx.status = "PARTIAL"
                disp.status = "PARTIAL"

    emit_outbox_event(
        db, event_type="MedicationDispensed", payload={"dispensation_id": disp.id, "bill_id": bill.id, "encounter_id": encounter_id},
        organisation_id=org_id, branch_id=branch_id,
    )
    log_audit(db, action="DISPENSE", entity_type="PharmacyDispensation", entity_id=disp.id, entity_ref=disp.dispense_no, user=current_user, branch_id=branch_id)
    db.commit()
    ws_manager.broadcast_sync("MedicationDispensed", {"dispensation_id": disp.id, "prescription_id": prescription_id})

    return schemas.ApiResponse(success=True, data={"dispensation_id": disp.id, "dispense_no": disp.dispense_no, "bill_no": bill.bill_no, "total_amount": net_amount, "status": disp.status})

@router.get("/stock-movements", response_model=schemas.ApiResponse)
def list_stock_movements(request: Request, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    branch_id = resolve_branch_id(request, current_user)
    q = db.query(models.StockMovement)
    if current_user.role != "Super Admin":
        q = q.filter(models.StockMovement.branch_id == branch_id)
    rows = q.order_by(desc(models.StockMovement.created_at)).limit(100).all()
    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": r.id, "medicine_name": r.medicine_name, "batch_no": r.batch_no,
            "quantity_delta": r.quantity_delta, "transaction_type": r.transaction_type,
            "reference_id": r.reference_id, "override_reason": r.override_reason,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in rows]
    )

@router.get("/purchase-orders", response_model=schemas.ApiResponse)
def list_purchase_orders(request: Request, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    branch_id = resolve_branch_id(request, current_user)
    q = db.query(models.PurchaseOrder)
    if current_user.role != "Super Admin":
        q = q.filter(models.PurchaseOrder.branch_id == branch_id)
    pos = q.order_by(desc(models.PurchaseOrder.created_at)).limit(100).all()
    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": po.id, "po_no": po.po_no, "supplier_name": po.supplier_name,
            "order_date": po.order_date.isoformat(), "status": po.status, "total_amount": po.total_amount
        } for po in pos]
    )

@router.post("/purchase-orders", response_model=schemas.ApiResponse)
def create_purchase_order(request: Request, payload: dict = Body(...), db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    branch_id = payload.get("branch_id") or resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    cnt = db.query(models.PurchaseOrder).count()
    po = models.PurchaseOrder(
        po_no=f"PO-{str(cnt + 1001).zfill(5)}",
        organisation_id=org_id, branch_id=branch_id,
        supplier_name=payload.get("supplier_name", "MedPlus Pharma Distributors"),
        status="ORDERED", total_amount=float(payload.get("total_amount") or 0.0),
        created_by=current_user.id,
    )
    db.add(po)
    db.commit()
    return schemas.ApiResponse(success=True, data={"id": po.id, "po_no": po.po_no})

@router.get("/expiry-returns", response_model=schemas.ApiResponse)
def list_expiry_returns(request: Request, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    branch_id = resolve_branch_id(request, current_user)
    q = db.query(models.ExpiryReturn)
    if current_user.role != "Super Admin":
        q = q.filter(models.ExpiryReturn.branch_id == branch_id)
    rows = q.order_by(desc(models.ExpiryReturn.created_at)).all()
    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": r.id, "debit_note_no": r.debit_note_no, "medicine_name": r.medicine_name,
            "batch_no": r.batch_no, "quantity": r.quantity, "credit_amount": r.credit_amount,
            "supplier_name": r.supplier_name, "status": r.status
        } for r in rows]
    )
