import { Schema, model, models } from "mongoose";

const DailyUsageSchema = new Schema({
  date: { type: Date, required: true, unique: true },
  active_users: { type: Number, required: true },
  suggestions_count: { type: Number, required: true },
  lines_accepted: { type: Number, required: true },
  estimated_hours_saved: { type: Number, required: true },
});

// Prevent overwriting the model if it already exists (hot reloading)
export const DailyUsage = models.DailyUsage || model("DailyUsage", DailyUsageSchema);
