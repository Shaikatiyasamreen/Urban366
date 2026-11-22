# Urbab366 - On-Demand Home Services Platform

Urbab366 is an on-demand home services platform inspired by modern service marketplaces, built for Bengaluru with verified professionals across salon, spa, cleaning, appliance repair, electrical, plumbing, carpentry, and smart living appliances.

## 🚀 Key Features

- **Voice Search**: Built-in voice query recognition powered by Web Speech API (`SpeechRecognition`) with Indian English (`en-IN`) acoustic tuning and quick suggestion prompts.
- **Custom Aesthetic & Theme**: Distinct modern palette featuring Deep Violet (`#4C1D95`), Indigo, and Emerald (`#34D399`) accents.
- **Dynamic Category & Services Matrix**: 8 standard categories, 2 "Native by Urbab366" smart hardware product categories, and 34+ granular home services.
- **Bengaluru Localities Support**: Instant neighborhood selector covering Richmond Town, Koramangala, Indiranagar, Whitefield, HSR Layout, Jayanagar, and more.
- **Cart & Booking Flow**: Interactive cart drawer, slot scheduling (dates and time windows), address confirmation, and booking persistence.
- **Database Backed**: Structured relational schema powered by MySQL.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide React
- **Backend**: Python 3.12 (REST HTTP Service with CORS support)
- **Database**: MySQL 8.0 (`urbab366_db` with InnoDB and utf8mb4 encoding)

---

## 📦 Project Structure

```text
UrbanCompany366/
├── backend/
│   ├── database.py         # PyMySQL connection pool & query helpers
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

---

## ⚙️ Setup & Running Locally

### 1. Database Setup (MySQL)
Ensure MySQL Server is running on port 3306:
```bash
mysql -u root -p < backend/mysql_schema.sql
mysql -u root -p < backend/mysql_seed.sql
```

### 2. Backend Setup (Python)
Install dependencies and run the server:
```bash
pip install pymysql cryptography
python backend/server.py
```
*Backend runs on `http://localhost:8000`.*

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
