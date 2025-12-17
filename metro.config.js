const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude web-only files from Metro bundler (for Android/iOS)
config.resolver.sourceExts = [...config.resolver.sourceExts];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add CSS to asset extensions so Metro doesn't try to parse it
config.resolver.assetExts = [...config.resolver.assetExts, 'css'];

module.exports = config;
