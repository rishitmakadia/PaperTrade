# Private Portfolio Terminal — Complete Project Run & Operations Guide

This guide covers how to set up and run the **Private Portfolio Terminal** platform (Spring Boot backend + React/Vite frontend + PostgreSQL database), manage ports, resolve conflicts, and change configurations without breaking the application flow.

---

## 🏗️ System Architecture & Default Ports

| Component | Technology | Default Port | Directory | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | Spring Boot 3.4.x (Java 21) | **`5001`** | `/paper-trade` | Port `5001` is used to avoid macOS AirPlay Receiver on `5000` |
| **Frontend** | React 18 + Vite | **`5173`** | `/frontend` | Proxies API calls to `5001` |
| **Database** | PostgreSQL 18 / 17 / 16 | **`5432`** | Database: `papertrade` | Managed with automated Flyway migrations |

---

## 🚀 1. First-Time Setup

### Step 1: Create the PostgreSQL Database
Make sure PostgreSQL is running on your machine, then create the `papertrade` database:

```bash
# Using macOS / Homebrew or PostgreSQL installer:
psql -U postgres -h localhost -c "CREATE DATABASE papertrade;"
```
*(Enter your PostgreSQL password when prompted; default in application.properties is `1234`).*

### Step 2: Verify Database Connection in Backend
Open `paper-trade/src/main/resources/application.properties` and verify your credentials:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/papertrade
spring.datasource.username=postgres
spring.datasource.password=1234
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## ⚡ 2. Regular Daily Run (Subsequent Runs)

Every time you work on the project, run the **Backend** and **Frontend** in two separate terminal windows (or run the backend from your IDE).

### Terminal 1 — Start Backend (Spring Boot)
```bash
cd paper-trade
./mvnw spring-boot:run
```
> **Or run from your IDE**: Open the project in IntelliJ IDEA / VS Code / Eclipse and run `PaperTradeApplication.java`.

- When the backend starts, **Flyway** automatically validates/creates all schema tables and seeds initial Indian NSE stocks and demo accounts.
- Verify status: [http://localhost:5001/actuator/health](http://localhost:5001/actuator/health) (returns `{"status":"UP"}`).

---

### Terminal 2 — Start Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
- Open your browser at: **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 3. Pre-Seeded Demo Accounts

You can log in immediately or test with these accounts:

| Role | Email | Password | Initial Balance |
| :--- | :--- | :--- | :--- |
| **Trader** | `krunal@example.com` | `password123` | ₹12,47,832.50 (with sample trades & portfolios) |
| **Admin** | `admin@admin.com` | `12345678` | Full access to Admin Console |
| **New User** | Any email | Any password | ₹10,00,000 fresh virtual capital |

---

## 🛑 4. How to Kill / Free Occupied Ports

If you receive `Web server failed to start. Port 5001 was already in use` or Vite starts on `5174` instead of `5173`:

### macOS & Linux:

#### Check what is using the ports:
```bash
lsof -i :5001 -i :5173
```

#### Kill the process on Port 5001 (Backend):
```bash
kill -9 $(lsof -ti :5001)
```

#### Kill the process on Port 5173 (Frontend):
```bash
kill -9 $(lsof -ti :5173)
```

#### Kill both with one command:
```bash
kill -9 $(lsof -ti :5001 -ti :5173) 2>/dev/null || true
```

---

### Windows (PowerShell / Command Prompt):

#### Check port usage:
```powershell
netstat -ano | findstr :5001
netstat -ano | findstr :5173
```

#### Kill process by PID:
```powershell
taskkill /PID <PID_NUMBER> /F
```

---

## 🔀 5. Running on a Custom Port (Without Breaking the App)

If you ever need to run the backend or frontend on different ports:

### Option A: Change Backend Port (e.g., to `8080` or `5002`)

1. **Start backend with custom port**:
   ```bash
   cd paper-trade
   ./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=5002"
   ```
   *(Or set `PORT=5002` in your environment or `server.port=5002` in `application.properties`).*

2. **Update Frontend to connect to the new port**:
   In `frontend/.env`:
   ```properties
   VITE_API_URL=http://localhost:5002
   ```
   And in `frontend/vite.config.js`:
   ```javascript
   server: {
     proxy: {
       "/api": {
         target: "http://localhost:5002",
         changeOrigin: true,
       },
     },
   }
   ```

---

### Option B: Change Frontend Port (e.g., to `3000`)

1. **Run Vite on custom port**:
   ```bash
   cd frontend
   npm run dev -- --port 3000
   ```
2. The Spring Boot backend's CORS is pre-configured with `allowedOriginPatterns` to accept all `http://localhost:*` and `http://127.0.0.1:*` ports automatically.

---

## 🛠️ 6. Troubleshooting Common Issues

### Issue 1: `Failed to fetch` in Frontend
- **Cause**: Backend is not running or CORS blocked the request.
- **Solution**:
  1. Check if backend is running: `curl http://localhost:5001/actuator/health`
  2. If using `127.0.0.1:5173` instead of `localhost:5173`, CORS is already configured for all localhost patterns in `SecurityConfig.java`.

### Issue 2: `FATAL: password authentication failed for user "postgres"`
- **Cause**: Database password in `application.properties` does not match your local PostgreSQL password.
- **Solution**:
  - Test connection: `psql -U postgres -h localhost -d papertrade`
  - Update `spring.datasource.password` in `paper-trade/src/main/resources/application.properties`.

### Issue 3: `Email already registered` on Sign Up
- **Cause**: The account already exists in the PostgreSQL `users` table.
- **Solution**:
  - Sign in using your existing password, or
  - Delete the test account from database:
    ```bash
    psql -U postgres -h localhost -d papertrade -c "DELETE FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email='test@test.com'); DELETE FROM users WHERE email='test@test.com';"
    ```

---

## 📋 7. Summary Cheat Sheet

```bash
# 1. Kill any stale processes on 5001 & 5173
kill -9 $(lsof -ti :5001 -ti :5173) 2>/dev/null || true

# 2. Run Backend (Terminal 1)
cd paper-trade && ./mvnw spring-boot:run

# 3. Run Frontend (Terminal 2)
cd frontend && npm run dev
```
