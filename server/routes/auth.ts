// server/routes/auth.ts
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { usersCollection } from "../db.ts";
import { generateToken, deleteToken, validateTokenAndGetUserId } from "../utils/token.ts";

const router = new Router();

// Login
router.post("/api/auth/login", async (ctx) => {
  const body = ctx.request.body();
  if (body.type !== "json") {
    ctx.response.status = 400;
    ctx.response.body = { success: false, message: "Invalid request format" };
    return;
  }

  const { email, password } = await body.value;
  if (!email || !password) {
    ctx.response.status = 400;
    ctx.response.body = { success: false, message: "Email and password are required" };
    return;
  }

  try {
    const user = await usersCollection.findOne({ email });
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Invalid email or password" };
      return;
    }

    const { compare } = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Invalid email or password" };
      return;
    }

    const token = await generateToken(user._id.toString());
    const { password: _, ...userWithoutPassword } = user;

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Login successful",
      token,
      user: userWithoutPassword,
    };
  } catch (error) {
    console.error("Login error:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error" };
  }
});

// Logout
router.post("/api/auth/logout", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "No token provided" };
      return;
    }

    const token = authHeader.split(" ")[1];
    await deleteToken(token);

    ctx.response.status = 200;
    ctx.response.body = { success: true, message: "Logged out successfully" };
  } catch (error) {
    console.error("Logout error:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error" };
  }
});

// Get Current User
router.get("/api/auth/me", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "No token provided" };
      return;
    }

    const token = authHeader.split(" ")[1];
    const userId = await validateTokenAndGetUserId(token);
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Invalid or expired token" };
      return;
    }

    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, message: "User not found" };
      return;
    }

    const { password: _, ...userWithoutPassword } = user;

    ctx.response.status = 200;
    ctx.response.body = { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error("Get user error:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error" };
  }
});

// Register
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

    const { hash } = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
    const hashedPassword = await hash(password);

    const starterInventory: [number, string, string][] = [
      [1, "OOF-31", "UR"],
      [2, "OOF-31", "SR"],
      [3, "OOF-01", "C"],
      [4, "OOF-21", "R"],
    ];

    const insertId = await usersCollection.insertOne({
      username,
      email,
      password: hashedPassword,
      role: "user",
      inventory: starterInventory,
    });

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
        inventory: starterInventory,
      },
    };
  } catch (err) {
    console.error("Registration error:", err);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error" };
  }
});

export { router as authRoutes };