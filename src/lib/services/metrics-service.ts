import { UserMetric } from "../db/models";
import dbConnect from "../db/connect";

import type {
  MetricsFilter,
  CompareEntityConfig,
  SummaryResponse,
  TrendResponse,
  BreakdownResponse,
  UserListResponse,
  BreakdownDimension,
  BreakdownMetricKey,
  BreakdownComparisonResponse,
  BreakdownStabilityResponse,
  UserChangeResponse,
  UserFirstActiveResponse,
  UserUsageRateResponse,
} from "@/lib/types/metrics";

export class MetricsService {
  /**
   * Compares multiple entities (users/teams) for a specific metric over time.
   */
  static async getMultiSeriesTrends(
    entities: CompareEntityConfig[],
    metricKey: "interactions" | "loc_added" | "acceptance_rate" | "acceptances" | "suggestions",
    filters: Omit<MetricsFilter, "segment" | "userLogin"> = {}
  ) {
    await dbConnect();

    // Map internal schema keys
    const schemaKeyMap: Record<string, string> = {
      interactions: "$user_initiated_interaction_count",
      loc_added: "$loc_added_sum",
      suggestions: "$code_generation_activity_count",
      acceptances: "$code_acceptance_activity_count",
    };

    // Fetch trends for each entity in parallel
    const allTrends = await Promise.all(
      entities.map(async (entity) => {
        const query = this.buildMatchQuery({
          ...filters,
          ...(entity.segment ? { segment: entity.segment } : {}),
          ...(entity.userLogin ? { userLogin: entity.userLogin } : {}),
          ...(entity.model ? { model: entity.model } : {}),
          ...(entity.language ? { language: entity.language } : {}),
        });

        let data;
        if (metricKey === "acceptance_rate") {
          data = await UserMetric.aggregate([
            { $match: query },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$day" } },
                total_acceptances: { $sum: "$code_acceptance_activity_count" },
                total_suggestions: { $sum: "$code_generation_activity_count" },
              },
            },
            {
              $project: {
                _id: 1,
                value: {
                  $cond: [
                    { $gt: ["$total_suggestions", 0] },
                    { $multiply: [{ $divide: ["$total_acceptances", "$total_suggestions"] }, 100] },
                    0,
                  ],
                },
              },
            },
            { $sort: { _id: 1 } },
          ]);
        } else {
          const targetSchemaKey = schemaKeyMap[metricKey] || "$user_initiated_interaction_count";
          data = await UserMetric.aggregate([
            { $match: query },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$day" } },
                value: { $sum: targetSchemaKey },
              },
            },
            { $sort: { _id: 1 } },
          ]);
        }

        return { label: entity.label, data };
      })
    );

    // Merge by date
    const mergedMap: Record<string, Record<string, number | string>> = {};

    allTrends.forEach((series) => {
      series.data.forEach((point: { _id: string; value: number }) => {
        if (!mergedMap[point._id]) {
          mergedMap[point._id] = { date: point._id };
        }
        mergedMap[point._id][series.label] = point.value;
      });
    });

    return Object.values(mergedMap).sort((a, b) => (a.date as string).localeCompare(b.date as string));
  }

  /**
   * Compares exactly two entities for a summary metric.
   * Calculates the gap and identifies the leader.
   */
  static async getComparisonSummary(
    entityA: CompareEntityConfig,
    entityB: CompareEntityConfig,
    metricKey: "total_interactions" | "total_loc_added" | "acceptance_rate",
    filters: Omit<MetricsFilter, "segment" | "userLogin"> = {}
  ) {
    const summaryA = await this.getSummary({
      ...filters,
      ...(entityA.segment ? { segment: entityA.segment } : {}),
      ...(entityA.userLogin ? { userLogin: entityA.userLogin } : {}),
      ...(entityA.model ? { model: entityA.model } : {}),
      ...(entityA.language ? { language: entityA.language } : {}),
    });
    const summaryB = await this.getSummary({
      ...filters,
      ...(entityB.segment ? { segment: entityB.segment } : {}),
      ...(entityB.userLogin ? { userLogin: entityB.userLogin } : {}),
      ...(entityB.model ? { model: entityB.model } : {}),
      ...(entityB.language ? { language: entityB.language } : {}),
    });

    const valA = summaryA[metricKey] as number || 0;
    const valB = summaryB[metricKey] as number || 0;

    const higherVal = Math.max(valA, valB);
    const lowerVal = Math.min(valA, valB);
    
    let gap = 0;
    if (lowerVal > 0) {
      gap = ((higherVal - lowerVal) / lowerVal) * 100;
    } else if (higherVal > 0) {
      gap = 100; // 100% gap if one is 0
    }

    return {
      metric: metricKey,
      gap: parseFloat(gap.toFixed(1)),
      entityA: {
        label: entityA.label,
        value: valA,
        isHigher: valA >= valB && valA !== 0
      },
      entityB: {
        label: entityB.label,
        value: valB,
        isHigher: valB > valA
      }
    };
  }

  /**
   * Aggregates high-level KPIs for the StatCards
   */
  static async getSummary(filters: MetricsFilter = {}): Promise<SummaryResponse> {
    await dbConnect();
    const query = this.buildMatchQuery(filters);
    console.log("📊 [MetricsService] getSummary Query:", JSON.stringify(query));

    const result = await UserMetric.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total_interactions: { $sum: "$user_initiated_interaction_count" },
          total_suggestions: { $sum: "$code_generation_activity_count" },
          total_acceptances: { $sum: "$code_acceptance_activity_count" },
          total_loc_suggested_to_add: { $sum: "$loc_suggested_to_add_sum" },
          total_loc_suggested_to_delete: { $sum: "$loc_suggested_to_delete_sum" },
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
          total_loc_suggested_to_add: 1,
          total_loc_suggested_to_delete: 1,
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

    console.log("📊 [MetricsService] getSummary Result:", JSON.stringify(result[0] || "No Data"));
    return result[0] || {
      total_interactions: 0,
      total_suggestions: 0,
      total_acceptances: 0,
      total_loc_suggested_to_add: 0,
      total_loc_suggested_to_delete: 0,
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
  static async getDailyTrends(filters: MetricsFilter = {}): Promise<TrendResponse[]> {
    await dbConnect();
    const { model, language, ...baseFilters } = filters;
    const query = this.buildMatchQuery(baseFilters);
    console.log("📊 [MetricsService] getDailyTrends Query:", JSON.stringify(query));

    const nestedMatch: Record<string, string> = {};
    if (model) nestedMatch["totals_by_language_model.model"] = model;
    if (language) nestedMatch["totals_by_language_model.language"] = language;

    if (model || language) {
      return await UserMetric.aggregate([
        { $match: query },
        { $unwind: "$totals_by_language_model" },
        ...(Object.keys(nestedMatch).length ? [{ $match: nestedMatch }] : []),
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$day" } },
            active_users: { $addToSet: "$user_id" },
            interactions: { $sum: "$totals_by_language_model.user_initiated_interaction_count" },
            suggestions: { $sum: "$totals_by_language_model.code_generation_activity_count" },
            acceptances: { $sum: "$totals_by_language_model.code_acceptance_activity_count" },
            loc_suggested_to_add: { $sum: "$totals_by_language_model.loc_suggested_to_add_sum" },
            loc_suggested_to_delete: { $sum: "$totals_by_language_model.loc_suggested_to_delete_sum" },
            loc_added: { $sum: "$totals_by_language_model.loc_added_sum" },
            loc_deleted: { $sum: "$totals_by_language_model.loc_deleted_sum" },
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
            loc_suggested_to_add: 1,
            loc_suggested_to_delete: 1,
            loc_added: 1,
            loc_deleted: 1,
            acceptance_rate: {
              $cond: [
                { $gt: ["$suggestions", 0] },
                { $divide: ["$acceptances", "$suggestions"] },
                0,
              ],
            },
          },
        },
        { $sort: { date: 1 } },
      ]);
    }

    return await UserMetric.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$day" } },
          active_users: { $addToSet: "$user_id" },
          interactions: { $sum: "$user_initiated_interaction_count" },
          suggestions: { $sum: "$code_generation_activity_count" },
          acceptances: { $sum: "$code_acceptance_activity_count" },
          loc_suggested_to_add: { $sum: "$loc_suggested_to_add_sum" },
          loc_suggested_to_delete: { $sum: "$loc_suggested_to_delete_sum" },
          loc_added: { $sum: "$loc_added_sum" },
          loc_deleted: { $sum: "$loc_deleted_sum" },
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
          loc_suggested_to_add: 1,
          loc_suggested_to_delete: 1,
          loc_added: 1,
          loc_deleted: 1,
          acceptance_rate: {
            $cond: [
              { $gt: ["$suggestions", 0] },
              { $divide: ["$acceptances", "$suggestions"] },
              0,
            ],
          },
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  /**
   * Pivots data by a dimension (e.g., 'model' or 'ide')
   */
  static async getBreakdown(dimension: BreakdownDimension, filters: MetricsFilter = {}): Promise<BreakdownResponse[]> {
    await dbConnect();
    const { model, language, ...baseFilters } = filters;
    const query = this.buildMatchQuery(baseFilters);

    const configs: Record<BreakdownDimension, {
      arrayPath: string;
      groupId: Record<string, string>;
      nameExpression: Record<string, unknown> | string;
      idFields: Array<"feature" | "model" | "language" | "ide">;
    }> = {
      ide: {
        arrayPath: "$totals_by_ide",
        groupId: { ide: "$totals_by_ide.ide" },
        nameExpression: "$_id.ide",
        idFields: ["ide"],
      },
      model: {
        arrayPath: "$totals_by_language_model",
        groupId: { model: "$totals_by_language_model.model" },
        nameExpression: "$_id.model",
        idFields: ["model"],
      },
      feature: {
        arrayPath: "$totals_by_feature",
        groupId: { feature: "$totals_by_feature.feature" },
        nameExpression: "$_id.feature",
        idFields: ["feature"],
      },
      language_model: {
        arrayPath: "$totals_by_language_model",
        groupId: {
          language: "$totals_by_language_model.language",
          model: "$totals_by_language_model.model",
        },
        nameExpression: { $concat: ["$_id.language", " | ", "$_id.model"] },
        idFields: ["language", "model"],
      },
      language_feature: {
        arrayPath: "$totals_by_language_feature",
        groupId: {
          language: "$totals_by_language_feature.language",
          feature: "$totals_by_language_feature.feature",
        },
        nameExpression: { $concat: ["$_id.language", " | ", "$_id.feature"] },
        idFields: ["language", "feature"],
      },
      model_feature: {
        arrayPath: "$totals_by_model_feature",
        groupId: {
          model: "$totals_by_model_feature.model",
          feature: "$totals_by_model_feature.feature",
        },
        nameExpression: { $concat: ["$_id.model", " | ", "$_id.feature"] },
        idFields: ["model", "feature"],
      },
    };

    const config = configs[dimension];
    const arrayPath = config.arrayPath;
    const elementMatch: Record<string, string> = {};

    if (model && (dimension === "model" || dimension === "language_model" || dimension === "model_feature")) {
      elementMatch[`${arrayPath}.model`] = model;
    }

    if (language && (dimension === "language_model" || dimension === "language_feature")) {
      elementMatch[`${arrayPath}.language`] = language;
    }

    const idProjects = config.idFields.reduce<Record<string, unknown>>((acc, field) => {
      acc[field] = `$_id.${field}`;
      return acc;
    }, {});

    return await UserMetric.aggregate([
      { $match: query },
      { $unwind: arrayPath },
      ...(Object.keys(elementMatch).length ? [{ $match: elementMatch }] : []),
      {
        $group: {
          _id: config.groupId,
          interactions: { $sum: `${arrayPath}.user_initiated_interaction_count` },
          suggestions: { $sum: `${arrayPath}.code_generation_activity_count` },
          acceptances: { $sum: `${arrayPath}.code_acceptance_activity_count` },
          loc_suggested_to_add: { $sum: `${arrayPath}.loc_suggested_to_add_sum` },
          loc_suggested_to_delete: { $sum: `${arrayPath}.loc_suggested_to_delete_sum` },
          loc_added: { $sum: `${arrayPath}.loc_added_sum` },
          loc_deleted: { $sum: `${arrayPath}.loc_deleted_sum` },
          unique_users: { $addToSet: "$user_id" },
          agent_usage_rate: { $avg: { $cond: ["$used_agent", 1, 0] } },
          chat_usage_rate: { $avg: { $cond: ["$used_chat", 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          name: config.nameExpression,
          ...idProjects,
          interactions: 1,
          suggestions: 1,
          acceptances: 1,
          loc_suggested_to_add: 1,
          loc_suggested_to_delete: 1,
          loc_added: 1,
          loc_deleted: 1,
          active_users_count: { $size: "$unique_users" },
          interactions_per_user: {
            $cond: [
              { $gt: [{ $size: "$unique_users" }, 0] },
              { $divide: ["$interactions", { $size: "$unique_users" }] },
              0,
            ],
          },
          loc_added_per_user: {
            $cond: [
              { $gt: [{ $size: "$unique_users" }, 0] },
              { $divide: ["$loc_added", { $size: "$unique_users" }] },
              0,
            ],
          },
          agent_usage_rate: 1,
          chat_usage_rate: 1,
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
   * Compares grouped breakdown metrics between two time ranges.
   */
  static async getBreakdownComparison(
    dimension: BreakdownDimension,
    metricKey: BreakdownMetricKey,
    currentFilters: MetricsFilter = {},
    compareFilters: MetricsFilter = {}
  ): Promise<BreakdownComparisonResponse[]> {
    const current = await this.getBreakdown(dimension, currentFilters);
    const previous = await this.getBreakdown(dimension, compareFilters);

    const previousMap = new Map(previous.map((item) => [item.name, item]));

    return current.map((item) => {
      const previousItem = previousMap.get(item.name);
      const currentValue = Number(item[metricKey as keyof BreakdownResponse] ?? 0);
      const previousValue = Number(previousItem?.[metricKey as keyof BreakdownResponse] ?? 0);
      const delta = currentValue - previousValue;
      const deltaPct = previousValue > 0 ? delta / previousValue : (currentValue > 0 ? 1 : 0);

      return {
        name: item.name,
        feature: item.feature,
        model: item.model,
        language: item.language,
        ide: item.ide,
        metric: metricKey,
        current_value: currentValue,
        previous_value: previousValue,
        delta,
        delta_pct: deltaPct,
      };
    });
  }

  /**
   * Calculates stability (variance) for a breakdown dimension across days.
   */
  static async getBreakdownStability(
    dimension: BreakdownDimension,
    metricKey: BreakdownMetricKey,
    filters: MetricsFilter = {}
  ): Promise<BreakdownStabilityResponse[]> {
    await dbConnect();
    const { model, language, ...baseFilters } = filters;
    const query = this.buildMatchQuery(baseFilters);

    const configs: Record<BreakdownDimension, {
      arrayPath: string;
      groupId: Record<string, string>;
      nameExpression: Record<string, unknown> | string;
      idFields: Array<"feature" | "model" | "language" | "ide">;
    }> = {
      ide: {
        arrayPath: "$totals_by_ide",
        groupId: { ide: "$totals_by_ide.ide" },
        nameExpression: "$_id.ide",
        idFields: ["ide"],
      },
      model: {
        arrayPath: "$totals_by_language_model",
        groupId: { model: "$totals_by_language_model.model" },
        nameExpression: "$_id.model",
        idFields: ["model"],
      },
      feature: {
        arrayPath: "$totals_by_feature",
        groupId: { feature: "$totals_by_feature.feature" },
        nameExpression: "$_id.feature",
        idFields: ["feature"],
      },
      language_model: {
        arrayPath: "$totals_by_language_model",
        groupId: {
          language: "$totals_by_language_model.language",
          model: "$totals_by_language_model.model",
        },
        nameExpression: { $concat: ["$_id.language", " | ", "$_id.model"] },
        idFields: ["language", "model"],
      },
      language_feature: {
        arrayPath: "$totals_by_language_feature",
        groupId: {
          language: "$totals_by_language_feature.language",
          feature: "$totals_by_language_feature.feature",
        },
        nameExpression: { $concat: ["$_id.language", " | ", "$_id.feature"] },
        idFields: ["language", "feature"],
      },
      model_feature: {
        arrayPath: "$totals_by_model_feature",
        groupId: {
          model: "$totals_by_model_feature.model",
          feature: "$totals_by_model_feature.feature",
        },
        nameExpression: { $concat: ["$_id.model", " | ", "$_id.feature"] },
        idFields: ["model", "feature"],
      },
    };

    const config = configs[dimension];
    const arrayPath = config.arrayPath;
    const elementMatch: Record<string, string> = {};

    if (model && (dimension === "model" || dimension === "language_model" || dimension === "model_feature")) {
      elementMatch[`${arrayPath}.model`] = model;
    }

    if (language && (dimension === "language_model" || dimension === "language_feature")) {
      elementMatch[`${arrayPath}.language`] = language;
    }

    const idProjects = config.idFields.reduce<Record<string, unknown>>((acc, field) => {
      acc[field] = `$_id.${field}`;
      return acc;
    }, {});

    const projectedGroupId = config.idFields.reduce<Record<string, unknown>>((acc, field) => {
      acc[field] = `$${field}`;
      return acc;
    }, {});

    const valueExpression = metricKey === "acceptance_rate"
      ? {
          $cond: [
            { $gt: ["$suggestions", 0] },
            { $divide: ["$acceptances", "$suggestions"] },
            0,
          ],
        }
      : `$${metricKey}`;

    return await UserMetric.aggregate([
      { $match: query },
      { $unwind: arrayPath },
      ...(Object.keys(elementMatch).length ? [{ $match: elementMatch }] : []),
      {
        $group: {
          _id: {
            ...config.groupId,
            date: { $dateToString: { format: "%Y-%m-%d", date: "$day" } },
          },
          interactions: { $sum: `${arrayPath}.user_initiated_interaction_count` },
          suggestions: { $sum: `${arrayPath}.code_generation_activity_count` },
          acceptances: { $sum: `${arrayPath}.code_acceptance_activity_count` },
          loc_suggested_to_add: { $sum: `${arrayPath}.loc_suggested_to_add_sum` },
          loc_suggested_to_delete: { $sum: `${arrayPath}.loc_suggested_to_delete_sum` },
          loc_added: { $sum: `${arrayPath}.loc_added_sum` },
          loc_deleted: { $sum: `${arrayPath}.loc_deleted_sum` },
        },
      },
      {
        $project: {
          _id: 0,
          ...idProjects,
          value: valueExpression,
        },
      },
      {
        $group: {
          _id: projectedGroupId,
          avg_value: { $avg: "$value" },
          stddev_value: { $stdDevPop: "$value" },
          days: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: config.nameExpression,
          ...idProjects,
          metric: metricKey,
          avg_value: 1,
          stddev_value: 1,
          coefficient_variation: {
            $cond: [
              { $gt: ["$avg_value", 0] },
              { $divide: ["$stddev_value", "$avg_value"] },
              0,
            ],
          },
          days: 1,
        },
      },
      { $sort: { coefficient_variation: 1 } },
    ]);
  }

  /**
   * Computes per-user deltas between two periods for a chosen metric.
   */
  static async getUserChange(
    metricKey: BreakdownMetricKey,
    currentFilters: MetricsFilter = {},
    compareFilters: MetricsFilter = {}
  ): Promise<UserChangeResponse[]> {
    const current = await this.getUsersList(currentFilters);
    const previous = await this.getUsersList(compareFilters);

    const previousMap = new Map(previous.map((item) => [item.user_login, item]));

    return current.map((item) => {
      const previousItem = previousMap.get(item.user_login);
      const currentValue = Number(item[metricKey as keyof UserListResponse] ?? 0);
      const previousValue = Number(previousItem?.[metricKey as keyof UserListResponse] ?? 0);
      const delta = currentValue - previousValue;
      const deltaPct = previousValue > 0 ? delta / previousValue : (currentValue > 0 ? 1 : 0);

      return {
        user_login: item.user_login,
        name: item.name,
        metric: metricKey,
        current_value: currentValue,
        previous_value: previousValue,
        delta,
        delta_pct: deltaPct,
      };
    });
  }

  /**
   * Finds users whose first activity falls within a given range.
   */
  static async getUsersFirstActive(filters: MetricsFilter = {}): Promise<UserFirstActiveResponse[]> {
    await dbConnect();
    const { startDate, endDate, ...baseFilters } = filters;
    const query = this.buildMatchQuery(baseFilters);
    const dateMatch: { first_day?: { $gte?: Date; $lte?: Date } } = {};

    if (startDate || endDate) {
      dateMatch.first_day = {};
      if (startDate) dateMatch.first_day.$gte = startDate;
      if (endDate) dateMatch.first_day.$lte = endDate;
    }

    const result = await UserMetric.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$user_login",
          name: { $first: "$user_name" },
          first_day: { $min: "$day" },
        },
      },
      ...(dateMatch.first_day ? [{ $match: dateMatch }] : []),
      {
        $project: {
          _id: 0,
          user_login: "$_id",
          name: { $ifNull: ["$name", "$_id"] },
          first_day: { $dateToString: { format: "%Y-%m-%d", date: "$first_day" } },
        },
      },
      { $sort: { first_day: -1 } },
    ]);

    return result as UserFirstActiveResponse[];
  }

  /**
   * Calculates user-level adoption rates for Agent and Chat usage.
   */
  static async getUsersUsageRates(filters: MetricsFilter = {}): Promise<UserUsageRateResponse> {
    await dbConnect();
    const query = this.buildMatchQuery(filters);

    const result = await UserMetric.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$user_id",
          used_agent: { $max: "$used_agent" },
          used_chat: { $max: "$used_chat" },
        },
      },
      {
        $group: {
          _id: null,
          total_users: { $sum: 1 },
          agent_users: { $sum: { $cond: ["$used_agent", 1, 0] } },
          chat_users: { $sum: { $cond: ["$used_chat", 1, 0] } },
          both_users: { $sum: { $cond: [{ $and: ["$used_agent", "$used_chat"] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          total_users: 1,
          agent_user_rate: {
            $cond: [{ $gt: ["$total_users", 0] }, { $divide: ["$agent_users", "$total_users"] }, 0],
          },
          chat_user_rate: {
            $cond: [{ $gt: ["$total_users", 0] }, { $divide: ["$chat_users", "$total_users"] }, 0],
          },
          both_user_rate: {
            $cond: [{ $gt: ["$total_users", 0] }, { $divide: ["$both_users", "$total_users"] }, 0],
          },
        },
      },
    ]);

    return (result[0] || {
      total_users: 0,
      agent_user_rate: 0,
      chat_user_rate: 0,
      both_user_rate: 0,
    }) as UserUsageRateResponse;
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
  static async getUsersList(filters: MetricsFilter = {}): Promise<UserListResponse[]> {
    await dbConnect();
    const query = this.buildMatchQuery(filters);
    console.log("📊 [MetricsService] getUsersList Query:", JSON.stringify(query));

    return await UserMetric.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$user_login",
          name: { $first: "$user_name" }, // Capture the real name
          interactions: { $sum: "$user_initiated_interaction_count" },
          suggestions: { $sum: "$code_generation_activity_count" },
          acceptances: { $sum: "$code_acceptance_activity_count" },
          loc_suggested_to_add: { $sum: "$loc_suggested_to_add_sum" },
          loc_suggested_to_delete: { $sum: "$loc_suggested_to_delete_sum" },
          loc_added: { $sum: "$loc_added_sum" },
          loc_deleted: { $sum: "$loc_deleted_sum" },
          // Capture the last known IDE for this user
          ide: { $last: { $arrayElemAt: ["$totals_by_ide.ide", 0] } },
          uses_agent: { $max: "$used_agent" },
          uses_chat: { $max: "$used_chat" },
          // Accumulate all nested arrays for deep analysis (Code Interpreter)
          totals_by_language_model: { $push: "$totals_by_language_model" },
          totals_by_ide: { $push: "$totals_by_ide" },
          totals_by_feature: { $push: "$totals_by_feature" },
          totals_by_language_feature: { $push: "$totals_by_language_feature" },
          totals_by_model_feature: { $push: "$totals_by_model_feature" }
        },
      },
      {
        $project: {
          _id: 0,
          user_login: "$_id",
          name: { $ifNull: ["$name", "$_id"] }, // Fallback to login if name missing
          interactions: 1,
          suggestions: 1,
          acceptances: 1,
          loc_suggested_to_add: 1,
          loc_suggested_to_delete: 1,
          loc_added: 1,
          loc_deleted: 1,
          ide: 1,
          uses_agent: 1,
          uses_chat: 1,
          // Flatten the accumulated arrays (since $push creates array of arrays)
          totals_by_language_model: {
            $reduce: {
              input: "$totals_by_language_model",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] }
            }
          },
          totals_by_ide: {
            $reduce: {
              input: "$totals_by_ide",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] }
            }
          },
          totals_by_feature: {
            $reduce: {
              input: "$totals_by_feature",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] }
            }
          },
          totals_by_language_feature: {
            $reduce: {
              input: "$totals_by_language_feature",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] }
            }
          },
          totals_by_model_feature: {
            $reduce: {
              input: "$totals_by_model_feature",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] }
            }
          },
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
      "totals_by_feature.feature"?: string | { $regex: RegExp };
      "totals_by_language_model.model"?: string;
      "totals_by_language_model.language"?: string;
      user_login?: string;
    } = {};

    if (filters.startDate || filters.endDate) {
      query.day = {};
      if (filters.startDate) query.day.$gte = filters.startDate;
      if (filters.endDate) query.day.$lte = filters.endDate;
    }

    if (filters.segment) {
      // Fuzzy match for segments (e.g., 'Backend' -> matches 'section_Backend-Core', 'section_Backend-Platform')
      // We escape special characters to be safe, though segment names are usually simple.
      const safeSegment = filters.segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query["totals_by_feature.feature"] = { $regex: new RegExp(safeSegment, 'i') };
    }

    if (filters.userLogin) {
      query.user_login = filters.userLogin;
    }

    if (filters.model) {
      query["totals_by_language_model.model"] = filters.model;
    }

    if (filters.language) {
      query["totals_by_language_model.language"] = filters.language;
    }

    return query;
  }
}
