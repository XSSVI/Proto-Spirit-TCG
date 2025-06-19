// server/routes/auth.ts
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { usersCollection } from "../db.ts"; // Import from db.ts
import { generateToken, deleteToken, validateTokenAndGetUserId } from "../utils/token.ts";

// Create the router
const router = new Router();

// Login endpoint
router.post("/api/auth/login", async (ctx) => {
  const body = ctx.request.body();
 
  if (body.type !== "json") {
    ctx.response.headers.set("Connection", "keep-alive");
    ctx.response.headers.set("Keep-Alive", "timeout=120");
    ctx.response.status = 400;
    ctx.response.body = { success: false, message: "Invalid request format" };
    return;
  }
 
  const { email, password } = await body.value;
 
  if (!email || !password) {
    ctx.response.headers.set("Connection", "keep-alive");
    ctx.response.headers.set("Keep-Alive", "timeout=120");
    ctx.response.status = 400;
    ctx.response.body = { success: false, message: "Email and password are required" };
    return;
  }
 
  try {
    // Find user by email
    const user = await usersCollection.findOne({ email });
   
    if (!user) {
      ctx.response.headers.set("Connection", "keep-alive");
      ctx.response.headers.set("Keep-Alive", "timeout=120");
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Invalid email or password" };
      return;
    }
   
    // Verify password
    const { compare } = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      ctx.response.headers.set("Connection", "keep-alive");
      ctx.response.headers.set("Keep-Alive", "timeout=120");
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Invalid email or password" };
      return;
    }
   
    // Generate session token
    const token = await generateToken(user._id.toString());
   
    // Return user info and token (excluding password)
    const { password: _, ...userWithoutPassword } = user;
   
    ctx.response.headers.set("Connection", "keep-alive");
    ctx.response.headers.set("Keep-Alive", "timeout=120");
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Login successful",
      token,
      user: userWithoutPassword
    };
  } catch (error) {
    console.error("Login error:", error);
    ctx.response.headers.set("Connection", "keep-alive");
    ctx.response.headers.set("Keep-Alive", "timeout=120");
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error" };
  }
});

// Logout endpoint
router.post("/api/auth/logout", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.headers.set("Connection", "keep-alive");
      ctx.response.headers.set("Keep-Alive", "timeout=120");
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "No token provided" };
      return;
    }
   
    const token = authHeader.split(" ")[1];
    await deleteToken(token);
   
    ctx.response.headers.set("Connection", "keep-alive");
    ctx.response.headers.set("Keep-Alive", "timeout=120");
    ctx.response.status = 200;
    ctx.response.body = { success: true, message: "Logged out successfully" };
  } catch (error) {
    console.error("Logout error:", error);
    ctx.response.headers.set("Connection", "keep-alive");
    ctx.response.headers.set("Keep-Alive", "timeout=120");
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error" };
  }
});

// Get current user info endpoint
router.get("/api/auth/me", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.headers.set("Connection", "keep-alive");
      ctx.response.headers.set("Keep-Alive", "timeout=120");
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "No token provided" };
      return;
    }
   
    const token = authHeader.split(" ")[1];
    // Verify token and get user ID
    const userId = await validateTokenAndGetUserId(token);
   
    if (!userId) {
      ctx.response.headers.set("Connection", "keep-alive");
      ctx.response.headers.set("Keep-Alive", "timeout=120");
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Invalid or expired token" };
      return;
    }
   
    // Find user by ID
    const user = await usersCollection.findOne({ _id: userId });
   
    if (!user) {
      ctx.response.headers.set("Connection", "keep-alive");
      ctx.response.headers.set("Keep-Alive", "timeout=120");
      ctx.response.status = 404;
      ctx.response.body = { success: false, message: "User not found" };
      return;
    }
   
    // Return user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;
   
    ctx.response.headers.set("Connection", "keep-alive");
    ctx.response.headers.set("Keep-Alive", "timeout=120");
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      user: userWithoutPassword
    };
  } catch (error) {
    console.error("Get user error:", error);
    ctx.response.headers.set("Connection", "keep-alive");
    ctx.response.headers.set("Keep-Alive", "timeout=120");
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error" };
  }
});

// Route export
export { router as authRoutes };

// Register endpoint
router.post("/api/auth/register", async (ctx) => {
  const body = ctx.request.body();

  if (body.type !== "json") {
    ctx.response.status = 400;
    ctx.response.body = { success: false, message: "Invalid request format" };
    return;
  }

  const { username, email, password } = await body.value;

  if (!username || !email || !password) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: "Username, email, and password are required",
    };
    return;
  }

  try {
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      ctx.response.status = 409;
      ctx.response.body = { success: false, message: "User already exists" };
      return;
    }

    // Import bcrypt and hash password
    const { hash } = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
    const hashedPassword = await hash(password);

    const insertId = await usersCollection.insertOne({
      username,
      email,
      password: hashedPassword,
      role: "user",
    });

    // Use existing token logic
    const token = await generateToken(insertId.toString());

    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      message: "User registered successfully",
      token,
      user: {
        _id: insertId,
        username,
        email,
        role: "user",
      },
    };
  } catch (err) {
    console.error("Registration error:", err);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error" };
  }
});