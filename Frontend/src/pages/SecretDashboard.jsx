import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, CheckCircle2, LogOut, Upload } from 'lucide-react';

const SecretDashboard = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const [riskLevel, setRiskLevel] = useState('GREEN');
  const [timeSilent, setTimeSilent] = useState(0);
  const [journalEntry, setJournalEntry] = useState('');
  const [riskScore, setRiskScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastCheckin, setLastCheckin] = useState(null);

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

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/safety/checkin/${userId}`);
      setLastCheckin(new Date());
      await fetchStatus();
      alert('✓ Check-in successful. Timer reset.');
    } catch (err) {
      alert('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleJournalSubmit = async () => {
    if (!journalEntry.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/safety/journal', {
        userId,
        entry: journalEntry,
      });
      setRiskScore(response.data.riskScore);
      setJournalEntry('');
      alert(`Journal logged. Risk Score: ${response.data.riskScore}/10`);
      await fetchStatus();
    } catch (err) {
      alert('Failed to log journal');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = () => {
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">🌿 Mycelium Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem('userId');
              localStorage.removeItem('riskLevel');
              navigate('/');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            <LogOut size={18} />
            Lock & Exit
          </button>
        </div>

        {/* Status Card */}
        <div className={`rounded-xl p-8 mb-8 border-2 ${getRiskColor()}`}>
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-full border-4 ${getRiskColor().split(' ')[0]} animate-pulse`} />
            <div>
              <h2 className="text-3xl font-bold uppercase">{riskLevel}</h2>
              <p className="text-gray-300">Last Active: {timeSilent} minutes ago</p>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {timeSilent > 720 && (
          <div className="bg-red-950/40 border-l-4 border-red-600 p-4 mb-8 rounded flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold">⚠️ CRITICAL: Silent for 12+ hours</p>
              <p className="text-sm text-gray-300">Guardian may be alerted soon</p>
            </div>
          </div>
        )}

        {timeSilent > 360 && timeSilent <= 720 && (
          <div className="bg-yellow-950/40 border-l-4 border-yellow-600 p-4 mb-8 rounded flex gap-3">
            <AlertCircle className="text-yellow-500 flex-shrink-0" />
            <p className="text-yellow-200">⚠️ WARNING: Silent for 6+ hours</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Journal Entry */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              📖 Journal Entry
            </h3>
            <textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="Write your thoughts here. Use metaphors if needed..."
              rows="6"
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleJournalSubmit}
              disabled={loading || !journalEntry.trim()}
              className="w-full mt-4 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold disabled:opacity-50 transition"
            >
              {loading ? 'Analyzing...' : 'Save Entry'}
            </button>
            {riskScore > 0 && (
              <div className="mt-4 p-3 bg-orange-900/30 border border-orange-600 rounded-lg">
                <p className="font-bold">Risk Score: {riskScore}/10</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Check-in */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-4">✓ Check-in</h3>
              <p className="text-gray-400 mb-4">Reset the Dead Man's Switch timer</p>
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg disabled:opacity-50 transition"
              >
                {loading ? 'Checking In...' : '💧 Water Plant'}
              </button>
              {lastCheckin && (
                <p className="text-green-400 text-sm mt-3 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Just now
                </p>
              )}
            </div>

            {/* Evidence Vault */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Upload size={24} /> Evidence Vault
              </h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <p>📸 Bruise_on_arm.jpg</p>
                <p>📄 Medical_report.pdf</p>
                <p>📝 Witness_statement.txt</p>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                All evidence is encrypted and hidden using steganography.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-xs">
          Mycelium © 2026 | Private & Secure
        </div>
      </div>
    </div>
  );
};

export default SecretDashboard;
