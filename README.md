# 🗳 iBallot – Secure & Transparent Blockchain Voting System

iBallot is a next-generation **electronic voting platform** designed to ensure **secure, transparent, and tamper‑proof elections** using **Ethereum blockchain** and **DigiLocker identity verification**.

---

## 🚀 Features

- **Blockchain Security:** Votes recorded on Ethereum chain (immutable and transparent)
- **DigiLocker Verification:** Voter identity verified via Aadhaar/Phone number ("one person, one vote")
- **Secure & Anonymized:** Voter mapped to vote using hash without revealing choice
- **Real‑time Results:** Live election dashboard via WebSockets
- **Admin Dashboard:** Manage elections, candidates, constituencies + analytics
- **Candidate Management:** Bulk upload via CSV with automatic NOTA option
- **Audit Trails:** Voting timestamps & TX hash logs for verification
- **Responsive UI:** Works on Desktop & Mobile (React + Tailwind)

---

## 🏗 Tech Stack

| Component | Technology |
|---|---|
| Frontend (Voter & Admin) | React.js + Tailwind CSS + Vite |
| Backend | Node.js + Express.js |
| Database | Neon PostgreSQL |
| Blockchain | Ethereum Smart Contracts |
| Authentication | JWT + Encrypted Custom Auth |
| Real Time Updates | WebSockets (ws) |

---

## 📂 Project Structure

```
iBallot/
├── backend/                 # Node.js Express Backend
│   ├── blockchain/          # Smart Contract ABI & Logic
│   ├── database/            # DB Connection & Scripts
│   ├── middleware/          # Auth Middlewares
│   ├── routes/              # API Routes (Admin & User)
│   ├── utils/               # Crypto & Hashing Utils
│   ├── uploads/             # Temp uploads
│   └── public/symbols/      # Candidate Symbols
├── frontend-admin/          # React Admin Dashboard
│   ├── src/components/      # UI components
│   ├── src/pages/           # Dashboard, Elections, Candidates
│   └── src/services/        # API service calls
├── frontend-voter/          # React Voter Portal
│   ├── src/components/      # UI components
│   ├── src/context/         # Auth & Verification
│   └── src/pages/           # Login, Vote, Dashboard
└── docker-compose.yml       # Docker orchestration
```

---

## 🛠 Setup & Installation

### ✅ Prerequisites
- Node.js (v16+)
- PostgreSQL / Neon DB
- MetaMask or Local blockchain (Ganache/Hardhat/Anvil)
- Git

### 1. Clone the Repo
```
git clone https://github.com/sidd1224/iballot.git
cd iballot
```

### 2. Backend Setup
```
cd backend
npm install
```

Create `.env` file in `backend/`:
```
PORT=5000
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=iballot
DB_PASSWORD=your_db_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
SECRET_SALT=your_secret_salt
```

Initialize DB:
```
psql -U your_db_user -d iballot -f dump.sql
```

Run Server:
```
npm run dev
```

### 3. Frontend (Voter)
```
cd ../frontend-voter
npm install
```

Create `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Run:
```
npm run dev
```

### 4. Frontend (Admin)
```
cd ../frontend-admin
npm install
```

Create `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Run:
```
npm run dev
```

### 5. Run Using Docker (Optional)
```
docker-compose up --build
```

---

## 🧑‍🧭 Voter Flow

1. Verify identity using DigiLocker  
2. Register/Login  
3. View relevant elections by constituency  
4. Vote for candidate or NOTA  
5. Receive TX hash as proof ✅  

---

## 🔗 Live Demo

- **Voter Portal:** https://iballot-frontend-voter-715732606815.asia-south1.run.app/  
- **Admin Dashboard:** https://iballot-frontend-admin-715732606815.asia-south1.run.app/  

> ✅ Both portals are hosted on **Google Cloud Run** using **Nginx reverse proxy (frontend)** and **Neon PostgreSQL (backend)**.

---

