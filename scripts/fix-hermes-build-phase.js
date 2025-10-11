#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

async function main() {
  const projectPath = path.join(
    __dirname,
    "..",
    "ios",
    "Pods",
    "Pods.xcodeproj",
    "project.pbxproj",
  );

  console.log("🔧 Fixing Hermes build phase configuration...");

  try {
    let projectContent = fs.readFileSync(projectPath, "utf8");

    // Check if already fixed
    if (
      projectContent.includes("outputPaths = (") &&
      projectContent.includes("hermes-engine/destroot")
    ) {
      console.log("⚠️  Hermes build phase already has output paths configured");
      return;
    }

    // Find the specific Hermes script phase by ID and add outputPaths
    const hermesPattern =
      /(46EB2E[0-9A-F]{8} \/\* \[CP-User\] \[Hermes\] Replace Hermes for the right configuration, if needed \*\/ = \{[\s\S]*?name = "\[CP-User\] \[Hermes\] Replace Hermes for the right configuration, if needed";)([\s\S]*?)(runOnlyForDeploymentPostprocessing = 0;)/;

    const replacement = projectContent.replace(hermesPattern, (match, p1, p2, p3) => {
      // Only add outputPaths if it's not already there
      if (p2.includes("outputPaths")) {
        return match; // Already has outputPaths
      }

      return `${p1}
			outputPaths = (
				"\${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/hermes.xcframework",
				"\${PODS_ROOT}/hermes-engine/destroot/bin",
			);${p2}${p3}`;
    });

    if (replacement !== projectContent) {
      fs.writeFileSync(projectPath, replacement);
      console.log("✅ Successfully added output paths to Hermes build phase");
    } else {
      console.log("⚠️  Hermes build phase not found or already configured");
    }
  } catch (error) {
    console.error("❌ Error fixing Hermes build phase:", error.message);
  }
}

main();
