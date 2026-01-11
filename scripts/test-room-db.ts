import mongoose from "mongoose";
import { RoomService } from "../src/lib/services/room-service";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

async function run() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);

  const roomId = `smoke-test-${Date.now()}`;
  console.log(`🏠 Creating Room: ${roomId}`);

  // 1. Create Room
  let room = await RoomService.getOrCreateRoom(roomId);
  console.log("✅ Room Created:", room.roomId);

  // 2. Add Message
  console.log("💬 Adding message...");
  room = await RoomService.addMessage(roomId, { role: "user", content: "Hello Room!" });
  
  if (room.messages.length === 1 && room.messages[0].content === "Hello Room!") {
    console.log("✅ Message persisted successfully.");
  } else {
    console.error("❌ Message persistence failed:", room.messages);
  }

  // 3. Update Config
  console.log("⚙️  Updating Dashboard Config...");
  const dummyConfig = { layout: "single", config: { title: "Test", component: "SmartStatCard", apiEndpoint: "/test" } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  room = await RoomService.updateRoom(roomId, { config: dummyConfig as any });

  if (room.dashboardConfig?.layout === "single") {
    console.log("✅ Config persisted successfully.");
  } else {
    console.error("❌ Config persistence failed.");
  }

  console.log("🏁 Smoke Test Complete.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
