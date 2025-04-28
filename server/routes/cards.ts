// server/routes/cards.ts
import { cardCollection } from "../db.ts";
import { RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";

export async function getCards(ctx: RouterContext<"/cards">) {
  const cards = await cardCollection.find().toArray();
  ctx.response.body = cards;
}