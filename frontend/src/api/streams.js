import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch live streams
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} List of live streams
 */
export const fetchLiveStreams = async (params = {}) => {
  try {
    const response = await api.get('/feed/live', { params });

    // Transform API response to match frontend format
    return response.data.streams.map(stream => ({
      id: stream.internal_id,
      platform: stream.platform,
      platform_stream_id: stream.platform_stream_id,
      title: stream.stream_metadata.title,
      description: stream.stream_metadata.description,
      thumbnail_url: stream.stream_metadata.thumbnail_url,
      embed_url: stream.stream_metadata.embed_url,
      viewer_count: stream.stream_metadata.viewer_count,
      started_at: stream.stream_metadata.started_at,
      channel_name: stream.channel_details.name,
      channel_id: stream.channel_details.id,
      channel_url: stream.channel_details.url,
      channel_avatar: stream.channel_details.avatar_url,
      trust_score: stream.channel_details.trust_score,
      matched_keywords: stream.search_context?.matched_keywords || [],
      status: stream.status
    }));
  } catch (error) {
    console.error('Error fetching live streams:', error);

    // Return mock data for development
    if (import.meta.env.DEV) {
      return getMockStreams();
    }

    throw error;
  }
};

/**
 * Fetch recently ended streams
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} List of recent streams
 */
export const fetchRecentStreams = async (params = {}) => {
  try {
    const response = await api.get('/feed/recent', { params });
    return response.data.streams;
  } catch (error) {
    console.error('Error fetching recent streams:', error);
    throw error;
  }
};

/**
 * Search channels
 * @param {string} query - Search query
 * @returns {Promise<Array>} List of channels
 */
export const searchChannels = async (query) => {
  try {
    const response = await api.get('/channels/search', {
      params: { q: query }
    });
    return response.data.channels;
  } catch (error) {
    console.error('Error searching channels:', error);
    throw error;
  }
};

/**
 * Submit a stream URL
 * @param {string} url - Stream URL
 * @returns {Promise<Object>} Submission response
 */
export const submitStream = async (url) => {
  try {
    const response = await api.post('/submit', { url });
    return response.data;
  } catch (error) {
    console.error('Error submitting stream:', error);
    throw error;
  }
};

// Mock data for development
const getMockStreams = () => [
  {
    id: '1',
    platform: 'youtube',
    platform_stream_id: 'dQw4w9WgXcQ',
    title: 'Live Protest Coverage - Downtown Seattle',
    description: 'Live coverage of ongoing demonstration',
    thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    embed_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    viewer_count: 1543,
    started_at: new Date().toISOString(),
    channel_name: 'Local News Network',
    channel_id: 'UC123',
    channel_url: 'https://youtube.com/channel/UC123',
    channel_avatar: null,
    trust_score: 0.85,
    matched_keywords: ['protest', 'seattle'],
    status: 'LIVE'
  },
  {
    id: '2',
    platform: 'twitch',
    platform_stream_id: 'twitch123',
    title: 'March for Justice - Live Updates',
    description: 'On-the-ground coverage',
    thumbnail_url: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_test-640x360.jpg',
    embed_url: 'https://www.twitch.tv/test',
    viewer_count: 842,
    started_at: new Date().toISOString(),
    channel_name: 'CitizenJournalist',
    channel_id: 'twitch123',
    channel_url: 'https://twitch.tv/citizenjournalist',
    channel_avatar: null,
    trust_score: 0.65,
    matched_keywords: ['march', 'justice'],
    status: 'LIVE'
  },
  {
    id: '3',
    platform: 'youtube',
    platform_stream_id: 'abc123xyz',
    title: 'Breaking: Rally at City Hall',
    description: 'Peaceful demonstration',
    thumbnail_url: 'https://i.ytimg.com/vi/abc123xyz/hqdefault.jpg',
    embed_url: 'https://www.youtube.com/watch?v=abc123xyz',
    viewer_count: 2341,
    started_at: new Date().toISOString(),
    channel_name: 'Independent Media',
    channel_id: 'UC456',
    channel_url: 'https://youtube.com/channel/UC456',
    channel_avatar: null,
    trust_score: 0.72,
    matched_keywords: ['rally', 'breaking'],
    status: 'LIVE'
  },
  {
    id: '4',
    platform: 'twitch',
    platform_stream_id: 'twitch456',
    title: 'Activism Stream - Community Organizing',
    description: 'Live activism coverage',
    thumbnail_url: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_test2-640x360.jpg',
    embed_url: 'https://www.twitch.tv/test2',
    viewer_count: 456,
    started_at: new Date().toISOString(),
    channel_name: 'ActivistNetwork',
    channel_id: 'twitch456',
    channel_url: 'https://twitch.tv/activistnetwork',
    channel_avatar: null,
    trust_score: 0.58,
    matched_keywords: ['activism', 'organizing'],
    status: 'LIVE'
  }
];

export default api;
