#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Build script for pachislo-graphic project
 * - Bundles TypeScript files using deno bundle
 * - Generates video-list.json from images directory
 *
 * Usage:
 *   deno task build           # Build for GitHub Pages deployment
 */

async function runCommand(command: string, args: string[]): Promise<boolean> {
  console.log(`🔧 Running: ${command} ${args.join(" ")}`);

  const process = new Deno.Command(command, {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await process.output();

  if (stdout.length > 0) {
    console.log(new TextDecoder().decode(stdout));
  }

  if (stderr.length > 0) {
    const stderrText = new TextDecoder().decode(stderr);
    if (success) {
      console.log(stderrText); // Some tools output info to stderr
    } else {
      console.error(stderrText);
    }
  }

  return success;
}

async function bundleTypeScript(): Promise<boolean> {
  console.log("\n📦 Bundling TypeScript files...");

  const success = await runCommand("deno", [
    "bundle",
    "src/pachislo.ts",
    "-o",
    "pachislo.js",
  ]);

  if (success) {
    console.log("✅ TypeScript bundling completed successfully");
  } else {
    console.error("❌ TypeScript bundling failed");
    console.error(
      "   Note: If pachislo.js already exists and is working, this may not be critical",
    );
  }

  return success;
}

async function generateVideoList(): Promise<boolean> {
  console.log("\n🎬 Generating video list...");

  const success = await runCommand("deno", [
    "run",
    "--allow-read",
    "--allow-write",
    "scripts/generate-video-list.ts",
  ]);

  if (success) {
    console.log("✅ Video list generation completed successfully");
  } else {
    console.error("❌ Video list generation failed");
  }

  return success;
}

async function build(): Promise<void> {
  console.log("🚀 Starting build process for GitHub Pages deployment...");

  let bundleSuccess = true;
  let videoSuccess = true;

  // Step 1: Bundle TypeScript
  bundleSuccess = await bundleTypeScript();

  // Step 2: Generate video list
  videoSuccess = await generateVideoList();

  // Summary
  console.log("\n" + "=".repeat(50));
  if (bundleSuccess && videoSuccess) {
    console.log("🎉 Build completed successfully!");
    console.log("\n📁 Files ready for deployment:");
    console.log("  - pachislo.js (TypeScript bundle)");
    console.log("  - video-list.json (video file listing)");
    console.log("  - index.html (main game page)");
    console.log("  - images/ (video assets)");
    console.log("\n🚀 Ready for GitHub Pages deployment!");
  } else if (!videoSuccess) {
    console.log("💥 Build failed!");
    console.log(
      "\nVideo list generation failed. Please check the errors above and try again.",
    );
    Deno.exit(1);
  } else {
    console.log("⚠️ Build completed with warnings!");
    console.log(
      "\nTypeScript bundling had issues, but video list was generated successfully.",
    );
    console.log(
      "If pachislo.js exists and works, you can proceed with deployment.",
    );
  }
}

// Run the build process
if (import.meta.main) {
  await build();
}
