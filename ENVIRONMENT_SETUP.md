# Environment Configuration Guide

This document explains the standardized environment configuration structure for the TopBudget application.

## 📁 File Structure Overview

```
TopBudget/
├── .env                    # Production configuration (Docker deployment)
├── .env.example           # Template with comments and examples
├── .env.development       # Development configuration (Docker Compose)
├── backend/
│   ├── .env              # Backend production configuration
│   └── .env.example      # Backend template
└── frontend/
    ├── .env.local        # Frontend production configuration (Next.js convention)
    └── .env.example      # Frontend template
```

## 🚀 Usage Instructions

### Development Setup (Local Docker)

```bash
# Copy development environment for Docker Compose
cp .env.development .env

# Start development environment
docker-compose up
```

### Production Deployment

#### Root Level (Docker/Heroku)

```bash
# The .env file is already configured for production
# It contains MongoDB Atlas credentials and production URLs
```

#### Backend Production

```bash
# File: backend/.env (already configured)
# Contains:
# - MongoDB Atlas connection string
# - Production JWT secret
# - Heroku app URLs
```

#### Frontend Production

```bash
# File: frontend/.env.local (already configured)
# Contains:
# - Heroku backend API URLs
# - Production environment variables
```

## 🔧 Configuration Details

### Root Level Variables

| Variable                  | Development           | Production                                  |
| ------------------------- | --------------------- | ------------------------------------------- |
| `NODE_ENV`                | development           | production                                  |
| `MONGO_USER`              | admin                 | nitrahinio                                  |
| `MONGO_PASSWORD`          | admin                 | [Atlas Password]                            |
| `CORS_ORIGIN`             | http://localhost:3000 | https://topbudget-frontend-\*.herokuapp.com |
| `LOG_LEVEL`               | debug                 | info                                        |
| `RATE_LIMIT_MAX_REQUESTS` | 100                   | 500                                         |

### Backend Variables

- `MONGO_URI`: Full MongoDB Atlas connection string
- `JWT_SECRET`: Strong generated secret for token signing
- `API_BASE_URL`: Heroku backend URL

### Frontend Variables

- `NEXT_PUBLIC_API_URL`: Backend API endpoint
- `NEXT_PUBLIC_BACKEND_URL`: Backend base URL for resources

## 🔒 Security Notes

- All production credentials are configured and ready
- JWT secret is securely generated using OpenSSL
- MongoDB Atlas password is properly integrated
- CORS is configured for production frontend domain
- Rate limiting is increased for production load

## 🔄 Switching Between Environments

### For Development

```bash
cp .env.development .env
```

### For Production

```bash
# .env is already configured for production
# No action needed
```

## 📝 Environment File Descriptions

- **`.env`**: Currently configured for production deployment
- **`.env.example`**: Template with detailed comments and examples
- **`.env.development`**: Development configuration for local Docker setup
- **`backend/.env`**: Backend-specific production configuration
- **`frontend/.env.local`**: Frontend-specific production configuration (Next.js convention)
