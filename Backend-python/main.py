import sys
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from config import settings
from database import engine, Base, SessionLocal
from seed import seed_database

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
    hrms
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

# CORS Middleware (Allows React frontend communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://heal-final-os.netlify.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
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
