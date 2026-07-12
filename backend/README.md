# AssetFlow — Enterprise Asset & Resource Management System

![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-darkgreen.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

A **production-ready**, fully async **ERP backend** built with FastAPI + Motor + MongoDB Atlas. Manages the complete lifecycle of enterprise assets — from registration and allocation to maintenance, auditing, and reporting.

---

## 🏗 Architecture

```
Clean Architecture + Repository Pattern + Service Layer

app/
├── config.py              # Pydantic Settings (env vars)
├── database.py            # MongoDB connection + collections
├── main.py                # FastAPI app + all router registration
├── security.py            # JWT + bcrypt password hashing
├── dependencies/          # FastAPI dependency injection
│   ├── auth.py            # JWT extraction + user resolution
│   └── role.py            # RBAC role guards
├── middleware/            # Custom Starlette middleware
│   └── role_middleware.py # Request logging + role context
├── models/
│   └── user.py            # UserRole enum + hierarchy
├── schemas/               # Pydantic V2 request/response models
│   ├── auth.py
│   ├── asset.py
│   ├── common.py
│   ├── dashboard.py
│   ├── operations.py
│   └── organization.py
├── services/              # Business logic layer (15+ services)
├── routers/               # FastAPI route handlers (thin layer)
└── utils/                 # Shared utilities
    ├── asset_codes.py     # QR + Barcode generation
    ├── code_generator.py  # Auto asset tag: AF-000001
    ├── logger.py          # Structured JSON logger
    ├── object_id.py       # MongoDB ObjectId validation
    └── pagination.py      # Reusable pagination helper
```

---

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.12+
- MongoDB Atlas account (or local MongoDB 7.0+)
- Git

### 2. Clone and Install

```bash
git clone https://github.com/yourorg/assetflow-backend.git
cd assetflow_backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy environment template
copy .env.example .env    # Windows
# cp .env.example .env    # Linux/macOS

# Edit .env with your MongoDB Atlas connection string and JWT secret
notepad .env
```

**Required variables:**
```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET_KEY=your-super-secret-key-min-32-characters-long
```

### 4. Run

```bash
# Development (hot reload)
python run.py

# Or directly with uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Explore the API

| URL | Description |
|-----|-------------|
| http://localhost:8000/docs | Swagger UI (interactive) |
| http://localhost:8000/redoc | ReDoc documentation |
| http://localhost:8000/health | Health check |
| http://localhost:8000/openapi.json | OpenAPI schema |

---

## 🐳 Docker

### Docker Compose (Recommended for Development)

```bash
# Start with local MongoDB
docker compose --profile development up -d

# API only (use Atlas URL in .env)
docker compose up -d assetflow-api

# Stop
docker compose down

# Rebuild
docker compose up --build -d
```

**Services:**
| Service | Port | Description |
|---------|------|-------------|
| assetflow-api | 8000 | FastAPI backend |
| mongo | 27017 | MongoDB (dev profile) |
| mongo-express | 8081 | MongoDB admin UI (dev profile) |

### Docker (Standalone)

```bash
docker build -t assetflow-backend .
docker run -p 8000:8000 --env-file .env assetflow-backend
```

---

## ☁ Cloud Deployment

### Render

1. Connect your GitHub repository to Render
2. Create a **Web Service**
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables from `.env`

### Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. `railway login && railway init`
3. `railway up`
4. Set environment variables in the Railway dashboard

---

## 📚 API Reference

### Authentication Flow

```
POST /api/v1/auth/signup          → Register new user
POST /api/v1/auth/login           → Get access + refresh tokens
POST /api/v1/auth/refresh         → Refresh expired access token
GET  /api/v1/auth/me              → Current user profile
POST /api/v1/auth/forgot-password → Request reset token
POST /api/v1/auth/reset-password  → Set new password
```

### User Roles (Hierarchical)

| Role | Level | Permissions |
|------|-------|-------------|
| `admin` | 5 | Full access to everything |
| `asset_manager` | 4 | Assets, allocations, maintenance, reports |
| `department_head` | 3 | Department employees, view assets |
| `employee` | 2 | Book resources, raise maintenance, view own |
| `technician` | 1 | Resolve maintenance assigned to them |
| `auditor` | 1 | Submit audit verifications |

### Core Modules

| Module | Base Path | Key Operations |
|--------|-----------|----------------|
| Auth | `/api/v1/auth` | signup, login, refresh, reset |
| Organization | `/api/v1/organization` | departments, employees, roles |
| Asset Categories | `/api/v1/asset-categories` | CRUD (admin) |
| Assets | `/api/v1/assets` | register, update, QR/barcode, history |
| Allocations | `/api/v1/allocations` | allocate, return, transfer, approve |
| Bookings | `/api/v1/bookings` | create, calendar, cancel, my bookings |
| Maintenance | `/api/v1/maintenance` | raise, approve, assign, resolve |
| Audits | `/api/v1/audits` | cycle, verify, discrepancy report |
| Dashboard | `/api/v1/dashboard` | KPIs, charts, statistics |
| Notifications | `/api/v1/notifications` | list, unread count, mark read |
| Reports | `/api/v1/reports` | utilization, department, maintenance, heatmap |
| Search | `/api/v1/search` | global + per-module |
| Uploads | `/api/v1/uploads` | images, documents |

---

## 🧪 Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=app --cov-report=html
```

---

## 🔧 Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URL` | **Required** | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | `assetflow_db` | Database name |
| `JWT_SECRET_KEY` | **Required** | Min 32-char secret for JWT signing |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |
| `UPLOAD_MODE` | `local` | `local` or `cloudinary` |
| `MAX_UPLOAD_SIZE_MB` | `10` | Maximum upload size |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed origins |
| `RATE_LIMIT_PER_MINUTE` | `60` | API rate limit per IP |
| `LOG_LEVEL` | `INFO` | Logging level |
| `DEBUG` | `false` | Debug mode (shows stack traces) |

---

## 📁 Project Structure

```
assetflow_backend/
├── app/
│   ├── __init__.py
│   ├── config.py              # Settings via Pydantic
│   ├── database.py            # Motor MongoDB client
│   ├── main.py                # App factory + router registration
│   ├── security.py            # JWT + bcrypt
│   ├── dependencies/          # DI providers
│   ├── middleware/            # Request logging, RBAC
│   ├── models/                # Domain constants/enums
│   ├── routers/               # 11 API router files
│   ├── schemas/               # Pydantic V2 models
│   ├── services/              # 18 business logic services
│   └── utils/                 # Shared helpers
├── uploads/                   # Local file uploads
├── logs/                      # Application logs
├── tests/                     # Pytest test suite
├── .env                       # Environment variables (git-ignored)
├── .env.example               # Environment template
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── run.py
└── README.md
```

---

## 🔐 Security Features

- **JWT authentication** with access + refresh token rotation
- **bcrypt password hashing** (never stores plaintext)
- **Role-based access control** (RBAC) enforced at route level
- **Rate limiting** (SlowAPI — 60 req/min per IP default)
- **Security headers** (X-Frame-Options, CSP, HSTS, etc.)
- **ObjectId validation** prevents injection via invalid IDs
- **Non-root Docker** user for container security
- **Input validation** via Pydantic V2 on all endpoints

---

## 📋 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

*Built with ❤ using FastAPI, Motor, and MongoDB Atlas.*
