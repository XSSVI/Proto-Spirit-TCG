import { Context } from "jsr:@oak/oak";
import { validateTokenAndGetUserId } from "../utils/token.ts";
import { usersCollection } from "../db.ts";

export async function validateToken(ctx: Context, next: () => Promise<unknown>) {
  try {
    const authHeader = ctx.request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Authentication required" };
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
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "User not found" };
      return;
    }

    // Attach user to context state
    const { password: _, ...userWithoutPassword } = user;
    ctx.state.user = userWithoutPassword;

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error" };
  }
}