#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Generate video-list.json by scanning the images directory for video files
 */

interface VideoList {
  [folderName: string]: string[] | VideoList;
}

const VIDEO_EXTENSIONS = [".mov", ".mp4", ".avi", ".mkv", ".webm", ".m4v"];
const IMAGES_DIR = "images";
const OUTPUT_FILE = "video-list.json";

async function scanDirectoryRecursively(
  dirPath: string,
  relativePath: string = "",
): Promise<VideoList> {
  const result: VideoList = {};
  const files: string[] = [];

  try {
    for await (const entry of Deno.readDir(dirPath)) {
      const fullPath = `${dirPath}/${entry.name}`;
      const currentRelativePath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;

      if (entry.isDirectory) {
        console.log(`📁 Scanning directory: ${currentRelativePath}`);
        
        // Recursively scan subdirectories
        const subResult = await scanDirectoryRecursively(
          fullPath,
          currentRelativePath,
        );
        
        // If subdirectory has content, add it to the result
        if (Object.keys(subResult).length > 0 || (Array.isArray(subResult) && subResult.length > 0)) {
          result[entry.name] = subResult;
        }
      } else if (entry.isFile) {
        const fileName = entry.name;
        const ext = fileName.toLowerCase().substring(
          fileName.lastIndexOf("."),
        );

        if (VIDEO_EXTENSIONS.includes(ext)) {
          files.push(fileName);
          console.log(`  🎬 Found video: ${currentRelativePath}`);
        }
      }
    }
  } catch (error) {
    console.warn(
      `⚠️ Could not read directory ${dirPath}:`,
      error.message,
    );
  }

  // If this directory has video files, add them to the result
  if (files.length > 0) {
    files.sort();
    // If there are also subdirectories, we need to handle both
    if (Object.keys(result).length > 0) {
      (result as any)["_files"] = files;
    } else {
      return files as any;
    }
  }

  return result;
}

function countVideosRecursively(obj: VideoList | string[]): number {
  if (Array.isArray(obj)) {
    return obj.length;
  }
  
  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    if (key === "_files" && Array.isArray(value)) {
      count += value.length;
    } else if (!key.startsWith("_")) {
      count += countVideosRecursively(value);
    }
  }
  return count;
}

function logStructureRecursively(obj: VideoList | string[], prefix: string = ""): void {
  if (Array.isArray(obj)) {
    console.log(`✅ ${prefix}: ${obj.length} video file${obj.length !== 1 ? 's' : ''}`);
    return;
  }
  
  for (const [key, value] of Object.entries(obj)) {
    if (key === "_files" && Array.isArray(value)) {
      console.log(`✅ ${prefix}: ${value.length} video file${value.length !== 1 ? 's' : ''} (+ subdirectories)`);
    } else if (!key.startsWith("_")) {
      const newPrefix = prefix ? `${prefix}/${key}` : key;
      logStructureRecursively(value, newPrefix);
    }
  }
}

async function scanVideoFiles(): Promise<VideoList> {
  try {
    console.log(`🔍 Recursively scanning ${IMAGES_DIR} directory for video files...`);

    const videoList = await scanDirectoryRecursively(IMAGES_DIR);
    
    console.log("\n📁 Directory structure:");
    logStructureRecursively(videoList);
    
    return videoList;
  } catch (error) {
    console.error(`❌ Error scanning ${IMAGES_DIR} directory:`, error.message);
    throw error;
  }
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
    const totalVideos = countVideosRecursively(videoList);
    
    function countFoldersRecursively(obj: VideoList | string[]): number {
      if (Array.isArray(obj)) {
        return 1; // This is a leaf folder with files
      }
      
      let count = 0;
      let hasFiles = false;
      
      for (const [key, value] of Object.entries(obj)) {
        if (key === "_files") {
          hasFiles = true;
        } else if (!key.startsWith("_")) {
          count += countFoldersRecursively(value);
        }
      }
      
      return count + (hasFiles ? 1 : 0);
    }
    
    const totalFolders = countFoldersRecursively(videoList);
    
    console.log(`\n🎯 Summary:`);
    console.log(`  - Folders scanned: ${totalFolders}`);
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
