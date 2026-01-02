import { UserMetric } from "../db/models";
import dbConnect from "../db/connect";

export interface MetricsFilter {
  startDate?: Date;
  endDate?: Date;
  segment?: string; // e.g., 'Frontend', 'Backend'
  userLogin?: string; // For auditing a specific developer
}

export class MetricsService {
  /**
   * Aggregates high-level KPIs for the StatCards
   */
  static async getSummary(filters: MetricsFilter = {}) {
    await dbConnect();
    const query = this.buildMatchQuery(filters);

    const result = await UserMetric.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total_interactions: { $sum: "$user_initiated_interaction_count" },
          total_suggestions: { $sum: "$code_generation_activity_count" },
          total_acceptances: { $sum: "$code_acceptance_activity_count" },
          total_loc_added: { $sum: "$loc_added_sum" },
          total_loc_deleted: { $sum: "$loc_deleted_sum" },
          unique_users: { $addToSet: "$user_id" },
          active_days: { $sum: 1 },
          uses_agent: { $max: "$used_agent" },
          uses_chat: { $max: "$used_chat" },
        },
      },
      {
        $project: {
          _id: 0,
          total_interactions: 1,
          total_suggestions: 1,
          total_acceptances: 1,
          total_loc_added: 1,
          total_loc_deleted: 1,
          active_users_count: { $size: "$unique_users" },
          active_days: 1,
          uses_agent: 1,
          uses_chat: 1,
          acceptance_rate: {
            $cond: [
              { $gt: ["$total_suggestions", 0] },
              { $divide: ["$total_acceptances", "$total_suggestions"] },
              0,
            ],
          },
        },
      },
    ]);

    return result[0] || {
      total_interactions: 0,
      total_suggestions: 0,
      total_acceptances: 0,
      total_loc_added: 0,
      total_loc_deleted: 0,
      active_users_count: 0,
      active_days: 0,
      uses_agent: false,
      uses_chat: false,
      acceptance_rate: 0,
    };
  }

  /**
   * Aggregates daily data for Charts
   */
  static async getDailyTrends(filters: MetricsFilter = {}) {
    await dbConnect();
    const query = this.buildMatchQuery(filters);

    return await UserMetric.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$day" } },
          active_users: { $addToSet: "$user_id" },
          interactions: { $sum: "$user_initiated_interaction_count" },
          suggestions: { $sum: "$code_generation_activity_count" },
          acceptances: { $sum: "$code_acceptance_activity_count" },
          loc_added: { $sum: "$loc_added_sum" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          active_users: { $size: "$active_users" },
          interactions: 1,
          suggestions: 1,
          acceptances: 1,
          loc_added: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  /**
   * Pivots data by a dimension (e.g., 'model' or 'ide')
   */
  static async getBreakdown(dimension: "model" | "ide", filters: MetricsFilter = {}) {
    await dbConnect();
    const query = this.buildMatchQuery(filters);
    
    const arrayPath = dimension === "model" ? "$totals_by_language_model" : "$totals_by_ide";
    const groupField = dimension === "model" ? "model" : "ide";

    return await UserMetric.aggregate([
      { $match: query },
      { $unwind: arrayPath },
      {
        $group: {
          _id: `${arrayPath}.${groupField}`,
          count: { $sum: 1 },
          interactions: { $sum: `${arrayPath}.user_initiated_interaction_count` },
          acceptances: { $sum: `${arrayPath}.code_acceptance_activity_count` },
          suggestions: { $sum: `${arrayPath}.code_generation_activity_count` },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          interactions: 1,
          acceptances: 1,
          suggestions: 1,
          acceptance_rate: {
            $cond: [
              { $gt: ["$suggestions", 0] },
              { $divide: ["$acceptances", "$suggestions"] },
              0,
            ],
          },
        },
      },
      { $sort: { interactions: -1 } },
    ]);
  }

  /**
   * Discovers all available segments (teams) in the dataset
   */
  static async getSegments() {
    await dbConnect();
    const segments = await UserMetric.distinct("totals_by_feature.feature");
    return segments.map(s => s.replace("section_", ""));
  }

  /**
   * Returns a list of users with their individual performance metrics
   */
  static async getUsersList(filters: MetricsFilter = {}) {
    await dbConnect();
    const query = this.buildMatchQuery(filters);

    return await UserMetric.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$user_login",
          interactions: { $sum: "$user_initiated_interaction_count" },
          suggestions: { $sum: "$code_generation_activity_count" },
          acceptances: { $sum: "$code_acceptance_activity_count" },
          loc_added: { $sum: "$loc_added_sum" },
          // Capture the last known IDE for this user
          ide: { $last: { $arrayElemAt: ["$totals_by_ide.ide", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          user_login: "$_id",
          interactions: 1,
          suggestions: 1,
          acceptances: 1,
          loc_added: 1,
          ide: 1,
          acceptance_rate: {
            $cond: [
              { $gt: ["$suggestions", 0] },
              { $divide: ["$acceptances", "$suggestions"] },
              0,
            ],
          },
        },
      },
      { $sort: { interactions: -1 } },
    ]);
  }

  private static buildMatchQuery(filters: MetricsFilter) {
    const query: {
      day?: { $gte?: Date; $lte?: Date };
      "totals_by_feature.feature"?: string;
      user_login?: string;
    } = {};

    if (filters.startDate || filters.endDate) {
      query.day = {};
      if (filters.startDate) query.day.$gte = filters.startDate;
      if (filters.endDate) query.day.$lte = filters.endDate;
    }

    if (filters.segment) {
      // In seed data, we mapped section to feature: `section_${segment}`
      query["totals_by_feature.feature"] = `section_${filters.segment}`;
    }

    if (filters.userLogin) {
      query.user_login = filters.userLogin;
    }

    return query;
  }
}
