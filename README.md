# run
backend: npm install, npm run dev
frontend npm install, npm run dev
# 💸 SplitSmart — Smart Expense Splitter

A full-stack MERN app to track and split group expenses with AI-powered natural language input.

## ✨ Features

- **Group Management** — Create groups (trips, flatmates, events) and invite members
- **Manual Expense Entry** — Equal, custom, or percentage splits
- **AI Split** — Describe expenses in plain English, Gemini parses it instantly
- **Settlement Algorithm** — Greedy algorithm minimizes the number of transactions needed
- **Real-time Balances** — See who owes whom at a glance
- **JWT Auth** — Secure login and registration

---

## 🚀 Setup (MacBook M1)

### Prerequisites
- Node.js (v18+) — check with `node -v`
- MongoDB running locally — check with `brew services list | grep mongodb`
  - If not installed: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`

### Step 1 — Get a Gemini API Key (Free)
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google → click **"Create API key"**
3. Copy the key

### Step 2 — Configure Environment
Open `backend/.env` and replace `your_gemini_api_key_here` with your actual key:
```
GEMINI_API_KEY=AIzaSy...your_key_here
```

### Step 3 — Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend (new terminal)
cd frontend && npm install
```

### Step 4 — Run the App

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# ✅ Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# 🚀 App running on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🧠 How the Settlement Algorithm Works

The core insight: naive splitting generates O(n²) transactions. The greedy algorithm reduces this to at most n-1.

```
1. Calculate net balance for each person:
   net = (total paid by them) - (total owed by them)

2. Separate into creditors (net > 0) and debtors (net < 0)

3. Greedily match the largest debtor with the largest creditor:
   - Transfer = min(creditor's balance, debtor's debt)
   - Repeat until all balanced
```

This is the same algorithm used by Splitwise.

---

## 🗂️ Project Structure

```
expense-splitter/
├── backend/
│   ├── models/          # User, Group, Expense (Mongoose)
│   ├── routes/          # auth, groups, expenses, ai
│   ├── middleware/       # JWT auth
│   └── server.js
└── frontend/
    └── src/
        ├── components/  # Modals, Layout, Panels
        ├── pages/       # Login, Register, Dashboard, GroupDetail
        ├── context/     # AuthContext
        └── utils/       # Axios instance
```

---

## 🎯 Interview Talking Points

1. **Settlement Algorithm** — Greedy net-balance approach, O(n) time, minimizes transactions vs naive O(n²)
2. **AI Integration** — Prompt engineering with Gemini: structured JSON output, handles ambiguous natural language
3. **JWT Auth** — Stateless, stored in localStorage, interceptor auto-attaches to every request
4. **MERN Stack** — Full separation of concerns: React context for state, Express routes, Mongoose schemas
5. **Edge Cases** — Split validation (sum must equal amount), member resolution from AI names to user IDs
