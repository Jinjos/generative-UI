export const DEMO_EXAMPLES = [
  // Example 1: The "Wow" Factor (Full Dashboard)
  {
    user: "Show me the trend of 'Active Users' over the last 30 days.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/trends?startDate={30_days_ago}" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?startDate={30_days_ago}", title: "30-Day Adoption Trend", chartSeries: [{ key: "active_users", label: "Daily Active Users", color: "#8b5cf6" }] }
          }
        }
      }
    ]
  },
  {
    user: "Compare the QA team vs. the Backend-Core team. Who has a higher code acceptance rate?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/summary" } },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "split",
            leftChart: {
              component: "CompareStatCard", 
              apiEndpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"QA\", \"segment\": \"QA\" }&entityB={ \"label\": \"Backend\", \"segment\": \"Backend-Core\" }&metricKey=acceptance_rate", 
              title: "Acceptance Rate Gap" 
            },
            rightChart: {
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/compare/trends?queries=[{\"label\":\"QA\",\"segment\":\"QA\"},{\"label\":\"Backend\",\"segment\":\"Backend-Core\"}]&metricKey=acceptance_rate", 
              title: "Daily Quality Comparison" 
            }
          }
        }
      }
    ]
  },
  {
    user: "Show me a full dashboard of our AI code adoption: I want to see total lines of code added vs. acceptance rate.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/summary" } },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "dashboard",
            headerStats: [{ title: "Active Users", apiEndpoint: "/api/metrics/summary", dataKey: "active_users_count" }],
            slotMain: { 
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/trends", 
              title: "Velocity vs Quality", 
              chartSeries: [
                { key: "loc_added", label: "Lines Added", color: "#10b981" },
                { key: "acceptance_rate", label: "Acceptance Rate", color: "#3b82f6" }
              ] 
            }
          }
        } 
      }
    ]
  },
  {
    user: "Who are my 'Power Users' (Top 5 by interaction count)?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/users?sortKey=interactions&sortOrder=desc&limit=5" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/users?sortKey=interactions&sortOrder=desc&limit=5", 
              title: "Top 5 Power Users", 
              tableColumns: [{ key: "user_login", label: "User" }, { key: "interactions", label: "Interactions", format: "number" }, { key: "acceptance_rate", label: "Quality", format: "percentage" }]
            }
          }
        }
      }
    ]
  }
];