import { useState, useEffect } from 'react';
import { LogOut, Plus, Trash2 } from 'lucide-react';

export default function UserDashboard() {
  const [plantedFlowers, setPlantedFlowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const userId = localStorage.getItem('mycelium_device_id');

  // Available flowers to plant
  const availableFlowers = [
    { id: 'green_fern', name: 'Green Fern', emoji: '🌿', description: 'Safe & Active', color: 'green' },
    { id: 'white_lily', name: 'White Lily', emoji: '🪷', description: 'Calm & Peaceful', color: 'blue' },
    { id: 'red_rose', name: 'Red Rose', emoji: '🌹', description: 'Emergency SOS', color: 'red' },
    { id: 'yellow_wheat', name: 'Yellow Wheat', emoji: '🌾', description: 'Elevated Risk', color: 'yellow' },
    { id: 'withered_leaf', name: 'Withered Leaf', emoji: '🍂', description: 'Critical', color: 'gray' },
  ];

  useEffect(() => {
    if (!userId) return;
    fetchPlantedFlowers();
    const interval = setInterval(fetchPlantedFlowers, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchPlantedFlowers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/safety/plants/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPlantedFlowers(data.plants || []);
      }
    } catch (error) {
      console.error('Failed to fetch plants:', error);
    }
  };

  const handlePlantFlower = async (flowerType) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/safety/plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          flowerType,
          timestamp: new Date(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActionMessage(`🌱 ${data.flowerName} planted! Caregiver notified.`);
        await fetchPlantedFlowers();
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to plant flower:', err);
      setActionMessage('❌ Failed to plant flower');
    } finally {
      setLoading(false);
    }
  };

  const handleWaterPlant = async (plantId, flowerType) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/safety/water-plant/${plantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setActionMessage(`💧 Plant watered! Caregiver notified.`);
        await fetchPlantedFlowers();
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to water plant:', err);
      setActionMessage('❌ Failed to water plant');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlant = async (plantId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/safety/remove-plant/${plantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setActionMessage('🗑️ Plant removed from garden');
        await fetchPlantedFlowers();
        setTimeout(() => setActionMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to remove plant:', err);
      setActionMessage('❌ Failed to remove plant');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mycelium_device_id');
    localStorage.removeItem('mycelium_role');
    localStorage.removeItem('mycelium_username');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">🌿 Secret Garden</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            <LogOut size={18} />
            Lock & Exit
          </button>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className="bg-blue-900/50 border border-blue-500 text-blue-200 px-6 py-3 rounded-lg mb-6 font-semibold">
            ✓ {actionMessage}
          </div>
        )}

        {/* ===== PLANT NEW FLOWERS SECTION ===== */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">🌱 Plant New Flowers</h2>
          <p className="text-gray-400 mb-6">Choose a flower to plant. Your caregiver will be notified.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {availableFlowers.map((flower) => (
              <div
                key={flower.id}
                className="bg-slate-800/50 border border-slate-700 hover:border-slate-500 rounded-xl p-4 transition"
              >
                <div className="text-5xl mb-2 text-center">{flower.emoji}</div>
                <h3 className="font-bold text-sm text-center">{flower.name}</h3>
                <p className="text-xs text-gray-400 text-center mt-1">{flower.description}</p>
                <button
                  onClick={() => handlePlantFlower(flower.id)}
                  disabled={loading}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded text-xs font-bold transition"
                >
                  <Plus size={14} className="inline mr-1" /> Plant
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ===== YOUR GARDEN SECTION ===== */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            🪴 Your Garden {plantedFlowers.length > 0 && `(${plantedFlowers.length})`}
          </h2>

          {plantedFlowers.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
              <p className="text-gray-400 mb-4">No plants in your garden yet</p>
              <p className="text-gray-500 text-sm">Plant a flower above to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plantedFlowers.map((plant) => {
                const flowerData = availableFlowers.find(f => f.id === plant.flowerType);
                return (
                  <div
                    key={plant._id}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-700/50 transition"
                  >
                    {/* Plant Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-4xl mb-2">{flowerData?.emoji}</div>
                        <h3 className="font-bold text-lg">{flowerData?.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          Planted {new Date(plant.plantedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemovePlant(plant._id)}
                        disabled={loading}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    {/* Plant Status */}
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-4 text-sm">
                      <p className="text-gray-300">Status: <span className="text-green-400 font-bold">Healthy</span></p>
                      <p className="text-gray-300">Last watered: <span className="text-blue-400">{plant.lastWatered ? 'Recently' : 'Never'}</span></p>
                    </div>

                    {/* Plant Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleWaterPlant(plant._id, plant.flowerType)}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded font-bold transition text-sm"
                      >
                        💧 Water Plant
                      </button>
                      <button
                        disabled={loading}
                        className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white py-2 rounded font-bold transition text-sm"
                      >
                        📝 Journal Entry
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-xs mt-12">
          Mycelium Secret Garden © 2026 | All actions logged & shared with caregiver
        </div>
      </div>
    </div>
  );
}
