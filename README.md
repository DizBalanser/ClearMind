# ClearMind — Personal Digital Twin Assistant
 
An AI-powered productivity application that transforms unstructured "brain dumps" into organized, prioritized tasks using Google Gemini AI.

## 🎯 Overview

**ClearMind** acts as a personal digital twin — a virtual reflection that understands your goals, habits, and priorities. Simply tell it what's on your mind, and AI automatically classifies your thoughts into actionable items.

## ⚙️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS v4, Vite |
| **Backend** | FastAPI (Python 3.12), SQLite |
| **AI** | Google Gemini 2.5 Flash |
| **Auth** | JWT tokens, bcrypt password hashing |

## 🚀 Features

- **Natural Language Input** — Chat interface for brain dumps
- **AI Classification** — Automatic categorization (Tasks, Goals, Obligations, Habits, Wishes, Ideas)
- **My Life Database** — View, edit, filter, search, and complete tasks
- **Smart Dashboard** — Priority focus items, completion stats
- **User Onboarding** — Personalized profile setup (goals, life areas)

## 📁 Project Structure

```
zhamurzaev-sanatbek/
├── docs/                    # Documentation & diagrams
│   └── milestones.md        # Project milestone plan
├── src/
│   ├── backend/             # FastAPI application
│   │   ├── app/
│   │   │   ├── models/      # SQLAlchemy models
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── services/    # Business logic (classification)
│   │   │   └── utils/       # Auth helpers
│   │   ├── requirements.txt
│   │   └── .env.example
│   └── frontend/            # React application
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── pages/       # Route pages
│       │   ├── services/    # API client
│       │   └── types/       # TypeScript types
│       └── package.json
└── README.md
```

## 🛠️ Installation

### Prerequisites
- Python 3.12+
- Node.js 18+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Backend Setup

```bash
cd src/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GOOGLE_API_KEY and SECRET_KEY

# Run server
uvicorn app.main:app --reload
```
```
### Frontend Setup

```bash
cd src/frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

The app runs at **http://localhost:5173** with API at **http://localhost:8000**.

## 📖 API Documentation

FastAPI auto-generates docs at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/chat` | Brain dump → AI classification |
| GET | `/api/items` | Get all user items |
| PUT | `/api/items/{id}` | Update item |
| PATCH | `/api/items/{id}/status` | Toggle completion |
| DELETE | `/api/items/{id}` | Delete item |


## 👤 Author

**Zhamurzaev Sanatbek**  
Eötvös Loránd University, Faculty of Informatics  
Supervisor: Dr. Walid

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
