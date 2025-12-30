import { z } from "zod";

// Base Chart Configuration
const ChartConfigSchema = z.object({
  component: z.enum(["SmartChart", "KPIGrid", "SmartTable"]),
  apiEndpoint: z.string().describe("The API endpoint to fetch data from (e.g., /api/github/usage)"),
  title: z.string().describe("The title of the chart or grid"),
  description: z.string().optional().describe("A brief description for the user"),
  
  // KPI Config
  kpiDefinitions: z.array(z.object({
    key: z.string().describe("The JSON key in the response summary object (e.g., 'total_hours_saved')"),
    label: z.string().describe("The human-readable label (e.g., 'Hours Saved')"),
    accent: z.string().describe("Hex color code for the accent"),
    format: z.enum(["number", "currency", "suffix_k"]).optional(),
    trendKey: z.string().optional().describe("Key for trend percentage if available")
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
    format: z.enum(["date", "currency", "status"]).optional()
  })).optional().describe("Required if component is SmartTable"),
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
]);

export type DashboardTool = z.infer<typeof DashboardToolSchema>;
