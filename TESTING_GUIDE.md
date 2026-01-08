# Mycelium Garden - Quick Testing Guide

## Startup Commands

### Terminal 1: Backend
```bash
cd Backend
npm start
# Server running on http://localhost:5000
# Swagger docs at http://localhost:5000/api-docs
```

### Terminal 2: Frontend
```bash
cd Frontend
npm run dev
# App running on http://localhost:3002
```

---

## Quick Test Flow

### Step 1: Login with Calculator
1. Go to `http://localhost:3002/`
2. Type `9999` on the calculator
3. Press `=` button
4. You should be redirected to `/gardening-app`

### Step 2: Choose Your Role
You'll see a green-themed selection screen:
- **Plant Owner (User)** - Green button
- **Plant Caretaker (Guardian)** - Blue button

### Step 3: Register

#### Option A: Register as Plant Owner
1. Click "Plant Owner (User)"
2. Fill in:
   - **Username**: `alice` (or any unique name)
   - **Guardian Email**: `bob@example.com`
   - **PINs**: Leave defaults or customize
3. Click "Register & Start Growing"
4. You'll be redirected to `/user-dashboard`

#### Option B: Register as Plant Caretaker
1. Click "Plant Caretaker (Guardian)"
2. Fill in:
   - **Username**: `bob` (or any unique name)
   - **PINs**: Leave defaults or customize
   - **Note**: No email needed for guardians
3. Click "Register & Start Growing"
4. You'll be redirected to `/guardian-dashboard`

---

## User Dashboard Features

### 1. Plant Status Card
Shows your plant's health based on last check-in:
- 🌱 **GREEN**: Recent check-in (< 6 hours)
- 🌾 **YELLOW**: Needs attention (6-12 hours)
- 🔥 **RED**: Critical (12-24 hours)
- 💀 **BLACK**: Emergency (> 24 hours)

### 2. Water Plant Button
Resets the Dead Man's Switch timer. Click to "water your plant" = check-in.

### 3. Garden Journal
Write your thoughts/feelings:
- Submit entry
- System analyzes for safety keywords
- Returns health score (1-10)
- Keywords detected: danger, hurt, afraid, scared, threat, abuse, help

### 4. Health Cards
Shows safety status, health score, and watering time at a glance.

### 5. Logout
Protected - Returns to calculator login

---

## Guardian Dashboard Features

### 1. Connect with Users
- Search by username (the Plant Owner's username)
- Click "Connect"
- They'll appear in your garden list

### 2. Monitor Connected Users
Each card shows:
- User's emoji status (🌱🌾🔥💀)
- Username
- Hours since last check-in
- Risk level
- Special alerts for RED/BLACK status

### 3. Real-Time Updates
Dashboard polls every 5 seconds for latest status.

### 4. Emergency Alerts
- **RED Alert**: "Immediate care needed - Consider reaching out"
- **BLACK Alert**: "CRITICAL - Emergency support required" with emergency contact button

### 5. Logout
Protected - Returns to calculator login

---

## Database Test Data

### Test Users (Pre-created)
If you want to test without registering:

**User (alice)**
- Username: `alice`
- Real PIN: `9999`
- Fake PIN: `1234`
- Panic PIN: `0000`

**Guardian (bob)**
- Username: `bob`
- Real PIN: `9999`
- Fake PIN: `1234`
- Panic PIN: `0000`

### Quick Test: Check API Endpoints

Open browser console or Postman and test:

#### 1. Register a User
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "role": "USER",
  "guardianEmail": "testguardian@example.com",
  "fakePin": "1234",
  "realPin": "9999",
  "panicPin": "0000"
}
```

#### 2. Register a Guardian
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "testguardian",
  "role": "GUARDIAN",
  "fakePin": "1234",
  "realPin": "9999",
  "panicPin": "0000"
}
```

#### 3. Connect Guardian to User
```bash
POST http://localhost:5000/api/auth/connect-guardian
Content-Type: application/json

{
  "userId": "<user_mongodb_id>",
  "guardianUsername": "testguardian"
}
```

#### 4. Check User Status
```bash
GET http://localhost:5000/api/safety/status/<user_mongodb_id>
```

#### 5. Get Guardian's Users
```bash
GET http://localhost:5000/api/safety/guardian/users/<guardian_mongodb_id>
```

#### 6. Check In (Water Plant)
```bash
POST http://localhost:5000/api/safety/checkin/<user_mongodb_id>
```

#### 7. Write Journal Entry
```bash
POST http://localhost:5000/api/safety/journal
Content-Type: application/json

{
  "userId": "<user_mongodb_id>",
  "entry": "I'm feeling scared and need help"
}
```

---

## Troubleshooting

### "User not found" error
- Make sure you registered first
- Try registering a new account with a unique username
- Check that userId in localStorage matches a real user in MongoDB

### Dashboard shows "Loading..."
- Check that backend is running on port 5000
- Verify MongoDB connection is successful
- Open browser console for network errors

### Can't login with calculator
- Make sure PIN is exactly `9999`
- Check that backend received the login attempt
- Verify axios is correctly posting to `http://localhost:5000/api/auth/login`

### Guardian dashboard shows no users
- You need to first register users and then connect them
- Use the "Connect" feature with existing Plant Owner usernames
- Verify the connection was successful in the response

### Styling looks wrong
- Clear browser cache (Ctrl+Shift+Delete)
- Restart frontend dev server
- Make sure Tailwind CSS is compiled (`npm run dev`)

---

## Key Files Changed

### Backend
- `server/models/User.js` - Added `role` and `connectedUsers`
- `server/controllers/authController.js` - Added `connectGuardian`
- `server/controllers/safetyController.js` - Added `getConnectedUsers`
- `server/routes/authRoutes.js` - Added connect-guardian endpoint
- `server/routes/safetyRoutes.js` - Added guardian/users endpoint

### Frontend
- `src/App.jsx` - New routing structure
- `src/pages/CalculatorWrapper.jsx` - Navigate to `/gardening-app`
- `src/pages/GardeningApp.jsx` - NEW: Role selection & registration
- `src/pages/UserDashboard.jsx` - NEW: Plant owner interface
- `src/pages/GuardianDashboard.jsx` - NEW: Caretaker interface
- `src/pages/SecretDashboard.jsx` - Still available but not used
- `src/pages/GuardianView.jsx` - Still available but not used

---

## Feature Checklist

- [x] Calculator login disguise (PIN 9999 → unlock)
- [x] Role selection (User vs Guardian)
- [x] Role-based registration
- [x] User dashboard with plant watering
- [x] Guardian dashboard with monitoring
- [x] Dead Man's Switch (24h timer)
- [x] Risk levels (GREEN/YELLOW/RED/BLACK)
- [x] Journal with threat detection
- [x] Guardian connection system
- [x] Real-time status polling
- [x] Gardening theme throughout
- [x] Emergency alerts
- [x] Logout functionality
- [x] localStorage persistence
- [ ] Email alerts (Phase 2)
- [ ] Evidence vault/steganography (Phase 2)
- [ ] PWA manifest (Phase 2)
- [ ] Offline mode (Phase 2)

---

**Last Updated**: January 8, 2026  
**Version**: 2.0 (Role-Based Refactor)
