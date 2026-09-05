# Mediora - Medical Report Simplifier

> **K.D.K. COLLEGE OF ENGINEERING, NAGPUR**  
> *(An Autonomous Institute, Accredited by NAAC and NBA)*  
> *"Service to the Society Through Quality Technical Education"*  
> **PRESENTS:** **VIBE with AI** — AI-Powered Web Development Challenge  
> **ORGANIZED BY:** Coding Club  

---

**Track:** Healthcare & Emergency Response  
**Problem Statement:** Medical Report Simplifier  
**Objective:** Use AI to convert complex medical report terminology into simple, easy-to-understand language  
**Team ID:** 219A37  
**Team Name:** Grove  

## Team Members
- Subodh Walondre – Backend
- Sanskruti Mishra – Research + Innovation + Pitch Lead
- Amogh Samarth – Frontend
- Meksha Tajane – UI/UX + Visualize Presenter + Research 

## Problem Statement
Medical reports provide critical health indicators, but patients often struggle to understand complex clinical terminology and how their lab results translate into everyday health decisions and nutrition choices. Generic advice does not consider individual lab findings, biological reference ranges, or dietary restrictions.

**Mediora** solves this by using AI to:
- Convert complex medical and veterinary terminology into simple, easy-to-understand language.
- Automatically extract and normalize diagnostic lab test parameters across human and veterinary species.
- Evaluate severity against biological reference ranges and compute a dynamic Health Score (0–100).
- Generate personalized, evidence-grounded health insights and tailored diet recommendations based on specific lab findings.

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Zustand, Vanilla CSS, Lucide React, Chart.js
- **Backend:** FastAPI, Python, Uvicorn, SQLAlchemy, Pydantic
- **Database:** SQLite
- **AI/ML:** EasyOCR, Tesseract, OpenCV, Pillow, OpenRouter LLMs
- **RAG:** Custom Vector-Similarity RAG, JSON Clinical Knowledge Base
- **AI Safety:** Rule-Based Safety Validator
- **Translation:** Sarvam AI
- **Authentication & Security:** PyJWT, Passlib (Bcrypt)
- **Testing:** Pytest, Vitest, React Testing Library, HTTPX
- **Development:** Git, Python 3.11, Virtual Environment (venv)

## Features
- **Feature 1:** Patient Category Selection (Human & Veterinary)
- **Feature 2:** Automated Medical Report OCR Extraction
- **Feature 3:** Reference Range & Severity Normalization
- **Feature 4:** Dynamic AI Health Score (0–100)
- **Feature 5:** Finding-Driven RAG Recommendation Engine
- **Feature 6:** Lab-Driven Personalized Diet Plan Engine
- **Feature 7:** Multi-Species Health Support
- **Feature 8:** Multi-Report Health Insights & Trend Analytics
- **Feature 9:** Medical Layman AI Explanations Engine
- **Feature 10:** Multi-Lingual Regional Translation
- **Feature 11:** Multi-Profile Patient Management
- **Feature 12:** Secure Report Sharing & Access Logging
- **Feature 13:** Instant Report Reprocessing Pipeline
- **Feature 14:** Interactive Visual Health Dashboard

## Installation

### Frontend
```bash
cd frontend
npm install
```

### Backend
```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

---

## 🚀 How to Run

### Frontend
```bash
cd frontend
npm run dev
```
The frontend web application will start at `http://localhost:5173`.

### Backend
```bash
cd backend
# Activate virtual environment if not activated:
.venv\Scripts\activate

# Run Uvicorn dev server:
uvicorn src.main:app --reload --port 8000
```
The backend API server will start at `http://localhost:8000`.
- **Interactive API Docs (Swagger)**: `http://localhost:8000/docs`
- **ReDoc API Docs**: `http://localhost:8000/redoc`
