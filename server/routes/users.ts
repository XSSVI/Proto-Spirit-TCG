import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { usersCollection } from "../db.ts";
import { Bson } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const router = new Router();

router.get("/users/:id", async (ctx) => {
  const id = ctx.params.id;

  console.log("Requested user ID:", id); // ✅ Debug line

  // ✅ Validate ID before using
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid user ID format" };
    return;
  }

  try {
    const user = await usersCollection.findOne({ _id: new Bson.ObjectId(id) });

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    user._id = user._id.toString();
    ctx.response.body = user;
  } catch (err) {
    console.error("Failed to fetch user:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: "Server error" };
  }
});

export { router as usersRoutes };