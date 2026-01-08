# Mycelium Garden - Role-Based Refactor Summary

## Overview
Transformed the application from a simple secret dashboard into a complete **gardening-themed game** where users can be either:
- **Plant Owners (Users)** - Safety dashboard with check-in system
- **Plant Caretakers (Guardians)** - Monitoring dashboard to track their plants/users

## New Application Flow

### 1. **Calculator Login** (Disguise Layer)
- **Route**: `/`
- **PIN 9999**: Unlocks the Gardening App
- **PIN 1234**: Shows "Error" (disguise maintained)
- **PIN 0000**: Triggers duress mode (wipes data)
- Stores `userId` in localStorage

### 2. **Gardening App Selection** 
- **Route**: `/gardening-app`
- Users choose their role: **Plant Owner** or **Plant Caretaker**
- **Register** with username, email (for users), and custom PINs
- Stores `userRole` and `username` in localStorage
- Auto-redirects to appropriate dashboard

### 3. **User Dashboard (Plant Owner)**
- **Route**: `/user-dashboard`
- **Theme**: Gardening app disguise with plants & watering metaphors
- **Features**:
  - 🌱 Plant Health Status (GREEN/YELLOW/RED/BLACK risk levels)
  - 💧 Water Plant button (Check-in to reset 24h timer)
  - 📔 Garden Journal (write feelings, get health score)
  - 🛡️ Safety metrics display
  - Auto-logout button
- **Dead Man's Switch**:
  - GREEN: < 6 hours since check-in
  - YELLOW: 6-12 hours (warning)
  - RED: 12-24 hours (critical)
  - BLACK: > 24 hours (emergency alert sent)

### 4. **Guardian Dashboard (Plant Caretaker)**
- **Route**: `/guardian-dashboard`
- **Theme**: Garden monitoring app for caretakers
- **Features**:
  - Search & connect to Plant Owners by username
  - Monitor multiple plants/users with real-time status
  - Color-coded alerts (GREEN/YELLOW/RED/BLACK)
  - Automatic emergency detection
  - Quick contact buttons for critical situations
  - Auto-logout button

## Database Changes

### User Model Updates
```javascript
{
  // ... existing fields ...
  role: {
    type: String,
    enum: ['USER', 'GUARDIAN'],
    required: true,
    default: 'USER'
  },
  connectedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}
```

## Backend API Changes

### New Endpoints

#### 1. **Enhanced Registration**
- **Endpoint**: `POST /api/auth/register`
- **New Field**: `role` (USER or GUARDIAN)
- **User Flow**: 
  - Register → GardeningApp → Select role → Navigate to dashboard
  - Users: require guardianEmail
  - Guardians: no email required

#### 2. **Guardian Connection**
- **Endpoint**: `POST /api/auth/connect-guardian`
- **Purpose**: Link a USER to a GUARDIAN by username
- **Response**: Adds user to guardian's `connectedUsers` array

#### 3. **Guardian's User List**
- **Endpoint**: `GET /api/safety/guardian/users/:guardianId`
- **Purpose**: Fetch all connected users for a guardian
- **Returns**: Array of user objects with status

## Frontend Components

### New Components Created
1. **GardeningApp.jsx** - Role selection & registration
2. **UserDashboard.jsx** - Plant owner interface
3. **GuardianDashboard.jsx** - Caretaker monitoring interface

### Updated Components
1. **App.jsx** - New routing structure
2. **CalculatorWrapper.jsx** - Navigates to `/gardening-app` instead of dashboard
3. **authController.js** - Supports role parameter
4. **safetyController.js** - New getConnectedUsers function

## Theme & UX Design

### User Dashboard (Plant Owner)
- **Color Scheme**: Greens & earth tones
- **Icons**: Plants 🌱, water droplets 💧, leaves 🍃
- **Language**: "Water your plant", "Garden journal", "Plant health"
- **Visual Feedback**: Pulsing animations for alerts, color changes for risk levels

### Guardian Dashboard (Plant Caretaker)
- **Color Scheme**: Blues & greens (caring/protective)
- **Icons**: Users 👥, search 🔍, plants 🪴
- **Language**: "Your garden", "Connect with plant owners", "Monitoring"
- **Visual Feedback**: Real-time status updates, emergency badges

## Testing Flow

### Test User Registration
```javascript
// Register as Plant Owner
POST /api/auth/register
{
  "username": "alice",
  "role": "USER",
  "guardianEmail": "bob@gmail.com",
  "fakePin": "1234",
  "realPin": "9999",
  "panicPin": "0000"
}

// Register as Plant Caretaker
POST /api/auth/register
{
  "username": "bob",
  "role": "GUARDIAN",
  "fakePin": "1234",
  "realPin": "9999",
  "panicPin": "0000"
}
```

### Complete User Journey
1. Load Calculator app at `localhost:3002/`
2. Enter PIN `9999`
3. Redirected to `/gardening-app`
4. Choose role (User or Guardian)
5. Register with username
6. Auto-navigate to appropriate dashboard
7. Test features:
   - **User**: Water plant, write journal, check status
   - **Guardian**: Search for users, monitor their status

## State Management

### localStorage Keys
- `userId` - Set by Calculator login
- `userRole` - Set by GardeningApp registration (USER/GUARDIAN)
- `username` - Set by GardeningApp registration
- `riskLevel` - Set by Calculator login

### Component State Flow
```
Calculator (PIN 9999)
  ↓ stores userId
GardeningApp (role selection)
  ↓ stores userRole + username
UserDashboard or GuardianDashboard
  ↓ uses userId for API calls
```

## API Response Examples

### Check Status (Dead Man's Switch)
```json
{
  "userId": "67801234567890abcdef1234",
  "username": "alice",
  "riskLevel": "GREEN",
  "lastActiveAt": "2026-01-08T10:30:00.000Z",
  "hoursSilence": 2,
  "silenceDuration": 120,
  "alertSentToGuardian": false,
  "isSilenced": false
}
```

### Guardian's Connected Users
```json
{
  "guardianUsername": "bob",
  "connectedUsers": [
    {
      "_id": "67801234567890abcdef1234",
      "username": "alice",
      "riskLevel": "YELLOW",
      "lastActiveAt": "2026-01-08T10:30:00.000Z"
    }
  ]
}
```

## Gamification Elements

The app feels like a **gardening game** rather than a safety tool:
- Plants instead of "users" 🌱
- Watering instead of "check-ins" 💧
- Garden instead of "dashboard" 🪴
- Health scores instead of "risk assessments" 📊
- Caretakers instead of "guardians" 👨‍🌾

This metaphor provides:
- **Psychological Safety**: Less threatening language
- **Normality**: Appears to be a game/hobby app
- **Engagement**: Gamified elements encourage regular usage
- **Steganography**: Perfect cover for a serious safety tool

## Security Notes

- Real PIN (9999) still hidden in calculator
- Panic PIN (0000) still triggers data wipe
- Fake PIN (1234) still shows calculator error
- All functionality requires userId in localStorage
- Guardian role explicitly validated on connection
- Dead Man's Switch automatically alerts after 24h silence

## Next Steps

### Phase 2 Implementation
1. Add friend request/approval system for connections
2. Implement email alerts when plants hit RED/BLACK status
3. Add image steganography for evidence vault
4. Create emergency contact UI
5. Implement PWA manifest for home screen
6. Add offline functionality
7. Create admin dashboard for monitoring multiple users

### Performance Optimizations
1. Reduce polling interval based on risk level
2. Cache user data locally
3. Batch API requests
4. Optimize re-renders with useMemo/useCallback

---

**Build Date**: January 8, 2026  
**Team**: Senior Backend Architect + Full Stack  
**Goal**: Win "Engineering Practice" category with clean, maintainable code
