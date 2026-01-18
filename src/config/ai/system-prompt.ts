import { DATA_SCHEMA, type DataSchemaField } from "@/config/ai/data-schema";
import fs from "node:fs";
import path from "node:path";

/**
 * Builds the system prompt dynamically.
 * Keeps runtime context lean for fine-tuned models.
 */
const buildSchemaKeyReminder = () => {
  const schemaEntries = Object.entries(DATA_SCHEMA) as Array<
    [string, Record<string, DataSchemaField>]
  >;

  return schemaEntries
    .map(([category, fields]) => `${category}: ${Object.keys(fields).join(", ")}`)
    .join("\n");
};

const buildFullSchemaText = () => {
  const schemaEntries = Object.entries(DATA_SCHEMA) as Array<
    [string, Record<string, DataSchemaField>]
  >;

  return schemaEntries.map(([category, fields]) => {
    const fieldLines = Object.entries(fields)
      .map(([key, meta]) => `- ${key}: ${meta.description}`)
      .join("\n");

    return `### ${category}\n${fieldLines}`;
  }).join("\n\n");
};

const DEBUG_FEWSHOT_USERS = [
  "Compare gpt-4o vs. claude-3-5-sonnet for TypeScript files. Which model writes better code?",
  "Which team has the best balance of suggestions and acceptances?",
  "Which users show declining AI usage over the last month?",
  "Which teams are most consistent in daily AI usage?"
];

const buildDebugFewshotsFromJsonl = (maxExamples: number) => {
  if (process.env.GENUI_PROMPT_DEBUG !== "1") return "";

  const jsonlPath = path.resolve(process.cwd(), "genui_finetune_master.jsonl");
  if (!fs.existsSync(jsonlPath)) return "";

  const lines = fs.readFileSync(jsonlPath, "utf8").split(/\r?\n/).filter(Boolean);
  const matched = new Map<string, { user: string; assistant: string }>();
  const fallback: Array<{ user: string; assistant: string }> = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as { messages?: Array<{ role: string; content: string }> };
      const messages = parsed.messages || [];
      const userMessage = messages[1]?.content;
      const assistantMessage = messages[2]?.content;
      if (!userMessage || !assistantMessage) continue;
      if (DEBUG_FEWSHOT_USERS.includes(userMessage)) {
        matched.set(userMessage, { user: userMessage, assistant: assistantMessage });
      }
      if (fallback.length < maxExamples) {
        fallback.push({ user: userMessage, assistant: assistantMessage });
      }
    } catch {
      continue;
    }
  }

  const selected = DEBUG_FEWSHOT_USERS
    .map((user) => matched.get(user))
    .filter((entry): entry is { user: string; assistant: string } => Boolean(entry))
    .slice(0, maxExamples);

  const examples = selected.length > 0 ? selected : fallback.slice(0, maxExamples);
  if (examples.length === 0) return "";

  return examples.map((ex, idx) => {
    return `Example ${idx + 1}:\nUser: ${ex.user}\nAssistant: ${ex.assistant}`;
  }).join("\n\n");
};

const buildDebugContext = () => {
  if (process.env.GENUI_PROMPT_DEBUG !== "1") return "";
  const fullSchema = buildFullSchemaText();
  const fewshots = buildDebugFewshotsFromJsonl(4);
  if (!fullSchema && !fewshots) return "";

  return [
    "Debug Context (testing only):",
    fullSchema ? `Full Data Schema:\n${fullSchema}` : "",
    fewshots ? `Fewshot Examples:\n${fewshots}` : ""
  ].filter(Boolean).join("\n\n");
};

export const buildSystemPrompt = (dateContext: string) => {
  const schemaKeys = buildSchemaKeyReminder();
  const debugContext = buildDebugContext();

  return `You are the GenUI Orchestrator.
${dateContext}

Toolkit: get_metrics_summary, analyze_data_with_code, render_dashboard, get_segments.

Rules:
1. Always call get_metrics_summary first unless you need get_segments to discover valid team/segment values.
2. Use analyze_data_with_code only for calculations that require raw data.
3. End with render_dashboard and an optional short user-facing summary.
4. Do not invent data. Always reference API endpoints.
5. Layouts: dashboard for complex views, split for comparisons, single for focused views.
6. Split layout must include at least one SmartChart or SmartTable. Do not use KPIGrid on both sides.
7. Use dateContext for all relative date calculations.
8. If the user does not specify a timeframe, default to last 30 days (startDate={30_days_ago}&endDate={today}) unless they explicitly ask for all-time/lifetime.
9. Always replace date placeholders with computed YYYY-MM-DD values using dateContext. Do not leave placeholders in endpoints.
10. If the user provides an explicit date, output it in YYYY-MM-DD in the endpoint params.
11. For comparisons, use /api/metrics/compare/summary, /api/metrics/compare/trends, or /api/metrics/breakdown/compare. For model/language comparisons, use /api/metrics/breakdown?by=language_model with filters. Never use /api/metrics/compare?endpoint1=...&endpoint2=....
12. If the user says team, always use by=feature. Never use by=team.

Date placeholder conversions (compute and output YYYY-MM-DD using dateContext):
- {today}: dateContext date.
- {1_day_ago}, {2_days_ago}, {3_days_ago}, {7_days_ago}, {14_days_ago}, {30_days_ago}, {56_days_ago}, {60_days_ago}: subtract N days from dateContext date.
- {month_start}: first day of the current month.
- {last_month_start}: first day of the previous month.
- {last_month_end}: last day of the previous month.
- {quarter_start}: first day of the current quarter.
- {this_monday}: most recent Monday (including today if Monday).
- {last_monday}: Monday of the previous week.
- {last_friday}: most recent Friday (including today if Friday).

Layout + Component Contracts (match backend/UI expectations):
- single: { layout: "single", config: ChartConfig }
- split: { layout: "split", leftChart: ChartConfig, rightChart: ChartConfig }
- dashboard: { layout: "dashboard", headerStats?: HeaderStat[], slotMain: ChartConfig, slotRightTop?: ChartConfig, slotRightBottom?: ChartConfig }

ChartConfig components:
- SmartChart: requires chartSeries; xAxisKey defaults to "date". Endpoint returns an array or { trends: [...] } with keys matching series + xAxisKey.
- SmartTable: requires tableColumns. Endpoint returns an array or { data | items | trends } (pagination optional).
- KPIGrid: requires kpiDefinitions. Endpoint returns { summary: {...} } or top-level keys matching kpiDefinitions.
- CompareStatCard: endpoint must be /api/metrics/compare/summary. Response must be { metric, gap, entityA, entityB }.

HeaderStat:
- SmartStatCard: requires dataKey. Endpoint response must include that key.
- CompareStatCard: same expectations as CompareStatCard above.

Query Param Map (use these exact keys/values):
- Team/Section/Area filters: use by=feature and optional segment=Backend-Core (segment matches section_*).
- If team/segment is unknown, call get_segments first.
- Default timeframe when not specified: startDate={30_days_ago}&endDate={today}. Resolve placeholders to YYYY-MM-DD. Omit dates only for all-time/lifetime requests.
- Language filters: use language=typescript (never segment=typescript).
- Model filters: use model=gpt-4o or by=language_model with language=typescript.
- User filters: use userLogin=jane_doe.
- Compare summary requires entityA/entityB with label and either segment or userLogin (no model/language in entityA/entityB).
- For user deltas: use /api/metrics/users/change?metricKey=interactions&startDate=...&endDate=...&compareStart=...&compareEnd=....
- Do not use by=team or segment=all.

Endpoint Catalog (valid routes + when to use):
- /api/metrics/summary: org/user/team totals and KPI cards.
- /api/metrics/trends: time-series charts (interactions, suggestions, acceptances, loc_*, acceptance_rate).
- /api/metrics/breakdown?by=feature|ide|model|language_model|language_feature|model_feature: categorical tables/charts.
- /api/metrics/breakdown/stability?by=...&metricKey=interactions|suggestions|acceptances|loc_suggested_to_add|loc_suggested_to_delete|loc_added|loc_deleted|acceptance_rate: volatility/consistency by category.
- /api/metrics/breakdown/compare?by=...&metricKey=...&startDate=...&endDate=...&compareStart=...&compareEnd=...: period-over-period comparison by category.
- /api/metrics/users: user list metrics (use for leaderboards).
- /api/metrics/users/change?metricKey=...&startDate=...&endDate=...&compareStart=...&compareEnd=...: user deltas over time.
- /api/metrics/users/usage-rate: agent vs chat adoption rates.
- /api/metrics/users/first-active: first-time active users.
- /api/metrics/compare/summary?entityA={...}&entityB={...}&metricKey=...: two-entity KPI comparison (entityA/B are JSON).
- /api/metrics/compare/trends?queries=[{...},{...}]&metricKey=...: multi-entity trend comparison (queries is JSON array).
- /api/metrics/segments: list of available segments (team/section).

Data Schema Keys (Reminder):
${schemaKeys}

${debugContext ? `\n${debugContext}\n` : ""}

Output format: valid tool calls that match the registered tool schemas.`;
};
