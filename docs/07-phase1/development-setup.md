# Local Development Environment Setup Guide

**Document ID:** `docs/07-phase1/development-setup.md`  
**Status:** COMPLETED / VERIFIED

---

## 1. Prerequisites

1. **Node.js:** v20.x or higher (Tested on Node.js v24.13.0).
2. **npm:** v10.x or higher (Tested on npm 11.6.2).
3. **PostgreSQL:** v16.x with superuser access.
4. **Android Studio:** Ladybug or newer with Android SDK 34/37 (for Android client engineers).

---

## 2. Step-by-Step Setup

### Step 1: Database Initialization
Connect to PostgreSQL and create the development and test databases:
```bash
psql -U postgres -c "CREATE USER sarvraksha WITH PASSWORD 'sarvraksha_password' SUPERUSER;"
psql -U postgres -c "CREATE DATABASE sarvraksha_dev OWNER sarvraksha;"
psql -U postgres -c "CREATE DATABASE sarvraksha_test OWNER sarvraksha;"
```

### Step 2: Environment Configuration
Navigate to `backend/` and verify the `.env` file:
```bash
cd backend
cp .env.example .env
```

Default `.env` settings:
```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://sarvraksha:sarvraksha_password@localhost:5432/sarvraksha_dev
JWT_SECRET=sarvraksha_production_foundation_secret_key_32_chars_minimum!
JWT_EXPIRES_IN_SECONDS=900
REFRESH_TOKEN_EXPIRES_IN_DAYS=7
CORS_ORIGIN=*
LOG_LEVEL=info
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run Database Migrations
Execute forward-only SQL migrations:
```bash
npm run migrate
```

### Step 5: Run Automated Tests
```bash
npm test
```

### Step 6: Start Backend Development Server
```bash
npm run dev
```
The server will boot on `http://0.0.0.0:3000`. Health endpoints will be live:
- `http://localhost:3000/health`
- `http://localhost:3000/ready`
- `http://localhost:3000/metrics`

---

## 3. Connecting the Android Client to Local Backend

When testing the Android app against a local workstation:
- **Android Emulator:** Use `http://10.0.2.2:3000/api/v1` as the base API URL (points to host localhost).
- **Physical Device over Wi-Fi:** Use `http://<your-workstation-lan-ip>:3000/api/v1` (ensure workstation firewall allows port 3000).
