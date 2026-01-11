/**
 * ARCHITECTURE NOTE: THE INTERFACE CONTRACT
 * 
 * This file defines the "Eyes" of the Agent. The LLM reads these Zod schemas 
 * to understand what UI components are available and what parameters they accept.
 * 
 * IMPORTANT:
 * - Use .describe() on every field. This is the only way the LLM knows what 
 *   an 'apiEndpoint' or 'dataKey' actually does.
 * - Use z.discriminatedUnion for layouts. This ensures the Agent cannot 
 *   mix-and-match properties from different layouts (e.g. adding 'leftChart' 
 *   to a 'single' layout).
 */

import { z } from "zod";

// Base Chart Configuration
export const ChartConfigSchema = z.object({
  component: z.enum(["SmartChart", "KPIGrid", "SmartTable", "CompareStatCard"]),
  apiEndpoint: z.string().describe("The API endpoint to fetch data from (e.g., /api/metrics/summary)"),
  title: z.string().describe("The title of the chart or grid"),
  filter: z.string().optional().describe("Optional time period label (e.g., '15 Days', 'Month')"),
  description: z.string().optional().describe("A brief description for the user"),
  
  // KPI Config
  kpiDefinitions: z.array(z.object({
    key: z.string().describe("The JSON key in the response summary object (e.g., 'total_hours_saved')"),
    label: z.string().describe("The human-readable label (e.g., 'Hours Saved')"),
    format: z.enum(["number", "currency", "suffix_k"]).optional(),
  })).optional().describe("Required only if component is KPIGrid"),
  
  // Chart Config
  xAxisKey: z.string().optional().describe("Key for the X Axis (e.g., 'date'). Defaults to 'date'"),
  chartSeries: z.array(z.object({
    key: z.string().describe("The JSON key to plot (e.g., 'estimated_hours_saved')"),
    label: z.string().describe("Label for the legend"),
    color: z.string().describe("Hex color for the line/area"),
  })).optional().describe("Required if component is SmartChart"),

  // Table Config
  tableColumns: z.array(z.object({
    key: z.string().describe("The JSON key for the column data"),
    label: z.string().describe("Column Header Label"),
    format: z.enum(["number","percentage","date", "currency", "status"]).optional()
  })).optional().describe("Required if component is SmartTable"),
});

export type ChartConfig = z.infer<typeof ChartConfigSchema>;

// New: Header Stat Schema (Smart)
export const HeaderStatSchema = z.object({
  component: z.enum(["SmartStatCard", "CompareStatCard"]).optional().default("SmartStatCard"),
  title: z.string().describe("Label for the stat (e.g., 'Total Users')"),
  apiEndpoint: z.string().describe("The API endpoint to fetch the value from"),
  dataKey: z.string().optional().describe("The JSON key for the value (Required for SmartStatCard)"),
  filter: z.string().optional().describe("Time filter label (e.g., 'Month')"),
});

// Discriminated Union for Layouts
export const DashboardToolSchema = z.discriminatedUnion("layout", [
  z.object({
    layout: z.literal("single"),
    config: ChartConfigSchema,
  }),
  z.object({
    layout: z.literal("split"),
    leftChart: ChartConfigSchema,
    rightChart: ChartConfigSchema,
  }),
  // New Full Dashboard Layout
  z.object({
    layout: z.literal("dashboard"),
    headerStats: z.array(HeaderStatSchema).max(4).optional(),
    slotMain: ChartConfigSchema, // The center component
  }),
]);

export type DashboardTool = z.infer<typeof DashboardToolSchema>;
