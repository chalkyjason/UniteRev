import { useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useStreamStore } from '../store/streamStore';
import { Volume2, VolumeX, ExternalLink, Users } from 'lucide-react';
import './StreamGrid.css';

const StreamGrid = () => {
  const {
    selectedStreams,
    gridLayout,
    activeAudioIndex,
    setActiveAudioIndex,
    removeStream
  } = useStreamStore();

  const playerRefs = useRef([]);

  const [rows, cols] = gridLayout.split('x').map(Number);

  // Mute all players except the active one
  useEffect(() => {
    playerRefs.current.forEach((ref, index) => {
      if (ref && ref.getInternalPlayer) {
        const player = ref.getInternalPlayer();
        if (player) {
          const shouldMute = activeAudioIndex !== index;

          // YouTube
          if (player.mute && player.unMute) {
            shouldMute ? player.mute() : player.unMute();
          }
          // HTML5 video
          else if (player.muted !== undefined) {
            player.muted = shouldMute;
          }
        }
      }
    });
  }, [activeAudioIndex]);

  const handleStreamClick = (index) => {
    if (selectedStreams[index]) {
      setActiveAudioIndex(index === activeAudioIndex ? null : index);
    }
  };

  const handleRemoveStream = (index, e) => {
    e.stopPropagation();
    removeStream(index);
    if (activeAudioIndex === index) {
      setActiveAudioIndex(null);
    }
  };

  const formatViewerCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
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
    <div
      className="stream-grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`
      }}
    >
      {Array.from({ length: rows * cols }).map((_, index) => {
        const stream = selectedStreams[index];
        const isActive = activeAudioIndex === index;

        return (
          <div
            key={index}
            className={`stream-cell ${stream ? 'has-stream' : 'empty'} ${isActive ? 'active-audio' : ''}`}
            onClick={() => handleStreamClick(index)}
            style={{
              borderColor: isActive ? '#EF4444' : 'transparent'
            }}
          >
            {stream ? (
              <>
                {/* Video Player */}
                <div className="player-wrapper">
                  <ReactPlayer
                    ref={(ref) => (playerRefs.current[index] = ref)}
                    url={stream.embed_url}
                    width="100%"
                    height="100%"
                    playing={true}
                    muted={activeAudioIndex !== index}
                    controls={false}
                    config={{
                      youtube: {
                        playerVars: {
                          autoplay: 1,
                          controls: 0,
                          modestbranding: 1,
                          rel: 0
                        }
                      },
                      twitch: {
                        options: {
                          width: '100%',
                          height: '100%'
                        }
                      }
                    }}
                  />
                </div>

                {/* Stream Overlay */}
                <div className="stream-overlay">
                  {/* Top Bar */}
                  <div className="stream-header">
                    <div className="stream-info">
                      <span
                        className="platform-badge"
                        style={{ backgroundColor: getPlatformColor(stream.platform) }}
                      >
                        {stream.platform}
                      </span>
                      <div className="live-badge">
                        <span className="live-dot"></span>
                        LIVE
                      </div>
                      <div className="viewer-count">
                        <Users size={14} />
                        {formatViewerCount(stream.viewer_count)}
                      </div>
                    </div>

                    <button
                      className="btn-remove"
                      onClick={(e) => handleRemoveStream(index, e)}
                      title="Remove stream"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Bottom Bar */}
                  <div className="stream-footer">
                    <div className="stream-details">
                      <div className="stream-title" title={stream.title}>
                        {stream.title}
                      </div>
                      <div className="stream-channel">
                        {stream.channel_name}
                      </div>
                    </div>

                    <div className="stream-actions">
                      <button
                        className="btn-audio"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStreamClick(index);
                        }}
                        title={isActive ? 'Mute' : 'Enable audio'}
                      >
                        {isActive ? (
                          <Volume2 size={20} className="audio-icon active" />
                        ) : (
                          <VolumeX size={20} className="audio-icon" />
                        )}
                      </button>

                      <a
                        href={stream.embed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-external"
                        onClick={(e) => e.stopPropagation()}
                        title="Open in new tab"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>

                  {/* Active Audio Indicator */}
                  {isActive && (
                    <div className="active-audio-border">
                      <div className="corner corner-tl"></div>
                      <div className="corner corner-tr"></div>
                      <div className="corner corner-bl"></div>
                      <div className="corner corner-br"></div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-cell">
                <div className="empty-cell-content">
                  <Layout size={32} />
                  <p>Slot {index + 1}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StreamGrid;
