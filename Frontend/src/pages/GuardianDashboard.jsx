import { useState, useEffect } from 'react';
import { Users, AlertCircle, LogOut, Trash2 } from 'lucide-react';

export default function GuardianDashboard() {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const guardianId = localStorage.getItem('mycelium_device_id');
  const guardianName = localStorage.getItem('mycelium_username');

  // Fetch connected users with their plants
  useEffect(() => {
    if (!guardianId) return;

    const fetchConnectedUsersPlants = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/safety/guardian/users/${guardianId}/plants`);
        if (response.ok) {
          const data = await response.json();
          setConnectedUsers(data.connectedUsers || []);
        } else {
          console.error('Failed to fetch connected users');
        }
      } catch (error) {
        console.error('Error fetching connected users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectedUsersPlants();
    const interval = setInterval(fetchConnectedUsersPlants, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [guardianId]);

  const handleLogout = () => {
    localStorage.removeItem('mycelium_device_id');
    localStorage.removeItem('mycelium_role');
    localStorage.removeItem('mycelium_username');
    window.location.href = '/';
  };

  // Get flower emoji based on type
  const getFlowerEmoji = (flowerType) => {
    const emojis = {
      green_fern: '🌿',
      white_lily: '🪷',
      red_rose: '🌹',
      yellow_wheat: '🌾',
      withered_leaf: '🍂',
    };
    return emojis[flowerType] || '🌿';
  };

  // Get flower name
  const getFlowerName = (flowerType) => {
    const names = {
      green_fern: 'Green Fern',
      white_lily: 'White Lily',
      red_rose: 'Red Rose',
      yellow_wheat: 'Yellow Wheat',
      withered_leaf: 'Withered Leaf',
    };
    return names[flowerType] || 'Unknown Flower';
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
          {guardianId && (
            <div className="bg-blue-100 border border-blue-300 text-blue-900 px-3 py-2 rounded-lg text-sm font-mono">
              <p className="font-semibold">Guardian ID</p>
              <p className="truncate" title={guardianId}>{guardianId}</p>
            </div>
          )}
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
            ➕ Connected Users
          </h3>
          <p className="text-gray-700">
            You are currently monitoring <strong>{connectedUsers.length}</strong> plant owner{connectedUsers.length !== 1 ? 's' : ''}.
            Their plants are displayed below. Check in regularly to ensure they're safe.
          </p>
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
