# HEAL Aesthetic & Medical Clinic Management System
## Python FastAPI Backend

FastAPI REST API backend for the **HEAL Outpatient Clinic Management System**, built for 3 branches (*Karanthoor, Calicut Beach Road, and Sulthan Bathery Wayanad*).

---

## 1. Tech Stack & Features

- **Framework:** FastAPI 0.115+ (Python 3.10+)
- **ORM / Database:** SQLAlchemy 2.0+ (Supports **SQLite** for zero-setup local development and **MySQL / MariaDB** with PyMySQL for production)
- **Authentication:** JWT (PyJWT HS256) + direct `bcrypt` password hashing (rounds=12)
- **Role-Based Access Control:** Super Admin, Branch Manager, Doctor, Receptionist, Cashier, Therapist, Nurse
- **Multi-Branch Support:** Branch partitioning (`KRN`, `CLT`, `WYD`) with `X-Branch-Id` override for administrators
- **File Uploads:** Clinical before/after photo uploads served via FastAPI static files (`/uploads/photos/`)
- **Interactive Documentation:** Automatic Swagger UI at `/docs` and ReDoc at `/redoc`

---

## 2. Directory Structure

```
d:\HEAL\FINAL\Backend-python\
├── config.py              # Environment configuration & settings
├── database.py            # SQLAlchemy engine, session maker & get_db
├── models.py              # SQLAlchemy models (all 16 clinic entities)
├── schemas.py             # Pydantic request/response validation schemas
├── auth.py                # JWT auth, bcrypt hashing & permission middleware
├── seed.py                # Automatic startup database seeding (branches, admin, packages)
├── main.py                # FastAPI app initialization, CORS & router mounting
├── requirements.txt       # Python dependencies
├── .env.example           # Example environment file
├── .env                   # Active environment configuration
├── uploads/
│   └── photos/            # Clinical before/after photos
└── routers/
    ├── auth.py            # POST /login, GET /me, POST /change-password
    ├── patients.py        # Patient CRUD, OP numbering, phone search
    ├── appointments.py    # Daily queue, tokens, follow-up queue
    ├── consultations.py   # EMR records, vitals, diagnosis, treatment
    ├── prescriptions.py   # Prescription builder & printable HTML/PDF
    ├── medicines.py       # Medicine catalog & live autocomplete
    ├── billing.py         # POS bills, GST calculation, line items
    ├── payments.py        # Multi-mode split payments (Cash, UPI, Card)
    ├── packages.py        # Aesthetic treatment packages & patient ledger
    ├── sessions.py        # Daycare session logging & parameter tracking
    ├── reports.py         # Financial collection audit & 7-day trend
    ├── dashboard.py       # Live clinic metrics & KPI cards
    ├── staff.py           # Doctor & staff directory
    ├── departments.py     # Clinic departments
    └── photos.py          # Clinical photo multipart upload
```

---

## 3. Quickstart & Running Locally

### Step 1: Install Dependencies
```bash
cd d:\HEAL\FINAL\Backend-python
pip install -r requirements.txt
```

### Step 2: Start the FastAPI Server
```bash
uvicorn main:app --reload --port 8000
```
*Or simply run:*
```bash
python main.py
```

The server will automatically:
1. Initialize the SQLite database `heal.db` (zero configuration needed).
2. Seed the 3 default clinic branches (Karanthoor, Calicut Beach, Wayanad).
3. Seed the default departments and sample aesthetic packages & medicines.
4. Create the default Super Admin user:
   - **Username:** `admin`
   - **Password:** `Admin@1234`

### Step 3: View Interactive API Documentation
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 4. Connecting With React Frontend

In `d:\HEAL\FINAL\Frontend\`:
Edit `.env` or `vite.config.ts`:
```env
VITE_API_URL=http://localhost:8000/api
```
Or if using Vite's development proxy in `vite.config.ts`:
```ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

---

## 5. Production Deployment (MySQL on VPS / Cloud)

To switch from SQLite to MySQL in production:
1. In `Backend-python/.env`:
   ```env
   DATABASE_URL=mysql+pymysql://heal_user:your_password@localhost:3306/heal_clinic_db?charset=utf8mb4
   ```
2. Run with Gunicorn + Uvicorn workers:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
   ```
