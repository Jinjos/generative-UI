import dbConnect from "../src/lib/db/connect";
import { DailyUsage } from "../src/lib/db/models";
import mongoose from "mongoose";

// Mock Data Generator
const generateMockData = () => {
  const data = [];
  const today = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Randomize slightly for realism
    const active_users = Math.floor(800 + Math.random() * 400); // 800-1200
    const suggestions = Math.floor(5000 + Math.random() * 2000); // 5000-7000
    const acceptance_rate = 0.25 + Math.random() * 0.1; // 25-35%
    const lines_accepted = Math.floor(suggestions * acceptance_rate * 5); // Avg 5 lines per suggestion
    const hours_saved = parseFloat((lines_accepted * 0.05).toFixed(2)); // 3 mins (0.05h) per line

    data.push({
      date: date,
      active_users,
      suggestions_count: suggestions,
      lines_accepted,
      estimated_hours_saved: hours_saved,
    });
  }
  return data;
};

async function seed() {
  console.log("🌱 Starting Seed...");
  
  try {
    await dbConnect();
    console.log("✅ DB Connected");

    await DailyUsage.deleteMany({});
    console.log("🧹 Cleared old data");

    const mockData = generateMockData();
    await DailyUsage.insertMany(mockData);
    console.log(`✅ Inserted ${mockData.length} records`);
    
    console.log("Example Record:", mockData[mockData.length - 1]);

  } catch (error) {
    console.error("❌ Seed Failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected");
  }
}

seed();
