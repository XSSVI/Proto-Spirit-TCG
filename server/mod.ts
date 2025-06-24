// server/mod.ts
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { authRoutes } from "./routes/auth.ts";
import { getCards } from "./routes/cards.ts";
import { validateToken } from "./middleware/auth.ts";
import { existsSync } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { usersRoutes } from "./routes/users.ts";

//Check if there's an .env file or if it needs to be created
if (!existsSync(".env")) {
  console.error("Missing .env file! Please create one (you can copy from .env.example)");
  Deno.exit(1); // immediately stop the server
}

const app = new Application();
const router = new Router();

// Middleware
app.use(oakCors());

// Error handler middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("Caught error:", err);

    const status = (err && typeof err === "object" && "status" in err)
      ? (err.status as number)
      : 500;

    const message = (err && typeof err === "object" && "message" in err)
      ? (err.message as string)
      : "Internal Server Error";

    ctx.response.status = status;
    ctx.response.body = {
      success: false,
      message: message,
    };
  }
});

// Auth routes
app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());

// Example protected route
router.get("/api/protected", validateToken, (ctx) => {
  ctx.response.body = {
    success: true,
    message: "Protected route accessed!",
    user: ctx.state.user,
  };
});

// Card route
router.get("/cards", getCards);

// User route
app.use(usersRoutes.routes());

// Mount router
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const port = 8000;
console.log(`🚀 Server running on http://localhost:${port}`);
await app.listen({ port });