const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        minimize: false,
      };
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        stream: require.resolve("stream-browserify"),
        process: require.resolve("process/browser"),
      };
      return webpackConfig;
    },
  },
};
