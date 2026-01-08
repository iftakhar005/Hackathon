import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CalculatorWrapper from './pages/CalculatorWrapper';
import Register from './pages/Register';
import GardeningApp from './pages/GardeningApp';
import UserDashboard from './pages/UserDashboard';
import GuardianDashboard from './pages/GuardianDashboard';
import SecretDashboard from './pages/SecretDashboard';
import GuardianView from './pages/GuardianView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Device Setup - One-time initial setup */}
        <Route path="/setup" element={<Register />} />
        
        {/* Calculator Interface - Main login screen (PIN entry) */}
        <Route path="/" element={<CalculatorWrapper />} />
        
        {/* After PIN validation - Gardening App selection screen */}
        <Route path="/gardening-app" element={<GardeningApp />} />
        
        {/* User Dashboard - for plant owners */}
        <Route path="/user-dashboard" element={<UserDashboard />} />
        
        {/* Guardian Dashboard - for caretakers */}
        <Route path="/guardian-dashboard" element={<GuardianDashboard />} />
        
        {/* Legacy routes (keeping for backwards compatibility) */}
        <Route path="/secret-dashboard" element={<SecretDashboard />} />
        <Route path="/guardian-view" element={<GuardianView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
