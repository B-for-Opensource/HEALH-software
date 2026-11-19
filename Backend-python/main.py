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
    photos
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all tables and run seed data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
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
    allow_origins=settings.CORS_ORIGINS,
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
def health_check():
    return {
        "status": "healthy",
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
