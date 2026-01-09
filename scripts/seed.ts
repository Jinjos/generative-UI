import mongoose from "mongoose";
import { UserMetric } from "../src/lib/db/models";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

// --- Configuration ---
const DAYS_HISTORY = 365; // 1 Year

const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", 
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Alice", "Bob",
  "Kevin", "Brian", "George", "Edward", "Ronald", "Timothy", "Jason", "Jeffrey",
  "Ryan", "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry",
  "Justin", "Scott", "Brandon", "Benjamin", "Samuel", "Gregory", "Frank", "Alexander",
  "Raymond", "Patrick", "Jack", "Dennis", "Jerry", "Tyler", "Aaron", "Jose", "Adam"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker"
];

const TEAM_CONFIG = [
  { name: 'Architects', count: 6 },
  { name: 'Product', count: 7 },
  { name: 'Project', count: 5 },
  { name: 'QA', count: 4 }, // Reduced to 4
  { name: 'HR', count: 6 }, // Added HR
  { name: 'Backend-Core', count: 6 },
  { name: 'Backend-Platform', count: 6 },
  { name: 'Frontend', count: 5 },
  { name: 'Mobile', count: 5 },
  { name: 'DevOps', count: 5 },
  { name: 'Data-Science', count: 5 }
];

const IDES = ["vscode", "jetbrains", "visual_studio", "xcode", "sublime", "vim"];
const MODELS = ["gpt-4o", "claude-3-5-sonnet", "gemini-1.5-pro", "gpt-4-turbo", "o1-preview", "llama-3-70b"];

interface UserPersona {
  user_id: number; // Added explicit ID to interface
  name: string;
  login: string;
  section: string;
  primaryIde: string;
  primaryModel: string;
  workStyle: 'regular' | 'workaholic' | 'junior';
}

// --- Dynamic User Generation ---
const users: UserPersona[] = [];
const usedNames = new Set<string>();
let nextUserId = 1000; // Start IDs at 1000 to avoid conflicts

function generateUniqueName(): string {
  let name = "";
  let attempts = 0;
  do {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    name = `${first} ${last}`;
    attempts++;
  } while (usedNames.has(name) && attempts < 100);
  usedNames.add(name);
  return name;
}

TEAM_CONFIG.forEach(team => {
  for (let i = 0; i < team.count; i++) {
    const name = generateUniqueName();
    users.push({
      user_id: nextUserId++, // Incrementing ID guarantees uniqueness
      name: name,
      login: name.toLowerCase().replace(" ", "_"),
      section: `section_${team.name}`,
      primaryIde: IDES[Math.floor(Math.random() * IDES.length)],
      primaryModel: MODELS[Math.floor(Math.random() * MODELS.length)],
      // Randomize work style: 10% Workaholic, 30% Junior, 60% Regular
      workStyle: Math.random() < 0.1 ? 'workaholic' : (Math.random() < 0.4 ? 'junior' : 'regular')
    });
  }
});

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Metrics Generators ---
function generateDailyMetrics(user: UserPersona, date: Date) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  
  // Weekend Logic based on Persona
  if (isWeekend) {
    if (user.workStyle === 'workaholic') {
      // Workaholics work 50% of weekends
      if (Math.random() > 0.5) return null;
    } else {
      // Regulars/Juniors almost never work weekends (5% chance)
      if (Math.random() > 0.05) return null;
    }
  }

  // Volume based on Persona
  let baseVolume = 50;
  if (user.workStyle === 'junior') baseVolume = 30;
  if (user.workStyle === 'workaholic') baseVolume = 80;

  // Daily variance
  const interactions = getRandomInt(0, baseVolume);
  
  // Junior devs accept more suggestions (learning), Seniors might reject more or write complex code
  const acceptanceRate = user.workStyle === 'junior' ? 0.6 : 0.35; 
  const suggestions = Math.floor(interactions * 1.5);
  const acceptances = Math.floor(suggestions * acceptanceRate);
  
  // Sticky IDE Logic (90% Primary)
  const currentIde = Math.random() > 0.1 ? user.primaryIde : IDES[getRandomInt(0, IDES.length - 1)];
  
  // Sticky Model Logic (70% Primary)
  const currentModel = Math.random() > 0.3 ? user.primaryModel : MODELS[getRandomInt(0, MODELS.length - 1)];

  return {
    user_id: user.user_id, // Use the unique ID from configuration
    user_login: user.login,
    user_name: user.name, // Explicitly add name
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
      feature: user.section, 
      user_initiated_interaction_count: interactions,
      code_generation_activity_count: suggestions,
      code_acceptance_activity_count: acceptances,
      loc_added_sum: acceptances * 10,
      loc_deleted_sum: acceptances * 2,
    }],
    
    totals_by_ide: [{
      ide: currentIde,
      user_initiated_interaction_count: interactions,
      code_generation_activity_count: suggestions,
      code_acceptance_activity_count: acceptances,
      loc_added_sum: acceptances * 10,
      loc_deleted_sum: acceptances * 2,
    }],

    totals_by_language_model: [{
      model: currentModel,
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
  console.log(`📝 Sample User: ${users[0].name} (${users[0].workStyle}) prefers ${users[0].primaryIde}`);
  
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
  
  const BATCH_SIZE = 1000;
  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    const batch = allRecords.slice(i, i + BATCH_SIZE);
    await UserMetric.insertMany(batch);
    process.stdout.write(`.`);
  }

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});