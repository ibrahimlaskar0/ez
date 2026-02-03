# Esplendidez 2026 Backend API

Backend API for the Esplendidez 2026 Tech Fest Event Management System.

---

## 🚨 Quick Links

**Having issues?** Start here:

- **Backend not responding?** → [QUICK_FIX.md](./QUICK_FIX.md) ⚡
- **First time deploying?** → [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 📋
- **Need environment variables?** → [ENV_VARIABLES.md](./ENV_VARIABLES.md) 🔧
- **Troubleshooting problems?** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 🔍

---

## Overview

This is a Node.js/Express backend API with PostgreSQL database, designed to run on Vercel serverless functions.

**Features:**
- ✅ Event registration with file uploads
- ✅ Payment verification and tracking
- ✅ Admin dashboard with JWT authentication
- ✅ PostgreSQL database with automatic schema creation
- ✅ Cloudinary integration for file storage
- ✅ CORS support for multiple frontend origins
- ✅ Rate limiting and security middleware

---

## Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your local configuration

# 3. Start PostgreSQL and create database
sudo service postgresql start
psql -U postgres -c "CREATE DATABASE esplendidez2026;"

# 4. Start server
npm start
# Server runs on http://localhost:5001

# 5. Test
curl http://localhost:5001/api/health
```

### Production (Vercel)

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete setup instructions.

**Quick deploy:**
```bash
vercel --prod
```

---

## Project Structure

```
backend/
├── api/                    # Vercel serverless functions
│   ├── index.js           # Main entry point (wraps Express app)
│   ├── _cors.js           # CORS configuration
│   ├── health.js          # Health check endpoint
│   └── registration/      # Alternative serverless registration handlers
├── config/                # Configuration files
├── db/                    # Database connection and schema
│   └── pg.js             # PostgreSQL setup
├── middleware/           # Express middleware
│   └── errorHandler.js  # Global error handler
├── models/              # Data models
│   ├── Admin.js
│   └── Registration.js
├── routes/              # Express routes
│   ├── auth.js         # Authentication (admin login)
│   ├── registration.js # Event registration
│   ├── admin.js       # Admin operations
│   └── payment.js     # Payment verification
├── tests/              # Unit and integration tests
├── server.js           # Main Express application
├── vercel.json         # Vercel configuration
├── package.json        # Dependencies
├── .env.example        # Environment variables template
├── README.md           # This file
├── QUICK_FIX.md        # Quick troubleshooting guide
├── DEPLOYMENT_GUIDE.md # Deployment instructions
├── ENV_VARIABLES.md    # Environment variables documentation
└── TROUBLESHOOTING.md  # Detailed troubleshooting
```

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/registration/register` | Submit registration |
| GET | `/api/registration/:id` | Get registration by ID |
| GET | `/api/registration/utr/:utr` | Check UTR availability |

### Admin Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/admin/login` | Admin login |
| GET | `/api/admin/registrations` | Get all registrations |
| PATCH | `/api/admin/payment-status` | Update payment status |
| GET | `/api/admin/export` | Export registrations |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/verify` | Verify payment |

---

## Environment Variables

**Required for production:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (production/development)
- `CLOUDINARY_URL` - Cloudinary for file uploads

See [ENV_VARIABLES.md](./ENV_VARIABLES.md) for complete list.

---

## Technology Stack

- **Runtime:** Node.js 16+
- **Framework:** Express.js 4.x
- **Database:** PostgreSQL 14+
- **ORM:** Native pg driver
- **File Storage:** Cloudinary (production) / Local filesystem (development)
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator, Joi
- **Security:** Helmet, CORS, Rate Limiting
- **Deployment:** Vercel Serverless Functions

---

## Development

### Install Dependencies
```bash
npm install
```

### Run in Development Mode (with auto-reload)
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
npm run lint:fix
```

### Format Code
```bash
npm run format
npm run format:write
```

---

## Database Schema

The database schema is automatically created on first run. Tables include:

- `admins` - Admin users with authentication
- `registrations` - Event registrations with payment tracking

See `db/pg.js` for full schema definition.

---

## CORS Configuration

The backend allows requests from:

**Production:**
- https://esplendidez.tech
- https://esplendidez.online
- https://ibrahimlaskar0.github.io
- https://ez-two-amber.vercel.app
- https://esplendidez-2026-frontend.netlify.app

**Development:**
- http://localhost:* (any port)
- http://127.0.0.1:* (any port)
- http://192.168.*.* (local network)

Add more origins in `server.js` and `api/_cors.js`.

---

## Security Features

- ✅ Helmet.js for HTTP headers
- ✅ CORS with origin validation
- ✅ Rate limiting (100 req/15min per IP)
- ✅ Auth rate limiting (5 attempts/15min)
- ✅ JWT token authentication
- ✅ Password hashing (bcrypt)
- ✅ Input validation and sanitization
- ✅ SQL injection protection (parameterized queries)
- ✅ File upload restrictions (type, size)

---

## File Uploads

### Local Development
Files stored in `./uploads/` directory.

### Production (Vercel)
Files uploaded to Cloudinary (required for serverless).

**Setup:**
1. Sign up at https://cloudinary.com
2. Get your Cloudinary URL from dashboard
3. Set `CLOUDINARY_URL` environment variable

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- server.test.js
```

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Set root directory to `backend`
3. Configure environment variables (see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md))
4. Deploy

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd backend
vercel --prod
```

---

## Troubleshooting

**Backend not responding?**
See [QUICK_FIX.md](./QUICK_FIX.md) for immediate solutions.

**Common issues:**
- 502/503 errors → Check Vercel deployment and logs
- CORS errors → Add domain to CORS allowlist
- Database errors → Verify DATABASE_URL is correct
- File upload errors → Set up Cloudinary

Full troubleshooting guide: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

## Support

- **Documentation:** See `*.md` files in backend directory
- **Issues:** https://github.com/ibrahimlaskar0/ez/issues
- **Vercel Support:** https://vercel.com/support

---

## License

ISC

---

## Version

1.0.0

---

**Last Updated:** 2026-02-03
