const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withFixHermesWarning = config => {
  return withDangerousMod(config, [
    "ios",
    async config => {
      const projectPath = path.join(
        config.modRequest.platformProjectRoot,
        "Pods",
        "Pods.xcodeproj",
        "project.pbxproj",
      );

      if (fs.existsSync(projectPath)) {
        let projectContent = fs.readFileSync(projectPath, "utf8");

        // Check if already fixed
        if (projectContent.includes("outputPaths = (")) {
          console.log("⚠️  Hermes build phase already has output paths configured");
          return config;
        }

        // Find and fix Hermes script phase
        const hermesPattern =
          /(\[CP-User\] \[Hermes\] Replace Hermes for the right configuration, if needed.*?name = "\[CP-User\] \[Hermes\] Replace Hermes for the right configuration, if needed";)(.*?)(shellScript = "[^"]*";)/s;

        const replacement = projectContent.replace(hermesPattern, (match, p1, p2, p3) => {
          return `${p1}
			outputPaths = (
				"$\{PODS_ROOT\}/hermes-engine/destroot/Library/Frameworks/hermes.xcframework",
				"$\{PODS_ROOT\}/hermes-engine/destroot/bin",
			);${p2}${p3}`;
        });

        if (replacement !== projectContent) {
          fs.writeFileSync(projectPath, replacement);
          console.log("✅ Fixed Hermes build phase warning via Expo plugin");
        }
      }

      return config;
    },
  ]);
};

module.exports = withFixHermesWarning;
