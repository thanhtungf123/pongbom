// Seed dữ liệu từ data/*.json vào MongoDB Atlas (chạy 1 lần).
// Dùng: node scripts/seed.mjs
import { MongoClient } from "mongodb";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const get = (k) =>
  (env.match(new RegExp("^" + k + "=(.*)$", "m"))?.[1] || "")
    .replace(/^["']|["']$/g, "")
    .trim();

const uri = get("MONGODB_URI");
const dbName = get("MONGODB_DB") || "pongbom";
if (!uri) {
  console.error("Thiếu MONGODB_URI trong .env.local");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
await client.connect();
const db = client.db(dbName);

const games = JSON.parse(fs.readFileSync("data/games.json", "utf8"));
const pages = JSON.parse(fs.readFileSync("data/pages.json", "utf8"));
const site = JSON.parse(fs.readFileSync("data/site.json", "utf8"));
const categories = JSON.parse(fs.readFileSync("data/categories.json", "utf8"));

for (const g of games)
  await db.collection("games").updateOne({ slug: g.slug }, { $set: g }, { upsert: true });
for (const p of pages)
  await db.collection("pages").updateOne({ slug: p.slug }, { $set: p }, { upsert: true });
for (const c of categories)
  await db.collection("categories").updateOne({ key: c.key }, { $set: c }, { upsert: true });
await db
  .collection("sites")
  .updateOne({ key: "main" }, { $set: { ...site, key: "main" } }, { upsert: true });

console.log(
  `✓ Seeded ${games.length} games, ${pages.length} pages, ${categories.length} categories, 1 site vào DB "${dbName}".`
);
await client.close();
