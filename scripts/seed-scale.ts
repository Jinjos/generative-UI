import mongoose from "mongoose";
import { UserMetric } from "../src/lib/db/models";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

// --- Configuration ---
const DAYS_HISTORY = 180; // 6 Months
const TEAMS = ['DevOps', 'Data-Science', 'Mobile', 'Frontend', 'Backend'];
const USERS_PER_TEAM = 4;

// --- Static User Definitions ---
const users = TEAMS.flatMap((team) => 
  Array.from({ length: USERS_PER_TEAM }).map((_, i) => ({
    user_id: Math.floor(Math.random() * 1000000) + i, // Stable ID not strictly needed for logic, but good for data
    user_login: `user_${team.toLowerCase()}_${i + 1}`,
    section: `section_${team}`
  }))
);

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Metrics Generators (Copied & Adapted from seed-modern.ts) ---
function generateDailyMetrics(user: typeof users[0], date: Date) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  
  // Weekend Drop-off: 80% chance of 0 activity
  if (isWeekend && Math.random() > 0.2) {
    return null;
  }

  const interactions = getRandomInt(0, 50);
  const suggestions = Math.floor(interactions * 1.5);
  const acceptances = Math.floor(suggestions * 0.4); // ~40% acceptance rate
  
  return {
    user_id: user.user_id,
    user_login: user.user_login,
    day: date,
    enterprise_id: "ent_vibe_inc",
    
    // Activity
    user_initiated_interaction_count: interactions,
    code_generation_activity_count: suggestions,
    code_acceptance_activity_count: acceptances,
    
    // LOC
    loc_suggested_to_add_sum: suggestions * 10,
    loc_suggested_to_delete_sum: suggestions * 2,
    loc_added_sum: acceptances * 10,
    loc_deleted_sum: acceptances * 2,
    
    // Booleans
    used_agent: interactions > 5,
    used_chat: interactions > 0,

    // Dimensions
    totals_by_feature: [{
      feature: user.section, // Map User Section
      user_initiated_interaction_count: interactions,
      code_generation_activity_count: suggestions,
      code_acceptance_activity_count: acceptances,
      loc_added_sum: acceptances * 10,
      loc_deleted_sum: acceptances * 2,
    }],
    
    totals_by_ide: [{
      ide: Math.random() > 0.5 ? "vscode" : "jetbrains",
      user_initiated_interaction_count: interactions,
      code_generation_activity_count: suggestions,
      code_acceptance_activity_count: acceptances,
      loc_added_sum: acceptances * 10,
      loc_deleted_sum: acceptances * 2,
    }],

    totals_by_language_model: [{
      model: "gpt-4",
      language: "typescript",
      user_initiated_interaction_count: interactions,
      code_generation_activity_count: suggestions,
      code_acceptance_activity_count: acceptances,
      loc_added_sum: acceptances * 10,
      loc_deleted_sum: acceptances * 2,
    }]
  };
}

async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!); 

  console.log("🧹 Cleaning existing data...");
  await UserMetric.deleteMany({});

  console.log(`🚀 Generating data for ${users.length} users over ${DAYS_HISTORY} days...`);
  
  const allRecords = [];
  const today = new Date();

  for (let d = 0; d < DAYS_HISTORY; d++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - d);
    currentDate.setHours(0, 0, 0, 0); // Normalize time

    for (const user of users) {
      const record = generateDailyMetrics(user, currentDate);
      if (record) {
        allRecords.push(record);
      }
    }
  }

  console.log(`📦 Inserting ${allRecords.length} records...`);
  
  // Batch insert for performance
  const BATCH_SIZE = 1000;
  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    const batch = allRecords.slice(i, i + BATCH_SIZE);
    await UserMetric.insertMany(batch);
    process.stdout.write(".");
  }

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
