import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('USER');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianId, setGuardianId] = useState('');
  const [realPin, setRealPin] = useState('9999');
  const [fakePin, setFakePin] = useState('1234');
  const [panicPin, setPanicPin] = useState('0000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!username.trim()) {
        setError('Username is required');
        setLoading(false);
        return;
      }

      if (role === 'USER' && !guardianEmail.trim() && !guardianId.trim()) {
        setError('Guardian Email OR Guardian ID is required for Plant Owners');
        setLoading(false);
        return;
      }

      if (!realPin || !fakePin || !panicPin || realPin.length !== 4 || fakePin.length !== 4 || panicPin.length !== 4) {
        setError('All PINs must be exactly 4 digits');
        setLoading(false);
        return;
      }

      // Call backend registration
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          role,
          guardianEmail: role === 'USER' ? guardianEmail : '',
          guardianId: role === 'USER' ? guardianId : '',
          realPin,
          fakePin,
          panicPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
        setLoading(false);
        return;
      }

      // CRITICAL: Save userId to localStorage as device binding ID
      localStorage.setItem('mycelium_device_id', data.userId);
      localStorage.setItem('mycelium_username', data.username);
      localStorage.setItem('mycelium_role', data.role);

      // Success message
      alert('🔐 Device Setup Complete. Disguise Active.');

      // Redirect to calculator
      navigate('/');
    } catch (err) {
      setError('Connection failed. Make sure backend is running on port 5000.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-950 flex items-center justify-center p-4">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 opacity-20">
        <Leaf size={120} className="text-green-300 animate-bounce" />
      </div>
      <div className="absolute bottom-0 right-0 opacity-20">
        <Leaf size={150} className="text-green-300" style={{ animation: 'float 4s ease-in-out infinite' }} />
      </div>

      {/* Setup Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white bg-opacity-95 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Lock size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-900 mb-2">Device Setup</h1>
            <p className="text-gray-600 text-sm">Configure your Mycelium Garden for this device</p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">Choose Your Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRole('USER')}
                className={`py-3 px-4 rounded-lg font-bold transition ${
                  role === 'USER'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🌱 Plant Owner
              </button>
              <button
                onClick={() => setRole('GUARDIAN')}
                className={`py-3 px-4 rounded-lg font-bold transition ${
                  role === 'GUARDIAN'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                👨‍🌾 Caretaker
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., alice"
                className="w-full px-4 py-2 border-2 border-green-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                disabled={loading}
              />
            </div>

            {/* Guardian Email (for Users only) */}
            {role === 'USER' && (
              <div className="space-y-3 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-bold">Connect to Guardian (choose one):</p>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Guardian Email</label>
                  <input
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="e.g., guardian@example.com"
                    className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">📧 Email for invite-based connection</p>
                </div>

                <div className="text-center text-gray-500 text-sm">— OR —</div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Guardian ID</label>
                  <input
                    type="text"
                    value={guardianId}
                    onChange={(e) => setGuardianId(e.target.value)}
                    placeholder="e.g., 65a1b2c3d4e5f6g7h8i9j0k1"
                    className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600 font-mono text-sm"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">🔗 Direct ID for instant connection</p>
                </div>
              </div>
            )}

            {/* PIN Configuration */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <label className="block text-sm font-bold text-gray-700 mb-3">🔐 Security PINs</label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">Real PIN (Safe Access)</label>
                  <input
                    type="text"
                    maxLength="4"
                    value={realPin}
                    onChange={(e) => setRealPin(e.target.value)}
                    placeholder="0000"
                    className="w-full px-3 py-2 border-2 border-green-300 rounded text-center font-mono text-lg text-gray-900 focus:outline-none focus:border-green-600"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Fake PIN (Shows Error)</label>
                  <input
                    type="text"
                    maxLength="4"
                    value={fakePin}
                    onChange={(e) => setFakePin(e.target.value)}
                    placeholder="0000"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded text-center font-mono text-lg text-gray-900 focus:outline-none focus:border-gray-600"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Panic PIN (Emergency Wipe)</label>
                  <input
                    type="text"
                    maxLength="4"
                    value={panicPin}
                    onChange={(e) => setPanicPin(e.target.value)}
                    placeholder="0000"
                    className="w-full px-3 py-2 border-2 border-red-300 rounded text-center font-mono text-lg text-gray-900 focus:outline-none focus:border-red-600"
                    disabled={loading}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">💡 Tip: Use memorable numbers, but keep them secret</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 active:scale-95"
            >
              {loading ? 'Setting Up Device...' : '✓ Complete Setup'}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-sm text-blue-900">
            <p className="font-bold mb-1">🔒 Your device will be bound to this user.</p>
            <p>Only the correct PINs will unlock your account on this device. This cannot be changed later without server support.</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
