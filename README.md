# iBallot - Secure E-Voting Platform

iBallot is a secure, transparent, and modern electronic voting platform built on blockchain technology.  
The system leverages **Aadhaar** for voter verification and ensures election integrity through a decentralized ledger.

---

## ✨ Features

- **Blockchain-Based Voting**: All votes are recorded as transactions on a blockchain, making them immutable and publicly verifiable.  
- **Aadhaar-Based Authentication**: Ensures *"one person, one vote"* by using offline Aadhaar XML for voter registration and age verification.  
- **Secure & Anonymous**: Voter data is encrypted, and the voting process is designed to protect anonymity while maintaining verifiability.  
- **Admin Dashboard**: A dedicated interface for election administrators to create/manage elections, add candidates, and view results.  
- **Dockerized Environment**: The entire stack (frontend, backend, database, and emulators) is containerized with Docker for easy setup.  
- **Automated Secret Management**: Securely manages all application secrets using **Doppler**, eliminating the need for local `.env` files.  

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js  
- **Frontend**: React (or preferred frontend framework)  
- **Database**: PostgreSQL  
- **Blockchain**: Solidity, Ethers.js, Hardhat  
- **Authentication**: Firebase Authentication (Emulator)  
- **Containerization**: Docker, Docker Compose  
- **Secret Management**: Doppler  

---

## 📋 Prerequisites

Before running the application, ensure the following are installed on your system:

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose  
- [Node.js](https://nodejs.org/) & npm  
- [Doppler](https://www.doppler.com/) account (invitation to project org required)  

---

## 🚀 Getting Started (Full-Stack Setup)

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd iBallot
```

### 2. One-Time Developer Setup
Make the setup script executable:
```bash
chmod +x setup-dev.sh
```

Run the script:
```bash
./setup-dev.sh
```
This installs the Doppler CLI (if not already installed) and logs you into your Doppler account.

### 3. Build Docker Images
```bash
docker compose build
```

### 4. Run the Application
```bash
doppler run -- docker compose up
```

### ✅ Services Available
- **Frontend** → [http://localhost:3000](http://localhost:3000)  
- **Backend** → [http://localhost:5000](http://localhost:5000)  
- **PostgreSQL** → Port `5432`  
- **Firebase Auth Emulator** → [http://localhost:9099](http://localhost:9099)  

---

## 🎨 Frontend-Only Development

If you only work on the UI:

1. Navigate to frontend:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file `frontend/.env.local`:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

   > Change the URL if connecting to a remote backend.

4. Start development server:
   ```bash
   npm start
   ```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Running Tests

Run the full test suite:
```bash
doppler run -- docker compose run --rm test
```

Run a specific test file:
```bash
doppler run -- docker compose run --rm test __tests__/integration/login.test.js
```

---

## 📌 Notes

- Secrets are never stored locally; they are injected securely via **Doppler**.  
- All services are containerized for consistent developer environments.  

---

## 📜 License

This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) file for details.

---
