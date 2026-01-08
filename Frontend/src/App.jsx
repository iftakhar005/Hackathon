import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CalculatorWrapper from './pages/CalculatorWrapper';
import SecretDashboard from './pages/SecretDashboard';
import GuardianView from './pages/GuardianView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CalculatorWrapper />} />
        <Route path="/secret-dashboard" element={<SecretDashboard />} />
        <Route path="/guardian-view" element={<GuardianView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
