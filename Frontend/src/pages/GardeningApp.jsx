import { useState, useEffect } from 'react';
import { Leaf, Users } from 'lucide-react';

export default function GardeningApp() {
  const [screen, setScreen] = useState('role-select'); // role-select, login, dashboard
  const [selectedRole, setSelectedRole] = useState(null);
  const [username, setUsername] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [fakePin, setFakePin] = useState('1234');
  const [realPin, setRealPin] = useState('9999');
  const [panicPin, setPanicPin] = useState('0000');
  const [message, setMessage] = useState('');
  const userId = localStorage.getItem('userId');

  // If user has already chosen role and has userId, navigate to dashboard
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userId && userRole) {
      const redirectPath = userRole === 'GUARDIAN' ? '/guardian-dashboard' : '/user-dashboard';
      window.location.href = redirectPath;
    }
  }, [userId]);

  const handleRegister = async () => {
    if (!username || !selectedRole) {
      setMessage('Please fill all fields');
      return;
    }

    if (selectedRole === 'USER' && !guardianEmail) {
      setMessage('Guardian email required for users');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          role: selectedRole,
          guardianEmail: selectedRole === 'USER' ? guardianEmail : '',
          fakePin,
          realPin,
          panicPin,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('✅ Registration successful! Now choose your role...');
        // Store userId and role for the appropriate dashboard
        localStorage.setItem('username', username);
        localStorage.setItem('userRole', selectedRole);
        setTimeout(() => {
          const redirectPath = selectedRole === 'GUARDIAN' ? '/guardian-dashboard' : '/user-dashboard';
          window.location.href = redirectPath;
        }, 1500);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Connection error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-950 flex items-center justify-center p-4">
      {/* Decorative plants */}
      <div className="absolute top-0 left-0 opacity-20">
        <Leaf size={100} className="text-green-300 animate-bounce" />
      </div>
      <div className="absolute bottom-0 right-0 opacity-20">
        <Leaf size={120} className="text-green-300" style={{ animation: 'float 3s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {screen === 'role-select' && (
          <div className="bg-white bg-opacity-95 rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-8">
              <Leaf size={64} className="mx-auto text-green-600 mb-4" />
              <h1 className="text-4xl font-bold text-green-900 mb-2">Mycelium Garden</h1>
              <p className="text-gray-600">A Safe Haven for Growth</p>
            </div>

            <p className="text-gray-700 mb-8">Welcome! Are you a Plant Owner or a Plant Caretaker?</p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setSelectedRole('USER');
                  setScreen('register');
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg transition transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Leaf size={20} />
                Plant Owner (User)
              </button>

              <button
                onClick={() => {
                  setSelectedRole('GUARDIAN');
                  setScreen('register');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg transition transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Users size={20} />
                Plant Caretaker (Guardian)
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-8">🌿 Everything you do here is safe and private</p>
          </div>
        )}

        {screen === 'register' && (
          <div className="bg-white bg-opacity-95 rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-green-900 mb-6">
              {selectedRole === 'USER' ? '🌱 Register as Plant Owner' : '👨‍🌾 Register as Plant Caretaker'}
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-600"
              />

              {selectedRole === 'USER' && (
                <input
                  type="email"
                  placeholder="Guardian Email (e.g., caretaker@email.com)"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              )}

              <div className="text-sm text-gray-600 mb-4">
                <p className="font-bold mb-2">🔐 Security Codes (Optional - customize your PINs):</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Fake PIN"
                    value={fakePin}
                    onChange={(e) => setFakePin(e.target.value)}
                    maxLength="4"
                    className="px-2 py-2 border border-gray-300 rounded text-center"
                  />
                  <input
                    type="text"
                    placeholder="Real PIN"
                    value={realPin}
                    onChange={(e) => setRealPin(e.target.value)}
                    maxLength="4"
                    className="px-2 py-2 border border-gray-300 rounded text-center"
                  />
                  <input
                    type="text"
                    placeholder="Panic PIN"
                    value={panicPin}
                    onChange={(e) => setPanicPin(e.target.value)}
                    maxLength="4"
                    className="px-2 py-2 border border-gray-300 rounded text-center"
                  />
                </div>
              </div>

              {message && (
                <p className={`text-center py-2 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message}
                </p>
              )}

              <button
                onClick={handleRegister}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition"
              >
                Register & Start Growing
              </button>

              <button
                onClick={() => setScreen('role-select')}
                className="w-full bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold transition"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
