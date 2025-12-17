// Polyfill for React Native's WebSocketInterceptor on web
// No-op for web since we use browser's native WebSocket
module.exports = {
  setInterceptor: () => {},
  isInterceptorEnabled: () => false,
};
