//main.ts

// Importing the `serve` function from Deno's standard HTTP server module
import { serve } from "https://deno.land/std/http/server.ts";

const handler = async (req: Request) => {
  const file = await Deno.readTextFile("index.html");
  // Returns the content of "index.html" as an HTTP response
  return new Response(file, {
    headers: { "content-type": "text/html" },
  });
};

// starts the HTTP server on port 8000 for live testing
serve(handler, { port: 8000 });
