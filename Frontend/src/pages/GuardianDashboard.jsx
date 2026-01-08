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
          <h2 className="text-2xl font-bold text-blue-900 mb-6">🪴 Your Garden Overview</h2>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <p className="text-gray-600">Loading your connected users' gardens...</p>
            </div>
          ) : connectedUsers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <p className="text-xl text-gray-600 mb-4">No connected users yet</p>
              <p className="text-gray-500">You can connect with plant owners to start monitoring them.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {connectedUsers.map((user) => (
                <div key={user._id} className="bg-white rounded-2xl shadow-lg p-6">
                  {/* User Header */}
                  <div className="border-b-2 border-gray-200 pb-4 mb-6">
                    <h3 className="text-2xl font-bold text-blue-900">
                      👤 {user.username}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Status: <span className="font-semibold text-blue-600">{user.riskLevel || 'GREEN'}</span> | 
                      Last seen: {new Date(user.lastActiveAt).toLocaleString()}
                    </p>
                  </div>

                  {/* User's Plants Grid */}
                  {user.plants && user.plants.length > 0 ? (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-4">
                        🌱 {user.plantCount} plant{user.plantCount !== 1 ? 's' : ''} in their garden
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {user.plants.map((plant) => (
                          <div
                            key={plant._id}
                            className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 hover:shadow-lg transition"
                          >
                            <div className="text-4xl text-center mb-2">
                              {getFlowerEmoji(plant.flowerType)}
                            </div>
                            <h4 className="font-bold text-sm text-center text-blue-900">
                              {getFlowerName(plant.flowerType)}
                            </h4>
                            <p className="text-xs text-gray-600 text-center mt-2">
                              Planted: {new Date(plant.plantedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-blue-600 text-center mt-1 font-semibold">
                              Status: <span className={plant.lastWatered ? 'text-green-600' : 'text-yellow-600'}>
                                {plant.lastWatered ? '✓ Healthy' : '⚠ Needs care'}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No plants planted yet</p>
                    </div>
                  )}
                </div>
              ))}
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
