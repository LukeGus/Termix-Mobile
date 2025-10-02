const { withInfoPlist } = require("@expo/config-plugins");

const withIOSNetworkConfig = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: true,
      NSAllowsLocalNetworking: true,
      NSAllowsArbitraryLoadsInWebContent: true,
      NSAllowsArbitraryLoadsForMedia: true,
    };
    
    config.modResults.NSAppTransportSecurity.NSExceptionDomains = config.modResults.NSAppTransportSecurity.NSExceptionDomains || {};
    
    return config;
  });
};

module.exports = withIOSNetworkConfig;

