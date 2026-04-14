# Simply-Life OS

## Overview
Simply-Life is a pro-active, multi-tenant Personal Operating System (Life OS) designed to orchestrate productivity, financial planning, and health telemetry within a single, secure ecosystem. Unlike traditional task managers, Simply-Life functions as a contextual engine that dynamically prioritizes data streams based on user-defined parameters and source urgency.

## Architecture & Tech Stack
The application relies on a decoupled architecture, ensuring strict separation of concerns between the presentation layer and business logic.

* **Frontend:** React (TypeScript), Vite, Tailwind CSS, Zustand, React Router DOM.
* **Backend:** Python 3, FastAPI, SQLAlchemy, SQLite (Development) / PostgreSQL (Production), Pydantic.
* **Security:** JWT (JSON Web Tokens) for stateless session management, Passlib & Bcrypt for password hashing, AES-256 for third-party API token encryption, SlowAPI for rate-limiting.

## Key Capabilities

### 1. Algorithmic Triage Engine
An internal scoring service intercepts incoming tasks and calculates priority scores (0-150) based on source weight and user-defined keyword matching. High-priority items bypass standard queues and trigger critical UI states.

### 2. Financial Ledger (50/30/20 Framework)
A comprehensive financial module that tracks debits and credits, automatically calculating daily burn rates and budget adherence against standard economic frameworks.

### 3. Health & Habit Telemetry
A system to monitor and persist daily wellness metrics (hydration, sleep tracking, medication compliance) linked directly to the user's daily productivity streak.

### 4. Multi-Tenant Data Isolation
Robust middleware ensures that all database operations (CRUD) are strictly filtered by the authenticated user's ID extracted from the HTTP Bearer Token, eliminating the risk of horizontal data leakage.

## Local Environment Setup

### Backend Initialization
1. Navigate to the backend directory: `cd backend`
2. Create and activate a virtual environment: `python -m venv venv` and `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Start the ASGI server: `python -m uvicorn main:app --reload`

### Frontend Initialization
1. Navigate to the frontend directory: `cd frontend`
2. Install Node dependencies: `npm install`
3. Start the Vite development server: `npm run dev`

