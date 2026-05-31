# Job Application Tracker

A full-stack job application tracker built to manage and monitor job applications locally. Track where you applied, what stage you're at, and get a quick overview of your application pipeline.

---

## Live Demo
- **App:** [ https://job-application-tracker-roan.vercel.app](https://job-application-tracker-roan.vercel.app/)
- **API Docs:** [https://job-application-tracker-xzsr.onrender.com/docs](https://job-application-tracker-xzsr.onrender.com/docs)

> Backend is hosted on Render free tier and may take time to load first time

## Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy, Pydantic, SQLite  
**Frontend:** React, Vite, JavaScript

---

## Features

- Add, view, edit, and delete job applications
- Inline status updates per application (Applied, Interview, Offer, Rejected, Ghosted)
- Filter applications by status with live tab counts
- Sort applications by company, role, status, or date applied
- Analytics dashboard with status breakdown and recent activity
- Delete confirmation to prevent accidental removal

---

## Setup

**Backend**
```bash
cd backend
pip install fastapi uvicorn sqlalchemy pydantic
uvicorn main:app --reload
```
Backend runs on `http://localhost:8000`  
Swagger UI available at `http://localhost:8000/docs`

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

> Backend must be running before starting the frontend.

---

## Demo Data

`jobs.db` is included with sample job applications for demo purposes.

---

## Development Notes

Built using a spec-driven development approach with AI-assisted coding. Endpoints and components were defined as a written spec before implementation. Each piece was tested against the spec before moving to the next, with AI tools used to scaffold, iterate, and debug throughout the process.
