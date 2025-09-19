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
