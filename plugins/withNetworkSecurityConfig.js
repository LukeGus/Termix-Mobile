const { withDangerousMod, withAndroidManifest } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const networkSecurityConfigContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext traffic for all domains (for local development and IP addresses) -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <!-- Specifically allow local network addresses -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>`;

const withNetworkSecurityConfig = (config) => {
  // Add the network security config file
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const filePath = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "xml",
        "network_security_config.xml"
      );

      // Create xml directory if it doesn't exist
      const xmlDir = path.dirname(filePath);
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Write the network security config
      fs.writeFileSync(filePath, networkSecurityConfigContent);

      return config;
    },
  ]);

  // Update AndroidManifest to reference the network security config
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    
    return config;
  });

  return config;
};

module.exports = withNetworkSecurityConfig;

