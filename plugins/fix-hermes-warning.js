const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo Config Plugin: Fix Hermes Build Phase
 *
 * This plugin injects Ruby code into the Podfile's post_install block
 * to fix the Hermes build phase outputPaths issue that causes
 * "Command PhaseScriptExecution failed" errors in Xcode.
 *
 * The fix runs DURING pod install (at the right time), not before.
 */
const withFixHermesBuildPhase = config => {
  return withDangerousMod(config, [
    "ios",
    async config => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");

      if (!fs.existsSync(podfilePath)) {
        console.log("⚠️  Podfile not found, skipping Hermes fix");
        return config;
      }

      let podfileContent = fs.readFileSync(podfilePath, "utf8");

      // Check if fix is already applied
      if (podfileContent.includes("Fix Hermes build phase outputPaths")) {
        console.log("⚠️  Hermes fix already present in Podfile");
        return config;
      }

      // Ruby code to inject into post_install block
      const hermesFix = `
    # Fix Hermes build phase outputPaths (added by fix-hermes-warning plugin)
    installer.pods_project.targets.each do |target|
      target.build_phases.each do |phase|
        if phase.respond_to?(:name) && phase.name&.include?('[Hermes]')
          phase.output_paths ||= []
          unless phase.output_paths.include?('\${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/hermes.xcframework')
            phase.output_paths << '\${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/hermes.xcframework'
            phase.output_paths << '\${PODS_ROOT}/hermes-engine/destroot/bin'
          end
        end
      end
    end
    installer.pods_project.save`;

      // Find the closing ) of react_native_post_install and inject after it
      // The pattern looks for react_native_post_install( followed by its closing )
      const postInstallPattern = /(react_native_post_install\([\s\S]*?\n\s*\))/;

      if (postInstallPattern.test(podfileContent)) {
        podfileContent = podfileContent.replace(postInstallPattern, `$1\n${hermesFix}`);
        fs.writeFileSync(podfilePath, podfileContent);
        console.log("✅ Injected Hermes fix into Podfile post_install block");
      } else {
        console.log("⚠️  Could not find react_native_post_install in Podfile");
      }

      return config;
    },
  ]);
};

module.exports = withFixHermesBuildPhase;
