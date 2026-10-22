import mongoose from "mongoose";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "pongbom";

// Cache kết nối qua global để không mở nhiều kết nối khi hot-reload (dev).
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = global as unknown as { _mongoose?: Cache };
const cached: Cache = g._mongoose || (g._mongoose = { conn: null, promise: null });

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!URI) throw new Error("Thiếu MONGODB_URI trong .env.local");
  if (!cached.promise) {
    cached.promise = mongoose.connect(URI, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 8000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
