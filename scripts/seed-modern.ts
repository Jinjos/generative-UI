import dbConnect from "../src/lib/db/connect";
import { UserMetric } from "../src/lib/db/models";

const SECTIONS = ["Frontend", "Backend", "Mobile", "Data-Science", "DevOps"];
const MODELS = ["claude-4.0-sonnet", "gpt-4o"];
const IDES = ["vscode", "intellij"];

const USERS = Array.from({ length: 20 }).map((_, i) => ({
  user_id: 1000 + i,
  user_login: `user_${i + 1}`,
  section: SECTIONS[i % SECTIONS.length],
  preferred_ide: IDES[i % IDES.length],
  preferred_model: MODELS[i % MODELS.length]
}));

async function seed() {
  await dbConnect();
  console.log("Connected to MongoDB...");

  // Clear existing modern data
  await UserMetric.deleteMany({});
  console.log("Cleared existing UserMetric data.");

  const allMetrics = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const currentDay = new Date();
    currentDay.setDate(now.getDate() - dayOffset);
    currentDay.setHours(0, 0, 0, 0);

    const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;

    for (const user of USERS) {
      // Scale down activity on weekends
      const activityMultiplier = isWeekend ? 0.2 : 1.0;
      if (Math.random() > (isWeekend ? 0.3 : 0.95)) { // Users sometimes skip days
        
        const interactions = Math.floor(Math.random() * 20 * activityMultiplier);
        const suggestions = Math.floor(Math.random() * 100 * activityMultiplier);
        const acceptances = Math.floor(suggestions * (0.2 + Math.random() * 0.3));
        const loc_added = acceptances * Math.floor(Math.random() * 10);

        allMetrics.push({
          user_id: user.user_id,
          user_login: user.user_login,
          day: currentDay,
          enterprise_id: "ent_vibe_123",
          user_initiated_interaction_count: interactions,
          code_generation_activity_count: suggestions,
          code_acceptance_activity_count: acceptances,
          used_agent: interactions > 5,
          used_chat: interactions > 0,
          loc_added_sum: loc_added,
          loc_deleted_sum: Math.floor(loc_added * 0.3),
          
          totals_by_ide: [{
            ide: user.preferred_ide,
            user_initiated_interaction_count: interactions,
            code_generation_activity_count: suggestions,
            code_acceptance_activity_count: acceptances,
            loc_added_sum: loc_added,
            loc_deleted_sum: Math.floor(loc_added * 0.3)
          }],
          
          totals_by_language_model: [{
            language: "typescript",
            model: user.preferred_model,
            user_initiated_interaction_count: interactions,
            code_generation_activity_count: suggestions,
            code_acceptance_activity_count: acceptances,
            loc_added_sum: loc_added,
            loc_deleted_sum: Math.floor(loc_added * 0.3)
          }],

          // We'll use feature to store the section info for easy aggregation later
          totals_by_feature: [{
            feature: `section_${user.section}`,
            user_initiated_interaction_count: interactions,
            code_generation_activity_count: suggestions,
            code_acceptance_activity_count: acceptances,
            loc_added_sum: loc_added,
            loc_deleted_sum: Math.floor(loc_added * 0.3)
          }]
        });
      }
    }
  }

  console.log(`Inserting ${allMetrics.length} records...`);
  await UserMetric.insertMany(allMetrics);
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
