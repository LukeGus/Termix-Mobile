const { withInfoPlist } = require("@expo/config-plugins");

const withIOSNetworkConfig = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: true,
      NSAllowsLocalNetworking: true,
      NSAllowsArbitraryLoadsInWebContent: true,
    };
    
    return config;
  });
};

module.exports = withIOSNetworkConfig;

