import { FewShotExample } from "./few-shot-examples";

export const ANALYST_FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    user: "What am I looking at?",
    tool_steps: [
      {
        tool: "get_current_page_view",
        args: {},
      },
    ],
  },
  {
    user: "Why is the trend dipping at the end?",
    tool_steps: [
      {
        tool: "get_current_page_view",
        args: {},
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate=2023-09-01", // Extracted from Beacon
          code: "const last3 = data.slice(-3); return { last3 };"
        }
      }
    ],
  },
  {
    user: "What is the average acceptance rate shown here?",
    tool_steps: [
      {
        tool: "get_current_page_view",
        args: {},
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/summary",
          code: "return { avg_rate: data.acceptance_rate };"
        }
      }
    ]
  }
];
