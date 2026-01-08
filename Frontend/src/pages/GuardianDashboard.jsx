import { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle, Leaf, Search, Plus } from 'lucide-react';

export default function GuardianDashboard() {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [searchUsername, setSearchUsername] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const guardianId = localStorage.getItem('userId');

  // Fetch connected users
  useEffect(() => {
    if (!guardianId) return;

    const fetchUsers = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/safety/guardian/users/${guardianId}`);
        if (response.ok) {
          const data = await response.json();
          setConnectedUsers(data.connectedUsers || []);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, [guardianId]);

  // Poll status for all connected users
  useEffect(() => {
    if (connectedUsers.length === 0) return;

    const fetchStatuses = async () => {
      const statuses = {};
      for (const userId of connectedUsers) {
        try {
          const response = await fetch(`http://localhost:5000/api/safety/status/${userId}`);
          if (response.ok) {
            const data = await response.json();
            statuses[userId] = data;
          }
        } catch (error) {
          console.error(`Failed to fetch status for ${userId}:`, error);
        }
      }
      setUserStatuses(statuses);
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, [connectedUsers]);

  const handleConnectUser = async () => {
    if (!searchUsername.trim()) {
      setMessage('Please enter a username');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/connect-guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: searchUsername, // In real app, this would be the user's ID found via username
          guardianUsername: localStorage.getItem('username'),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Connected to ${searchUsername}!`);
        setSearchUsername('');
        // Refresh the connected users list
        // In a real app, we'd add the user to the list
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  const getRiskColor = (level) => {
    const colors = {
      GREEN: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-900' },
      YELLOW: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-900' },
      RED: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-900' },
      BLACK: { bg: 'bg-gray-200', border: 'border-gray-700', text: 'text-gray-900' },
    };
    return colors[level] || colors.GREEN;
  };

  const getRiskEmoji = (level) => {
    const emojis = { GREEN: '🌱', YELLOW: '🌾', RED: '🔥', BLACK: '💀' };
    return emojis[level] || '🌱';
  };

  const getAlertMessage = (level) => {
    const messages = {
      GREEN: 'Plant is thriving! ✓',
      YELLOW: 'Needs attention - check in soon',
      RED: 'Immediate care needed!',
      BLACK: 'CRITICAL - Emergency support required!',
    };
    return messages[level] || 'Unknown status';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-blue-900">Garden Caretaker</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
          >
            Log Out
          </button>
        </div>

        {/* Connect New User Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Plus size={20} />
            Connect with a Plant Owner
          </h3>

          <div className="flex gap-3 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="Enter their username..."
                className="w-full pl-10 pr-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              onClick={handleConnectUser}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold transition"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>

          {message && (
            <p className={`text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>

        {/* Connected Plants/Users */}
        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            {connectedUsers.length === 0 ? '🪴 Your Garden' : `🪴 Your Garden (${connectedUsers.length} ${connectedUsers.length === 1 ? 'Plant' : 'Plants'})`}
          </h2>

          {connectedUsers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Leaf size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-xl text-gray-600 mb-4">No plants connected yet</p>
              <p className="text-gray-500">Search above to connect with plant owners and start caring for them!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {connectedUsers.map((userId) => {
                const status = userStatuses[userId] || {};
                const riskColor = getRiskColor(status.riskLevel || 'GREEN');

                return (
                  <div
                    key={userId}
                    className={`${riskColor.bg} border-2 ${riskColor.border} rounded-xl p-6 shadow-lg transform hover:scale-102 transition`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-4xl">{getRiskEmoji(status.riskLevel || 'GREEN')}</p>
                          <div>
                            <h3 className={`text-2xl font-bold ${riskColor.text}`}>
                              {status.username || userId}
                            </h3>
                            <p className={`text-sm ${riskColor.text} opacity-75`}>
                              {getAlertMessage(status.riskLevel || 'GREEN')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-600">Hours Since Check-in</p>
                            <p className={`text-2xl font-bold ${riskColor.text}`}>
                              {status.hoursSilence || 0}h
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Health Status</p>
                            <p className={`text-2xl font-bold ${riskColor.text}`}>
                              {status.riskLevel || 'UNKNOWN'}
                            </p>
                          </div>
                        </div>

                        {status.riskLevel === 'RED' && (
                          <div className="mt-4 bg-red-200 border-l-4 border-red-600 p-3 rounded">
                            <p className="text-red-900 font-bold">⚠️ This plant needs immediate care!</p>
                            <p className="text-red-800 text-sm">Consider reaching out to check on them.</p>
                          </div>
                        )}

                        {status.riskLevel === 'BLACK' && (
                          <div className="mt-4 bg-gray-800 border-l-4 border-gray-900 p-3 rounded">
                            <p className="text-red-200 font-bold">🚨 CRITICAL EMERGENCY!</p>
                            <p className="text-red-100 text-sm">This plant has been silent for more than 24 hours. Immediate action required!</p>
                            <button className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold">
                              📞 Contact Emergency
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center">
          <p className="text-blue-900 font-semibold mb-2">🌍 You are a trusted caretaker</p>
          <p className="text-sm text-blue-700">
            These plant owners trust you to help them stay safe. Regular check-ins from them mean they're doing well. If you don't see them watering their plant for a while, they might need your support.
          </p>
        </div>
      </div>
    </div>
  );
}
