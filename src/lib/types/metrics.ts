export interface MetricsFilter {
  startDate?: Date;
  endDate?: Date;
  segment?: string; // e.g., 'Frontend', 'Backend'
  userLogin?: string; // For auditing a specific developer
  model?: string;
  language?: string;
}

export interface CompareEntityConfig {
  label: string;
  segment?: string;
  userLogin?: string;
  model?: string;
  language?: string;
}

export interface SummaryResponse {
  total_interactions: number;
  total_suggestions: number;
  total_acceptances: number;
  total_loc_suggested_to_add: number;
  total_loc_suggested_to_delete: number;
  total_loc_added: number;
  total_loc_deleted: number;
  active_users_count: number;
  active_days: number;
  uses_agent: boolean;
  uses_chat: boolean;
  acceptance_rate: number;
}

export interface TrendResponse {
  date: string;
  active_users: number;
  interactions: number;
  suggestions: number;
  acceptances: number;
  acceptance_rate: number;
  loc_suggested_to_add: number;
  loc_suggested_to_delete: number;
  loc_added: number;
  loc_deleted: number;
}

export interface BreakdownResponse {
  name: string;
  feature?: string;
  model?: string;
  language?: string;
  ide?: string;
  interactions: number;
  acceptances: number;
  suggestions: number;
  loc_suggested_to_add: number;
  loc_suggested_to_delete: number;
  loc_added: number;
  loc_deleted: number;
  active_users_count: number;
  interactions_per_user: number;
  loc_added_per_user: number;
  agent_usage_rate: number;
  chat_usage_rate: number;
  acceptance_rate: number;
}

export interface NestedUsageMetric {
  feature?: string;
  model?: string;
  language?: string;
  ide?: string;
  user_initiated_interaction_count?: number;
  code_generation_activity_count?: number;
  code_acceptance_activity_count?: number;
  loc_suggested_to_add_sum?: number;
  loc_suggested_to_delete_sum?: number;
  loc_added_sum?: number;
  loc_deleted_sum?: number;
}

export interface UserListResponse {
  user_login: string;
  name: string;
  interactions: number;
  suggestions: number;
  acceptances: number;
  loc_suggested_to_add: number;
  loc_suggested_to_delete: number;
  loc_added: number;
  loc_deleted: number;
  ide: string;
  uses_agent: boolean;
  uses_chat: boolean;
  totals_by_feature: NestedUsageMetric[];
  totals_by_language_feature: NestedUsageMetric[];
  totals_by_model_feature: NestedUsageMetric[];
  totals_by_language_model: NestedUsageMetric[];
  totals_by_ide: NestedUsageMetric[];
  acceptance_rate: number;
}

export type BreakdownDimension =
  | "model"
  | "ide"
  | "feature"
  | "language_model"
  | "language_feature"
  | "model_feature";

export type BreakdownMetricKey =
  | "interactions"
  | "suggestions"
  | "acceptances"
  | "loc_suggested_to_add"
  | "loc_suggested_to_delete"
  | "loc_added"
  | "loc_deleted"
  | "acceptance_rate";

export interface BreakdownComparisonResponse {
  name: string;
  feature?: string;
  model?: string;
  language?: string;
  ide?: string;
  metric: BreakdownMetricKey;
  current_value: number;
  previous_value: number;
  delta: number;
  delta_pct: number;
}

export interface BreakdownStabilityResponse {
  name: string;
  feature?: string;
  model?: string;
  language?: string;
  ide?: string;
  metric: BreakdownMetricKey;
  avg_value: number;
  stddev_value: number;
  coefficient_variation: number;
  days: number;
}

export interface UserChangeResponse {
  user_login: string;
  name: string;
  metric: BreakdownMetricKey;
  current_value: number;
  previous_value: number;
  delta: number;
  delta_pct: number;
}

export interface UserFirstActiveResponse {
  user_login: string;
  name: string;
  first_day: string;
}

export interface UserUsageRateResponse {
  total_users: number;
  agent_user_rate: number;
  chat_user_rate: number;
  both_user_rate: number;
}
