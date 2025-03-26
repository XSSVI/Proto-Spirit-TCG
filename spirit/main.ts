// main.ts
import { serve } from "https://deno.land/std/http/server.ts";

const handler = (req: Request) => {
  return new Response("Testeo de pagina web", {
    headers: { "content-type": "text/plain" },
  });
};

console.log("Hello");
serve(handler);
