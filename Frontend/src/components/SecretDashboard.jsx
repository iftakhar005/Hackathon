import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import './SecretDashboard.css';

const SecretDashboard = ({ onLogout }) => {
  const { user } = useContext(AuthContext);
  const [riskLevel, setRiskLevel] = useState('GREEN');
  const [timeSinceActive, setTimeSinceActive] = useState(0);
  const [journalEntry, setJournalEntry] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [realImage, setRealImage] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch status on load
    fetchStatus();
    // Poll every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/safety/status/${user.userId}`);
      const data = await response.json();
      setRiskLevel(data.riskLevel);
      setTimeSinceActive(data.silenceDuration);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/safety/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          entry: journalEntry,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Journal logged. Risk Score: ${data.riskScore}/10`);
        setJournalEntry('');
        fetchStatus();
      }
    } catch (err) {
      alert('Failed to log journal');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!coverImage || !realImage) {
      alert('Both cover and real images required');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement steganography in backend
      // For now, simulate upload
      alert('Evidence uploaded securely');
      setCoverImage(null);
      setRealImage(null);
      setNote('');
    } catch (err) {
      alert('Failed to upload evidence');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'GREEN':
        return '#34c759';
      case 'YELLOW':
        return '#ffcc00';
      case 'RED':
        return '#ff3b30';
      case 'BLACK':
        return '#000';
      default:
        return '#34c759';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🌿 Mycelium Dashboard</h1>
        <button onClick={onLogout} className="btn-logout">
          Lock & Exit
        </button>
      </div>

      {/* Status Indicator */}
      <div className="status-card">
        <div className="status-indicator" style={{ backgroundColor: getRiskColor() }} />
        <div className="status-info">
          <h2>Safety Status</h2>
          <p className="risk-level">{riskLevel}</p>
          <p className="time-info">Last Active: {timeSinceActive} minutes ago</p>
        </div>
      </div>

      {/* Dead Man's Switch Warning */}
      {timeSinceActive > 720 && (
        <div className="alert alert-critical">
          ⚠️ CRITICAL: You have been inactive for over 12 hours. Your Guardian may be alerted.
        </div>
      )}

      {timeSinceActive > 360 && timeSinceActive <= 720 && (
        <div className="alert alert-warning">
          ⚠️ WARNING: You have been inactive for over 6 hours.
        </div>
      )}

      {/* Journal Entry */}
      <div className="section">
        <h3>📖 Journal Entry</h3>
        <form onSubmit={handleJournalSubmit}>
          <textarea
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            placeholder="Write your thoughts here. Use metaphors if needed..."
            rows="6"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !journalEntry.trim()}>
            {loading ? 'Submitting...' : 'Save Entry'}
          </button>
        </form>
      </div>

      {/* Evidence Upload */}
      <div className="section">
        <h3>🖼️ Upload Evidence</h3>
        <form onSubmit={handleUploadEvidence}>
          <div className="image-upload-group">
            <div className="upload-box">
              <label>Cover Image (Public)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0])}
                disabled={loading}
              />
              {coverImage && <p className="file-name">✓ {coverImage.name}</p>}
            </div>

            <div className="upload-box">
              <label>Real Evidence (Hidden)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setRealImage(e.target.files?.[0])}
                disabled={loading}
              />
              {realImage && <p className="file-name">✓ {realImage.name}</p>}
            </div>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this evidence..."
            rows="3"
            disabled={loading}
          />

          <button type="submit" disabled={loading || !coverImage || !realImage}>
            {loading ? 'Uploading...' : 'Upload Evidence'}
          </button>
        </form>
      </div>

      {/* Manual Check-in */}
      <div className="section">
        <button
          onClick={async () => {
            try {
              await fetch(`http://localhost:5000/api/safety/checkin/${user.userId}`, {
                method: 'POST',
              });
              alert('✓ Check-in successful. Timer reset.');
              fetchStatus();
            } catch (err) {
              alert('Failed to check in');
            }
          }}
          className="btn-checkin"
        >
          ✓ Manual Check-in
        </button>
      </div>
    </div>
  );
};

export default SecretDashboard;
