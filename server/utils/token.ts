// server/utils/token.ts
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { tokenCollection } from "../db.ts"; // Import from db.ts

// Secret key for signing tokens
const KEY = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"]
);

// Generate a new token for a user
export async function generateToken(userId: string): Promise<string> {
  // Create JWT with user ID and expiration
  const token = await create(
    { alg: "HS512", typ: "JWT" },
    { 
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours expiration
    },
    KEY
  );
  
  // Store token in database
  await tokenCollection.insertOne({
    token,
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000) // 24 hours
  });
  
  return token;
}

// Validate a token and return user ID if valid
export async function validateTokenAndGetUserId(token: string): Promise<string | null> {
  try {
    // Check if token exists in database
    const tokenDoc = await tokenCollection.findOne({ token });
    
    if (!tokenDoc) {
      return null;
    }
    
    // Check if token is expired
    if (tokenDoc.expiresAt < new Date()) {
      await tokenCollection.deleteOne({ token });
      return null;
    }
    
    // Verify JWT
    const payload = await verify(token, KEY);
    return payload.sub as string;
  } catch (error) {
    console.error("Token validation error:", error);
    return null;
  }
}

// Delete a token (logout)
export async function deleteToken(token: string): Promise<boolean> {
    try {
      const result = await tokenCollection.deleteOne({ token }) as unknown as { deletedCount: number };
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Token deletion error:", error);
      return false;
    }
}
  