from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db, init_db
from models import Job
from schemas import JobCreate, JobUpdate, JobResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Job Application Tracker", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default dev port
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/jobs")
def get_jobs(db: Session = Depends(get_db)):
    return db.query(Job).all()
@app.post("/jobs", response_model=JobResponse, status_code=201)
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    job = Job(
        company=payload.company,
        role=payload.role,
        date_applied=payload.date_applied_as_date(),
        status=payload.status,
        job_description=payload.job_description,
        website=payload.website,
        notes=payload.notes,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@app.put("/jobs/{job_id}")
def update_job(job_id: int, payload: JobUpdate, db: Session = Depends(get_db)):

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail=f"Job with id {job_id} not found")

    # Only touch fields that were explicitly included in the request body
    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        # date_applied arrives as a validated string — convert to date for the ORM
        if field == "date_applied":
            value = payload.date_applied_as_date()
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    return {
        "message": "Job has been updated",
        "job": JobResponse.model_validate(job),
    }
@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail=f"Job with id {job_id} not found")

    db.delete(job)
    db.commit()

    return {"message": "Job deleted"}