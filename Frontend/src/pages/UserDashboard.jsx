import { useState, useEffect } from 'react';
import { Leaf, AlertCircle, CheckCircle, Droplet, Wind, Shield } from 'lucide-react';

export default function UserDashboard() {
  const [status, setStatus] = useState(null);
  const [journal, setJournal] = useState('');
  const [riskScore, setRiskScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/safety/status/${userId}`);
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleCheckIn = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/safety/checkin/${userId}`, {
        method: 'POST',
      });
      if (response.ok) {
        setMessage('💧 Water given! Plant is happy!');
        setTimeout(() => setMessage(''), 3000);
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleJournal = async () => {
    if (!journal.trim()) {
      setMessage('Please write something first');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/safety/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, entry: journal }),
      });

      const data = await response.json();
      setRiskScore(data.riskScore);
      setJournal('');
      setMessage(`📔 Journal entry saved! Plant health: ${data.riskScore}/10`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Journal failed:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  const getRiskColor = (level) => {
    const colors = {
      GREEN: 'from-green-400 to-green-600',
      YELLOW: 'from-yellow-400 to-yellow-600',
      RED: 'from-red-400 to-red-600',
      BLACK: 'from-gray-700 to-gray-900',
    };
    return colors[level] || colors.GREEN;
  };

  const getRiskEmoji = (level) => {
    const emojis = { GREEN: '🌱', YELLOW: '🌾', RED: '🔥', BLACK: '💀' };
    return emojis[level] || '🌱';
  };

  if (loading) return <div className="text-center py-20">Loading your garden...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <Leaf className="text-green-600" size={32} />
            <h1 className="text-3xl font-bold text-green-900">My Garden</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
          >
            Log Out
          </button>
        </div>

        {/* Plant Status Card */}
        {status && (
          <div className={`bg-gradient-to-r ${getRiskColor(status.riskLevel)} rounded-2xl p-8 text-white mb-6 shadow-lg transform hover:scale-105 transition`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-5xl">{getRiskEmoji(status.riskLevel)}</p>
                <h2 className="text-2xl font-bold mt-2">
                  {status.riskLevel === 'GREEN' && '🌱 Plant is Thriving!'}
                  {status.riskLevel === 'YELLOW' && '🌾 Needs Attention'}
                  {status.riskLevel === 'RED' && '🔥 Critical Care Needed'}
                  {status.riskLevel === 'BLACK' && '💀 Emergency!'}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Last watered</p>
                <p className="text-lg font-bold">{status.hoursSilence} hours ago</p>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <p>Status: {status.message}</p>
              <p>Your caretaker has been notified if needed</p>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {message && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg mb-6">
            {message}
          </div>
        )}

        {/* Water Plant Button */}
        <button
          onClick={handleCheckIn}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mb-6 flex items-center justify-center gap-2 transform hover:scale-105 transition shadow-lg"
        >
          <Droplet size={24} />
          Water Plant (Check-in)
        </button>

        {/* Journal Entry */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
            <Wind size={20} />
            Garden Journal
          </h3>
          <textarea
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="How is your plant doing? Write anything you want... The garden is safe."
            className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-600 mb-3 font-mono text-sm"
            rows={4}
          />
          <button
            onClick={handleJournal}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition"
          >
            📝 Save Journal Entry
          </button>
        </div>

        {/* Plant Health Info */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <Shield size={32} className="mx-auto text-green-600 mb-2" />
            <p className="text-sm text-gray-600">Safety</p>
            <p className="text-2xl font-bold text-green-900">{status?.riskLevel || 'N/A'}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-4 text-center">
            <Leaf size={32} className="mx-auto text-green-600 mb-2" />
            <p className="text-sm text-gray-600">Health Score</p>
            <p className="text-2xl font-bold text-green-900">{riskScore || status?.riskScore || '--'}/10</p>
          </div>

          <div className="bg-white rounded-xl shadow p-4 text-center">
            <Droplet size={32} className="mx-auto text-blue-500 mb-2" />
            <p className="text-sm text-gray-600">Watering</p>
            <p className="text-2xl font-bold text-blue-900">{status?.hoursSilence || 0}h</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 text-center">
          <p className="text-green-900 font-semibold mb-2">🌍 Your garden is protected</p>
          <p className="text-sm text-green-700">Your caretaker monitors your plant's health. If you don't water it for 24 hours, they'll know you might need help.</p>
        </div>
      </div>
    </div>
  );
}
