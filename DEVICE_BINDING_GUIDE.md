# Device Binding & Guardian ID Feature - Implementation Guide

## 🔧 What Was Fixed

### 1. **Server Error - guardianEmail Required**
**Problem**: The User model had `guardianEmail` as `required: true`, but Guardians were being created with an empty string, causing validation errors.

**Solution**: 
- Changed `guardianEmail` from `required: true` to `default: ''` (optional)
- Now Guardians don't need an email at all
- Users can optionally provide an email

### 2. **Added Guardian ID Support**
**New Field**: `guardianId` - A MongoDB reference to link users to their guardian directly

**Why it's better than email:**
- ✅ Email-based connections need invite system (complex)
- ✅ Guardian ID allows instant connection (simpler)
- ✅ Users can copy-paste guardian's ID from QR code or text
- ✅ No need for email verification
- ✅ Multiple users can connect to same guardian immediately

---

## 📋 Database Schema Updates

### User Model Changes

```javascript
{
  username: String,
  role: "USER" | "GUARDIAN",
  
  // Guardian Connection - Users choose ONE:
  guardianEmail: String,      // Optional: email-based invite
  guardianId: ObjectId,       // Optional: direct ID reference
  
  // PINs
  realPin: String,            // Real access
  fakePin: String,            // Shows calculator error
  panicPin: String,           // Triggers duress mode
  
  // ... other fields ...
}
```

### Example Documents

**User (alice) with Guardian Email**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "username": "alice",
  "role": "USER",
  "guardianEmail": "bob@example.com",
  "guardianId": null,
  "realPin": "9999",
  "fakePin": "1234",
  "panicPin": "0000"
}
```

**User (jen) with Guardian ID**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
  "username": "jen",
  "role": "USER",
  "guardianEmail": "",
  "guardianId": "65a1b2c3d4e5f6g7h8i9j0k9",
  "realPin": "8888",
  "fakePin": "1111",
  "panicPin": "0000"
}
```

**Guardian (bob)**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k9",
  "username": "bob",
  "role": "GUARDIAN",
  "guardianEmail": "",
  "guardianId": null,
  "realPin": "9999",
  "fakePin": "1234",
  "panicPin": "0000"
}
```

---

## 🎨 Frontend Setup Form Changes

### User Registration Form Now Shows:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Device Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Role Selection]
🌱 Plant Owner  |  👨‍🌾 Caretaker

[Username Field]
Username: [alice            ]

[Guardian Connection - USERS ONLY]
┌─────────────────────────────────┐
│ Connect to Guardian (choose one) │
│                                 │
│ 📧 Guardian Email               │
│ [guardian@example.com ________] │
│ Email for invite-based connection
│                                 │
│     — OR —                      │
│                                 │
│ 🔗 Guardian ID                  │
│ [65a1b2c3d4e5f6g7h8i9j0k9____] │
│ Direct ID for instant connection
└─────────────────────────────────┘

[Security PINs]
🔐 Real PIN:   [9999]
🔐 Fake PIN:   [1234]
🔐 Panic PIN:  [0000]

[Register Button]
🔐 Device Setup Complete
```

---

## 🔄 Registration API Changes

### Request Format

**New POST /api/auth/register**

```json
{
  "username": "alice",
  "role": "USER",
  "guardianEmail": "bob@example.com",    // Optional
  "guardianId": "65a1b2c3...",           // Optional
  "realPin": "9999",
  "fakePin": "1234",
  "panicPin": "0000"
}
```

### Response Format

```json
{
  "message": "Device setup complete. Disguise active.",
  "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "username": "alice",
  "role": "USER"
}
```

### Backend Validation

```javascript
// Validation Rules:
1. username + role are REQUIRED
2. role must be 'USER' or 'GUARDIAN'
3. For USER role: Either guardianEmail OR guardianId must be provided
4. If guardianId provided: Must exist in database and be GUARDIAN role
5. Username must be unique
```

---

## 🧪 Testing Scenarios

### Scenario 1: Register User with Guardian ID

```
Step 1: Guardian already registered
  Username: bob
  Role: GUARDIAN
  ID: 65a1b2c3d4e5f6g7h8i9j0k9

Step 2: User registers and connects via ID
  Go to /setup
  Select 🌱 Plant Owner
  Enter username: alice
  Leave Guardian Email empty
  Enter Guardian ID: 65a1b2c3d4e5f6g7h8i9j0k9
  Click Register

Step 3: Success!
  Device ID saved to localStorage
  Redirected to calculator
  alice is now bound to bob as guardian

Step 4: Login with PIN 9999
  Calculator shows 9999
  User accesses dashboard
  Guardian bob can monitor alice
```

### Scenario 2: Register User with Guardian Email

```
Step 1: Setup form
  Select 🌱 Plant Owner
  Enter username: jen
  Enter Guardian Email: caretaker@example.com
  Leave Guardian ID empty
  Click Register

Step 2: Success!
  Device ID saved
  Email invitation sent (Phase 2)
  jen can proceed to login

Step 3: Guardian receives email invite (Phase 2)
  caretaker@example.com gets email
  Clicks accept to be guardianId reference
  Email validated and linked
```

### Scenario 3: Register as Guardian

```
Step 1: Setup form
  Select 👨‍🌾 Caretaker
  Enter username: bob
  Leave both Guardian fields empty (not applicable)
  Click Register

Step 2: Success!
  Device ID saved
  Redirected to calculator
  bob can login with PIN 9999
  bob's ID (65a1b2c3d4e5f6g7h8i9j0k9) can be shared with users

Step 3: Share Guardian ID
  bob shares ID: 65a1b2c3d4e5f6g7h8i9j0k9
  Users copy-paste it during registration
  Instant connection established
```

---

## 🔐 Device Binding Flow (Complete)

```
┌─────────────────────────────────────────────────────┐
│            COMPLETE DEVICE BINDING FLOW              │
└─────────────────────────────────────────────────────┘

FIRST TIME: Setup Screen (/setup)
├─ Choose Role (USER or GUARDIAN)
├─ Enter Username
├─ [If USER] Connect to Guardian:
│  ├─ Option A: Guardian Email
│  │  (email invite system, Phase 2)
│  └─ Option B: Guardian ID
│     (instant connection, NOW)
├─ Set 3 PINs (Real/Fake/Panic)
├─ POST /api/auth/register
│  └─ Backend validates guardian exists
├─ Receive userId in response
├─ CRITICAL: Save userId to localStorage as 'mycelium_device_id'
└─ Redirect to / (Calculator)

SUBSEQUENT LOGINS: Calculator App (/)
├─ Read userId from localStorage.getItem('mycelium_device_id')
├─ Guard: If no userId → Alert "Device not configured" → Redirect to /setup
├─ User enters PIN on calculator
├─ POST /api/auth/login
│  {
│    "userId": "65a1b2c3...",  ← From localStorage
│    "pin": "9999"              ← From calculator display
│  }
├─ Backend finds user by ID (not username!)
├─ Compares PIN against user's stored values:
│  ├─ realPin → "DASHBOARD" mode
│  ├─ fakePin → "CALCULATOR_ERROR" mode
│  ├─ panicPin → "PANIC_TRIGGERED" mode
│  └─ no match → "CALCULATOR_ERROR" mode
└─ Frontend handles response mode
   ├─ DASHBOARD → Navigate to /user-dashboard or /guardian-dashboard
   ├─ CALCULATOR_ERROR → Show "Error" on calculator for 1.5s
   └─ PANIC_TRIGGERED → Show "DURESS MODE" and clear data
```

---

## 🛡️ Security Model

### Device Binding Advantages

1. **No Username Needed**
   - Calculator has no text input field
   - PIN-only authentication
   - Disguise maintained

2. **Device-Specific Identity**
   - One device = One user
   - localStorage tied to browser
   - Can't switch users on same device (by design)

3. **Guardian Verification**
   - If guardianId provided, verified at registration
   - Guardian must exist and have role "GUARDIAN"
   - Invalid guardian ID rejected immediately

4. **Three-PIN System**
   - Real PIN (9999) → Real access
   - Fake PIN (1234) → Disguise maintained
   - Panic PIN (0000) → Data destruction

---

## 📋 Code Changes Summary

### Backend (`server/`)

**User Model** (`models/User.js`)
- ✅ guardianEmail: `required: true` → `default: ''`
- ✅ NEW: guardianId field (ObjectId reference)

**Auth Controller** (`controllers/authController.js`)
- ✅ handleRegister: Accept guardianId parameter
- ✅ handleRegister: Validate guardianId if provided
- ✅ handleRegister: Check guardian exists and is GUARDIAN role
- ✅ handleLogin: Already updated (reads userId instead of username)

### Frontend (`src/`)

**Register Component** (`pages/Register.jsx`)
- ✅ NEW: guardianId state variable
- ✅ NEW: Form fields for both guardianEmail and guardianId
- ✅ NEW: "Choose one" UI with — OR — divider
- ✅ NEW: Send guardianId in registration request
- ✅ NEW: Validation accepts either email OR ID

**Calculator** (`pages/CalculatorWrapper.jsx`)
- ✅ Already updated: Reads userId from localStorage
- ✅ Already updated: Sends userId in login request
- ✅ Already updated: Guards against missing userId

---

## 🚀 Usage Examples

### Example 1: Parent Monitoring Child

```
Step 1: Parent registers as Guardian
  Username: mom
  Role: Guardian
  PIN: 5678
  → Receives ID: 65abc...

Step 2: Parent shares ID with child
  "Here's your guardian ID: 65abc..."
  OR via QR code

Step 3: Child registers as User
  Username: tommy
  Role: User
  Guardian ID: 65abc...
  PIN: 1234
  → Device bound

Step 4: Child opens app
  mom can monitor tommy's status in real-time
```

### Example 2: DV Survivor with Support Network

```
Step 1: Survivor registers as User
  Username: sarah
  Role: User
  Guardian ID: [support_center_id]
  PIN: 9999
  → Device bound

Step 2: Support center staff monitors
  All users with that guardian ID
  Real-time alerts on RED/BLACK
  Can reach out if needed

Step 3: Friend can also connect
  Registers as separate Guardian
  sarah can connect to multiple guardians
  (Phase 2: Multi-guardian support)
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Device not configured" on first login

**Cause**: localStorage doesn't have `mycelium_device_id`

**Solution**: 
1. Go to /setup
2. Register a new account
3. Make sure registration response includes userId
4. Check localStorage in DevTools → should see mycelium_device_id

### Issue 2: "Server error" during registration

**Cause**: 
- Likely guardianId doesn't exist in database
- OR guardianId user doesn't have role "GUARDIAN"

**Solution**:
1. Verify guardian exists: `db.users.findById(guardianId)`
2. Check guardian has `role: "GUARDIAN"`
3. Try registering without guardianId first
4. Check backend console for error message

### Issue 3: Can't connect with Guardian Email

**Cause**: Email invitation system not implemented (Phase 2)

**Solution**: Use Guardian ID instead (now available)

### Issue 4: "Username already exists"

**Cause**: Someone already registered with that username

**Solution**: Choose a unique username

---

## 📱 Phase 2 Enhancements

When ready, implement:

1. **Email-based Guardian Invitations**
   - Send email to guardianEmail
   - User clicks confirm link
   - Automatically sets guardianId

2. **Multi-Guardian Support**
   - Users connect to multiple guardians
   - Each guardian sees user status
   - Redundant safety network

3. **Guardian ID QR Codes**
   - Guardians generate QR code with their ID
   - Users scan with camera during registration
   - Instant connection

4. **Guardian Management Dashboard**
   - Guardians see all connected users
   - Can generate/revoke IDs
   - Audit log of connections

---

## ✅ Testing Checklist

- [ ] Register user with Guardian ID (existing guardian)
- [ ] Register user with Guardian Email (email-only, for future)
- [ ] Register guardian (no guardian fields)
- [ ] Login with Real PIN (9999)
- [ ] Login with Fake PIN (1234)
- [ ] Login with Panic PIN (0000)
- [ ] Device ID persists in localStorage
- [ ] Clear localStorage and verify "not configured" alert
- [ ] Check MongoDB for correct guardianId reference
- [ ] Verify guardian can see connected user's status

---

**Status**: ✅ Device Binding Implemented  
**Guardian ID**: ✅ Available  
**Guardian Email**: ⏳ Phase 2  
**Next Step**: Test complete flow end-to-end
