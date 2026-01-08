import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, CheckCircle2, LogOut, Upload, Flower2, Leaf } from 'lucide-react';

const SecretDashboard = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('mycelium_device_id');

  const [riskLevel, setRiskLevel] = useState('GREEN');
  const [timeSilent, setTimeSilent] = useState(0);
  const [journalEntry, setJournalEntry] = useState('');
  const [riskScore, setRiskScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastCheckin, setLastCheckin] = useState(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [userId, navigate]);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/safety/status/${userId}`);
      setRiskLevel(response.data.riskLevel);
      setTimeSilent(response.data.silenceDuration);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  // Get current flower icon based on status
  const getCurrentFlower = () => {
    if (sosTriggered) return '🌹'; // Red Rose - SOS Active
    if (timeSilent > 1440) return '🍂'; // Withered Leaf - Critical Silence
    if (riskLevel === 'RED' || riskLevel === 'BLACK') return '🌹'; // Red Rose - High Risk
    if (riskLevel === 'YELLOW') return '🌾'; // Yellow Wheat - Elevated Risk
    return '🌿'; // Green Fern - Safe/Active
  };

  const getFlowerMessage = () => {
    if (sosTriggered) return 'SOS Signal Sent';
    if (timeSilent > 1440) return 'Critical Silence';
    if (riskLevel === 'RED' || riskLevel === 'BLACK') return 'High Risk State';
    if (riskLevel === 'YELLOW') return 'Elevated Risk';
    return 'Safe & Active';
  };

  const handleWaterFern = async () => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/safety/checkin/${userId}`);
      setLastCheckin(new Date());
      setSosTriggered(false);
      setActionSuccess('🌿 Fern watered - Timer reset!');
      await fetchStatus();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert('Failed to water fern');
    } finally {
      setLoading(false);
    }
  };

  const handlePlantWhiteLily = async () => {
    if (!journalEntry.trim()) {
      alert('Please write a safe/calm entry first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/safety/journal', {
        userId,
        entry: journalEntry,
      });
      setRiskScore(response.data.riskScore);
      setJournalEntry('');
      setActionSuccess('🪷 White Lily planted - Calm entry logged!');
      await fetchStatus();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert('Failed to plant white lily');
    } finally {
      setLoading(false);
    }
  };

  const handlePlantRedRose = async () => {
    setLoading(true);
    try {
      // Trigger SOS alert
      await axios.post(`http://localhost:5000/api/safety/sos/${userId}`);
      setSosTriggered(true);
      setActionSuccess('🌹 RED ROSE PLANTED - SOS SIGNAL SENT!');
      await fetchStatus();
      // Flash effect for 5 seconds
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      alert('Failed to plant red rose');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = () => {
    if (sosTriggered) return 'text-red-500 bg-red-900/40';
    switch (riskLevel) {
      case 'GREEN':
        return 'text-green-400 bg-green-900/20';
      case 'YELLOW':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'RED':
        return 'text-red-400 bg-red-900/20';
      case 'BLACK':
        return 'text-red-600 bg-red-950/40';
      default:
        return 'text-green-400 bg-green-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">🌿 Secret Garden</h1>
          <button
            onClick={() => {
              localStorage.removeItem('mycelium_device_id');
              localStorage.removeItem('mycelium_role');
              localStorage.removeItem('mycelium_username');
              navigate('/');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            <LogOut size={18} />
            Lock & Exit
          </button>
        </div>

        {/* ===== CURRENT FLOWER STATUS (TOP SECTION) ===== */}
        <div className={`rounded-xl p-12 mb-8 border-2 ${getRiskColor()} text-center transition-all ${sosTriggered ? 'animate-pulse' : ''}`}>
          <div className="text-7xl mb-4">{getCurrentFlower()}</div>
          <h2 className="text-4xl font-bold mb-2 uppercase">{getFlowerMessage()}</h2>
          <p className="text-gray-300 text-lg">Silent for {timeSilent} minutes</p>
          {actionSuccess && (
            <p className={`text-xl font-bold mt-4 ${sosTriggered ? 'text-red-400 animate-bounce' : 'text-green-400'}`}>
              ✓ {actionSuccess}
            </p>
          )}
        </div>

        {/* Critical Alerts */}
        {timeSilent > 720 && (
          <div className="bg-red-950/40 border-l-4 border-red-600 p-4 mb-8 rounded flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold">⚠️ CRITICAL: Silent for 12+ hours</p>
              <p className="text-sm text-gray-300">Guardian alert will be triggered soon</p>
            </div>
          </div>
        )}

        {timeSilent > 360 && timeSilent <= 720 && (
          <div className="bg-yellow-950/40 border-l-4 border-yellow-600 p-4 mb-8 rounded flex gap-3">
            <AlertCircle className="text-yellow-500 flex-shrink-0" />
            <p className="text-yellow-200">⚠️ WARNING: Silent for 6+ hours</p>
          </div>
        )}

        {/* ===== TEND YOUR GARDEN (ACTION SECTION) ===== */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Tend Your Garden</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Option A: Water Fern */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-700/50 transition">
              <div className="text-5xl mb-3 text-center">🌿</div>
              <h3 className="text-xl font-bold mb-2 text-center">Water Fern</h3>
              <p className="text-gray-400 text-sm text-center mb-4">Reset timer. Show you're safe.</p>
              <button
                onClick={handleWaterFern}
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-bold transition"
              >
                {loading ? 'Watering...' : 'Check-In'}
              </button>
              {lastCheckin && (
                <p className="text-green-400 text-xs mt-3 text-center">✓ Just now</p>
              )}
            </div>

            {/* Option B: Plant White Lily */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-700/50 transition">
              <div className="text-5xl mb-3 text-center">🪷</div>
              <h3 className="text-xl font-bold mb-2 text-center">Plant White Lily</h3>
              <p className="text-gray-400 text-sm text-center mb-4">Log a calm/safe entry.</p>
              <div className="mb-3">
                <textarea
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  placeholder="Write a calm entry..."
                  rows="3"
                  disabled={loading}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
              <button
                onClick={handlePlantWhiteLily}
                disabled={loading || !journalEntry.trim()}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-bold transition"
              >
                {loading ? 'Planting...' : 'Plant Lily'}
              </button>
            </div>

            {/* Option C: Plant Red Rose (SOS) */}
            <div className="bg-slate-800/50 border border-red-700/50 rounded-xl p-6 hover:bg-red-900/30 transition">
              <div className="text-5xl mb-3 text-center animate-pulse">🌹</div>
              <h3 className="text-xl font-bold mb-2 text-center text-red-400">Plant Red Rose</h3>
              <p className="text-red-300 text-sm text-center mb-4 font-semibold">EMERGENCY SOS SIGNAL</p>
              <button
                onClick={handlePlantRedRose}
                disabled={loading}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg font-bold transition text-white border border-red-500"
              >
                {loading ? 'Sending SOS...' : 'Plant Rose (SOS)'}
              </button>
              <p className="text-red-300 text-xs mt-3 text-center">Alerts guardian immediately</p>
            </div>
          </div>
        </div>

        {/* Risk Score Display */}
        {riskScore > 0 && (
          <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-4 mb-8">
            <p className="font-bold text-lg">Risk Assessment: {riskScore}/10</p>
            <p className="text-orange-200 text-sm mt-1">Based on journal analysis. Higher scores = Higher risk.</p>
          </div>
        )}

        {/* Evidence Vault */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Upload size={24} /> Evidence Vault
          </h3>
          <div className="space-y-2 text-gray-400 text-sm">
            <p>📸 All captured evidence is encrypted</p>
            <p>📄 Backup location: Hidden partition</p>
            <p>📝 Access: PIN-protected only</p>
          </div>
          <p className="text-xs text-gray-500 mt-4 italic">
            Evidence is steganographically hidden within innocent-looking garden photos.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-xs">
          Mycelium Secret Garden © 2026 | Private & Secure
        </div>
      </div>
    </div>
  );
};

export default SecretDashboard;
