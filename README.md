# HEAL Aesthetic & Medical Clinic Management System
**Outpatient ERP, CMS & Clinical EMR Platform**
*Built for 3 Branches: Karanthoor, Calicut Beach Road, and Sulthan Bathery Wayanad (Kerala)*

---

## 1. Architecture & Dual-Backend Options

The system includes a single unified **React.js Frontend** and **two alternative Backends** that you can choose based on your hosting infrastructure:

| Component | Stack | Hosting Target | Cost Profile |
|---|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS v4 | Any static host / cPanel `public_html/` | Low / Free |
| **Backend (PHP)** | Pure PHP 8.1+ REST API (zero composer dependencies) | Shared cPanel Apache Hosting | Extremely low cost (~₹150-300/mo) |
| **Backend (Python)** | FastAPI 0.115+ + SQLAlchemy 2.0 + SQLite/MySQL | VPS / Cloud (DigitalOcean, AWS, Linode) | High performance (~₹400-800/mo) |

Both backends implement the **exact same REST API contracts**, endpoints, and JSON response structure, so the React frontend works seamlessly with either option.

---

## 2. Directory Structure

```
d:\HEAL\FINAL\
├── Backend\                    # Pure PHP 8.1+ REST API (cPanel Shared Hosting)
│   ├── api\                    # 16 REST endpoints
│   ├── config\                 # PDO MySQL connection & constants
│   ├── lib\                    # Pure PHP JWT, Auth middleware, Validator, Response
│   ├── database.sql            # MySQL schema + seed data
│   └── index.php               # Front controller API router
│
├── Backend-python\             # Python FastAPI REST API (VPS / Cloud Hosting)
│   ├── routers\                # 15 FastAPI modular routers matching all endpoints
│   ├── config.py               # Settings from .env
│   ├── database.py             # SQLAlchemy session & engine
│   ├── models.py               # 16 SQLAlchemy entities
│   ├── schemas.py              # Pydantic validation schemas
│   ├── auth.py                 # JWT & bcrypt password hashing
│   ├── seed.py                 # Automatic startup database seeding
│   ├── main.py                 # FastAPI app entrypoint
│   └── requirements.txt        # Python dependencies
│
└── Frontend\                   # React 19 + TypeScript + Vite + Tailwind CSS v4
    ├── dist\                   # Pre-compiled production build ready to deploy
    ├── src\                    # Full UI (Reception, Clinical EMR, Billing POS, Aesthetic Packages, Reports)
    └── package.json
```

---

## 3. How to Run Each Component

### A. Run Python FastAPI Backend
```bash
cd d:\HEAL\FINAL\Backend-python
pip install -r requirements.txt
python main.py
```
- API will start at `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Auto-seeds SQLite database with default branches, admin user, packages, and medicines.

### B. Run PHP Backend (cPanel / Local Apache)
- Import `Backend/database.sql` into MySQL.
- Update `Backend/config/database.php` with MySQL credentials.
- Deploy to Apache / cPanel under `/api`.

### C. Run React Frontend
```bash
cd d:\HEAL\FINAL\Frontend
npm install
npm run dev
```
- Dev UI runs at `http://localhost:3000` (or `5173`)
- Point to Python backend (`http://localhost:8000/api`) or PHP backend (`http://localhost/heal-api/api`) via `Frontend/.env`.

---

## 4. Default Credentials (Both Backends)

- **Username:** `admin`
- **Password:** `Admin@1234`
- **Role:** Super Admin (All branches, full permissions)
