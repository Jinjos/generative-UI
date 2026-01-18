import fs from "node:fs";
import { FEW_SHOT_EXAMPLES, FewShotExample } from "../src/config/ai/few-shot-examples";
// import { FEW_SHOT_EXAMPLES_2 } from "../src/config/ai/fewshots-examples-2";
import { DATA_SCHEMA, DataSchemaField } from "../src/config/ai/data-schema";

/**
 * Helper function to convert the JSON Schema object into a readable text format.
 * This teaches the model the "vocabulary" of your data during training.
 */
const buildSchemaText = () => {
  const schemaEntries = Object.entries(DATA_SCHEMA) as Array<
    [string, Record<string, DataSchemaField>]
  >;

  return schemaEntries.map(([category, fields]) => {
    // Iterate over fields in each category to create a list like "- key: description"
    const fieldLines = Object.entries(fields)
      .map(([key, meta]) => `- ${key}: ${meta.description}`)
      .join("\n");
    
    return `### ${category}\n${fieldLines}`;
  }).join("\n\n");
};

/**
 * The System Prompt used specifically for TRAINING.
 * It includes the full Schema rules so the model internalizes them.
 */
const TRAINING_SYSTEM_PROMPT = `You are the GenUI Orchestrator.

## Toolkit
1. get_metrics_summary
2. analyze_data_with_code
3. render_dashboard
4. get_segments

## Rules
1. Always call 'get_metrics_summary' first unless you need get_segments to discover valid team/segment values.
2. Output valid JSON matching the tool calls.
3. Use strict metric names from the dictionary below.
4. Use analyze_data_with_code only for calculations that require raw data.
5. End with render_dashboard and an optional short user-facing summary.
6. Split layout must include at least one SmartChart or SmartTable. Do not use KPIGrid on both sides.
7. If the user does not specify a timeframe, default to last 30 days (startDate={30_days_ago}&endDate={today}) unless they explicitly ask for all-time/lifetime.
8. When dateContext is available, replace date placeholders with YYYY-MM-DD values. Do not leave placeholders in endpoints.
9. For comparisons, use /api/metrics/compare/summary, /api/metrics/compare/trends, or /api/metrics/breakdown/compare.
10. For model/language comparisons, use /api/metrics/breakdown?by=language_model with filters.
11. Compare summary requires entityA/entityB with label and either segment or userLogin (no model/language in entityA/entityB).
12. Do not use by=team or segment=all.

## Data Dictionary
${buildSchemaText()}
`;

const ALL_EXAMPLES: FewShotExample[] = [...FEW_SHOT_EXAMPLES];

console.log(`Preparing training data from ${ALL_EXAMPLES.length} examples...`);

// Convert to OpenAI's JSONL format
// Structure: { messages: [ {role: system}, {role: user}, {role: assistant} ] }
const jsonlData = ALL_EXAMPLES.map((ex: FewShotExample) => {
  return JSON.stringify({
    messages: [
      { role: "system", content: TRAINING_SYSTEM_PROMPT }, // Context & Schema
      { role: "user", content: ex.user },                  // Input Query
      { role: "assistant", content: JSON.stringify(ex.tool_steps) } // Ideal Output
    ]
  });
}).join("\n");

// Write the file to disk
fs.writeFileSync("genui_finetune_master.jsonl", jsonlData);
console.log("✅ Done! File 'genui_finetune_master.jsonl' is ready for upload.");
