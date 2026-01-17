export interface DataSchemaField {
  type: string;
  description: string;
  example?: string;
}

export const DATA_SCHEMA: Record<string, Record<string, DataSchemaField>> = {
  "User Identity": {
    "user_id": {
      "type": "number",
      "description": "Internal numeric user identifier."
    },
    "user_login": {
      "type": "string",
      "description": "The GitHub username/handle (e.g., 'brian_williams'). Primary key for user lookups."
    },
    "user_name": {
      "type": "string",
      "description": "Full human-readable name (e.g., 'Brian Williams'). Use this for display labels."
    },
    "enterprise_id": {
      "type": "string",
      "description": "Organization identifier."
    }
  },
  "Record Metadata": {
    "day": {
      "type": "string (ISO date)",
      "description": "UTC date for the metric record (e.g., 2026-01-06)."
    }
  },
  "Engagement Metrics": {
    "user_initiated_interaction_count": {
      "type": "number",
      "description": "Total number of chat messages or manual triggers sent by the user to the AI. Indicates 'Chat Volume'."
    },
    "code_generation_activity_count": {
      "type": "number",
      "description": "Number of times the AI suggested code. 'Suggestions'."
    },
    "code_acceptance_activity_count": {
      "type": "number",
      "description": "Number of times the user accepted an AI suggestion. 'Acceptances'."
    },
    "acceptance_rate": {
      "type": "number (percentage)",
      "description": "Computed metric: (Acceptances / Suggestions). Indicates 'Quality' or 'Efficiency'. High is better."
    },
    "used_agent": {
      "type": "boolean",
      "description": "True if the user utilized Agentic capabilities (autonomous tools) on this day."
    },
    "used_chat": {
      "type": "boolean",
      "description": "True if the user utilized standard Chat capabilities on this day."
    }
  },
  "Code Velocity Metrics": {
    "loc_added_sum": {
      "type": "number",
      "description": "Total lines of code added to the codebase by AI suggestions. 'Velocity' or 'Volume'."
    },
    "loc_deleted_sum": {
      "type": "number",
      "description": "Total lines of code removed/refactored by AI suggestions. Indicates 'Refactoring' or 'Cleanup'."
    },
    "loc_suggested_to_add_sum": {
      "type": "number",
      "description": "Total lines of code the AI *proposed* adding (before acceptance/rejection)."
    },
    "loc_suggested_to_delete_sum": {
      "type": "number",
      "description": "Total lines of code the AI *proposed* deleting (before acceptance/rejection)."
    }
  },
  "Dimensions (Breakdowns)": {
    "totals_by_ide": {
      "type": "array",
      "description": "Breakdown of activity by Editor. Object keys: { ide, user_initiated_interaction_count, code_generation_activity_count, code_acceptance_activity_count, loc_added_sum, loc_deleted_sum }.",
      "example": "[{ 'ide': 'vscode', 'user_initiated_interaction_count': 22, 'code_generation_activity_count': 33, 'code_acceptance_activity_count': 19, 'loc_added_sum': 190, 'loc_deleted_sum': 38 }]"
    },
    "totals_by_feature": {
      "type": "array",
      "description": "Breakdown by functional team or area. Object keys: { feature, user_initiated_interaction_count, code_generation_activity_count, code_acceptance_activity_count, loc_added_sum, loc_deleted_sum }. Feature names often start with 'section_' (e.g., 'section_Backend').",
      "example": "[{ 'feature': 'section_QA', 'user_initiated_interaction_count': 40, 'code_generation_activity_count': 55, 'code_acceptance_activity_count': 32, 'loc_added_sum': 120, 'loc_deleted_sum': 24 }]"
    },
    "totals_by_language_model": {
      "type": "array",
      "description": "Breakdown by Programming Language AND AI Model. Object keys: { language, model, user_initiated_interaction_count, code_generation_activity_count, code_acceptance_activity_count, loc_added_sum, loc_deleted_sum }.",
      "example": "[{ 'language': 'typescript', 'model': 'gpt-4o', 'user_initiated_interaction_count': 22, 'code_generation_activity_count': 33, 'code_acceptance_activity_count': 19, 'loc_added_sum': 190, 'loc_deleted_sum': 38 }]"
    },
    "totals_by_language_feature": {
      "type": "array",
      "description": "Breakdown by Programming Language and Feature. Object keys: { language, feature, user_initiated_interaction_count, code_generation_activity_count, code_acceptance_activity_count, loc_added_sum, loc_deleted_sum }.",
      "example": "[{ 'language': 'typescript', 'feature': 'section_Backend-Platform', 'user_initiated_interaction_count': 17, 'code_generation_activity_count': 25, 'code_acceptance_activity_count': 15, 'loc_added_sum': 150, 'loc_deleted_sum': 30 }]"
    },
    "totals_by_model_feature": {
      "type": "array",
      "description": "Breakdown by Model and Feature. Object keys: { model, feature, user_initiated_interaction_count, code_generation_activity_count, code_acceptance_activity_count, loc_added_sum, loc_deleted_sum }.",
      "example": "[{ 'model': 'gpt-4-turbo', 'feature': 'section_Architects', 'user_initiated_interaction_count': 7, 'code_generation_activity_count': 10, 'code_acceptance_activity_count': 6, 'loc_added_sum': 60, 'loc_deleted_sum': 12 }]"
    }
  }
};
