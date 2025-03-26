// main.ts
import { serve } from "https://deno.land/std/http/server.ts";


// Text that will show during testing phase. Base for our web app
const handler = (req: Request) => {
  return new Response("App web testing", {
    headers: { "content-type": "text/plain" },
  });
};

// Test
console.log("Hello");
serve(handler);
