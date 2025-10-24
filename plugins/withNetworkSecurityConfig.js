const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo config plugin to ensure network security config is properly set up
 * This allows the app to trust user-installed CA certificates (for self-signed certs)
 */
const withNetworkSecurityConfig = (config) => {
  // Add network security config reference to AndroidManifest
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application[0];

    // Set network security config attribute
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return config;
  });

  // Ensure the network security config file exists in the correct location
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resXmlPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      // Create xml directory if it doesn't exist
      if (!fs.existsSync(resXmlPath)) {
        fs.mkdirSync(resXmlPath, { recursive: true });
      }

      const networkSecurityConfigPath = path.join(resXmlPath, 'network_security_config.xml');

      // Create network security config file with user certificate trust
      const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext traffic for all domains (for local development and IP addresses) -->
    <!-- Trust both system certificates AND user-installed certificates (for self-signed certs) -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <!-- System certificates (built-in CAs) -->
            <certificates src="system" />
            <!-- User-installed certificates (for self-signed/local CA certificates) -->
            <certificates src="user" />
        </trust-anchors>
    </base-config>

    <!-- Specifically allow local network addresses -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </domain-config>
</network-security-config>
`;

      // Write the network security config file
      fs.writeFileSync(networkSecurityConfigPath, networkSecurityConfig);

      return config;
    },
  ]);

  return config;
};

module.exports = withNetworkSecurityConfig;
