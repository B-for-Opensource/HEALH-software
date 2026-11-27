from datetime import date, datetime, timedelta
import json
from sqlalchemy.orm import Session
import models
from auth import hash_password

def seed_database(db: Session):
    # 0. Seed Organisation (Tenant)
    try:
        if db.query(models.Organisation).count() == 0:
            org = models.Organisation(
                id="org-heal-001",
                name="HEALESTHETIC Healthcare Group",
                code="HEAL",
                subscription_plan="Enterprise"
            )
            db.add(org)
            db.commit()
    except Exception:
        db.rollback()

    # 1. Seed Branches
    try:
        if db.query(models.Branch).count() == 0:
            branches = [
                models.Branch(
                    id="krn-branch-001",
                    name="HEAL Clinic — Karanthoor (Main)",
                    branch_code="KRN",
                    address="Way to Markaz, Karanthoor, Calicut, Kerala 673571",
                    city="Kozhikode",
                    phone="0495-2720000",
                    email="karanthoor@healclinic.in"
                ),
                models.Branch(
                    id="clt-branch-002",
                    name="HEAL Clinic — Beach Road Calicut",
                    branch_code="CLT",
                    address="Beach Road, Near Corporation Office, Calicut, Kerala 673032",
                    city="Kozhikode",
                    phone="0495-2720001",
                    email="beachroad@healclinic.in"
                ),
                models.Branch(
                    id="wyd-branch-003",
                    name="HEAL Clinic — Sulthan Bathery Wayanad",
                    branch_code="WYD",
                    address="Main Road, Sulthan Bathery, Wayanad, Kerala 673592",
                    city="Sulthan Bathery",
                    phone="04936-220000",
                    email="wayanad@healclinic.in"
                ),
            ]
            db.add_all(branches)
            db.commit()
    except Exception:
        db.rollback()

    # 2. Seed Departments
    try:
        if db.query(models.Department).count() == 0:
            departments = [
                models.Department(id="dept-derm", name="Dermatology & Cosmetology", code="DERM", description="Clinical dermatology and advanced aesthetics"),
                models.Department(id="dept-gen", name="General Outpatient (OP)", code="GEN", description="General outpatient consultations and wellness"),
                models.Department(id="dept-laser", name="Laser & Aesthetic Daycare", code="LASER", description="Diode, Q-switch and CO2 laser treatments"),
                models.Department(id="dept-tri", name="Trichology & Hair Restoration", code="TRI", description="Hair loss treatments, PRP, and scalp therapy"),
                models.Department(id="dept-nutr", name="Wellness & Nutrition", code="NUTR", description="Dietetics, weight management, and lifestyle counseling"),
                models.Department(id="dept-pharm", name="Pharmacy & Dispensary", code="PHARM", description="In-house retail pharmacy, dispensary, and FEFO inventory"),
            ]
            db.add_all(departments)
            db.commit()
    except Exception:
        db.rollback()

    # 3. Seed Default Admin User
    try:
        admin = db.query(models.Staff).filter(models.Staff.username == "admin").first()
        if not admin:
            default_admin = models.Staff(
                id="staff-admin-001",
                branch_id="krn-branch-001",
                department_id="dept-derm",
                username="admin",
                password_hash=hash_password("Admin@1234"),
                full_name="Dr. Shahnaz (Clinic Director)",
                role="Super Admin",
                doctor_reg_no="TCMC-48291",
                specialisation="Dermatology & Cosmetology",
                phone="9876543210",
                email="admin@healclinic.in"
            )
            db.add(default_admin)
            db.commit()
    except Exception:
        db.rollback()

    # 4. Seed Doctors if needed
    try:
        if db.query(models.Staff).filter(models.Staff.role == "Doctor").count() == 0:
            docs = [
                models.Staff(
                    id="doc-001",
                    branch_id="krn-branch-001",
                    department_id="dept-derm",
                    username="dr.ananya",
                    password_hash=hash_password("Doctor@1234"),
                    full_name="Dr. Ananya Nair",
                    role="Doctor",
                    doctor_reg_no="TCMC-54321",
                    specialisation="Consultant Dermatologist",
                    phone="9876543211",
                    email="ananya@healclinic.in"
                ),
                models.Staff(
                    id="doc-002",
                    branch_id="krn-branch-001",
                    department_id="dept-gen",
                    username="dr.rahul",
                    password_hash=hash_password("Doctor@1234"),
                    full_name="Dr. Rahul Menon",
                    role="Doctor",
                    doctor_reg_no="TCMC-61204",
                    specialisation="General Physician",
                    phone="9876543212",
                    email="rahul@healclinic.in"
                )
            ]
            db.add_all(docs)
            db.commit()
    except Exception:
        db.rollback()

    # 4b. Seed Dedicated Pharmacy Personnel
    try:
        pharm = db.query(models.Staff).filter(models.Staff.username == "pharmacist").first()
        if not pharm:
            default_pharm = models.Staff(
                id="staff-pharm-001",
                branch_id="krn-branch-001",
                department_id="dept-pharm",
                username="pharmacist",
                password_hash=hash_password("Pharmacy@1234"),
                full_name="Alex Mathew (Chief Pharmacist)",
                role="Pharmacist",
                phone="9876543220",
                email="pharmacist@healclinic.in"
            )
            db.add(default_pharm)
            db.commit()
    except Exception:
        db.rollback()

    # 5. Seed Treatment Packages
    try:
        if db.query(models.TreatmentPackage).count() == 0:
            packages = [
                models.TreatmentPackage(
                    id="pkg-laser-full",
                    code="LHR-FACE-6S",
                    name="Laser Hair Reduction — Full Face (6 Sessions)",
                    category="Laser",
                    total_sessions=6,
                    validity_months=12,
                    package_price=15000.0,
                    cgst_percent=9.0,
                    sgst_percent=9.0,
                    description="808nm diode laser hair reduction for chin, upper lip, and cheeks"
                ),
                models.TreatmentPackage(
                    id="pkg-peel-acne",
                    code="PEEL-ACNE-4S",
                    name="Anti-Acne Chemical Peel Package (4 Sessions)",
                    category="Peels",
                    total_sessions=4,
                    validity_months=6,
                    package_price=8000.0,
                    cgst_percent=9.0,
                    sgst_percent=9.0,
                    description="Salicylic + Mandelic combination peels for active acne and comedones"
                ),
                models.TreatmentPackage(
                    id="pkg-hydra-glow",
                    code="HYDRA-GLOW-3S",
                    name="HydraFacial Deluxe Glow Package (3 Sessions)",
                    category="Aesthetic",
                    total_sessions=3,
                    validity_months=6,
                    package_price=10500.0,
                    cgst_percent=9.0,
                    sgst_percent=9.0,
                    description="Deep cleansing, salicylic extraction, peptide infusion, and LED light therapy"
                ),
                models.TreatmentPackage(
                    id="pkg-prp-hair",
                    code="PRP-HAIR-4S",
                    name="PRP Hair Regrowth Therapy (4 Sessions)",
                    category="Trichology",
                    total_sessions=4,
                    validity_months=6,
                    package_price=16000.0,
                    cgst_percent=9.0,
                    sgst_percent=9.0,
                    description="Autologous platelet-rich plasma scalp microinjections with microneedling"
                )
            ]
            db.add_all(packages)
            db.commit()
    except Exception:
        db.rollback()

    # 6. Seed Medicines
    try:
        if db.query(models.Medicine).count() == 0:
            meds = [
                models.Medicine(id="med-doxy", name="Doxycycline 100mg", generic_name="Doxycycline Hyclate", brand_name="Doxt-SL", dosage_form="Capsule", strength="100mg", unit="Cap", default_dosage="1 Cap", default_frequency="1-0-1", default_timing="After Food", route="Oral"),
                models.Medicine(id="med-isotret", name="Isotretinoin 20mg", generic_name="Isotretinoin", brand_name="Sotret", dosage_form="Capsule", strength="20mg", unit="Cap", default_dosage="1 Cap", default_frequency="0-0-1", default_timing="After Food", route="Oral"),
                models.Medicine(id="med-sunscreen", name="Broad Spectrum Sunscreen Gel SPF 50", generic_name="Octinoxate + Avobenzone", brand_name="UV-DOUX", dosage_form="Gel", strength="SPF 50+ PA+++", unit="Tube", default_dosage="Apply Liberally", default_frequency="1-1-0", default_timing="Apply Locally", route="Topical"),
                models.Medicine(id="med-azelaic", name="Azelaic Acid Cream 20%", generic_name="Azelaic Acid", brand_name="Aziderm", dosage_form="Cream", strength="20%", unit="Tube", default_dosage="Pea size", default_frequency="0-0-1", default_timing="Apply Locally", route="Topical"),
                models.Medicine(id="med-clinda", name="Clindamycin 1% + Nicotinamide 4% Gel", generic_name="Clindamycin Phosphate", brand_name="Clindac-A", dosage_form="Gel", strength="1% + 4%", unit="Tube", default_dosage="Thin film", default_frequency="1-0-1", default_timing="Apply Locally", route="Topical"),
                models.Medicine(id="med-minox", name="Minoxidil 5% Topical Solution", generic_name="Minoxidil", brand_name="Mintop", dosage_form="Lotion", strength="5%", unit="Bottle", default_dosage="1 ml", default_frequency="1-0-1", default_timing="Apply Locally", route="Topical"),
                models.Medicine(id="med-paracetamol", name="Paracetamol 650mg", generic_name="Paracetamol", brand_name="Dolo 650", dosage_form="Tablet", strength="650mg", unit="Tab", default_dosage="1 Tab", default_frequency="SOS", default_timing="After Food", route="Oral"),
                models.Medicine(id="med-cetirizine", name="Levocetirizine 5mg", generic_name="Levocetirizine", brand_name="Levocet", dosage_form="Tablet", strength="5mg", unit="Tab", default_dosage="1 Tab", default_frequency="0-0-1", default_timing="Bedtime", route="Oral"),
            ]
            db.add_all(meds)
            db.commit()
    except Exception:
        db.rollback()

    # 7. Seed HRMS Designations
    try:
        if db.query(models.Designation).count() == 0:
            desigs = [
                models.Designation(id="desig-derm", title="Senior Consultant Dermatologist", category="Clinical"),
                models.Designation(id="desig-gp", title="General Physician & Family Doctor", category="Clinical"),
                models.Designation(id="desig-aesth", title="Clinical Aesthetician & Laser Operator", category="Clinical"),
                models.Designation(id="desig-nurse", title="Staff Nurse & Treatment Coordinator", category="Clinical"),
                models.Designation(id="desig-rec", title="Front Desk Receptionist", category="Administrative"),
                models.Designation(id="desig-cash", title="Billing Specialist & Cashier", category="Administrative"),
            ]
            db.add_all(desigs)
            db.commit()
    except Exception:
        db.rollback()

    # 8. Seed Medical Credentials
    try:
        if db.query(models.MedicalCredential).count() == 0:
            creds = [
                models.MedicalCredential(
                    id="cred-001",
                    employee_id="doc-001",
                    license_type="Travancore-Cochin Medical Council (TCMC)",
                    license_number="TCMC-54321",
                    issuing_authority="Kerala State Medical Council",
                    issue_date=date(2021, 1, 15),
                    expiry_date=date(2027, 1, 15),
                    status="Valid",
                    document_name="tcmc_ananya_nair.pdf"
                ),
                models.MedicalCredential(
                    id="cred-002",
                    employee_id="doc-001",
                    license_type="Board Certification in Aesthetic Laser Medicine",
                    license_number="AESTH-LASER-9921",
                    issuing_authority="Indian Association of Dermatologists & Venereologists (IADVL)",
                    issue_date=date(2022, 6, 1),
                    expiry_date=date.today() + timedelta(days=25), # Expiring soon alert demo
                    status="Expiring Soon",
                    document_name="laser_cert_ananya.pdf"
                ),
                models.MedicalCredential(
                    id="cred-003",
                    employee_id="doc-002",
                    license_type="State Medical Registration",
                    license_number="TCMC-61204",
                    issuing_authority="Kerala State Medical Council",
                    issue_date=date(2020, 3, 10),
                    expiry_date=date(2028, 3, 10),
                    status="Valid",
                    document_name="tcmc_rahul_menon.pdf"
                ),
            ]
            db.add_all(creds)
            db.commit()
    except Exception:
        db.rollback()

    # 9. Seed Shift Rosters
    try:
        if db.query(models.ShiftRoster).count() == 0:
            today = date.today()
            rosters = [
                models.ShiftRoster(
                    id="roster-001",
                    employee_id="doc-001",
                    branch_id="krn-branch-001",
                    shift_date=today,
                    shift_name="Morning Aesthetic & Laser OPD",
                    start_time="09:00 AM",
                    end_time="01:30 PM",
                    is_on_call=False,
                    notes="Diode Laser & Chemical Peels"
                ),
                models.ShiftRoster(
                    id="roster-002",
                    employee_id="doc-002",
                    branch_id="krn-branch-001",
                    shift_date=today,
                    shift_name="Evening Family Medicine OPD",
                    start_time="03:00 PM",
                    end_time="08:00 PM",
                    is_on_call=True,
                    notes="General consultations & followups"
                ),
            ]
            db.add_all(rosters)
            db.commit()
    except Exception:
        db.rollback()

    # 10. Seed Leave Requests
    try:
        if db.query(models.LeaveRequest).count() == 0:
            today = date.today()
            leaves = [
                models.LeaveRequest(
                    id="leave-001",
                    employee_id="doc-001",
                    branch_id="krn-branch-001",
                    leave_type="CME Conference",
                    start_date=today + timedelta(days=7),
                    end_date=today + timedelta(days=9),
                    total_days=3,
                    reason="Attending National Aesthetic Dermatology Summit 2026",
                    substitute_doctor_id="doc-002",
                    status="Pending",
                    applied_at=datetime.utcnow()
                )
            ]
            db.add_all(leaves)
            db.commit()
    except Exception:
        db.rollback()


    # 11. Seed Role Staff (Nurse, Reception, Cashier, Lab Tech, Radiologist, Pharmacist)
    try:
        role_users = [
            ("staff-nurse-001", "nurse", "Nurse@1234", "Anjali Pillai", "Nurse", "9876543220", "nurse@healesthetic.in"),
            ("staff-rec-001", "reception", "Reception@1234", "Meera Nair", "Receptionist", "9876543221", "reception@healesthetic.in"),
            ("staff-cash-001", "cashier", "Cashier@1234", "Rohan Das", "Cashier", "9876543222", "cashier@healesthetic.in"),
            ("staff-lab-001", "labtech", "Lab@1234", "Dr. Kavya Menon (Pathology)", "Lab Technician", "9876543223", "lab@healesthetic.in"),
            ("staff-rad-001", "radiologist", "Radio@1234", "Dr. Vivek Varma (Radiology)", "Radiologist", "9876543224", "radiology@healesthetic.in"),
            ("staff-pharm-001", "pharmacist", "Pharma@1234", "Nikhil Krishnan", "Pharmacist", "9876543225", "pharmacy@healesthetic.in"),
        ]
        for uid, uname, pwd, fname, role, phone, email in role_users:
            if not db.query(models.Staff).filter(models.Staff.username == uname).first():
                db.add(models.Staff(
                    id=uid,
                    organisation_id="org-heal-001",
                    branch_id="krn-branch-001",
                    department_id="dept-gen",
                    username=uname,
                    password_hash=hash_password(pwd),
                    full_name=fname,
                    role=role,
                    phone=phone,
                    email=email,
                ))
        db.commit()
    except Exception:
        db.rollback()

    # 12. Seed Lab & Imaging Master Services
    try:
        if db.query(models.LabServiceMaster).count() == 0:
            db.add_all([
                models.LabServiceMaster(
                    id="lab-srv-cbc", organisation_id="org-heal-001", test_code="LAB-CBC",
                    test_name="Complete Blood Count (CBC)", category="Hematology", sample_type="EDTA Whole Blood",
                    parameters_json=json.dumps([
                        {"name": "Hemoglobin", "unit": "g/dL", "ref_range": "12.0 - 16.0"},
                        {"name": "WBC Count", "unit": "cells/mcL", "ref_range": "4,000 - 11,000"},
                        {"name": "Platelets", "unit": "lakhs/mcL", "ref_range": "1.5 - 4.5"},
                    ]),
                    default_price=450.0, gst_percent=0.0
                ),
                models.LabServiceMaster(
                    id="lab-srv-lft", organisation_id="org-heal-001", test_code="LAB-LFT",
                    test_name="Liver Function Test (LFT)", category="Biochemistry", sample_type="Serum",
                    parameters_json=json.dumps([
                        {"name": "SGOT (AST)", "unit": "U/L", "ref_range": "5 - 40"},
                        {"name": "SGPT (ALT)", "unit": "U/L", "ref_range": "7 - 56"},
                        {"name": "Total Bilirubin", "unit": "mg/dL", "ref_range": "0.1 - 1.2"},
                    ]),
                    default_price=750.0, gst_percent=0.0
                ),
                models.LabServiceMaster(
                    id="lab-srv-hba1c", organisation_id="org-heal-001", test_code="LAB-HBA1C",
                    test_name="HbA1c (Glycated Hemoglobin)", category="Biochemistry", sample_type="EDTA Whole Blood",
                    parameters_json=json.dumps([
                        {"name": "HbA1c", "unit": "%", "ref_range": "4.0 - 5.6"},
                    ]),
                    default_price=600.0, gst_percent=0.0
                ),
            ])
            db.commit()
    except Exception:
        db.rollback()

    try:
        if db.query(models.ImagingServiceMaster).count() == 0:
            db.add_all([
                models.ImagingServiceMaster(
                    id="img-srv-xray-chest", organisation_id="org-heal-001", service_code="IMG-XRAY-01",
                    service_name="Chest X-Ray PA View", modality="X-Ray", default_room="Room 104 (Radiology)",
                    default_price=600.0, gst_percent=0.0
                ),
                models.ImagingServiceMaster(
                    id="img-srv-mri-brain", organisation_id="org-heal-001", service_code="IMG-MRI-01",
                    service_name="Brain MRI (T1/T2 Plain)", modality="MRI", default_room="Room 108 (MRI Suite)",
                    default_price=5500.0, gst_percent=0.0
                ),
                models.ImagingServiceMaster(
                    id="img-srv-usg-abd", organisation_id="org-heal-001", service_code="IMG-USG-01",
                    service_name="Ultrasound Abdomen & Pelvis", modality="Ultrasound", default_room="Room 106 (USG)",
                    default_price=1400.0, gst_percent=0.0
                ),
            ])
            db.commit()
    except Exception:
        db.rollback()

    # 13. Seed Suppliers & Pharmacy Batches
    try:
        if db.query(models.Supplier).count() == 0:
            db.add(models.Supplier(
                id="sup-001", organisation_id="org-heal-001", name="MedPlus Pharma Distributors",
                gstin="32AABCM1234F1Z5", phone="0495-2441100", email="orders@medplusdist.in"
            ))
            db.commit()
        if db.query(models.PharmacyBatch).count() == 0:
            meds = db.query(models.Medicine).limit(6).all()
            for idx, m in enumerate(meds):
                db.add(models.PharmacyBatch(
                    id=f"batch-seed-{idx+1}",
                    organisation_id="org-heal-001",
                    branch_id="krn-branch-001",
                    medicine_id=m.id,
                    medicine_name=m.name,
                    salt_name=m.generic_name,
                    batch_no=f"HL26-{101+idx}",
                    expiry_date=date.today() + timedelta(days=180 + idx * 60),
                    quantity_available=120,
                    purchase_rate=45.0,
                    mrp=85.0 + idx * 15,
                    gst_percent=12.0,
                    is_schedule_h1=(idx % 3 == 0),
                ))
            db.commit()
    except Exception:
        db.rollback()

    # 14. Seed Sample Patients & Initial Encounter
    try:
        if db.query(models.Patient).count() == 0:
            p1 = models.Patient(
                id="pat-seed-001", organisation_id="org-heal-001", branch_id="krn-branch-001",
                op_no="A00101", first_name="Aisha", last_name="Rahman",
                phone="9847011223", date_of_birth=date(1995, 5, 14), age_years=31,
                gender="Female", blood_group="O+", created_source="RECEPTION"
            )
            p2 = models.Patient(
                id="pat-seed-002", organisation_id="org-heal-001", branch_id="krn-branch-001",
                op_no="A00102", first_name="Rahul", last_name="Menon",
                phone="9847099887", date_of_birth=date(1988, 11, 2), age_years=38,
                gender="Male", blood_group="B+", created_source="RECEPTION"
            )
            db.add_all([p1, p2])
            db.commit()
    except Exception:
        db.rollback()
