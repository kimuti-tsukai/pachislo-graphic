#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Generate video-list.json by scanning the images directory for video files
 */

interface VideoList {
  [folderName: string]: string[];
}

const VIDEO_EXTENSIONS = [".mov", ".mp4", ".avi", ".mkv", ".webm", ".m4v"];
const IMAGES_DIR = "images";
const OUTPUT_FILE = "video-list.json";

async function scanVideoFiles(): Promise<VideoList> {
  const videoList: VideoList = {};

  try {
    console.log(`🔍 Scanning ${IMAGES_DIR} directory for video files...`);

    // Read the images directory
    for await (const dirEntry of Deno.readDir(IMAGES_DIR)) {
      if (dirEntry.isDirectory) {
        const folderName = dirEntry.name;
        const folderPath = `${IMAGES_DIR}/${folderName}`;

        console.log(`📁 Checking folder: ${folderName}`);

        videoList[folderName] = [];

        try {
          // Read each subfolder for video files
          for await (const fileEntry of Deno.readDir(folderPath)) {
            if (fileEntry.isFile) {
              const fileName = fileEntry.name;
              const ext = fileName.toLowerCase().substring(
                fileName.lastIndexOf("."),
              );

              if (VIDEO_EXTENSIONS.includes(ext)) {
                videoList[folderName].push(fileName);
                console.log(`  🎬 Found video: ${fileName}`);
              }
            }
          }
        } catch (error) {
          console.warn(
            `⚠️ Could not read folder ${folderPath}:`,
            error.message,
          );
        }

        // Sort files alphabetically for consistent output
        videoList[folderName].sort();

        console.log(
          `✅ ${folderName}: ${videoList[folderName].length} video files`,
        );
      }
    }
  } catch (error) {
    console.error(`❌ Error scanning ${IMAGES_DIR} directory:`, error.message);
    throw error;
  }

  return videoList;
}

async function generateVideoList(): Promise<void> {
  try {
    const videoList = await scanVideoFiles();

    // Convert to JSON with pretty formatting
    const jsonContent = JSON.stringify(videoList, null, 2);

    // Write to output file
    await Deno.writeTextFile(OUTPUT_FILE, jsonContent);

    console.log(`\n📄 Generated ${OUTPUT_FILE}:`);
    console.log(jsonContent);

    // Summary
    const totalVideos = Object.values(videoList).reduce(
      (sum, files) => sum + files.length,
      0,
    );
    console.log(`\n🎯 Summary:`);
    console.log(`  - Folders scanned: ${Object.keys(videoList).length}`);
    console.log(`  - Total video files: ${totalVideos}`);
    console.log(`  - Output file: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("💥 Error generating video list:", error.message);
    Deno.exit(1);
  }
}

// Run the script
if (import.meta.main) {
  await generateVideoList();
}
