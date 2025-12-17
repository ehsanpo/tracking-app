const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Completely exclude react-native internal modules that don't work on web
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    'react-native-web$': 'react-native-web',
  };

  // Add CSS loader for Leaflet
  config.module.rules.push({
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
  });

  // Use NormalModuleReplacementPlugin to redirect all react-native internal imports
  const webpack = require('webpack');
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /react-native\/Libraries\/.*/,
      (resource) => {
        // Redirect to react-native-web equivalents or empty modules
        if (resource.request.includes('WebSocket')) {
          resource.request = 'react-native-web/dist/modules/UnimplementedView';
        } else if (resource.request.includes('Platform')) {
          resource.request = 'react-native-web/dist/exports/Platform';
        } else {
          // For other internal modules, use a no-op
          resource.request = 'react-native-web/dist/modules/UnimplementedView';
        }
      }
    )
  );

  return config;
};
