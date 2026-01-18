# Personal Digital Twin Assistant - Backend

Backend API for the Personal Digital Twin productivity assistant built with FastAPI.

## Setup

### 1. Create Virtual Environment

```bash
cd src/backend
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Required environment variables:**
- `GOOGLE_API_KEY`: Your Google Gemini API key (get from https://aistudio.google.com/app/apikey)
- `SECRET_KEY`: Random secret key for JWT (generate with `openssl rand -hex 32` or `python -c "import secrets; print(secrets.token_hex(32))"`)

### 5. Run the Server

```bash
# From src/backend directory
uvicorn app.main:app --reload
```

The API will be available at: http://localhost:8000

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
app/
├── main.py              # FastAPI application
├── config.py            # Configuration and settings
├── database.py          # Database setup
├── schemas.py           # Pydantic models
├── models/              # SQLAlchemy models
│   ├── user.py
│   ├── item.py
│   └── conversation.py
├── routes/              # API endpoints
│   ├── auth.py          # Authentication
│   ├── users.py         # User profile
│   ├── items.py         # Items CRUD
│   └── chat.py          # Chat & classification
├── services/            # Business logic
│   └── classification_service.py
└── utils/               # Utilities
    ├── auth.py          # JWT & password helpers
    └── dependencies.py  # FastAPI dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile

### Items
- `GET /api/items` - Get all items (with filters)
- `POST /api/items` - Create item manually
- `GET /api/items/{id}` - Get single item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item
- `PATCH /api/items/{id}/status` - Update status

### Chat (Core Feature)
- `POST /api/chat` - Send message for classification

## Database

Using SQLite for development (`digital_twin.db`).
For production, switch to PostgreSQL by updating `DATABASE_URL` in `.env`.

## AI Model

Using **Google Gemini 1.5 Flash** for classification:
- Fast and accurate
- FREE tier: 15 req/min, 1500 req/day
- Perfect for development and testing

## Testing

```bash
# Run with uvicorn in reload mode
uvicorn app.main:app --reload

# Test with curl or use Swagger UI at http://localhost:8000/docs
```
