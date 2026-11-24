# Urbab366 - On-Demand Home Services Platform

Urbab366 is an on-demand home services platform inspired by modern service marketplaces, built for Bengaluru with verified professionals across salon, spa, cleaning, appliance repair, electrical, plumbing, carpentry, and smart living appliances.

## 🚀 Key Features

- **Voice Search**: Built-in voice query recognition powered by Web Speech API (`SpeechRecognition`) with Indian English (`en-IN`) acoustic tuning and quick suggestion prompts.
- **Custom Aesthetic & Theme**: Distinct modern palette featuring Deep Violet (`#4C1D95`), Indigo, and Emerald (`#34D399`) accents.
- **Dynamic Category & Services Matrix**: 8 standard categories, 2 "Native by Urbab366" smart hardware product categories, and 34+ granular home services.
- **Bengaluru Localities Support**: Instant neighborhood selector covering Richmond Town, Koramangala, Indiranagar, Whitefield, HSR Layout, Jayanagar, and more.
- **Cart & Booking Flow**: Interactive cart drawer, slot scheduling (dates and time windows), address confirmation, and booking persistence.
- **Database Backed**: Structured relational schema powered by SQLite.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide React
- **Backend**: Python 3.12 (REST HTTP Service with CORS support)
- **Database**: SQLite (`backend/urbab366.db`)

---

## 📦 Project Structure

```text
UrbanCompany366/
├── backend/
│   ├── database.py         # SQLite schema, migrations, seed data, and query helpers
│   ├── mysql_schema.sql    # DDL schema (8 tables)
│   ├── mysql_seed.sql      # Seed data (categories, services, banners, locations)
│   └── server.py           # REST API HTTP server
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, VoiceSearchModal, Hero, Carousels, CartDrawer, etc.
│   │   ├── App.jsx         # Root application component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Tailwind CSS styling
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Worker onboarding and admin access

- The unlisted `/join` page accepts worker self-registration; new submissions are marked `Pending` until approved in `/admin`.
- The customer `Account` button supports email signup/login; sessions are issued through `/api/auth/signup`, `/api/auth/login`, and `/api/auth/me`.
- The `/admin` dashboard and every `/api/admin/*` endpoint require the `x-admin-key` header.
- Set `ADMIN_PASSWORD` in the Render backend environment. If it is unset, the development fallback is `Urbab366Admin2026!`; set a private password before production use.
- Laborer records are stored in the existing SQLite `laborers` table. Startup migrates its older single-service schema while preserving existing records.
- Customer worker lookup is available through `GET /api/laborers/search?service=...&locality=...&expertise=...`.

---

## ⚙️ Setup & Running Locally

### 1. Database Setup (SQLite)
The backend creates and migrates `backend/urbab366.db` automatically when it starts. Set `SQLITE_DB_PATH` to use a different database file.

### 2. Backend Setup (Python)
Install dependencies and run the server:
```bash
pip install -r requirements.txt
python backend/server.py
```
*Backend runs on `http://localhost:8000`. Werkzeug is used for customer password hashing.*

### 3. Frontend Setup (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://127.0.0.1:5173` (or available local port).*

### 4. Build for Production
```bash
cd frontend
npm run build
```
The production bundle will be generated in `frontend/dist/`.

---

## 📄 License
MIT
