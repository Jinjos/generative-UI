export interface DataSchemaField {
  type: string;
  description: string;
  example?: string;
}

export const DATA_SCHEMA: Record<string, Record<string, DataSchemaField>> = {
  "User Identity": {
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
    }
  },
  "Dimensions (Breakdowns)": {
    "totals_by_ide": {
      "type": "array",
      "description": "Breakdown of activity by Editor. Object keys: { ide, ...metrics }.",
      "example": "[{ 'ide': 'vscode', 'loc_added_sum': 150 }]"
    },
    "totals_by_feature": {
      "type": "array",
      "description": "Breakdown by functional team or area. Object keys: { feature, ...metrics }. Feature names often start with 'section_' (e.g., 'section_Backend').",
      "example": "[{ 'feature': 'section_QA', 'interactions': 40 }]"
    },
    "totals_by_language_model": {
      "type": "array",
      "description": "Breakdown by Programming Language AND AI Model. Object keys: { language, model, ...metrics }.",
      "example": "[{ 'language': 'typescript', 'model': 'gpt-4o', 'acceptance_rate': 0.45 }]"
    }
  }
};
