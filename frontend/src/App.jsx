import { useState, useEffect } from 'react';
import StreamGrid from './components/StreamGrid';
import StreamSelector from './components/StreamSelector';
import GridLayoutSelector from './components/GridLayoutSelector';
import { useStreamStore } from './store/streamStore';
import { fetchLiveStreams } from './api/streams';
import { Layout, Radio } from 'lucide-react';
import './App.css';

function App() {
  const {
    selectedStreams,
    gridLayout,
    activeAudioIndex,
    setGridLayout,
    availableStreams,
    setAvailableStreams
  } = useStreamStore();

  const [showStreamSelector, setShowStreamSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch available streams on mount
  useEffect(() => {
    const loadStreams = async () => {
      try {
        setLoading(true);
        const streams = await fetchLiveStreams();
        setAvailableStreams(streams);
      } catch (error) {
        console.error('Failed to load streams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStreams();

    // Refresh every 2 minutes
    const interval = setInterval(loadStreams, 120000);
    return () => clearInterval(interval);
  }, [setAvailableStreams]);

  const getGridDimensions = () => {
    const [rows, cols] = gridLayout.split('x').map(Number);
    return { rows, cols, total: rows * cols };
  };

  const dimensions = getGridDimensions();

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <Radio className="logo-icon" size={32} />
            <h1>Live Protest Viewer</h1>
          </div>

          <div className="header-right">
            <div className="stream-count">
              {selectedStreams.filter(s => s).length} / {dimensions.total} streams
            </div>

            <button
              className="btn-primary"
              onClick={() => setShowStreamSelector(true)}
              disabled={loading}
            >
              <Layout size={18} />
              Select Streams
            </button>
          </div>
        </div>

        {/* Grid Layout Selector */}
        <GridLayoutSelector
          currentLayout={gridLayout}
          onLayoutChange={setGridLayout}
        />
      </header>

      {/* Main Content */}
      <main className="app-main">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading live streams...</p>
          </div>
        ) : selectedStreams.filter(s => s).length === 0 ? (
          <div className="empty-state">
            <Layout size={64} />
            <h2>No Streams Selected</h2>
            <p>Click "Select Streams" to add live broadcasts to your grid</p>
            <button
              className="btn-primary"
              onClick={() => setShowStreamSelector(true)}
            >
              Select Streams
            </button>
          </div>
        ) : (
          <StreamGrid />
        )}
      </main>

      {/* Stream Selector Modal */}
      {showStreamSelector && (
        <StreamSelector
          onClose={() => setShowStreamSelector(false)}
          maxStreams={dimensions.total}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="audio-indicator">
            {activeAudioIndex !== null ? (
              <>
                <div className="audio-pulse"></div>
                <span>Audio: Stream {activeAudioIndex + 1}</span>
              </>
            ) : (
              <span>No audio selected</span>
            )}
          </div>

          <div className="footer-info">
            <span>{availableStreams.length} live streams available</span>
            <span className="separator">•</span>
            <span>Click any stream to enable audio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
