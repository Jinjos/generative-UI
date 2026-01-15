export interface FewShotExample {
  user: string;
  tool_steps: {
    tool: "get_metrics_summary" | "analyze_data_with_code" | "render_dashboard";
    args: Record<string, unknown>;
  }[];
}

export const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  // --- ROI & Velocity (High-Level) ---
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
    user: "What is the global trend of 'LOC Added' over the last week? Are we accelerating?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/trends?startDate={7_days_ago}" } },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { 
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/trends?startDate={7_days_ago}", 
              title: "Lines Added Trend", 
              chartSeries: [{ key: "loc_added", label: "LOC Added", color: "#10b981" }] 
            }
          }
        } 
      }
    ]
  },
  {
    user: "Show me the ratio of 'Suggestions' to 'Acceptances'. How much noise is the AI generating?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/summary" } },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "split",
            leftChart: {
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/trends", 
              title: "Suggestions vs Acceptances", 
              chartSeries: [
                { key: "suggestions", label: "Generated", color: "#94a3b8" },
                { key: "acceptances", label: "Accepted", color: "#10b981" }
              ] 
            },
            rightChart: {
              component: "KPIGrid", 
              apiEndpoint: "/api/metrics/summary", 
              title: "Noise Ratio",
              kpiDefinitions: [
                { key: "suggestions", label: "Suggestions", format: "number" },
                { key: "acceptances", label: "Acceptances", format: "number" },
                { key: "acceptance_rate", label: "Ratio", format: "number" }
              ]
            }
          }
        } 
      }
    ]
  },
  {
    user: "What percentage of our total users are actually using the 'Agent' capability versus just 'Chat'?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/summary" } },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { 
              component: "KPIGrid", 
              apiEndpoint: "/api/metrics/summary", 
              title: "Adoption", 
              kpiDefinitions: [
                { key: "uses_agent", label: "Agent Users", format: "percentage" },
                { key: "uses_chat", label: "Chat Users", format: "percentage" }
              ] 
            }
          }
        }
      }
    ]
  },
  {
    user: "Is our code velocity (LOC Added) trending up or down compared to last week?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/trends?startDate={14_days_ago}" } },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?startDate={14_days_ago}", title: "Velocity Trend" }
          }
        } 
      }
    ]
  },

  // --- Team Comparisons ---
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
    user: "Which functional area (section_...) is generating the most interactions?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/breakdown?by=feature" } },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/breakdown?by=feature", title: "Interactions by Team" }
          }
        } 
      }
    ]
  },
  {
    user: "Show me a breakdown of 'Code Generation Activity' by Team. Who is leaning on AI the most?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/breakdown?by=feature" } },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/breakdown?by=feature", title: "Generation Activity by Team" }
          }
        } 
      }
    ]
  },
  {
    user: "Is the Backend-Platform team more efficient (higher acceptance rate) than the QA team?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"Platform\", \"segment\": \"Backend-Platform\" }&entityB={ \"label\": \"QA\", \"segment\": \"QA\" }&metricKey=acceptance_rate" } },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { component: "CompareStatCard", apiEndpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"Platform\", \"segment\": \"Backend-Platform\" }&entityB={ \"label\": \"QA\", \"segment\": \"QA\" }&metricKey=acceptance_rate", title: "Efficiency Gap" }
          }
        }
      }
    ]
  },
  {
    user: "Rank all teams by total 'LOC Deleted'. Who is doing the most refactoring?",
    tool_steps: [
      {
        tool: "analyze_data_with_code", 
        args: { 
          endpoint: "/api/metrics/users", 
          code: "const teams = {}; data.forEach(u => { const team = u.totals_by_feature[0]?.feature || 'Other'; if(!teams[team]) teams[team] = 0; teams[team] += u.loc_deleted_sum; }); return Object.entries(teams).map(([name, val]) => ({ name, val })).sort((a,b) => b.val - a.val);"
        } 
      },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: {
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/users", 
              title: "Refactoring Leaderboard", 
              tableColumns: [{ key: "feature", label: "Team" }, { key: "loc_deleted", label: "Lines Deleted", format: "number" }]
            }
          }
        }
      }
    ]
  },

  // --- Model Analysis ---
  {
    user: "Compare gpt-4o vs. claude-3-5-sonnet for TypeScript files. Which model writes better code?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/compare/trends?queries=[{\"label\":\"GPT-4o\",\"model\":\"gpt-4o\",\"language\":\"typescript\"},{\"label\":\"Claude 3.5\",\"model\":\"claude-3-5-sonnet\",\"language\":\"typescript\"}]&metricKey=acceptance_rate" } },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "split",
            leftChart: {
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/compare/trends?queries=[{\"label\":\"GPT-4o\",\"model\":\"gpt-4o\",\"language\":\"typescript\"},{\"label\":\"Claude 3.5\",\"model\":\"claude-3-5-sonnet\",\"language\":\"typescript\"}]&metricKey=acceptance_rate", 
              title: "Model Quality (TS)" 
            },
            rightChart: { component: "SmartChart", apiEndpoint: "/api/metrics/breakdown?by=model", title: "Total Volume" }
          }
        }
      }
    ]
  },
  {
    user: "What is the acceptance rate for o1-preview? Is it worth the cost compared to llama-3-70b?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"o1-preview\", \"model\": \"o1-preview\" }&entityB={ \"label\": \"Llama 3\", \"model\": \"llama-3-70b\" }&metricKey=acceptance_rate" } },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { component: "CompareStatCard", apiEndpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"o1-preview\", \"model\": \"o1-preview\" }&entityB={ \"label\": \"Llama 3\", \"model\": \"llama-3-70b\" }&metricKey=acceptance_rate", title: "Model Efficiency Gap" }
          }
        }
      }
    ]
  },
    {
      user: "Show me the distribution of interactions by Model. Are we relying too much on one provider?",
      tool_steps: [
        { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/breakdown?by=model" } },
        {
          tool: "render_dashboard", 
          args: { 
            config: {
              layout: "single",
              config: {
                component: "SmartChart", 
                apiEndpoint: "/api/metrics/breakdown?by=model", 
                title: "Provider Distribution",
                chartSeries: [{ key: "interactions", label: "Interactions", color: "#8b5cf6" }]
              }
            }
          } 
        }
      ]
    },
  
  {
    user: "For developers using o1-preview, what is their average LOC added per day?",
    tool_steps: [
      {
        tool: "analyze_data_with_code", 
        args: { 
          endpoint: "/api/metrics/users", 
          code: "const users = data.filter(u => u.totals_by_language_model.some(m => m.model === 'o1-preview')); const total = users.reduce((a,b) => a + b.loc_added_sum, 0); return total / (users.length || 1);"
        } 
      },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartStatCard", title: "Avg LOC (o1-preview)", apiEndpoint: "/api/metrics/summary", dataKey: "total_loc_added" }
          }
        }
      }
    ]
  },
  {
    user: "Trend the usage of claude-3-5-sonnet over the last 7 days.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/trends?startDate={7_days_ago}&model=claude-3-5-sonnet" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?startDate={7_days_ago}&model=claude-3-5-sonnet", title: "Claude 3.5 Weekly Trend" }
          }
        }
      }
    ]
  },

  // --- Developer Analytics ---
  {
    user: "Analyze Brian Williams. He has high interactions, but what is his actual code acceptance rate?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/summary?userLogin=brian_williams" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "dashboard",
            headerStats: [{ title: "Brian's Activity", apiEndpoint: "/api/metrics/summary?userLogin=brian_williams", dataKey: "total_interactions" }],
            slotMain: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?userLogin=brian_williams", title: "Brian's Quality Trend", chartSeries: [{ key: "acceptance_rate", label: "Acceptance Rate", color: "#ec4899" }] }
          }
        }
      }
    ]
  },
  {
    user: "Compare James Wilson and Brian Williams. Who is more efficient with their prompts?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"James\", \"userLogin\": \"james_wilson\" }&entityB={ \"label\": \"Brian\", \"userLogin\": \"brian_williams\" }&metricKey=acceptance_rate" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "split",
            leftChart: { component: "CompareStatCard", apiEndpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"James\", \"userLogin\": \"james_wilson\" }&entityB={ \"label\": \"Brian\", \"userLogin\": \"brian_williams\" }&metricKey=acceptance_rate", title: "Efficiency Comparison" },
            rightChart: { component: "SmartTable", apiEndpoint: "/api/metrics/users", title: "User Details" }
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
  },
  {
    user: "Show me George Thompson's activity breakdown. Which models is he experimenting with?",
    tool_steps: [
      { tool: "analyze_data_with_code", args: { endpoint: "/api/metrics/users", code: "return data[0].totals_by_language_model;" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartTable", apiEndpoint: "/api/metrics/users?userLogin=george_thompson", title: "George's Model Lab", tableColumns: [{ key: "model", label: "AI Model" }, { key: "language", label: "Language" }, { key: "interactions", label: "Activity" }] }
          }
        }
      }
    ]
  },
  {
    user: "Identify users who have high 'Code Generation' but low 'Code Acceptance'. Who needs better prompt engineering training?",
    tool_steps: [
      { tool: "analyze_data_with_code", args: { endpoint: "/api/metrics/users", code: "return data.filter(u => u.suggestions > 50 && u.acceptance_rate < 0.2).map(u => ({ user: u.user_login, rate: u.acceptance_rate }));" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartTable", apiEndpoint: "/api/metrics/users", title: "Efficiency Training Audit" }
          }
        }
      }
    ]
  },

  // --- Time-Range Specific ---
  {
    user: "Show me the QA team's acceptance rate over the last 7 days.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/trends?startDate={7_days_ago}&segment=QA" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?startDate={7_days_ago}&segment=QA", title: "QA Quality (Last 7 Days)", chartSeries: [{ key: "acceptance_rate", label: "Acceptance Rate", color: "#3b82f6" }] }
          }
        }
      }
    ]
  },
  {
    user: "Did Brian Williams improve his acceptance rate yesterday compared to the day before?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/trends?startDate={2_days_ago}&userLogin=brian_williams" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?startDate={2_days_ago}&userLogin=brian_williams", title: "Brian's Daily Quality" }
          }
        }
      }
    ]
  },
  {
    user: "Who were the top 3 contributors by LOC added this week?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/users?startDate={7_days_ago}&sortKey=interactions&sortOrder=desc&limit=3" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartTable", apiEndpoint: "/api/metrics/users?startDate={7_days_ago}&sortKey=interactions&sortOrder=desc&limit=3", title: "Weekly Top Contributors" }
          }
        }
      }
    ]
  },
  {
    user: "Compare gpt-4o vs o1-preview usage for the last 24 hours.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/compare/summary?startDate={1_day_ago}&entityA={ \"label\": \"GPT-4o\", \"model\": \"gpt-4o\" }&entityB={ \"label\": \"o1-preview\", \"model\": \"o1-preview\" }&metricKey=total_interactions" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "CompareStatCard", apiEndpoint: "/api/metrics/compare/summary?startDate={1_day_ago}&entityA={ \"label\": \"GPT-4o\", \"model\": \"gpt-4o\" }&entityB={ \"label\": \"o1-preview\", \"model\": \"o1-preview\" }&metricKey=total_interactions", title: "Last 24h Model Battle" }
          }
        }
      }
    ]
  },
  {
    user: "Show me the velocity trend for the Backend-Core team since Monday.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/trends?startDate={this_monday}&segment=Backend-Core" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?startDate={this_monday}&segment=Backend-Core", title: "Backend Velocity (Week-to-Date)" }
          }
        }
      }
    ]
  },
  {
    user: "Show me the total Lines of Code added in January 2026.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/summary?startDate=2026-01-01&endDate=2026-01-31" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartStatCard", title: "January Total LOC", apiEndpoint: "/api/metrics/summary?startDate=2026-01-01&endDate=2026-01-31", dataKey: "total_loc_added" }
          }
        }
      }
    ]
  },
  {
    user: "Compare the acceptance_rate of December 2025 vs. January 2026.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/summary?startDate=2025-12-01&endDate=2025-12-31" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "split",
            leftChart: { component: "SmartStatCard", title: "Dec Rate", apiEndpoint: "/api/metrics/summary?startDate=2025-12-01&endDate=2025-12-31", dataKey: "acceptance_rate" },
            rightChart: { component: "SmartStatCard", title: "Jan Rate", apiEndpoint: "/api/metrics/summary?startDate=2026-01-01&endDate=2026-01-31", dataKey: "acceptance_rate" }
          }
        }
      }
    ]
  },
  {
    user: "Which model was the most popular last month?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/breakdown?by=model&startDate={last_month_start}&endDate={last_month_end}" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/breakdown?by=model", 
              title: "Monthly Model Popularity",
              chartSeries: [{ key: "interactions", label: "Interactions", color: "#8b5cf6" }]
            }
          }
        } 
      }
    ]
  },
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
    user: "List all developers who had zero interactions between Jan 1st and Jan 15th.",
    tool_steps: [
      { tool: "analyze_data_with_code", args: { endpoint: "/api/metrics/users", code: "return data.filter(u => u.interactions === 0);" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartTable", apiEndpoint: "/api/metrics/users", title: "Inactive Developers" }
          }
        }
      }
    ]
  },
  {
    user: "Show me the adoption metrics since the release on Jan 5th.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/summary?startDate=2026-01-05" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "dashboard",
            headerStats: [{ title: "Post-Release Adoption", apiEndpoint: "/api/metrics/summary?startDate=2026-01-05", dataKey: "active_users_count" }],
            slotMain: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?startDate=2026-01-05", title: "Daily Active Users since Jan 5" }
          }
        }
      }
    ]
  },
  {
    user: "Compare the velocity of Sprint 22 (Jan 1 - Jan 14) vs Sprint 21 (Dec 15 - Dec 31).",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/summary?startDate=2026-01-01&endDate=2026-01-14" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "split",
            leftChart: { component: "SmartStatCard", title: "Sprint 22 LOC", apiEndpoint: "/api/metrics/summary?startDate=2026-01-01&endDate=2026-01-14", dataKey: "total_loc_added" },
            rightChart: { component: "SmartStatCard", title: "Jan Rate", apiEndpoint: "/api/metrics/summary?startDate=2025-12-15&endDate=2025-12-31", dataKey: "total_loc_added" }
          }
        }
      }
    ]
  },
  {
    user: "Show me the 'Suggestions vs Acceptances' chart for Q1 2026 so far.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/trends?startDate=2026-01-01" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?startDate=2026-01-01", title: "Q1 Performance Trend" }
          }
        }
      }
    ]
  },
  {
    user: "Did the QA team's usage spike during the last weekend?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/trends?startDate={last_friday}&endDate={last_monday}&segment=QA" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?startDate={last_friday}&endDate={last_monday}&segment=QA", title: "Weekend QA Activity" }
          }
        }
      }
    ]
  },
  {
    user: "Show me a summary of James Wilson's impact year-to-date.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/summary?startDate=2026-01-01&userLogin=james_wilson" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "dashboard",
            headerStats: [{ title: "Total Impact", apiEndpoint: "/api/metrics/summary?userLogin=james_wilson", dataKey: "total_loc_added" }],
            slotMain: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?userLogin=james_wilson", title: "James's YTD Growth" }
          }
        }
      }
    ]
  },
  {
    user: "Show me the breakdown of IDEs used last week by the Backend-Platform team.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/breakdown?by=ide&startDate={7_days_ago}&segment=Backend-Platform" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/breakdown?by=ide", title: "Platform IDE Split" }
          }
        }
      }
    ]
  },
  {
    user: "Who had the highest acceptance rate in the last 3 days using typescript?",
    tool_steps: [
      { tool: "analyze_data_with_code", args: { endpoint: "/api/metrics/users?startDate={3_days_ago}", code: "return data.filter(u => u.totals_by_language_model.some(m => m.language === 'typescript')).sort((a,b) => b.acceptance_rate - a.acceptance_rate)[0];" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartTable", apiEndpoint: "/api/metrics/users", title: "TS Quality Leader" }
          }
        }
      }
    ]
  },
  {
    user: "Compare Brian vs George specifically during the first week of January.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/compare/summary?startDate=2026-01-01&endDate=2026-01-07&entityA={ \"label\": \"Brian\", \"userLogin\": \"brian_williams\" }&entityB={ \"label\": \"George\", \"userLogin\": \"george_thompson\" }&metricKey=acceptance_rate" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "split",
            leftChart: { component: "CompareStatCard", apiEndpoint: "/api/metrics/compare/summary?startDate=2026-01-01&endDate=2026-01-07&entityA={ \"label\": \"Brian\", \"userLogin\": \"brian_williams\" }&entityB={ \"label\": \"George\", \"userLogin\": \"george_thompson\" }&metricKey=acceptance_rate", title: "Early Jan Quality Gap" },
            rightChart: { component: "SmartChart", apiEndpoint: "/api/metrics/compare/trends?startDate=2026-01-01&endDate=2026-01-07&queries=[{\"label\":\"Brian\",\"userLogin\":\"brian_williams\"},{\"label\":\"George\",\"userLogin\":\"george_thompson\"}]&metricKey=acceptance_rate", title: "Quality Over Time" }
          }
        }
      }
    ]
  },
  {
    user: "Show me the trend of o1-preview adoption since Jan 10th.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/trends?startDate={2026-01-10}&model=o1-preview" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartChart", apiEndpoint: "/api/metrics/trends?startDate={2026-01-10}&model=o1-preview", title: "o1-preview Adoption Trend" }
          }
        }
      }
    ]
  },
  {
    user: "Rank users by interactions for the last 48 hours.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/users?startDate={2_days_ago}&sortKey=interactions&sortOrder=desc" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { component: "SmartTable", apiEndpoint: "/api/metrics/users?startDate={2_days_ago}&sortKey=interactions&sortOrder=desc", title: "Activity Leaderboard (48h)" }
          }
        }
      }
    ]
  }
];