// Polyfill for React Native's WebSocket on web
// Just use the browser's native WebSocket
module.exports = typeof WebSocket !== 'undefined' ? WebSocket : class {};
