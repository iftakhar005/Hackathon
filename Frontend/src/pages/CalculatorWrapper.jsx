import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CalculatorWrapper = () => {
  const [display, setDisplay] = useState('0');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInput = (value) => {
    if (display === '0' && value !== '.') {
      setDisplay(value);
    } else {
      setDisplay(display + value);
    }
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleDelete = () => {
    setDisplay(display.slice(0, -1) || '0');
  };

  const handleEquals = async () => {
    const pin = display;

    // CRITICAL: Check if device is bound to a user
    const deviceId = localStorage.getItem('mycelium_device_id');
    
    if (!deviceId) {
      // Guard Clause: Device not configured
      alert('🔐 Device not configured. Please complete setup first.');
      navigate('/setup');
      return;
    }

    setLoading(true);
    try {
      // Device-bound login: send userId + pin
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        userId: deviceId,
        pin: pin,
      });

      const { mode, success } = response.data;

      // Handle different response modes
      if (mode === 'DASHBOARD' && success) {
        // Real PIN - Grant dashboard access
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('userRole', localStorage.getItem('mycelium_role'));
        localStorage.setItem('username', localStorage.getItem('mycelium_username'));
        
        // Redirect to appropriate dashboard based on role
        const role = localStorage.getItem('mycelium_role');
        navigate(role === 'GUARDIAN' ? '/guardian-dashboard' : '/user-dashboard');
      } else if (mode === 'PANIC_TRIGGERED') {
        // Panic PIN - Trigger emergency wipe
        setDisplay('DURESS MODE');
        setTimeout(() => setDisplay('0'), 2000);
      } else if (mode === 'CALCULATOR_ERROR') {
        // Fake PIN or invalid - Show calculator error
        setDisplay('Error');
        setTimeout(() => setDisplay('0'), 1500);
      }
    } catch (err) {
      // Invalid PIN - Try to calculate
      try {
        const result = eval(display);
        setDisplay(result.toString());
      } catch {
        setDisplay('Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const ButtonGroup = ({ children }) => (
    <div className="grid grid-cols-4 gap-3">{children}</div>
  );

  const Button = ({ value, onClick, className = '', variant = 'default' }) => {
    const baseStyle = 'h-16 rounded-lg font-bold text-xl transition-all active:scale-95';
    const variants = {
      default: 'bg-gray-700 text-white hover:bg-gray-600',
      operator: 'bg-orange-500 text-white hover:bg-orange-600',
      equals: 'bg-green-500 text-white hover:bg-green-600 col-span-2',
      clear: 'bg-red-500 text-white hover:bg-red-600',
    };

    return (
      <button
        onClick={onClick}
        className={`${baseStyle} ${variants[variant]} ${className}`}
        disabled={loading}
      >
        {value}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm">
        {/* Display */}
        <div className="bg-black rounded-xl p-6 mb-6">
          <div className="text-right text-5xl font-bold text-green-400 font-mono truncate">
            {display}
          </div>
        </div>

        {/* Buttons */}
        <ButtonGroup>
          <Button value="AC" onClick={handleClear} variant="clear" />
          <Button value="+/-" onClick={() => setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display)} />
          <Button value="%" onClick={() => setDisplay((parseFloat(display) * 0.01).toString())} />
          <Button value="÷" onClick={() => handleInput('/')} variant="operator" />

          <Button value="7" onClick={() => handleInput('7')} />
          <Button value="8" onClick={() => handleInput('8')} />
          <Button value="9" onClick={() => handleInput('9')} />
          <Button value="×" onClick={() => handleInput('*')} variant="operator" />

          <Button value="4" onClick={() => handleInput('4')} />
          <Button value="5" onClick={() => handleInput('5')} />
          <Button value="6" onClick={() => handleInput('6')} />
          <Button value="−" onClick={() => handleInput('-')} variant="operator" />

          <Button value="1" onClick={() => handleInput('1')} />
          <Button value="2" onClick={() => handleInput('2')} />
          <Button value="3" onClick={() => handleInput('3')} />
          <Button value="+" onClick={() => handleInput('+')} variant="operator" />

          <Button value="0" onClick={() => handleInput('0')} className="col-span-2" />
          <Button value="." onClick={() => handleInput('.')} />
          <Button value="=" onClick={handleEquals} variant="equals" />
        </ButtonGroup>

        {/* Footer */}
        <div className="text-center text-gray-500 text-xs mt-6">
          Math Tool v1.0
        </div>
      </div>
    </div>
  );
};

export default CalculatorWrapper;
