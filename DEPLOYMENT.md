# Dropesa - Deployment Guide

## Quick Checklist
- [ ] MongoDB Atlas cluster created
- [ ] Environment variables configured in Vercel
- [ ] M-Pesa callback URL updated in `.env`
- [ ] Backend deployed to Vercel
- [ ] Frontend build passes locally
- [ ] API endpoints tested on production

---

## 1. Database Setup (MongoDB Atlas)

### Create a Free MongoDB Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (free tier available)
3. Create a new project: **dropesa-production**
4. Click "Create a Database"
   - **Provider**: AWS
   - **Region**: Choose closest to your location (e.g., `us-east-1`)
   - **Tier**: M0 (free)
5. Choose "Username and Password" authentication
6. Create database user:
   - Username: `dropesa_user`
   - Password: Generate strong password (save this!)
7. Add IP Whitelist: 
   - Click "Add My Current IP" for development
   - For production: Add `0.0.0.0/0` (allows all IPs - required for Vercel)

### Get Connection String
1. Go to **Databases** → Click **Connect**
2. Choose **Drivers**
3. Copy the connection string:
   ```
   mongodb+srv://dropesa_user:PASSWORD@cluster0.xxxxx.mongodb.net/dropesa?retryWrites=true&w=majority
   ```
4. Replace `PASSWORD` with your actual password
5. This becomes your `MONGODB_URI`

---

## 2. Backend Deployment (Vercel)

### Prerequisites
- [ ] GitHub account with your repo pushed
- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))

### Deploy via Vercel Dashboard

1. **Connect GitHub Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Select your GitHub repo
   - Import

2. **Configure Environment Variables**
   - In the "Environment Variables" section, add:
   
   ```
   MONGODB_URI = mongodb+srv://dropesa_user:PASSWORD@cluster0.xxxxx.mongodb.net/dropesa?retryWrites=true&w=majority
   JWT_SECRET = (generate with: openssl rand -hex 32)
   MPESA_CONSUMER_KEY = y7dk97AUGMa4oLhIMdWxnYWADsmotTDsstlZV2GwEl6dFnA1
   MPESA_CONSUMER_SECRET = KIlQIqY12RpjMmBT5uAkWciPkVdqhSoosSYikozwV0ZEtZai3i7YShp6PfSjggvB
   MPESA_SHORTCODE = 174379
   MPESA_PASSKEY = bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
   MPESA_CALLBACK_URL = https://your-vercel-deployment.vercel.app/api/mpesa/callback
   MPESA_ENV = sandbox
   ```

3. **Deploy**
   - Click **Deploy**
   - Wait for build to complete
   - Your API is now live at: `https://your-project-name.vercel.app`

### Update M-Pesa Callback URL
After Vercel deployment, update your production `.env`:
```
MPESA_CALLBACK_URL=https://your-vercel-url.vercel.app/api/mpesa/callback
```

**IMPORTANT**: Go to [Safaricom Daraja](https://developer.safaricom.co.ke/) and register this callback URL in your M-Pesa app settings.

---

## 3. Test Backend Endpoints

### Health Check
```bash
curl https://your-vercel-url.vercel.app/
# Expected: {"message":"Dropesa API running"}
```

### Test Auth Endpoint
```bash
curl -X POST https://your-vercel-url.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"phone":"+254712345678","name":"Test User"}'
```

---

## 4. Mobile App Deployment

### Local Testing First (Recommended)
```bash
cd app
npm install
npm run start
# Open in Expo Go app on your phone
```

### Build for Production
#### iOS (via TestFlight)
```bash
cd app
eas build --platform ios
# Follow prompts to create iOS build profile
# Distribute via TestFlight using Xcode or EAS
```

#### Android (via Google Play)
```bash
cd app
eas build --platform android
# Follow prompts. Get APK/AAB from EAS dashboard
# Upload to Google Play Console
```

### Update API Base URL in App
Ensure your app's API client points to your Vercel URL:
```javascript
// In app code, replace localhost:4000 with:
const API_BASE_URL = 'https://your-vercel-url.vercel.app'
```

---

## 5. Security Checklist

- [ ] Do NOT commit `.env` file (use `.env.example` only)
- [ ] Rotate `JWT_SECRET` before production
- [ ] Use strong `MONGODB_URI` password
- [ ] Lock down MongoDB IP whitelist in production (if possible)
- [ ] Enable HTTPS-only for all API calls
- [ ] Test CORS configuration for your mobile app domain
- [ ] Regenerate M-Pesa credentials if they were ever exposed
- [ ] Enable rate limiting on auth endpoints

---

## 6. Troubleshooting

### MongoDB Connection Fails
- Check `MONGODB_URI` connection string is correct
- Verify IP is whitelisted in MongoDB Atlas
- Confirm username/password are correct

### M-Pesa Callbacks Not Working
- Verify `MPESA_CALLBACK_URL` matches backend URLs
- Check Daraja portal has correct callback registered
- Test with M-Pesa sandbox credentials first

### CORS Errors
- Update `cors()` middleware in `server/index.js` for production domains:
  ```javascript
  app.use(cors({
    origin: ['https://yourdomain.com', 'https://your-vercel-url.vercel.app']
  }));
  ```

---

## 7. Monitoring

### Vercel Dashboard
- Check deployments, logs, and errors
- Set up email alerts for failed builds

### MongoDB Atlas Monitoring
- Check connection metrics
- Monitor storage usage
- Set up alerts for replica set health

---

## Next Steps
1. Set up MongoDB Atlas
2. Deploy to Vercel (auto-deploys on git push)
3. Test all endpoints in production
4. Build and test mobile app
5. Submit to App Store / Play Store

Questions? Check `.env.example` for all required variables.
