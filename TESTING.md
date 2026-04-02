# Dropesa Testing Guide

## Unit Testing Backend

### Setup
```bash
cd server
npm install --save-dev jest supertest
```

### Create Test File
Create `server/routes/__tests__/auth.test.js`:

```javascript
const request = require('supertest');
const express = require('express');
const authRouter = require('../auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  test('POST /signup should return token', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ phone: '+254712345678', name: 'Test User' });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });
});
```

### Run Tests
```bash
npm test
```

---

## API Integration Testing

### Test with Postman or Insomnia

#### 1. Start Backend Locally
```bash
cd server
npm run dev
```

#### 2. Test Health Check
```
GET http://localhost:4000/
Expected: {"message":"Dropesa API running"}
```

#### 3. Test Signup
```
POST http://localhost:4000/api/auth/signup
Body:
{
  "phone": "+254712345678",
  "name": "Test User"
}
```

#### 4. Test Contact Generation
```
POST http://localhost:4000/api/contacts/generate
Headers: Authorization: Bearer YOUR_TOKEN
```

#### 5. Test M-Pesa STK Push
```
POST http://localhost:4000/api/mpesa/stk
Body:
{
  "phone": "+254712345678",
  "amount": 100
}
```

---

## Mobile App Testing

### Expo Testing
```bash
cd app
npm run start
```

Then:
- iOS: Press `i` to open in simulator, or scan QR with Expo Go app
- Android: Press `a` to open in simulator, or scan QR with Expo Go app
- Web: Press `w` for Expo web preview

### Test User Flows
1. **Signup**: Enter phone, verify
2. **Generate QR**: Share contact via QR code
3. **Pair Contacts**: Scan partner's QR code
4. **Send Payment**: Initiate M-Pesa STK push
5. **View History**: Check transaction history

---

## E2E Testing (Optional)

### Setup with Cypress
```bash
cd app
npm install --save-dev cypress
npx cypress open
```

Create e2e tests for critical user flows like signup, payment, and contact pairing.

---

## Load Testing (Before Production)

### Using Apache Bench
```bash
# Test homepage
ab -n 1000 -c 10 http://localhost:4000/

# Test auth endpoint
ab -n 1000 -c 10 -p payload.json http://localhost:4000/api/auth/signup
```

### Using K6
```bash
npm install -g k6

# Create load-test.js script
# Run: k6 run load-test.js
```

---

## Production Testing

After deploying to Vercel:

1. Test all endpoints via production URL
2. Verify callback URLs working
3. Test with real (or sandbox) M-Pesa transactions
4. Monitor performance in Vercel dashboard
5. Check logs for errors

---

## Test Checklist
- [ ] Auth signup/login works
- [ ] Contact pairing via QR works
- [ ] M-Pesa STK push triggers correctly
- [ ] Transaction history displays
- [ ] DB queries respond in <500ms
- [ ] CORS headers correct
- [ ] Error handling graceful
- [ ] Production secrets not exposed
