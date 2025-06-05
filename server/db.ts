// server/db.ts
import { load } from "https://deno.land/std@0.203.0/dotenv/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

// MongoDB Connection

const env = await load();
const client = new MongoClient();
console.log("Loaded env:", env);


await client.connect({
  db: env["MONGO_DB"],
  tls: true,
  servers: [
    {
      host: env["MONGO_HOST_1"],
      port: 27017,
    },
    {
      host: env["MONGO_HOST_2"],
      port: 27017,
    },
    {
      host: env["MONGO_HOST_3"],
      port: 27017,
    },
  ],
  credential: {
    username: env["MONGO_USERNAME"],
    password: env["MONGO_PASSWORD"],
    db: env["MONGO_DB"],
    mechanism: "SCRAM-SHA-1",
  },
});


console.log("Connected to MongoDB Atlas");


// Export the databases and collections
export const db = client.database("Usuarios");
export const usersCollection = db.collection("users");
export const tokenCollection = db.collection("tokens");

export const dbcards = client.database("Cartas");
export const cardCollection = dbcards.collection("Collection2");
export const rarities = dbcards.collection("Rarezas");
export const carddata = dbcards.collection("datos");

// Initialize sample users if none exist
const userCount = await usersCollection.countDocuments();
if (userCount === 0) {
  await usersCollection.insertMany([
    {
      email: "admin@example.com",
      password: "admin123",
      name: "Admin User",
      role: "admin",
    },
    {
      email: "user@example.com",
      password: "user123",
      name: "Regular User",
      role: "user",
    },
  ]);
  console.log("Sample users created");
}



// Print the first 3 cards in Collection1
const firstThreeCards = await cardCollection.find().limit(3).toArray();
console.log("First 3 cards in Collection1:", firstThreeCards);

// Print the first 3 entries in rarities
const firstThreeRarities = await rarities.find().limit(3).toArray();
console.log("First 3 rarities:", firstThreeRarities);

// Print the first 3 entries in rarities
const firstThreeCardData = await carddata.find().limit(3).toArray();
console.log("First 3 rarities:", firstThreeCardData);