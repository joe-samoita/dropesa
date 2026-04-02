# Dropesa (NameDrop-style M-Pesa app)

## Overview
React Native app + Node/Express backend for contact exchange and M-Pesa STK Push payments.

## Architecture
- `/app`: React Native (Expo-friendly skeleton)
- `/server`: Express API with Daraja/STK integration, auth, and persistence

## Features
- ✅ User signup/login with phone verification
- ✅ Contact pairing via QR code share
- ✅ M-Pesa STK Push transactions
- ✅ Transaction history with status tracking
- ✅ JWT authentication
- ✅ MongoDB persistence

## Quickstart

### Backend
1. cd server
2. npm install
3. cp .env.example .env (add credentials + MONGODB_URI)
4. npm run start

### Mobile App
1. cd app
2. npm install
3. npm run start (Expo dev tools)

## Environment Setup

### Required credentials
- **M-Pesa**: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY (from Safaricom Daraja)
- **MongoDB**: MONGODB_URI (local or MongoDB Atlas)
- **JWT**: JWT_SECRET (any strong random string)

### Local testing
```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Backend
cd server && npm run start

# Terminal 3: Mobile App
cd app && npm run start
```

## Deployment

### Option 1: Vercel (Backend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Option 2: Heroku (Backend)
```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Create app
heroku create dropesa-api

# Set environment variables
heroku config:set MONGODB_URI=<your-atlas-url>
heroku config:set JWT_SECRET=<your-secret>
heroku config:set MPESA_CONSUMER_KEY=<key>
heroku config:set MPESA_CONSUMER_SECRET=<secret>
heroku config:set MPESA_PASSKEY=<passkey>

# Deploy
git push heroku main
```

### DBaaS: MongoDB Atlas (Free tier)
1. Create cluster at https://www.mongodb.com/cloud/atlas
2. Add user + IP whitelist (allow all: 0.0.0.0/0 for dev)
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dropesa`
4. Set `MONGODB_URI` in your `.env` or cloud deployment

### Mobile: App Store / Play Store
- Build with `eas build` (Expo cloud build)
- Submit via TestFlight (iOS) or Google Play Console (Android)

## API Routes

### Auth
- `POST /api/auth/signup` - phone, name → token, user
- `GET /api/auth/me` - (auth required) → current user

### Contacts
- `POST /api/contacts/generate` - (auth required) → pairing token
- `POST /api/contacts/accept` - (auth required) pairingToken → paired contacts
- `GET /api/contacts` - (auth required) → all paired contacts

### M-Pesa
- `POST /api/mpesa/stkpush` - (auth required) phoneNumber, amount → CheckoutRequestID
- `GET /api/mpesa/transactions` - (auth required) → transaction history
- `POST /api/mpesa/callback` - (Daraja) → updates transaction status

## Security Notes
- Keep JWT_SECRET + M-Pesa credentials in `.env` (never commit)
- Use HTTPS in production
- Callback endpoint must be publicly accessible (MPESA_CALLBACK_URL)
- Consider adding request signing/HMAC for callbacks
- Implement rate limiting on auth + payment endpoints
- Store user PIN as hashed salted value (not plaintext)

## Testing
```bash
# Backend health
curl http://localhost:4000/

# Auth signup/login
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"phone":"254700000000","name":"Test User"}'

# STK push (requires auth token)
curl -X POST http://localhost:4000/api/mpesa/stkpush \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"phoneNumber":"254700000000","amount":100}'

# Transactions
curl http://localhost:4000/api/mpesa/transactions \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting
- **Port 4000 in use**: `lsof -i :4000 | grep LISTEN | awk '{print $2}' | xargs kill -9`
- **MongoDB connection error**: Check `MONGODB_URI` format and credentials
- **STK push fails**: Verify M-Pesa credentials and `MPESA_ENV=sandbox`
- **Frontend can't reach backend**: Update `baseURL` in App.js (use 10.0.2.2 for Android emulator)

## Next Steps
- [ ] Biometric auth (Face ID / fingerprint)
- [ ] Receipt generation (PDF export)
- [ ] Push notifications for payment status
- [ ] NFC payment exchange
- [ ] Merchant integration (receive payments)
- [ ] Balance check from M-Pesa account

