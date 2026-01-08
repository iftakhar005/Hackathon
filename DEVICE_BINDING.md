# Mycelium PWA - Device Binding Architecture

## Overview

The **Device Binding** system is a security architecture where each physical device (or browser instance) is permanently bound to a specific User ID during one-time setup. This is critical because:

1. **Calculator has no username field** - Only PIN entry
2. **We need to know WHO is holding the phone** - Without device binding, any PIN-only login could be from anyone
3. **Each device instance is unique** - Like how a bank card + PIN works

## Architecture Diagram

```
┌────────────────────────────────────────────────────┐
│              USER'S FIRST VISIT                    │
├────────────────────────────────────────────────────┤
│  Browser checks localStorage                       │
│  └─ mycelium_device_id NOT found                   │
│                      ↓                             │
│  Auto-redirect to /setup                           │
│                      ↓                             │
│  ┌────────────────────────────────────────────┐   │
│  │ Register.jsx (One-Time Setup Screen)       │   │
│  │                                             │   │
│  │ ✓ Username                                 │   │
│  │ ✓ Role (USER or GUARDIAN)                 │   │
│  │ ✓ Guardian Email (if USER)                │   │
│  │ ✓ Real PIN (9999)                         │   │
│  │ ✓ Fake PIN (1234)                         │   │
│  │ ✓ Panic PIN (0000)                        │   │
│  │                                             │   │
│  │ Submit → POST /api/auth/register           │   │
│  │ Response: { userId: "65a..." }             │   │
│  └────────────────────────────────────────────┘   │
│                      ↓                             │
│  localStorage.setItem('mycelium_device_id',       │
│    response.userId)                               │
│                      ↓                             │
│  ✅ Setup Complete. Redirect to / (Calculator)    │
└────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────┐
│           SUBSEQUENT VISITS (Normal Login)         │
├────────────────────────────────────────────────────┤
│  User goes to /                                    │
│  ┌────────────────────────────────────────────┐   │
│  │ CalculatorWrapper.jsx                      │   │
│  │ (iOS-style calculator UI)                  │   │
│  │                                             │   │
│  │ 1. User types: 9 9 9 9                    │   │
│  │ 2. User presses =                          │   │
│  │                                             │   │
│  │ handleEquals() {                           │   │
│  │   const deviceId =                         │   │
│  │     localStorage.getItem(                  │   │
│  │       'mycelium_device_id'                 │   │
│  │     )                                       │   │
│  │                                             │   │
│  │   if (!deviceId) {                         │   │
│  │     alert('Device not configured')         │   │
│  │     navigate('/setup')                     │   │
│  │     return                                 │   │
│  │   }                                         │   │
│  │                                             │   │
│  │   POST /api/auth/login {                   │   │
│  │     userId: deviceId,     // From storage  │   │
│  │     pin: "9999"           // From display  │   │
│  │   }                                         │   │
│  │ }                                           │   │
│  │                                             │   │
│  └────────────────────────────────────────────┘   │
│                      ↓                             │
│  Backend Validation (see below)                    │
│                      ↓                             │
│  Response: { mode: "DASHBOARD" }                   │
│                      ↓                             │
│  ✅ Navigate to /user-dashboard                    │
└────────────────────────────────────────────────────┘
```

## Backend Logic (Modified)

### OLD LOGIN FLOW (Username + PIN)
```javascript
// POST /api/auth/login
{
  username: "alice",    // User types this
  pin: "9999"           // User types this
}
// Find user by username, validate PIN
// PROBLEM: Anyone could try any username
```

### NEW LOGIN FLOW (Device Binding)
```javascript
// POST /api/auth/login
{
  userId: "65a1b2c3d4e5f6g7h8i9j0k1",  // From localStorage
  pin: "9999"                             // User types this
}
// Find user by userId (not username), validate PIN
// BENEFIT: Phone can ONLY unlock the account it was set up for
```

## Backend Controller Update

```javascript
// OLD: handleLogin(req, res) {}
//   - Accepts: { username, pin }
//   - Finds user by: User.findOne({ username })

// NEW: handleLogin(req, res) {}
//   - Accepts: { userId, pin }
//   - Finds user by: User.findById(userId)
//   - Returns different modes:
//     * { mode: "DASHBOARD" } - Real PIN
//     * { mode: "CALCULATOR_ERROR" } - Fake PIN
//     * { mode: "PANIC_TRIGGERED" } - Panic PIN
//     * { mode: "CALCULATOR_ERROR" } - Device not found
```

## Frontend Changes

### 1. New Route: /setup (Register.jsx)
**Purpose**: One-time device setup (appears on first visit)

```
GET /setup → Register.jsx
├─ Username input
├─ Role selector (USER | GUARDIAN)
├─ Guardian Email (conditional on role)
├─ PIN inputs (Real, Fake, Panic)
└─ Submit → POST /api/auth/register
   └─ Response includes userId
   └─ localStorage.setItem('mycelium_device_id', userId)
   └─ Redirect to /
```

### 2. Updated Calculator (CalculatorWrapper.jsx)
**Key Change**: Check for device binding BEFORE attempting login

```javascript
handleEquals() {
  // NEW: Check device binding
  const deviceId = localStorage.getItem('mycelium_device_id');
  
  if (!deviceId) {
    alert('🔐 Device not configured. Please complete setup first.');
    navigate('/setup');
    return;
  }
  
  // NEW: Send userId + pin (not username + pin)
  POST /api/auth/login {
    userId: deviceId,
    pin: display
  }
  
  // Handle response.mode
  if (response.mode === 'DASHBOARD') { navigate('/user-dashboard') }
  else if (response.mode === 'PANIC_TRIGGERED') { display = 'DURESS MODE' }
  else if (response.mode === 'CALCULATOR_ERROR') { display = 'Error' }
}
```

## localStorage Keys

All device binding info is stored in localStorage:

```javascript
localStorage.setItem('mycelium_device_id', userId)        // CRITICAL
localStorage.setItem('mycelium_username', username)       // Display name
localStorage.setItem('mycelium_role', 'USER' | 'GUARDIAN') // User type
```

## API Endpoint Changes

### POST /api/auth/register
**Changed**: Now returns userId (device binding ID)

**Request**:
```json
{
  "username": "alice",
  "role": "USER",
  "guardianEmail": "bob@example.com",
  "realPin": "9999",
  "fakePin": "1234",
  "panicPin": "0000"
}
```

**Response**:
```json
{
  "message": "Device setup complete. Disguise active.",
  "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "username": "alice",
  "role": "USER"
}
```

### POST /api/auth/login
**Changed**: Now accepts userId instead of username

**Request**:
```json
{
  "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "pin": "9999"
}
```

**Response** (Real PIN):
```json
{
  "mode": "DASHBOARD",
  "success": true,
  "message": "Access Granted",
  "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "username": "alice",
  "token": "NjVhMWIyYzNkNGU1ZjZnN2g4aTlqMGsx",
  "riskLevel": "GREEN"
}
```

**Response** (Fake PIN):
```json
{
  "mode": "CALCULATOR_ERROR",
  "success": false,
  "message": "Error"
}
```

**Response** (Panic PIN):
```json
{
  "mode": "PANIC_TRIGGERED",
  "success": true,
  "message": "DURESS_DETECTED"
}
```

**Response** (Device not found):
```json
{
  "mode": "CALCULATOR_ERROR",
  "message": "Device binding lost. Please reconfigure."
}
```

## Complete Flow Visualization

```
SCENARIO: Alice opens Mycelium for the first time on her Android phone

┌─────────────────────────────────────────────────────────┐
│ Step 1: Browser Load                                    │
├─────────────────────────────────────────────────────────┤
│ localhost:3002/                                         │
│ ↓                                                       │
│ App.jsx checks:                                         │
│   const deviceId = localStorage.getItem('mycelium_..') │
│   // NOT FOUND ❌                                        │
│ ↓                                                       │
│ Auto-redirect to /setup (Register.jsx)                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Step 2: Device Setup (Registration)                     │
├─────────────────────────────────────────────────────────┤
│ Register.jsx displays form:                             │
│                                                         │
│ [Username Field]      → "alice"                        │
│ [Role Selector]       → "USER" (Plant Owner)          │
│ [Guardian Email]      → "bob@example.com"             │
│ [Real PIN]            → "9999"                         │
│ [Fake PIN]            → "1234"                         │
│ [Panic PIN]           → "0000"                         │
│                                                         │
│ Submit Button Click                                     │
│ ↓                                                       │
│ fetch('http://localhost:5000/api/auth/register', {    │
│   method: 'POST',                                       │
│   body: { username, role, ... }                        │
│ })                                                      │
│ ↓                                                       │
│ Response: {                                             │
│   userId: "65a1b2c3d4e5f6g7h8i9j0k1",                │
│   username: "alice",                                    │
│   role: "USER"                                         │
│ }                                                       │
│ ↓                                                       │
│ CRITICAL: Save to localStorage                         │
│ localStorage.setItem('mycelium_device_id',             │
│   '65a1b2c3d4e5f6g7h8i9j0k1')                         │
│ ↓                                                       │
│ ✅ alert('🔐 Device Setup Complete. Disguise Active.') │
│ ↓                                                       │
│ navigate('/') → CalculatorWrapper                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Step 3: Normal Login (Subsequent Visits)                │
├─────────────────────────────────────────────────────────┤
│ Alice opens Mycelium again                              │
│ localhost:3002/ → CalculatorWrapper                     │
│                                                         │
│ View: iOS-style calculator                              │
│ Display: 0                                              │
│                                                         │
│ User Action: Type 1 2 3 4                              │
│ Display: 1234                                           │
│                                                         │
│ User Action: Press = (equals button)                    │
│ ↓                                                       │
│ handleEquals() called                                   │
│ ├─ pin = "1234" (from display)                         │
│ ├─ deviceId = localStorage.getItem('mycelium_device_id')
│ ├─ deviceId = "65a1b2c3d4e5f6g7h8i9j0k1" ✅           │
│ │                                                       │
│ └─ POST /api/auth/login {                              │
│     userId: "65a1b2c3d4e5f6g7h8i9j0k1",              │
│     pin: "1234"                                        │
│   }                                                     │
│ ↓                                                       │
│ Backend Processing:                                     │
│ ├─ Find user by userId ✅                              │
│ ├─ Check: pin === user.fakePin? → YES                │
│ └─ Response: { mode: 'CALCULATOR_ERROR', ... }       │
│ ↓                                                       │
│ Frontend Handle:                                        │
│ ├─ if (mode === 'CALCULATOR_ERROR')                    │
│ └─ setDisplay('Error')                                 │
│    setTimeout(() => setDisplay('0'), 1500)             │
│ ↓                                                       │
│ Result: User sees "Error" on calculator (correct!)     │
│         Device binding works! ✅                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Step 4: Real PIN Login (Access Granted)                 │
├─────────────────────────────────────────────────────────┤
│ User Action: Type 9 9 9 9 (real PIN)                   │
│ Press =                                                 │
│ ↓                                                       │
│ POST /api/auth/login {                                  │
│   userId: "65a1b2c3d4e5f6g7h8i9j0k1",                │
│   pin: "9999"                                          │
│ }                                                       │
│ ↓                                                       │
│ Backend:                                                │
│ ├─ Find user by userId ✅                              │
│ ├─ Check: pin === user.realPin? → YES                 │
│ ├─ Update lastActiveAt (Dead Man's Switch)            │
│ └─ Response: { mode: 'DASHBOARD', ... }              │
│ ↓                                                       │
│ Frontend Handle:                                        │
│ ├─ if (mode === 'DASHBOARD')                           │
│ ├─ localStorage.setItem('userId', response.userId)    │
│ └─ navigate('/user-dashboard')                         │
│ ↓                                                       │
│ Result: User sees UserDashboard ✅                      │
│         "🌱 My Garden" with plant status               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Step 5: Panic Mode (Emergency)                          │
├─────────────────────────────────────────────────────────┤
│ User Action: Type 0 0 0 0 (panic PIN)                  │
│ Press =                                                 │
│ ↓                                                       │
│ POST /api/auth/login {                                  │
│   userId: "65a1b2c3d4e5f6g7h8i9j0k1",                │
│   pin: "0000"                                          │
│ }                                                       │
│ ↓                                                       │
│ Backend:                                                │
│ ├─ Find user by userId ✅                              │
│ ├─ Check: pin === user.panicPin? → YES                │
│ ├─ WIPE DATA:                                          │
│ │  ├─ user.evidenceVault = []                          │
│ │  ├─ user.journals = []                               │
│ │  └─ user.guardianAlertSent = false                   │
│ └─ Response: { mode: 'PANIC_TRIGGERED', ... }        │
│ ↓                                                       │
│ Frontend Handle:                                        │
│ ├─ if (mode === 'PANIC_TRIGGERED')                     │
│ ├─ setDisplay('DURESS MODE')                           │
│ └─ setTimeout(() => setDisplay('0'), 2000)             │
│ ↓                                                       │
│ Result: User sees "DURESS MODE" briefly                │
│         Database wiped ✅                               │
│         Phone still looks like calculator               │
└─────────────────────────────────────────────────────────┘
```

## Security Properties

### What Device Binding Provides

✅ **Device Uniqueness**: Each phone/browser instance is bound to exactly one user  
✅ **PIN-Only Login**: No username needed (hides identity)  
✅ **Attacker Resistance**: Phone thief cannot use a different PIN to unlock  
✅ **Disguise Maintained**: Calculator interface shows no account info  
✅ **Data Protection**: Panic PIN triggers automatic data wipe  

### How Device Binding Works

```
Phone A (Bound to alice)         Phone B (Bound to bob)
↓                                ↓
localStorage {                   localStorage {
  mycelium_device_id:            mycelium_device_id:
  "65a1b2c3d4e5f..."             "65b2c3d4e5f6g7..."
}                                }
↓                                ↓
User types: 9999                 User types: 9999
↓                                ↓
Login with {                     Login with {
  userId: "65a1b2c3...",         userId: "65b2c3d4...",
  pin: "9999"                    pin: "9999"
}                                }
↓                                ↓
✅ Finds alice                   ✅ Finds bob
Validates alice's PIN             Validates bob's PIN
↓                                ↓
Correct device + Correct PIN     Correct device + Correct PIN
= Access Granted                 = Access Granted
```

### Attack Scenarios Prevented

```
Scenario 1: Thief steals Alice's phone
├─ Tries PIN: 1234 → "Error" (Fake PIN shown)
├─ Tries PIN: 0000 → Database wiped (Panic mode)
├─ Tries PIN: 9999 → Alice's dashboard (But phone is bound to alice)
│  └─ Thief CAN access alice's account (9999 is known)
│  └─ BUT: Phone can only unlock alice, not other accounts
│  └─ AND: Alice will see suspicious activity in dashboard
└─ MITIGATION: Not perfect, but device is bound (can't steal for multiple accounts)

Scenario 2: Attacker knows multiple PINs (1234, 9999)
├─ Tries on unknown phone
├─ Phone 1: No device binding → Redirects to /setup
├─ Phone 2: No device binding → Redirects to /setup
└─ OUTCOME: Cannot access account without physical device

Scenario 3: Attacker has username list
├─ Traditional app: username + PIN login is vulnerable
├─ Mycelium: Username not needed, only PIN used
└─ OUTCOME: Username list is worthless without device access
```

## Testing Guide

### Test Case 1: New Device (First Time)
```
1. Clear localStorage
2. Go to localhost:3002/
3. EXPECT: Redirect to /setup (Register page)
4. Fill form: username=alice, role=USER, pins...
5. Submit
6. EXPECT: localStorage now has mycelium_device_id
7. EXPECT: Redirect to / (Calculator)
```

### Test Case 2: Fake PIN Test
```
1. Calculator shows: 0
2. Type: 1234 (fake PIN)
3. Press: =
4. EXPECT: Display shows "Error" for 1.5 seconds
5. EXPECT: Display resets to 0
```

### Test Case 3: Real PIN Test
```
1. Calculator shows: 0
2. Type: 9999 (real PIN)
3. Press: =
4. EXPECT: Navigates to /user-dashboard
5. EXPECT: Page shows "🌱 My Garden"
```

### Test Case 4: Panic PIN Test
```
1. Calculator shows: 0
2. Type: 0000 (panic PIN)
3. Press: =
4. EXPECT: Display shows "DURESS MODE" for 2 seconds
5. EXPECT: Display resets to 0
6. EXPECT: Check database - journals/evidence wiped
```

### Test Case 5: Device Loss (localStorage wipe)
```
1. Have working device with mycelium_device_id
2. Clear localStorage manually (Dev Tools)
3. Go to localhost:3002/
4. Type: 9999 (real PIN)
5. Press: =
6. EXPECT: alert("Device not configured")
7. EXPECT: Redirect to /setup
```

## Migration from Old System

**Before Device Binding**:
```javascript
// CalculatorWrapper sent: {username: 'alice', pin: '9999'}
```

**After Device Binding**:
```javascript
// CalculatorWrapper sends: {userId: <from localStorage>, pin: '9999'}
```

**For existing users**:
1. They see /setup on first visit
2. They register (creates new User with new userId)
3. New device binding takes effect
4. (Optional) Admin could migrate old accounts with script

## Files Changed

### Backend
- ✅ `server/controllers/authController.js` - Updated handleLogin & handleRegister
- ✅ `server/routes/authRoutes.js` - Updated Swagger docs

### Frontend
- ✅ `src/pages/Register.jsx` - NEW file (one-time setup)
- ✅ `src/pages/CalculatorWrapper.jsx` - Updated login logic
- ✅ `src/App.jsx` - Added /setup route

## Summary

Device Binding transforms Mycelium from a **username + PIN** system (vulnerable) to a **device ID + PIN** system (much more secure). Each physical device is uniquely tied to one user account, making it impossible for attackers to use stolen PINs to access multiple accounts.

**The calculator has no username field → Device binding solves this architectural constraint.**

---

**Status**: Implementation Complete ✅  
**Test**: Ready for testing  
**Security**: Device-bound PIN authentication  
**Architecture**: One-time setup → PIN-only login on each device
