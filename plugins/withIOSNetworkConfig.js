const { withDangerousMod, IOSConfig } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withIOSNetworkConfig = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const infoPlistPath = path.join(
        projectRoot,
        "ios",
        config.modRequest.projectName || "Termix",
        "Info.plist"
      );

      if (fs.existsSync(infoPlistPath)) {
        let infoPlist = fs.readFileSync(infoPlistPath, "utf8");
        
        // Remove existing NSAppTransportSecurity if present
        infoPlist = infoPlist.replace(
          /<key>NSAppTransportSecurity<\/key>[\s\S]*?<\/dict>/,
          ""
        );
        
        // Add our NSAppTransportSecurity config right before closing </dict></plist>
        const atsConfig = `	<key>NSAppTransportSecurity</key>
	<dict>
		<key>NSAllowsArbitraryLoads</key>
		<true/>
		<key>NSAllowsLocalNetworking</key>
		<true/>
		<key>NSAllowsArbitraryLoadsInWebContent</key>
		<true/>
		<key>NSAllowsArbitraryLoadsForMedia</key>
		<true/>
	</dict>
`;
        
        infoPlist = infoPlist.replace("</dict>\n</plist>", atsConfig + "</dict>\n</plist>");
        
        fs.writeFileSync(infoPlistPath, infoPlist);
      }

      return config;
    },
  ]);
};

module.exports = withIOSNetworkConfig;

