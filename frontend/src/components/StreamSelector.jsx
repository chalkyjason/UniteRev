import { useState, useMemo } from 'react';
import { useStreamStore } from '../store/streamStore';
import { X, Search, Users, Filter } from 'lucide-react';
import './StreamSelector.css';

const StreamSelector = ({ onClose, maxStreams }) => {
  const {
    availableStreams,
    selectedStreams,
    addStream,
    removeStream
  } = useStreamStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortBy, setSortBy] = useState('viewers');

  // Filter and sort streams
  const filteredStreams = useMemo(() => {
    let streams = [...availableStreams];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      streams = streams.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.channel_name.toLowerCase().includes(query) ||
          s.matched_keywords?.some((k) => k.toLowerCase().includes(query))
      );
    }

    // Platform filter
    if (platformFilter !== 'all') {
      streams = streams.filter((s) => s.platform === platformFilter);
    }

    // Sort
    streams.sort((a, b) => {
      switch (sortBy) {
        case 'viewers':
          return b.viewer_count - a.viewer_count;
        case 'recent':
          return new Date(b.started_at) - new Date(a.started_at);
        case 'name':
          return a.channel_name.localeCompare(b.channel_name);
        default:
          return 0;
      }
    });

    return streams;
  }, [availableStreams, searchQuery, platformFilter, sortBy]);

  const isStreamSelected = (streamId) => {
    return selectedStreams.some((s) => s?.id === streamId);
  };

  const handleToggleStream = (stream) => {
    if (isStreamSelected(stream.id)) {
      const index = selectedStreams.findIndex((s) => s?.id === stream.id);
      removeStream(index);
    } else {
      // Find first empty slot
      const emptyIndex = selectedStreams.findIndex((s) => s === null);
      if (emptyIndex !== -1) {
        addStream(stream, emptyIndex);
      } else if (selectedStreams.length < maxStreams) {
        addStream(stream, selectedStreams.length);
      }
    }
  };

  const selectedCount = selectedStreams.filter((s) => s).length;
  const platforms = ['all', ...new Set(availableStreams.map((s) => s.platform))];

  const formatViewerCount = (count) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  const getPlatformColor = (platform) => {
    const colors = {
      youtube: '#FF0000',
      twitch: '#9146FF',
      rumble: '#85C742',
      x: '#1DA1F2'
    };
    return colors[platform] || '#6B7280';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Select Streams</h2>
            <p className="modal-subtitle">
              {selectedCount} of {maxStreams} slots filled
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="modal-filters">
          {/* Search */}
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search streams, channels, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Platform Filter */}
          <div className="filter-group">
            <Filter size={18} />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform === 'all' ? 'All Platforms' : platform.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="viewers">Most Viewers</option>
              <option value="recent">Recently Started</option>
              <option value="name">Channel Name</option>
            </select>
          </div>
        </div>

        {/* Stream List */}
        <div className="stream-list">
          {filteredStreams.length === 0 ? (
            <div className="empty-results">
              <p>No streams found</p>
            </div>
          ) : (
            filteredStreams.map((stream) => {
              const selected = isStreamSelected(stream.id);
              const canSelect = selectedCount < maxStreams || selected;

              return (
                <div
                  key={stream.id}
                  className={`stream-item ${selected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
                  onClick={() => canSelect && handleToggleStream(stream)}
                >
                  {/* Thumbnail */}
                  <div className="stream-thumbnail">
                    <img src={stream.thumbnail_url} alt={stream.title} />
                    <div className="live-badge-small">
                      <span className="live-dot"></span>
                      LIVE
                    </div>
                  </div>

                  {/* Info */}
                  <div className="stream-item-info">
                    <div className="stream-item-header">
                      <span
                        className="platform-badge-small"
                        style={{ backgroundColor: getPlatformColor(stream.platform) }}
                      >
                        {stream.platform}
                      </span>
                      <div className="viewer-count-small">
                        <Users size={14} />
                        {formatViewerCount(stream.viewer_count)}
                      </div>
                    </div>

                    <h3 className="stream-item-title">{stream.title}</h3>
                    <p className="stream-item-channel">{stream.channel_name}</p>

                    {stream.matched_keywords && stream.matched_keywords.length > 0 && (
                      <div className="stream-keywords">
                        {stream.matched_keywords.slice(0, 3).map((keyword, i) => (
                          <span key={i} className="keyword-tag">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Checkbox */}
                  <div className="stream-checkbox">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!canSelect}
                      onChange={() => {}}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onClose}>
            Done ({selectedCount} selected)
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreamSelector;
