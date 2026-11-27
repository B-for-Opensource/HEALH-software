// ============================================================================
// HEAL AESTHETIC & MULTI-BRANCH CLINIC OS — PHARMACY ENTERPRISE ENGINE
// Modules 4 & 5: Procurement, FEFO Batches, Vial Splitting, Schedule H1 & GST
// ============================================================================

export interface SaltMaster {
  id: string;
  chemical_name: string;
  therapeutic_class: string;
  hsn_code: string;
  gst_rate: number; // 5, 12, 18, 28
  is_schedule_h1: boolean;
  is_narcotic: boolean;
  is_cold_chain: boolean;
  is_aesthetic_injectable: boolean;
  default_route: string;
  substitute_brands: {
    brand_name: string;
    manufacturer: string;
    dosage_form: string;
    strength: string;
    mrp: number;
    landed_cost: number;
    in_stock_units: number;
    recommended: boolean;
  }[];
}

export interface EnterpriseBatch {
  id: string;
  medicine_id: string;
  medicine_name: string;
  salt_name: string;
  brand_name: string;
  batch_no: string;
  manufacturer: string;
  hsn_code: string;
  gst_rate: number;
  mfg_date: string;
  expiry_date: string;
  days_to_expiry: number;
  expiry_status: 'critical_30' | 'warning_60' | 'review_90' | 'healthy';
  stock_qty: number;
  reserved_qty: number;
  unit: string;
  purchase_rate: number; // Landed
  mrp: number;
  rack_location: string;
  branch_id: string;
  is_schedule_h1: boolean;
  is_cold_chain: boolean;
  is_aesthetic_injectable: boolean;
}

export interface VialSplittingRecord {
  id: string;
  vial_code: string;
  batch_no: string;
  drug_name: string;
  total_units: number; // e.g. 100 Units for Botox
  used_units: number;
  remaining_units: number;
  reconstituted_at: string;
  reconstituted_by: string;
  saline_volume_ml: number;
  stability_expiry_at: string; // 24 hours after reconstitution
  cold_chain_temp_c: number; // e.g. 3.4 C
  status: 'active' | 'exhausted' | 'expired_discarded';
  draw_logs: {
    id: string;
    patient_op: string;
    patient_name: string;
    doctor_name: string;
    units_drawn: number;
    target_area: string;
    timestamp: string;
    notes?: string;
  }[];
}

export interface VelocityReorderItem {
  id: string;
  medicine_name: string;
  salt_name: string;
  daily_moving_avg: number; // units/day across branches
  current_stock: number;
  min_threshold: number; // safety buffer
  max_threshold: number;
  lead_time_days: number;
  suggested_order_qty: number;
  status: 'critical_reorder' | 'reorder_soon' | 'optimal' | 'overstocked';
  primary_vendor: string;
  estimated_cost: number;
}

export interface BonusSchemeCalc {
  item_name: string;
  distributor_name: string;
  standard_mrp: number;
  standard_ptr: number; // Price to Retailer
  base_quantity: number;
  free_quantity: number; // e.g. Buy 10 get 2 free
  gst_percent: number;
  standard_unit_cost: number;
  effective_landed_cost: number;
  margin_standard_pct: number;
  margin_effective_pct: number;
  distributor_savings: number;
}

export interface GRNReconciliation {
  id: string;
  grn_no: string;
  po_no: string;
  distributor_name: string;
  invoice_no: string;
  invoice_date: string;
  total_amount: number;
  reconciliation_status: 'verified' | 'price_hike_flagged' | 'short_qty_flagged' | 'shelf_life_warning';
  items: {
    item_name: string;
    batch_no: string;
    expiry_date: string;
    shelf_life_months: number;
    po_qty: number;
    received_qty: number;
    po_rate: number;
    invoice_rate: number;
    price_variance: number;
    flag?: string;
  }[];
}

export interface ExpiryReturnDebitNote {
  id: string;
  debit_note_no: string;
  distributor_name: string;
  distributor_gstin: string;
  created_at: string;
  total_claim_amount: number;
  status: 'draft' | 'dispatched_to_vendor' | 'credit_note_received' | 'adjusted_in_po';
  credit_note_ref?: string;
  batches: {
    batch_no: string;
    item_name: string;
    expiry_date: string;
    return_qty: number;
    landed_rate: number;
    total_value: number;
  }[];
}

export interface ScheduleH1AuditEntry {
  id: string;
  dispensed_at: string;
  drug_name: string;
  salt_name: string;
  batch_no: string;
  quantity: number;
  patient_name: string;
  patient_op: string;
  patient_aadhaar_ref: string;
  doctor_name: string;
  doctor_reg_no: string; // Medical Council Reg No (Mandatory)
  pharmacist_name: string;
  clinical_indication: string;
}

export interface IsotretinoinConsentLog {
  id: string;
  patient_name: string;
  patient_op: string;
  age: number;
  gender: string;
  prescribing_doctor: string;
  doctor_reg_no: string;
  dispensed_date: string;
  tablet_strength_mg: number;
  tablets_dispensed: number;
  teratogenicity_waiver_signed: boolean;
  pregnancy_test_negative: boolean;
  contraception_counseling_verified: boolean;
  consent_pdf_ref: string;
}

const STORAGE_KEY = 'HEAL_PHARMACY_ENTERPRISE_OS_V1';

// Seed chemical salts & brand hierarchy
export const SEED_SALTS: SaltMaster[] = [
  {
    id: 'salt-01',
    chemical_name: 'Paracetamol 650mg',
    therapeutic_class: 'Analgesic & Antipyretic',
    hsn_code: '30049060',
    gst_rate: 12,
    is_schedule_h1: false,
    is_narcotic: false,
    is_cold_chain: false,
    is_aesthetic_injectable: false,
    default_route: 'Oral',
    substitute_brands: [
      { brand_name: 'Dolo 650', manufacturer: 'Micro Labs', dosage_form: 'Tablet', strength: '650mg', mrp: 33.50, landed_cost: 21.00, in_stock_units: 320, recommended: true },
      { brand_name: 'Calpol 650', manufacturer: 'GSK Pharma', dosage_form: 'Tablet', strength: '650mg', mrp: 34.00, landed_cost: 22.50, in_stock_units: 180, recommended: false },
      { brand_name: 'Pacimol 650', manufacturer: 'Ipca Labs', dosage_form: 'Tablet', strength: '650mg', mrp: 31.00, landed_cost: 19.50, in_stock_units: 140, recommended: false },
    ],
  },
  {
    id: 'salt-02',
    chemical_name: 'Doxycycline Hyclate 100mg + Lactic Acid Bacillus',
    therapeutic_class: 'Broad-Spectrum Tetracycline Antibiotic',
    hsn_code: '30042049',
    gst_rate: 12,
    is_schedule_h1: true, // Schedule H1
    is_narcotic: false,
    is_cold_chain: false,
    is_aesthetic_injectable: false,
    default_route: 'Oral',
    substitute_brands: [
      { brand_name: 'Doxt-SL 100mg', manufacturer: 'Dr. Reddy Labs', dosage_form: 'Capsule', strength: '100mg', mrp: 142.00, landed_cost: 92.00, in_stock_units: 450, recommended: true },
      { brand_name: 'Doxicip-LB 100mg', manufacturer: 'Cipla', dosage_form: 'Capsule', strength: '100mg', mrp: 148.00, landed_cost: 98.00, in_stock_units: 120, recommended: false },
      { brand_name: 'Microdox-LBX', manufacturer: 'Micro Labs', dosage_form: 'Capsule', strength: '100mg', mrp: 139.00, landed_cost: 89.00, in_stock_units: 95, recommended: false },
    ],
  },
  {
    id: 'salt-03',
    chemical_name: 'Tretinoin 0.05% Micronized',
    therapeutic_class: 'Retinoid / Anti-Acne / Photo-Aging',
    hsn_code: '30049099',
    gst_rate: 12,
    is_schedule_h1: false,
    is_narcotic: false,
    is_cold_chain: false,
    is_aesthetic_injectable: false,
    default_route: 'Topical Application',
    substitute_brands: [
      { brand_name: 'Retino-A 0.05% Cream 20g', manufacturer: 'Janssen / J&J', dosage_form: 'Cream', strength: '0.05%', mrp: 410.00, landed_cost: 285.00, in_stock_units: 65, recommended: true },
      { brand_name: 'Tretiheal 0.05% Gel 20g', manufacturer: 'Healing Pharma', dosage_form: 'Gel', strength: '0.05%', mrp: 295.00, landed_cost: 190.00, in_stock_units: 40, recommended: false },
      { brand_name: 'A-Ret 0.05% Gel 20g', manufacturer: 'Menarini India', dosage_form: 'Gel', strength: '0.05%', mrp: 380.00, landed_cost: 260.00, in_stock_units: 30, recommended: false },
    ],
  },
  {
    id: 'salt-04',
    chemical_name: 'Botulinum Toxin Type A (Purified Neurotoxin Complex)',
    therapeutic_class: 'Aesthetic Neuromodulator / Dynamic Wrinkle Inactivation',
    hsn_code: '30029030',
    gst_rate: 12,
    is_schedule_h1: true,
    is_narcotic: false,
    is_cold_chain: true, // 2°C - 8°C
    is_aesthetic_injectable: true, // Multi-patient vial splitting
    default_route: 'Intramuscular / Subdermal Injection',
    substitute_brands: [
      { brand_name: 'BOTOX Cosmetic 100U', manufacturer: 'Allergan AbbVie', dosage_form: 'Lyophilized Vial', strength: '100 Units', mrp: 18500.00, landed_cost: 14200.00, in_stock_units: 14, recommended: true },
      { brand_name: 'Dysport 300U', manufacturer: 'Galderma', dosage_form: 'Vial', strength: '300 Units', mrp: 24000.00, landed_cost: 18500.00, in_stock_units: 6, recommended: false },
      { brand_name: 'Nabota 100U', manufacturer: 'Daewoong Pharma', dosage_form: 'Vial', strength: '100 Units', mrp: 14500.00, landed_cost: 11000.00, in_stock_units: 8, recommended: false },
    ],
  },
  {
    id: 'salt-05',
    chemical_name: 'Hyaluronic Acid 24mg/ml Cross-linked with 0.3% Lidocaine',
    therapeutic_class: 'Dermal Volumizer & Mid-Face Contour Filler',
    hsn_code: '30067000',
    gst_rate: 12,
    is_schedule_h1: false,
    is_narcotic: false,
    is_cold_chain: true,
    is_aesthetic_injectable: true,
    default_route: 'Subcutaneous / Supraperiosteal Bolus',
    substitute_brands: [
      { brand_name: 'Juvederm VOLUMA XC 1ml', manufacturer: 'Allergan AbbVie', dosage_form: 'Prefilled Syringe', strength: '24mg/ml', mrp: 22000.00, landed_cost: 16800.00, in_stock_units: 9, recommended: true },
      { brand_name: 'Restylane Defyne 1ml', manufacturer: 'Galderma', dosage_form: 'Prefilled Syringe', strength: '20mg/ml', mrp: 20500.00, landed_cost: 15400.00, in_stock_units: 5, recommended: false },
      { brand_name: 'Belotero Volume 1ml', manufacturer: 'Merz Aesthetics', dosage_form: 'Prefilled Syringe', strength: '26mg/ml', mrp: 19800.00, landed_cost: 14900.00, in_stock_units: 4, recommended: false },
    ],
  },
  {
    id: 'salt-06',
    chemical_name: 'Isotretinoin 20mg Soft Gelatin Capsule',
    therapeutic_class: 'Systemic Retinoid / Severe Cystic Acne',
    hsn_code: '30049099',
    gst_rate: 12,
    is_schedule_h1: true, // Schedule H1 & Black Box Teratogenicity
    is_narcotic: false,
    is_cold_chain: false,
    is_aesthetic_injectable: false,
    default_route: 'Oral',
    substitute_brands: [
      { brand_name: 'Sotret 20mg', manufacturer: 'Ranbaxy / Sun Pharma', dosage_form: 'Capsule', strength: '20mg', mrp: 385.00, landed_cost: 250.00, in_stock_units: 240, recommended: true },
      { brand_name: 'Tretiva 20mg', manufacturer: 'Intas Pharmaceuticals', dosage_form: 'Capsule', strength: '20mg', mrp: 370.00, landed_cost: 240.00, in_stock_units: 110, recommended: false },
      { brand_name: 'Isoin 20mg', manufacturer: 'Cipla Ltd', dosage_form: 'Capsule', strength: '20mg', mrp: 360.00, landed_cost: 235.00, in_stock_units: 90, recommended: false },
    ],
  },
  {
    id: 'salt-07',
    chemical_name: 'Broad-Spectrum UV Gel (Octinoxate + Avobenzone + Zinc Oxide)',
    therapeutic_class: 'Clinical Photoprotection / Cosmeceutical Skincare',
    hsn_code: '33049990', // Cosmeceutical 18% GST
    gst_rate: 18,
    is_schedule_h1: false,
    is_narcotic: false,
    is_cold_chain: false,
    is_aesthetic_injectable: false,
    default_route: 'Topical OTC Retail',
    substitute_brands: [
      { brand_name: 'UV-DOUX Sunscreen Gel SPF 50+ 50g', manufacturer: 'Brinton Pharma', dosage_form: 'Gel', strength: 'SPF 50+ PA+++', mrp: 750.00, landed_cost: 510.00, in_stock_units: 85, recommended: true },
      { brand_name: 'Photostable Gold Matte Gel 50g', manufacturer: 'Sun Pharma', dosage_form: 'Gel', strength: 'SPF 55 PA++++', mrp: 820.00, landed_cost: 565.00, in_stock_units: 45, recommended: false },
      { brand_name: 'Bello Photostable Sunscreen Emulgel 75g', manufacturer: 'Curatio Healthcare', dosage_form: 'Gel', strength: 'SPF 40 PA+++', mrp: 690.00, landed_cost: 470.00, in_stock_units: 30, recommended: false },
    ],
  },
  {
    id: 'salt-08',
    chemical_name: 'Reduced L-Glutathione 600mg + Ascorbic Acid 1000mg',
    therapeutic_class: 'IV Antioxidant / Pigmentation & Melasma Therapy',
    hsn_code: '30045090',
    gst_rate: 12,
    is_schedule_h1: false,
    is_narcotic: false,
    is_cold_chain: true,
    is_aesthetic_injectable: true,
    default_route: 'IV Infusion with Normal Saline 100ml',
    substitute_brands: [
      { brand_name: 'Gluta-Inject 600mg Ampoule', manufacturer: 'Biomedica Milano', dosage_form: 'Injection Ampoule', strength: '600mg', mrp: 3200.00, landed_cost: 2100.00, in_stock_units: 28, recommended: true },
      { brand_name: 'Maxilite-G 600mg Infusion Kit', manufacturer: 'Swiss Derma Lab', dosage_form: 'Lyophilized Kit', strength: '600mg', mrp: 3600.00, landed_cost: 2350.00, in_stock_units: 16, recommended: false },
    ],
  },
];

// Seed FEFO batches with 90, 60, 30 days indicators
export const SEED_BATCHES: EnterpriseBatch[] = [
  {
    id: 'batch-fefo-01',
    medicine_id: 'salt-02',
    medicine_name: 'Doxt-SL 100mg Capsule',
    salt_name: 'Doxycycline Hyclate 100mg',
    brand_name: 'Doxt-SL',
    batch_no: 'DX-2026-04A',
    manufacturer: 'Dr. Reddy Labs',
    hsn_code: '30042049',
    gst_rate: 12,
    mfg_date: '2024-05-10',
    expiry_date: '2026-12-20', // ~24 days left
    days_to_expiry: 24,
    expiry_status: 'critical_30',
    stock_qty: 120,
    reserved_qty: 10,
    unit: 'Strips (10s)',
    purchase_rate: 92.00,
    mrp: 142.00,
    rack_location: 'Bay A · Rack 2 · Shelf 1',
    branch_id: 'krn-branch-001',
    is_schedule_h1: true,
    is_cold_chain: false,
    is_aesthetic_injectable: false,
  },
  {
    id: 'batch-fefo-02',
    medicine_id: 'salt-03',
    medicine_name: 'Retino-A 0.05% Cream 20g',
    salt_name: 'Tretinoin 0.05% Micronized',
    brand_name: 'Retino-A',
    batch_no: 'RA-0925-C',
    manufacturer: 'Janssen / J&J',
    hsn_code: '30049099',
    gst_rate: 12,
    mfg_date: '2024-09-01',
    expiry_date: '2027-01-15', // ~50 days left
    days_to_expiry: 50,
    expiry_status: 'warning_60',
    stock_qty: 35,
    reserved_qty: 4,
    unit: 'Tubes (20g)',
    purchase_rate: 285.00,
    mrp: 410.00,
    rack_location: 'Bay B · Rack 1 · Shelf 3',
    branch_id: 'krn-branch-001',
    is_schedule_h1: false,
    is_cold_chain: false,
    is_aesthetic_injectable: false,
  },
  {
    id: 'batch-fefo-03',
    medicine_id: 'salt-06',
    medicine_name: 'Sotret 20mg Capsule',
    salt_name: 'Isotretinoin 20mg',
    brand_name: 'Sotret 20mg',
    batch_no: 'ST-8812-B',
    manufacturer: 'Sun Pharma',
    hsn_code: '30049099',
    gst_rate: 12,
    mfg_date: '2024-10-15',
    expiry_date: '2027-02-18', // ~84 days left
    days_to_expiry: 84,
    expiry_status: 'review_90',
    stock_qty: 140,
    reserved_qty: 20,
    unit: 'Strips (10s)',
    purchase_rate: 250.00,
    mrp: 385.00,
    rack_location: 'Locked Schedule Vault · Shelf H1',
    branch_id: 'krn-branch-001',
    is_schedule_h1: true,
    is_cold_chain: false,
    is_aesthetic_injectable: false,
  },
  {
    id: 'batch-fefo-04',
    medicine_id: 'salt-04',
    medicine_name: 'BOTOX Cosmetic 100U',
    salt_name: 'Botulinum Toxin Type A',
    brand_name: 'BOTOX 100U',
    batch_no: 'BX-ALL-9901',
    manufacturer: 'Allergan AbbVie',
    hsn_code: '30029030',
    gst_rate: 12,
    mfg_date: '2025-01-10',
    expiry_date: '2027-11-30', // >300 days
    days_to_expiry: 368,
    expiry_status: 'healthy',
    stock_qty: 8,
    reserved_qty: 2,
    unit: 'Vials',
    purchase_rate: 14200.00,
    mrp: 18500.00,
    rack_location: 'Cold-Chain Refrigerator #1 (3.4°C)',
    branch_id: 'krn-branch-001',
    is_schedule_h1: true,
    is_cold_chain: true,
    is_aesthetic_injectable: true,
  },
  {
    id: 'batch-fefo-05',
    medicine_id: 'salt-05',
    medicine_name: 'Juvederm VOLUMA XC 1ml',
    salt_name: 'Hyaluronic Acid 24mg/ml',
    brand_name: 'Juvederm Voluma',
    batch_no: 'JD-VOL-4412',
    manufacturer: 'Allergan AbbVie',
    hsn_code: '30067000',
    gst_rate: 12,
    mfg_date: '2025-02-20',
    expiry_date: '2027-08-31',
    days_to_expiry: 278,
    expiry_status: 'healthy',
    stock_qty: 6,
    reserved_qty: 1,
    unit: 'Syringes',
    purchase_rate: 16800.00,
    mrp: 22000.00,
    rack_location: 'Cold-Chain Refrigerator #2 (4.1°C)',
    branch_id: 'krn-branch-001',
    is_schedule_h1: false,
    is_cold_chain: true,
    is_aesthetic_injectable: true,
  },
  {
    id: 'batch-fefo-06',
    medicine_id: 'salt-07',
    medicine_name: 'UV-DOUX Sunscreen Gel SPF 50+',
    salt_name: 'Broad-Spectrum UV Gel',
    brand_name: 'UV-DOUX',
    batch_no: 'UV-2611-X',
    manufacturer: 'Brinton Pharma',
    hsn_code: '33049990',
    gst_rate: 18, // 18% Cosmeceutical GST
    mfg_date: '2025-03-01',
    expiry_date: '2027-12-31',
    days_to_expiry: 400,
    expiry_status: 'healthy',
    stock_qty: 85,
    reserved_qty: 0,
    unit: 'Tubes (50g)',
    purchase_rate: 510.00,
    mrp: 750.00,
    rack_location: 'Aesthetic Retail Showcase · Counter 1',
    branch_id: 'krn-branch-001',
    is_schedule_h1: false,
    is_cold_chain: false,
    is_aesthetic_injectable: false,
  },
  {
    id: 'batch-fefo-07',
    medicine_id: 'salt-01',
    medicine_name: 'Dolo 650 Tablet',
    salt_name: 'Paracetamol 650mg',
    brand_name: 'Dolo 650',
    batch_no: 'DL-9081-M',
    manufacturer: 'Micro Labs',
    hsn_code: '30049060',
    gst_rate: 12,
    mfg_date: '2025-01-15',
    expiry_date: '2028-01-14',
    days_to_expiry: 779,
    expiry_status: 'healthy',
    stock_qty: 320,
    reserved_qty: 15,
    unit: 'Strips (15s)',
    purchase_rate: 21.00,
    mrp: 33.50,
    rack_location: 'Dispensary Shelf · Fast Movers #1',
    branch_id: 'krn-branch-001',
    is_schedule_h1: false,
    is_cold_chain: false,
    is_aesthetic_injectable: false,
  },
];

// Seed Aesthetic Vial Splitting records (Botox 100U draw-down)
export const SEED_VIAL_SPLITS: VialSplittingRecord[] = [
  {
    id: 'vial-botox-01',
    vial_code: 'VIAL-BTX-101',
    batch_no: 'BX-ALL-9901',
    drug_name: 'BOTOX Cosmetic 100U (Allergan)',
    total_units: 100,
    used_units: 64,
    remaining_units: 36,
    reconstituted_at: '2026-11-26 09:15 AM',
    reconstituted_by: 'Staff Nurse Priyamvada',
    saline_volume_ml: 2.5,
    stability_expiry_at: '2026-11-27 09:15 AM', // 24-hr stability limit
    cold_chain_temp_c: 3.4,
    status: 'active',
    draw_logs: [
      {
        id: 'draw-01',
        patient_op: 'OP-1042',
        patient_name: 'Sunita Menon',
        doctor_name: 'Dr. Ananya Nair',
        units_drawn: 28,
        target_area: 'Glabellar Complex (Frown Lines) & Forehead',
        timestamp: '2026-11-26 10:30 AM',
        notes: '0.7ml drawn with 30G BD insulin syringe',
      },
      {
        id: 'draw-02',
        patient_op: 'OP-1055',
        patient_name: 'Rohit Verma',
        doctor_name: 'Dr. Rohit Sharma',
        units_drawn: 36,
        target_area: 'Masseter Hypertrophy (Jawline Slimming)',
        timestamp: '2026-11-26 11:45 AM',
        notes: '18U bilateral masseters',
      },
    ],
  },
  {
    id: 'vial-botox-02',
    vial_code: 'VIAL-BTX-100',
    batch_no: 'BX-ALL-9870',
    drug_name: 'BOTOX Cosmetic 100U (Allergan)',
    total_units: 100,
    used_units: 100,
    remaining_units: 0,
    reconstituted_at: '2026-11-25 10:00 AM',
    reconstituted_by: 'Senior Pharmacist Shaji',
    saline_volume_ml: 2.5,
    stability_expiry_at: '2026-11-26 10:00 AM',
    cold_chain_temp_c: 3.2,
    status: 'exhausted',
    draw_logs: [
      {
        id: 'draw-prev-01',
        patient_op: 'OP-1011',
        patient_name: 'Amina Basheer',
        doctor_name: 'Dr. Ananya Nair',
        units_drawn: 50,
        target_area: 'Full Upper Face (Crow Feet + Glabella + Bunny Lines)',
        timestamp: '2026-11-25 11:00 AM',
      },
      {
        id: 'draw-prev-02',
        patient_op: 'OP-1019',
        patient_name: 'Kavita Nair',
        doctor_name: 'Dr. Ananya Nair',
        units_drawn: 50,
        target_area: 'Platysmal Bands (Nefertiti Neck Lift)',
        timestamp: '2026-11-25 03:30 PM',
      },
    ],
  },
];

// Velocity Reorder Engine items
export const SEED_VELOCITY_REORDERS: VelocityReorderItem[] = [
  {
    id: 'vel-01',
    medicine_name: 'Doxt-SL 100mg Capsule',
    salt_name: 'Doxycycline Hyclate 100mg',
    daily_moving_avg: 18.5,
    current_stock: 120,
    min_threshold: 200,
    max_threshold: 600,
    lead_time_days: 4,
    suggested_order_qty: 554,
    status: 'critical_reorder',
    primary_vendor: 'Medisync Pharma Distributors',
    estimated_cost: 50968,
  },
  {
    id: 'vel-02',
    medicine_name: 'UV-DOUX Sunscreen Gel SPF 50+',
    salt_name: 'Broad-Spectrum UV Gel',
    daily_moving_avg: 7.2,
    current_stock: 85,
    min_threshold: 100,
    max_threshold: 250,
    lead_time_days: 5,
    suggested_order_qty: 201,
    status: 'reorder_soon',
    primary_vendor: 'Apex Derma Logistics',
    estimated_cost: 102510,
  },
  {
    id: 'vel-03',
    medicine_name: 'BOTOX Cosmetic 100U',
    salt_name: 'Botulinum Toxin Type A',
    daily_moving_avg: 1.1,
    current_stock: 8,
    min_threshold: 10,
    max_threshold: 25,
    lead_time_days: 7,
    suggested_order_qty: 25,
    status: 'reorder_soon',
    primary_vendor: 'Allergan India Direct Cold Chain',
    estimated_cost: 355000,
  },
  {
    id: 'vel-04',
    medicine_name: 'Sotret 20mg Capsule',
    salt_name: 'Isotretinoin 20mg',
    daily_moving_avg: 9.4,
    current_stock: 140,
    min_threshold: 150,
    max_threshold: 400,
    lead_time_days: 3,
    suggested_order_qty: 288,
    status: 'reorder_soon',
    primary_vendor: 'Sun Care Distributors Calicut',
    estimated_cost: 72000,
  },
  {
    id: 'vel-05',
    medicine_name: 'Dolo 650 Tablet',
    salt_name: 'Paracetamol 650mg',
    daily_moving_avg: 24.0,
    current_stock: 320,
    min_threshold: 250,
    max_threshold: 1000,
    lead_time_days: 2,
    suggested_order_qty: 728,
    status: 'optimal',
    primary_vendor: 'Medisync Pharma Distributors',
    estimated_cost: 15288,
  },
];

// Seed Bonus schemes
export const SEED_BONUS_SCHEMES: BonusSchemeCalc[] = [
  {
    item_name: 'Dolo 650 Strips',
    distributor_name: 'Medisync Pharma Distributors',
    standard_mrp: 33.50,
    standard_ptr: 24.00,
    base_quantity: 10,
    free_quantity: 2, // Buy 10 get 2 free
    gst_percent: 12,
    standard_unit_cost: 26.88,
    effective_landed_cost: 22.40,
    margin_standard_pct: 19.7,
    margin_effective_pct: 33.1,
    distributor_savings: 53.76,
  },
  {
    item_name: 'UV-DOUX Sunscreen Gel 50g',
    distributor_name: 'Apex Derma Logistics',
    standard_mrp: 750.00,
    standard_ptr: 550.00,
    base_quantity: 20,
    free_quantity: 5, // Buy 20 get 5 free
    gst_percent: 18,
    standard_unit_cost: 649.00,
    effective_landed_cost: 519.20,
    margin_standard_pct: 13.4,
    margin_effective_pct: 30.7,
    distributor_savings: 3245.00,
  },
  {
    item_name: 'Retino-A 0.05% Cream',
    distributor_name: 'Sun Care Distributors Calicut',
    standard_mrp: 410.00,
    standard_ptr: 300.00,
    base_quantity: 15,
    free_quantity: 3, // Buy 15 get 3 free
    gst_percent: 12,
    standard_unit_cost: 336.00,
    effective_landed_cost: 280.00,
    margin_standard_pct: 18.0,
    margin_effective_pct: 31.7,
    distributor_savings: 1008.00,
  },
];

// Seed GRN reconciliation records
export const SEED_GRNS: GRNReconciliation[] = [
  {
    id: 'grn-01',
    grn_no: 'GRN-2026-11-042',
    po_no: 'PO-2026-089',
    distributor_name: 'Apex Derma Logistics',
    invoice_no: 'INV-ADL-8849',
    invoice_date: '2026-11-24',
    total_amount: 58240,
    reconciliation_status: 'price_hike_flagged',
    items: [
      {
        item_name: 'UV-DOUX Sunscreen Gel 50g',
        batch_no: 'UV-2611-X',
        expiry_date: '2027-12-31',
        shelf_life_months: 25,
        po_qty: 50,
        received_qty: 50,
        po_rate: 510.00,
        invoice_rate: 535.00, // Flagged +25 INR hike!
        price_variance: +25.00,
        flag: 'Price hike ₹25/unit (+4.9%) over approved PO',
      },
    ],
  },
  {
    id: 'grn-02',
    grn_no: 'GRN-2026-11-043',
    po_no: 'PO-2026-092',
    distributor_name: 'Medisync Pharma Distributors',
    invoice_no: 'MS-INV-2041',
    invoice_date: '2026-11-25',
    total_amount: 41400,
    reconciliation_status: 'short_qty_flagged',
    items: [
      {
        item_name: 'Doxt-SL 100mg Capsule',
        batch_no: 'DX-2026-11B',
        expiry_date: '2027-09-30',
        shelf_life_months: 22,
        po_qty: 500,
        received_qty: 450, // Short 50 units!
        po_rate: 92.00,
        invoice_rate: 92.00,
        price_variance: 0,
        flag: 'Short shipment by 50 strips (Short delivery memo raised)',
      },
    ],
  },
  {
    id: 'grn-03',
    grn_no: 'GRN-2026-11-044',
    po_no: 'PO-2026-095',
    distributor_name: 'Sun Care Distributors Calicut',
    invoice_no: 'SCD-9904',
    invoice_date: '2026-11-26',
    total_amount: 142000,
    reconciliation_status: 'verified',
    items: [
      {
        item_name: 'BOTOX Cosmetic 100U',
        batch_no: 'BX-ALL-9901',
        expiry_date: '2027-11-30',
        shelf_life_months: 24,
        po_qty: 10,
        received_qty: 10,
        po_rate: 14200.00,
        invoice_rate: 14200.00,
        price_variance: 0,
      },
    ],
  },
];

// Seed Expiry Returns & Debit Notes
export const SEED_EXPIRY_RETURNS: ExpiryReturnDebitNote[] = [
  {
    id: 'dn-01',
    debit_note_no: 'DN-EXP-2026-004',
    distributor_name: 'Medisync Pharma Distributors',
    distributor_gstin: '32AABCM4590K1Z4',
    created_at: '2026-11-20',
    total_claim_amount: 11040.00,
    status: 'credit_note_received',
    credit_note_ref: 'CN-MED-8891 (₹11,040 adjusted in PO-096)',
    batches: [
      {
        batch_no: 'DX-2026-04A',
        item_name: 'Doxt-SL 100mg Capsule',
        expiry_date: '2026-12-20',
        return_qty: 120,
        landed_rate: 92.00,
        total_value: 11040.00,
      },
    ],
  },
  {
    id: 'dn-02',
    debit_note_no: 'DN-EXP-2026-005',
    distributor_name: 'Apex Derma Logistics',
    distributor_gstin: '32AADCA9912B1Z8',
    created_at: '2026-11-25',
    total_claim_amount: 9975.00,
    status: 'dispatched_to_vendor',
    credit_note_ref: 'Awaiting distributor physical verification',
    batches: [
      {
        batch_no: 'RA-0925-C',
        item_name: 'Retino-A 0.05% Cream 20g',
        expiry_date: '2027-01-15',
        return_qty: 35,
        landed_rate: 285.00,
        total_value: 9975.00,
      },
    ],
  },
];

// Seed Schedule H1 Statutory Register
export const SEED_SCHEDULE_H1_REG: ScheduleH1AuditEntry[] = [
  {
    id: 'h1-01',
    dispensed_at: '2026-11-26 10:15 AM',
    drug_name: 'Doxt-SL 100mg Capsule (Doxycycline)',
    salt_name: 'Doxycycline Hyclate 100mg',
    batch_no: 'DX-2026-11B',
    quantity: 10,
    patient_name: 'Fathima Zahra',
    patient_op: 'OP-1033',
    patient_aadhaar_ref: 'XXXX-XXXX-9142',
    doctor_name: 'Dr. Ananya Nair',
    doctor_reg_no: 'TCMC-49812-DERM',
    pharmacist_name: 'R. Shaji (Reg #KL-PH-8819)',
    clinical_indication: 'Grade III Inflammatory Acne Vulgaris',
  },
  {
    id: 'h1-02',
    dispensed_at: '2026-11-26 11:30 AM',
    drug_name: 'Sotret 20mg Capsule (Isotretinoin)',
    salt_name: 'Isotretinoin 20mg',
    batch_no: 'ST-8812-B',
    quantity: 30,
    patient_name: 'Rahul K. Sharma',
    patient_op: 'OP-1049',
    patient_aadhaar_ref: 'XXXX-XXXX-3810',
    doctor_name: 'Dr. Rohit Sharma',
    doctor_reg_no: 'KMC-55219-SURG',
    pharmacist_name: 'R. Shaji (Reg #KL-PH-8819)',
    clinical_indication: 'Recalcitrant Nodulocystic Acne',
  },
];

// Seed Isotretinoin Teratogenicity Register
export const SEED_ISOTRETINOIN_LOGS: IsotretinoinConsentLog[] = [
  {
    id: 'iso-01',
    patient_name: 'Pooja Krishnan',
    patient_op: 'OP-1028',
    age: 24,
    gender: 'Female',
    prescribing_doctor: 'Dr. Ananya Nair',
    doctor_reg_no: 'TCMC-49812-DERM',
    dispensed_date: '2026-11-25',
    tablet_strength_mg: 20,
    tablets_dispensed: 30,
    teratogenicity_waiver_signed: true,
    pregnancy_test_negative: true,
    contraception_counseling_verified: true,
    consent_pdf_ref: 'DOC-ISO-WAIVER-1028.pdf',
  },
  {
    id: 'iso-02',
    patient_name: 'Rahul K. Sharma',
    patient_op: 'OP-1049',
    age: 27,
    gender: 'Male',
    prescribing_doctor: 'Dr. Rohit Sharma',
    doctor_reg_no: 'KMC-55219-SURG',
    dispensed_date: '2026-11-26',
    tablet_strength_mg: 20,
    tablets_dispensed: 30,
    teratogenicity_waiver_signed: true,
    pregnancy_test_negative: true, // N/A for male, verified
    contraception_counseling_verified: true,
    consent_pdf_ref: 'DOC-ISO-WAIVER-1049.pdf',
  },
];

export interface PharmacyEnterpriseStore {
  salts: SaltMaster[];
  batches: EnterpriseBatch[];
  vialSplits: VialSplittingRecord[];
  velocityReorders: VelocityReorderItem[];
  bonusSchemes: BonusSchemeCalc[];
  grns: GRNReconciliation[];
  expiryReturns: ExpiryReturnDebitNote[];
  scheduleH1Reg: ScheduleH1AuditEntry[];
  isotretinoinLogs: IsotretinoinConsentLog[];
}

export function getPharmacyStore(): PharmacyEnterpriseStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: PharmacyEnterpriseStore = {
        salts: SEED_SALTS,
        batches: SEED_BATCHES,
        vialSplits: SEED_VIAL_SPLITS,
        velocityReorders: SEED_VELOCITY_REORDERS,
        bonusSchemes: SEED_BONUS_SCHEMES,
        grns: SEED_GRNS,
        expiryReturns: SEED_EXPIRY_RETURNS,
        scheduleH1Reg: SEED_SCHEDULE_H1_REG,
        isotretinoinLogs: SEED_ISOTRETINOIN_LOGS,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading pharmacy store', err);
    return {
      salts: SEED_SALTS,
      batches: SEED_BATCHES,
      vialSplits: SEED_VIAL_SPLITS,
      velocityReorders: SEED_VELOCITY_REORDERS,
      bonusSchemes: SEED_BONUS_SCHEMES,
      grns: SEED_GRNS,
      expiryReturns: SEED_EXPIRY_RETURNS,
      scheduleH1Reg: SEED_SCHEDULE_H1_REG,
      isotretinoinLogs: SEED_ISOTRETINOIN_LOGS,
    };
  }
}

export function savePharmacyStore(store: PharmacyEnterpriseStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event('pharmacy_db_updated'));
  } catch (err) {
    console.error('Error saving pharmacy store', err);
  }
}

export function subscribeToPharmacyUpdates(callback: () => void): () => void {
  window.addEventListener('pharmacy_db_updated', callback);
  return () => window.removeEventListener('pharmacy_db_updated', callback);
}
