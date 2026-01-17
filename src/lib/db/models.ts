import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// --- Modern Schema (Granular User Metrics v2 GA) ---

const IDEUsageSchema = new Schema({
  ide: String,
  user_initiated_interaction_count: Number,
  code_generation_activity_count: Number,
  code_acceptance_activity_count: Number,
  loc_suggested_to_add_sum: Number,
  loc_suggested_to_delete_sum: Number,
  loc_added_sum: Number,
  loc_deleted_sum: Number,
  last_known_plugin_version: {
    sampled_at: Date,
    plugin: String,
    plugin_version: String,
  },
  last_known_ide_version: {
    sampled_at: Date,
    ide_version: String,
  }
}, { _id: false });

const FeatureUsageSchema = new Schema({
  feature: String,
  model: String,
  language: String,
  user_initiated_interaction_count: Number,
  code_generation_activity_count: Number,
  code_acceptance_activity_count: Number,
  loc_suggested_to_add_sum: Number,
  loc_suggested_to_delete_sum: Number,
  loc_added_sum: Number,
  loc_deleted_sum: Number
}, { _id: false });

const LanguageModelUsageSchema = new Schema({
  language: String,
  model: String,
  user_initiated_interaction_count: { type: Number, default: 0 },
  code_generation_activity_count: Number,
  code_acceptance_activity_count: Number,
  loc_suggested_to_add_sum: Number,
  loc_suggested_to_delete_sum: Number,
  loc_added_sum: Number,
  loc_deleted_sum: Number
}, { _id: false });

const UserMetricSchema = new Schema({
  user_id: { type: Number, required: true },
  user_login: { type: String, required: true },
  user_name: { type: String }, // Human-readable name (e.g. "Alice Chen")
  day: { type: Date, required: true },
  enterprise_id: String,
  user_initiated_interaction_count: { type: Number, default: 0 },
  code_generation_activity_count: { type: Number, default: 0 },
  code_acceptance_activity_count: { type: Number, default: 0 },
  
  totals_by_ide: [IDEUsageSchema],
  totals_by_feature: [FeatureUsageSchema],
  totals_by_language_feature: [FeatureUsageSchema],
  totals_by_language_model: [LanguageModelUsageSchema],
  totals_by_model_feature: [FeatureUsageSchema],
  
  used_agent: { type: Boolean, default: false },
  used_chat: { type: Boolean, default: false },
  loc_suggested_to_add_sum: { type: Number, default: 0 },
  loc_suggested_to_delete_sum: { type: Number, default: 0 },
  loc_added_sum: { type: Number, default: 0 },
  loc_deleted_sum: { type: Number, default: 0 }
});

// Compound index to ensure uniqueness per user per day
UserMetricSchema.index({ user_id: 1, day: 1 }, { unique: true });

export const UserMetric = models.UserMetric || model("UserMetric", UserMetricSchema);
