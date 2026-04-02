## Dropesa Deployment - Quick Start ✅

### Step 1: Database (5 mins)
```text
✓ Create MongoDB Atlas account (free tier)
✓ Create cluster in your region
✓ Create user: dropesa_user with strong password
✓ Whitelist IP 0.0.0.0/0 (for Vercel)
✓ Copy connection string: mongodb+srv://dropesa_user:PASS@cluster.mongodb.net/dropesa
```

### Step 2: Backend Deployment (5 mins)
```bash
# Option A: Via Vercel Dashboard (easiest)
1. Push code to GitHub
2. Go to vercel.com → Import project
3. Select your GitHub repo
4. Add environment variables:
   - MONGODB_URI (from step 1)
   - JWT_SECRET (generate: openssl rand -hex 32)
   - MPESA_CONSUMER_KEY
   - MPESA_CONSUMER_SECRET
   - MPESA_PASSKEY
   - MPESA_CALLBACK_URL (your Vercel URL)
   - MPESA_ENV=sandbox
5. Click Deploy

# Option B: Via Vercel CLI
npm i -g vercel
cd server
vercel --prod
```

### Step 3: Verify Backend Works
```bash
curl https://YOUR-VERCEL-URL.vercel.app/
# Should return: {"message":"Dropesa API running"}
```

### Step 4: Update App API URL
In your React Native app, change API base URL from `localhost:4000` to `YOUR-VERCEL-URL.vercel.app`

### Step 5: Test Mobile App
```bash
cd app
npm run start
# Scan QR with Expo Go on your phone
# Test signup, payment, contact pairing
```

### Step 6: Deploy Mobile App (Optional)
```bash
# iOS
cd app && eas build --platform ios
# Follow prompts, distribute via TestFlight

# Android  
cd app && eas build --platform android
# Upload AAB to Google Play Console
```

---

## Environment Variables Needed

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dropesa
JWT_SECRET=<generate-random-32-bytes>
MPESA_CONSUMER_KEY=<from-daraja>
MPESA_CONSUMER_SECRET=<from-daraja>
MPESA_PASSKEY=<from-daraja>
MPESA_CALLBACK_URL=https://your-vercel-url.vercel.app/api/mpesa/callback
MPESA_ENV=sandbox
```

---

## Production Checklist
- [ ] MongoDB cluster created and secured
- [ ] Vercel deployment successful
- [ ] All env vars configured in Vercel
- [ ] Backend endpoints tested (`/api/auth/signup`, `/api/mpesa/stk`)
- [ ] M-Pesa callback URL registered with Safaricom
- [ ] Mobile app updated with production API URL
- [ ] JWT secret changed from default
- [ ] `.env` file NOT committed to GitHub
- [ ] CORS configured for your domain

---

## Issues?

**MongoDB won't connect**: Check IP whitelist is set to `0.0.0.0/0`

**M-Pesa callbacks fail**: Verify callback URL in Vercel matches Daraja portal

**Frontend can't reach API**: Update API base URL to Vercel domain

**CORS errors**: Check `app.use(cors())` in `server/index.js`

---

See **DEPLOYMENT.md** for detailed guide.
See **TESTING.md** for testing instructions.
