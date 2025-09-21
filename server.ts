// HTTP Server for Pachislo Game - Deno with TypeScript support
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.208.0/http/file_server.ts";

const port = 8000;

console.log(`🚀 Pachislo Game Server starting on http://localhost:${port}`);
console.log(`📁 Serving files from current directory`);
console.log(`🎮 Open http://localhost:${port} to play the game`);

serve(
  async (req: Request) => {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Handle API endpoint for listing video files
    if (pathname === "/api/list-videos" && req.method === "POST") {
      try {
        const body = await req.json();
        const folderPath = body.folder;

        if (!folderPath) {
          return new Response(
            JSON.stringify({ error: "Folder path required" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const videoExtensions = [".mov", ".mp4", ".avi", ".mkv", ".webm"];
        const files = [];

        try {
          for await (const dirEntry of Deno.readDir(folderPath)) {
            if (dirEntry.isFile) {
              const ext = dirEntry.name.toLowerCase().substring(
                dirEntry.name.lastIndexOf("."),
              );
              if (videoExtensions.includes(ext)) {
                files.push(dirEntry.name);
              }
            }
          }
        } catch (error) {
          console.error(`Error reading directory ${folderPath}:`, error);
          return new Response(
            JSON.stringify({ error: "Directory not found or not accessible" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        return new Response(JSON.stringify(files), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      } catch (error) {
        console.error("Error processing list-videos request:", error);
        return new Response(
          JSON.stringify({ error: "Internal server error" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // Handle TypeScript files by serving them as JavaScript modules
    if (pathname.endsWith(".ts")) {
      try {
        const filePath = `.${pathname}`;
        const fileContent = await Deno.readTextFile(filePath);

        // Set proper headers for TypeScript files to be treated as JavaScript modules
        return new Response(fileContent, {
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      } catch (error) {
        console.error(`Error serving TypeScript file ${pathname}:`, error);
        return new Response("File not found", { status: 404 });
      }
    }

    // For all other files, use the default file server with CORS enabled
    return serveDir(req, {
      fsRoot: ".",
      urlRoot: "",
      showDirListing: true,
      enableCors: true,
      headers: [
        // Add additional headers for better module support
        "Cross-Origin-Embedder-Policy: require-corp",
        "Cross-Origin-Opener-Policy: same-origin",
      ],
    });
  },
  { port },
);
