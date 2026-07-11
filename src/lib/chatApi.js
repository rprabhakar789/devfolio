import axios from 'axios';

const DEFAULT_CHAT_API_BASE_URL =
  'https://portfolio-backend-ca-214629.victoriousground-7c18e3f7.eastus.azurecontainerapps.io';
const CHAT_API_PREFIX = '/api/chat';

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '');
}

const chatApi = axios.create({
  baseURL: import.meta.env.DEV
    ? ''
    : normalizeBaseUrl(import.meta.env.VITE_CHAT_API_BASE_URL || DEFAULT_CHAT_API_BASE_URL),
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function sendChatMessage({ message, sessionId }) {
  const { data } = await chatApi.post(`${CHAT_API_PREFIX}/message`, {
    message,
    sessionId
  });

  return data;
}
