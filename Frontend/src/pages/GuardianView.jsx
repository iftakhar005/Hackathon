import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Shield } from 'lucide-react';

const GuardianView = () => {
  // DEMO: Hardcode the user ID here (replace with your actual MongoDB user ID)
  const DEMO_USER_ID = '67801234567890abcdef1234'; // Replace this with real user ID

  const [riskLevel, setRiskLevel] = useState('GREEN');
  const [timeSilent, setTimeSilent] = useState(0);
  const [lastActive, setLastActive] = useState(null);
  const [alertSent, setAlertSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/safety/status/${DEMO_USER_ID}`
      );
      setRiskLevel(response.data.riskLevel);
      setTimeSilent(response.data.silenceDuration);
      setLastActive(response.data.lastActiveAt);
      setAlertSent(response.data.alertSentToGuardian);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (riskLevel) {
      case 'GREEN':
        return <CheckCircle2 className="w-20 h-20 text-green-400" />;
      case 'YELLOW':
        return <AlertCircle className="w-20 h-20 text-yellow-400" />;
      case 'RED':
      case 'BLACK':
        return <AlertCircle className="w-20 h-20 text-red-600 animate-pulse" />;
      default:
        return <Shield className="w-20 h-20 text-green-400" />;
    }
  };

  const getStatusText = () => {
    if (riskLevel === 'BLACK') {
      return '🚨 CRITICAL SILENCE DETECTED 🚨';
    }
    if (riskLevel === 'RED') {
      return '⚠️ HIGH RISK - IMMEDIATE ACTION NEEDED';
    }
    if (riskLevel === 'YELLOW') {
      return '⚡ ELEVATED RISK - MONITOR CLOSELY';
    }
    return '✅ SAFE - All is Well';
  };

  const getBackgroundColor = () => {
    switch (riskLevel) {
      case 'GREEN':
        return 'from-green-900 to-green-700';
      case 'YELLOW':
        return 'from-yellow-900 to-yellow-700';
      case 'RED':
      case 'BLACK':
        return 'from-red-950 to-red-900';
      default:
        return 'from-green-900 to-green-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
        <p className="text-white text-2xl">Loading guardian status...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundColor()} flex items-center justify-center p-4`}>
      <div className="max-w-2xl w-full">
        {/* Main Status Card */}
        <div className="bg-black/40 backdrop-blur-xl border-2 border-white/10 rounded-3xl p-12 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            {getStatusIcon()}
          </div>

          {/* Status Text */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {getStatusText()}
          </h1>

          {/* Time Info */}
          <div className="text-xl text-gray-300 mb-8">
            <p>Silent for: <span className="font-bold text-2xl">{timeSilent} minutes</span></p>
            {lastActive && (
              <p className="text-sm mt-2">
                Last active: {new Date(lastActive).toLocaleString()}
              </p>
            )}
          </div>

          {/* Alert Status */}
          {riskLevel === 'BLACK' && alertSent && (
            <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-6 mb-8">
              <p className="text-red-200 font-bold">
                ✓ Guardian alert sent to emergency contacts
              </p>
              <p className="text-red-300 text-sm mt-2">
                Police have been notified of prolonged silence
              </p>
            </div>
          )}

          {riskLevel === 'RED' && (
            <div className="bg-yellow-900/50 border-2 border-yellow-500 rounded-lg p-6 mb-8">
              <p className="text-yellow-200 font-bold">
                ⚠️ Subject at HIGH RISK
              </p>
              <p className="text-yellow-300 text-sm mt-2">
                Immediate intervention may be required
              </p>
            </div>
          )}

          {riskLevel === 'GREEN' && (
            <div className="bg-green-900/50 border-2 border-green-500 rounded-lg p-6 mb-8">
              <p className="text-green-200 font-bold">
                ✓ All systems nominal
              </p>
              <p className="text-green-300 text-sm mt-2">
                Subject is actively checking in
              </p>
            </div>
          )}

          {/* Risk Scale */}
          <div className="mt-10 pt-8 border-t border-white/10">
            <h3 className="text-white font-bold mb-4">Risk Level Scale</h3>
            <div className="space-y-2 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span className="text-gray-300">GREEN: Active & Safe</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                <span className="text-gray-300">YELLOW: 6+ hours silent</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500 rounded"></div>
                <span className="text-gray-300">RED: 12+ hours silent</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-700 rounded animate-pulse"></div>
                <span className="text-gray-300">BLACK: 24+ hours (CRITICAL)</span>
              </div>
            </div>
          </div>

          {/* Auto-refresh indicator */}
          <div className="mt-10 text-gray-500 text-sm">
            Auto-refreshing every 5 seconds...
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardianView;
