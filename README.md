# iBallot - Secure Blockchain E-Voting Platform

iBallot is a modern, secure, and transparent electronic voting platform designed to ensure election integrity through the use of blockchain technology. It leverages a mock Aadhaar/DigiLocker system for voter verification, ensuring a "one person, one vote" paradigm in a fully containerized development environment.

## ✨ Core Features
- **Blockchain-Based Voting**: Every vote is a transaction recorded on a decentralized ledger, making it immutable, transparent, and publicly verifiable.
- **Secure Voter Authentication**: A multi-step registration process uses mock DigiLocker data to verify voter identity and eligibility (age >= 18).
- **Gasless Meta-Transactions**: Voters can cast their ballots without needing cryptocurrency. A designated relayer account covers the gas fees, simplifying the user experience.
- **Role-Based Access**:
  - *Voter Dashboard*: A user-friendly interface for voters to view eligible elections and cast their ballots.
  - *Admin Panel*: A comprehensive dashboard for administrators to create and manage elections, upload candidate lists via CSV, and view results.
- **Dockerized Environment**: The entire application stack—frontend, backend, PostgreSQL database, and Firebase Auth emulator—is containerized with Docker for consistent, one-command setup.
- **Automated Secret Management**: All secrets and environment variables are securely managed by Doppler, eliminating the need for local .env files.

## 🛠 Tech Stack
- **Backend**: Node.js, Express.js  
- **Frontend**: React (Vite)  
- **Database**: PostgreSQL  
- **Blockchain**: Solidity, Ethers.js, Hardhat (for development and deployment)  
- **Authentication**:  
  - Voter: Custom authentication tied to database records.  
  - Admin: Token-based authentication.  
- **Containerization**: Docker, Docker Compose  
- **Secret Management**: Doppler  

## 🚀 Getting Started
Before you begin, ensure you have the following installed on your system:
- Docker & Docker Compose  
- Node.js & npm  
- Doppler CLI and a Doppler account  

### 1. Doppler Setup (One-Time)
You need to install the Doppler CLI and log in to your account to access the project's secrets.

**Install Doppler CLI:**  
Run the following command in your terminal:

```bash
(curl -Ls https://cli.doppler.com/install.sh || wget -qO- https://cli.doppler.com/install.sh) | sh
```

**Login to Doppler:**  
After installation, authenticate with your Doppler account. This will open a browser window for you to log in.

```bash
doppler login
```

### 2. Build and Run the Application
Once your Doppler CLI is authenticated, you can build and run the entire application stack with a single command.

```bash
doppler run -- docker compose up --build
```

## ✅ Services Available
After running the command, the following services will be accessible:

- Frontend (Voter & Admin): [http://localhost:3000](http://localhost:3000)  
- Backend API: [http://localhost:5000](http://localhost:5000)  
- PostgreSQL Database: Port 5432  
- Firebase Auth Emulator UI: [http://localhost:4000](http://localhost:4000)  

## 🗳️ Key Workflows

### Voter Workflow
1. **Register**: A new voter navigates to the registration page, provides a username and password, and verifies their identity via a (mock) DigiLocker phone number. The system checks their age and creates a unique Ethereum wallet for them.  
2. **Login**: The voter logs in with their credentials.  
3. **Dashboard**: The voter is taken to their dashboard, which fetches and displays only the elections they are eligible to vote in, based on their constituency.  
4. **View Candidates**: The voter selects an election and is shown a list of candidates for their specific constituency.  
5. **Vote**: The voter selects a candidate and confirms their choice by re-entering their password. This triggers a secure, gasless meta-transaction that is recorded on the blockchain.  

### Admin Workflow
1. **Login**: An admin navigates to `/admin/login` and authenticates using a secret token.  
2. **Admin Dashboard**: The admin is taken to a multi-page dashboard.  
3. **Create Election**: The admin can create a new election by providing a name, type, start/end times, and a list of eligible constituency IDs. This action updates both the database and the smart contract.  
4. **Upload Candidates**: The admin can upload a CSV file containing a list of candidates for a specific election and constituency.  
5. **View Results**: The admin can view real-time election results, which are fetched directly from the blockchain.  

## 🧪 Running Tests
The backend includes a suite of integration and unit tests. To run them, use the following command, which starts the test-specific services defined in `docker-compose.yml`:

```bash
doppler run -- docker compose run --rm test
```
