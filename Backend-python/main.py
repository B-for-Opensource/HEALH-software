import sys
import json
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from config import settings
from database import engine, Base, SessionLocal
import models
from seed import seed_database
from realtime import ws_manager

# Import routers
from routers import (
    auth,
    patients,
    appointments,
    consultations,
    prescriptions,
    medicines,
    billing,
    payments,
    packages,
    sessions,
    reports,
    dashboard,
    staff,
    departments,
    photos,
    hrms,
    encounters,
    lab,
    imaging,
    pharmacy,
    nursing,
    patient_portal,
    finance,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: safely create all tables and handle concurrent worker boots
    try:
        Base.metadata.create_all(bind=engine, checkfirst=True)
    except Exception as e:
        if "already exists" in str(e).lower():
            pass
        else:
            print(f"Database schema initialization notice: {e}")

    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        print(f"Database seed notice: {e}")
        try:
            db.rollback()
        except Exception:
            pass
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Python FastAPI REST backend for HEAL Aesthetic & Medical Clinic Management System",
    lifespan=lifespan
)

# CORS Middleware (Supports 3 Dedicated Frontends: Core, HRMS, and Pharmacy)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://healh-software.netlify.app",
        "https://heal-final-os.netlify.app",
        "https://heal-hrms.netlify.app",
        "https://heal-pharmacy.netlify.app",
        # Core Frontend (Port 3000 / 5173)
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        # HRMS Dedicated Frontend (Port 3001 / 5174)
        "http://localhost:3001",
        "http://localhost:5174",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5174",
        # Pharmacy Dedicated Frontend (Port 3002 / 5175)
        "http://localhost:3002",
        "http://localhost:5175",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:5175",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Mount Static Uploads (For clinical before/after photo viewing)
uploads_dir = Path(__file__).resolve().parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(consultations.router)
app.include_router(prescriptions.router)
app.include_router(medicines.router)
app.include_router(billing.router)
app.include_router(payments.router)
app.include_router(packages.router)
app.include_router(sessions.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(staff.router)
app.include_router(departments.router)
app.include_router(photos.router)
app.include_router(hrms.router)
app.include_router(encounters.router)
app.include_router(lab.router)
app.include_router(imaging.router)
app.include_router(pharmacy.router)
app.include_router(nursing.router)
app.include_router(patient_portal.router)
app.include_router(finance.router)

@app.websocket("/ws/pipeline")
async def pipeline_websocket(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.get("/api/pipeline/sync")
def sync_pipeline_pull():
    """Live DB-backed pipeline snapshot (no longer uses pipeline_cache.json as source of truth)."""
    db = SessionLocal()
    try:
        appts = db.query(models.Appointment).all()
        encounters = db.query(models.Encounter).all()
        return {
            "status": "ok",
            "source": "database",
            "appointments": [{
                "id": a.id, "token_no": a.token_no, "patient_id": a.patient_id,
                "doctor_id": a.doctor_id, "status": a.status,
                "appointment_date": a.appointment_date.isoformat() if a.appointment_date else None,
            } for a in appts],
            "encounters_count": len(encounters),
            "updated_at": datetime.utcnow().isoformat() + "Z",
        }
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "framework": "FastAPI (Python 3.12)",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/health")
@app.get("/api/health")
@app.get("/cron")
@app.get("/api/cron")
@app.get("/api/cron/keep-alive")
@app.get("/ping")
def health_and_cron_check():
    return {
        "status": 200,
        "health": "okay",
        "running": True,
        "message": "HEAL Clinic backend is healthy and running",
        "service": "HEAL Clinic Management API",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/api")
def api_root():
    return {
        "status": "ok",
        "app": "HEAL Clinic REST API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
