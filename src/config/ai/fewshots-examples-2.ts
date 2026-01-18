export interface FewShotExample {
  user: string;
  tool_steps: {
    tool: "get_metrics_summary" | "analyze_data_with_code" | "render_dashboard";
    args: Record<string, unknown>;
  }[];
}

export const FEW_SHOT_EXAMPLES_2: FewShotExample[] = [
  // --- Adoption and Engagement ---
  {
    user: "Which teams increased AI usage the most week over week?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: {
          endpoint: "/api/metrics/breakdown/compare?by=feature&metricKey=interactions&startDate={7_days_ago}&endDate={today}&compareStart={14_days_ago}&compareEnd={7_days_ago}",
        },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown/compare?by=feature&metricKey=interactions&startDate={7_days_ago}&endDate={today}&compareStart={14_days_ago}&compareEnd={7_days_ago}",
          code: "const top = data.reduce((best, d) => (d.delta || 0) > (best?.delta || 0) ? d : best, null); return { team: top?.name || top?.feature || null, delta: top?.delta || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown/compare?by=feature&metricKey=interactions&startDate={7_days_ago}&endDate={today}&compareStart={14_days_ago}&compareEnd={7_days_ago}",
              title: "Week-over-Week Team Usage",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "current_value", label: "This Week", format: "number" },
                { key: "previous_value", label: "Last Week", format: "number" },
                { key: "delta", label: "Change", format: "number" },
                { key: "delta_pct", label: "Change %", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "How many active users did we have each day over the last 30 days?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/trends?startDate={30_days_ago}" },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={30_days_ago}",
          code: "const latest = data[data.length - 1]?.active_users ?? 0; return { days: data.length, latest };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartChart",
              apiEndpoint: "/api/metrics/trends?startDate={30_days_ago}",
              title: "Daily Active Users",
              chartSeries: [{ key: "active_users", label: "Active Users", color: "#10b981" }],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which users had zero interactions in the last 14 days?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/users?startDate={14_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate={14_days_ago}",
          code: "const inactive = data.filter(u => (u.interactions || 0) === 0).map(u => u.user_login); return { count: inactive.length, users: inactive.slice(0, 5) };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/users?startDate={14_days_ago}",
              title: "User Activity (Last 14 Days)",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "interactions", label: "Interactions", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "What percent of users used both Agent and Chat this month?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/users/usage-rate?startDate={month_start}&endDate={today}" },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users/usage-rate?startDate={month_start}&endDate={today}",
          code: "const row = data[0] || {}; return { both_user_rate: row.both_user_rate ?? 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "KPIGrid",
              apiEndpoint: "/api/metrics/users/usage-rate?startDate={month_start}&endDate={today}",
              title: "Agent vs Chat Adoption",
              kpiDefinitions: [
                { key: "agent_user_rate", label: "Agent Users", format: "percentage" },
                { key: "chat_user_rate", label: "Chat Users", format: "percentage" },
                { key: "both_user_rate", label: "Both", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which teams are under-adopting AI compared to the org average interactions per user?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
          code: "const avg = data.reduce((a,b) => a + (b.interactions_per_user || 0), 0) / (data.length || 1); const below = data.filter(d => (d.interactions_per_user || 0) < avg).sort((a,b) => (a.interactions_per_user || 0) - (b.interactions_per_user || 0)).slice(0, 5).map(d => ({ team: d.name, interactions_per_user: d.interactions_per_user })); return { avg_interactions_per_user: avg, under_adopting: below };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
              title: "Team Adoption (Interactions per User)",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "interactions_per_user", label: "Interactions per User", format: "number" },
                { key: "active_users_count", label: "Active Users", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Who are the top 10 most active users by interaction count this month?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/users?startDate={month_start}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate={month_start}",
          code: "const top = data.sort((a,b) => (b.interactions || 0) - (a.interactions || 0)).slice(0, 10).map(u => ({ user: u.user_login, interactions: u.interactions })); return { count: top.length, top };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/users?startDate={month_start}",
              title: "Top Active Users (This Month)",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "interactions", label: "Interactions", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "How does AI usage differ between weekdays and weekends?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/trends?startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={30_days_ago}",
          code: "const weekday = []; const weekend = []; data.forEach(d => { const day = new Date(d.date).getDay(); if (day === 0 || day === 6) weekend.push(d.interactions || 0); else weekday.push(d.interactions || 0); }); const avg = arr => arr.reduce((a,b) => a+b, 0) / (arr.length || 1); return { weekday_avg: avg(weekday), weekend_avg: avg(weekend) };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartChart",
              apiEndpoint: "/api/metrics/trends?startDate={30_days_ago}",
              title: "Daily Interactions (Last 30 Days)",
              chartSeries: [{ key: "interactions", label: "Interactions", color: "#6366f1" }],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which users became active for the first time in the last 30 days?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/users/first-active?startDate={30_days_ago}" },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users/first-active?startDate={30_days_ago}",
          code: "const users = data.slice(0, 10).map(d => ({ user: d.user_login, first_day: d.first_day })); return { users };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/users/first-active?startDate={30_days_ago}",
              title: "Newly Active Users",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "first_day", label: "First Active Day", format: "date" },
              ],
            },
          },
        },
      },
    ],
  },

  // --- Quality and Efficiency ---
  {
    user: "What is the acceptance rate trend for the org over the last 30 days?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/trends?startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={30_days_ago}",
          code: "const first = data[0]?.acceptance_rate ?? 0; const last = data[data.length - 1]?.acceptance_rate ?? 0; return { first, last, delta: last - first };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartChart",
              apiEndpoint: "/api/metrics/trends?startDate={30_days_ago}",
              title: "Acceptance Rate Trend",
              chartSeries: [{ key: "acceptance_rate", label: "Acceptance Rate", color: "#22c55e" }],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which teams have the highest and lowest acceptance rates?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
          code: "const sorted = data.slice().sort((a,b) => (b.acceptance_rate || 0) - (a.acceptance_rate || 0)); return { top: sorted.slice(0, 3).map(d => ({ team: d.name, rate: d.acceptance_rate })), bottom: sorted.slice(-3).map(d => ({ team: d.name, rate: d.acceptance_rate })) };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
              title: "Team Acceptance Rates",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
                { key: "suggestions", label: "Suggestions", format: "number" },
                { key: "acceptances", label: "Acceptances", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which users generate many suggestions but accept few?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/users?startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate={30_days_ago}",
          code: "const filtered = data.filter(u => (u.suggestions || 0) > 50 && (u.acceptance_rate || 0) < 0.2).slice(0, 5).map(u => ({ user: u.user_login, suggestions: u.suggestions, rate: u.acceptance_rate })); return { count: filtered.length, users: filtered };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/users?startDate={30_days_ago}",
              title: "Suggestions vs Acceptances (Users)",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "suggestions", label: "Suggestions", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "How does acceptance rate vary by model across all users?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=model&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=model&startDate={30_days_ago}",
          code: "const ranked = [...data].sort((a, b) => (b.acceptance_rate || 0) - (a.acceptance_rate || 0)).map(d => ({ model: d.model || d.name, acceptance_rate: d.acceptance_rate || 0 })); return { ranked };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=model&startDate={30_days_ago}",
              title: "Model Acceptance Rates",
              tableColumns: [
                { key: "name", label: "Model" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
                { key: "suggestions", label: "Suggestions", format: "number" },
                { key: "acceptances", label: "Acceptances", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "What is the suggestions-to-acceptances ratio by team?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}&endDate={today}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}&endDate={today}",
          code: "const top = data.map(d => ({ team: d.name, rate: d.acceptance_rate || 0 })).sort((a,b) => b.rate - a.rate).slice(0,5); return { top_teams: top };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}&endDate={today}",
              title: "Team Suggestion Efficiency",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "suggestions", label: "Suggestions", format: "number" },
                { key: "acceptances", label: "Acceptances", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which teams show the biggest acceptance rate volatility by day?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown/stability?by=feature&metricKey=acceptance_rate&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown/stability?by=feature&metricKey=acceptance_rate&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => (d.coefficient_variation ?? 0) > (best?.coefficient_variation ?? 0) ? d : best, null); return { team: top?.name || top?.feature || null, coefficient_variation: top?.coefficient_variation || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown/stability?by=feature&metricKey=acceptance_rate&startDate={30_days_ago}",
              title: "Acceptance Rate Volatility",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "avg_value", label: "Avg Rate", format: "percentage" },
                { key: "stddev_value", label: "Std Dev", format: "number" },
                { key: "coefficient_variation", label: "Volatility", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which users have high interactions but low acceptance rate?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/users?startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate={30_days_ago}",
          code: "const flagged = data.filter(u => (u.interactions || 0) > 100 && (u.acceptance_rate || 0) < 0.25).slice(0, 5).map(u => ({ user: u.user_login, interactions: u.interactions, rate: u.acceptance_rate })); return { count: flagged.length, users: flagged };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/users?startDate={30_days_ago}",
              title: "High Activity, Low Acceptance",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "interactions", label: "Interactions", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which model-feature pairs show the best acceptance rate?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=model_feature&startDate={30_days_ago}" },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=model_feature&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => (d.acceptance_rate || 0) > (best?.acceptance_rate || 0) ? d : best, null); return { pair: top?.name || null, acceptance_rate: top?.acceptance_rate || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=model_feature&startDate={30_days_ago}",
              title: "Model-Feature Acceptance",
              tableColumns: [
                { key: "name", label: "Model | Feature" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
                { key: "suggestions", label: "Suggestions", format: "number" },
                { key: "acceptances", label: "Acceptances", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },

  // --- Productivity Impact ---
  {
    user: "How many lines were added and deleted by AI suggestions this month?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/summary?startDate={month_start}&endDate={today}" },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/summary?startDate={month_start}&endDate={today}",
          code: "const totals = data.reduce((acc, d) => { acc.added += d.loc_added || 0; acc.deleted += d.loc_deleted || 0; return acc; }, { added: 0, deleted: 0 }); return totals;"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "KPIGrid",
              apiEndpoint: "/api/metrics/summary?startDate={month_start}&endDate={today}",
              title: "Monthly Code Movement",
              kpiDefinitions: [
                { key: "total_loc_added", label: "Lines Added", format: "number" },
                { key: "total_loc_deleted", label: "Lines Deleted", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which teams deliver the most LOC added per active user?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => { const value = d.loc_added_per_user ?? ((d.loc_added || 0) / (d.active_users_count || 1)); return value > (best?.value ?? -Infinity) ? { name: d.name || d.feature, value } : best; }, null); return { team: top?.name || null, loc_added_per_user: top?.value || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
              title: "LOC per Active User",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "loc_added_per_user", label: "LOC per User", format: "number" },
                { key: "active_users_count", label: "Active Users", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "What is the trend of LOC added over the last 8 weeks?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/trends?startDate={56_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={56_days_ago}",
          code: "const first = data[0]?.loc_added ?? 0; const last = data[data.length - 1]?.loc_added ?? 0; return { first, last, delta: last - first };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartChart",
              apiEndpoint: "/api/metrics/trends?startDate={56_days_ago}",
              title: "LOC Added Trend",
              chartSeries: [{ key: "loc_added", label: "LOC Added", color: "#f97316" }],
            },
          },
        },
      },
    ],
  },
  {
    user: "Where do suggested deletions exceed actual deletions the most?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
          code: "const gaps = data.map(d => ({ team: d.name, gap: (d.loc_suggested_to_delete || 0) - (d.loc_deleted || 0) })).sort((a,b) => b.gap - a.gap).slice(0,5); return { top_gaps: gaps };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
              title: "Suggested vs Actual Deletions",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "loc_suggested_to_delete", label: "Suggested Deletes", format: "number" },
                { key: "loc_deleted", label: "Actual Deletes", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which users have the highest LOC added totals this quarter?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/users?startDate={quarter_start}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate={quarter_start}",
          code: "const top = data.sort((a,b) => (b.loc_added || 0) - (a.loc_added || 0)).slice(0, 5).map(u => ({ user: u.user_login, loc_added: u.loc_added })); return { top };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/users?startDate={quarter_start}",
              title: "Top LOC Contributors",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "loc_added", label: "LOC Added", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "What is the net code delta (added minus deleted) per team?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
          code: "const net = data.map(d => ({ team: d.name, net_loc: (d.loc_added || 0) - (d.loc_deleted || 0) })).sort((a,b) => b.net_loc - a.net_loc).slice(0,5); return { top_net: net };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
              title: "Net Code Delta by Team",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "loc_added", label: "LOC Added", format: "number" },
                { key: "loc_deleted", label: "LOC Deleted", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which teams have high suggestions but low LOC added?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}&endDate={today}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}&endDate={today}",
          code: "const flagged = data.filter(d => (d.suggestions || 0) > 100 && (d.loc_added || 0) < 50).slice(0,5).map(d => ({ team: d.name, suggestions: d.suggestions, loc_added: d.loc_added })); return { teams: flagged };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}&endDate={today}",
              title: "Suggestions vs LOC Added",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "suggestions", label: "Suggestions", format: "number" },
                { key: "loc_added", label: "LOC Added", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Where is the gap largest between suggested additions and accepted additions?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
          code: "const gaps = data.map(d => ({ team: d.name, gap: (d.loc_suggested_to_add || 0) - (d.loc_added || 0) })).sort((a,b) => b.gap - a.gap).slice(0,5); return { top_gaps: gaps };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
              title: "Suggested vs Accepted Additions",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "loc_suggested_to_add", label: "Suggested Adds", format: "number" },
                { key: "loc_added", label: "Accepted Adds", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },

  // --- Team and Org Comparisons ---
  {
    user: "Compare acceptance rate between Backend-Platform and QA teams.",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: {
          endpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"Backend-Platform\", \"segment\": \"Backend-Platform\" }&entityB={ \"label\": \"QA\", \"segment\": \"QA\" }&metricKey=acceptance_rate",
        },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"Backend-Platform\", \"segment\": \"Backend-Platform\" }&entityB={ \"label\": \"QA\", \"segment\": \"QA\" }&metricKey=acceptance_rate",
          code: "const find = (label) => data.find(d => String(d.name || d.feature || '').toLowerCase().includes(label.toLowerCase())); const backend = find('Backend-Platform'); const qa = find('QA'); const backendRate = backend?.acceptance_rate ?? 0; const qaRate = qa?.acceptance_rate ?? 0; const winner = backendRate === qaRate ? 'tie' : (backendRate > qaRate ? (backend?.name || backend?.feature) : (qa?.name || qa?.feature)); return { backend_rate: backendRate, qa_rate: qaRate, winner };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "split",
            leftChart: {
              component: "CompareStatCard",
              apiEndpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"Backend-Platform\", \"segment\": \"Backend-Platform\" }&entityB={ \"label\": \"QA\", \"segment\": \"QA\" }&metricKey=acceptance_rate",
              title: "Acceptance Rate Gap",
            },
            rightChart: {
              component: "SmartChart",
              apiEndpoint: "/api/metrics/compare/trends?queries=[{\"label\":\"Backend-Platform\",\"segment\":\"Backend-Platform\"},{\"label\":\"QA\",\"segment\":\"QA\"}]&metricKey=acceptance_rate&startDate={30_days_ago}",
              title: "Daily Acceptance Rate",
              chartSeries: [
                { key: "Backend-Platform", label: "Backend-Platform", color: "#06b6d4" },
                { key: "QA", label: "QA", color: "#f43f5e" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which teams contribute the most to total interactions?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => (d.interactions || 0) > (best?.interactions || 0) ? d : best, null); return { team: top?.name || top?.feature || null, interactions: top?.interactions || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
              title: "Interactions by Team",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "interactions", label: "Interactions", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Rank teams by total LOC deleted to spot refactoring leaders.",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}" },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
          code: "const ranked = [...data].sort((a, b) => (b.loc_deleted || 0) - (a.loc_deleted || 0)).slice(0, 10).map(d => ({ name: d.name || d.feature, loc_deleted: d.loc_deleted || 0 })); return { ranked };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
              title: "Refactoring Leaders",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "loc_deleted", label: "LOC Deleted", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which team has the best balance of suggestions and acceptances?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}&endDate={today}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}&endDate={today}",
          code: "const scored = data.map(d => ({ team: d.name, gap: Math.abs((d.suggestions || 0) - (d.acceptances || 0)) })).sort((a,b) => a.gap - b.gap); return { most_balanced: scored[0] || null };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}&endDate={today}",
              title: "Suggestion Balance by Team",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "suggestions", label: "Suggestions", format: "number" },
                { key: "acceptances", label: "Acceptances", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "How do team usage trends compare over the last two sprints?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/compare/trends?queries=[{\"label\":\"Backend-Core\",\"segment\":\"Backend-Core\"},{\"label\":\"QA\",\"segment\":\"QA\"}]&metricKey=interactions&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/compare/trends?queries=[{\"label\":\"Backend-Core\",\"segment\":\"Backend-Core\"},{\"label\":\"QA\",\"segment\":\"QA\"}]&metricKey=interactions&startDate={30_days_ago}",
          code: "const totals = data.reduce((acc, row) => { Object.keys(row).forEach((key) => { if (key !== 'date') acc[key] = (acc[key] || 0) + (Number(row[key]) || 0); }); return acc; }, {}); return { totals };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartChart",
              apiEndpoint: "/api/metrics/compare/trends?queries=[{\"label\":\"Backend-Core\",\"segment\":\"Backend-Core\"},{\"label\":\"QA\",\"segment\":\"QA\"}]&metricKey=interactions&startDate={30_days_ago}",
              title: "Team Usage Trends",
              chartSeries: [
                { key: "Backend-Core", label: "Backend-Core", color: "#0ea5e9" },
                { key: "QA", label: "QA", color: "#f59e0b" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which teams are most consistent in daily AI usage?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown/stability?by=feature&metricKey=interactions&startDate={30_days_ago}" },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown/stability?by=feature&metricKey=interactions&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => (d.coefficient_variation ?? Infinity) < (best?.coefficient_variation ?? Infinity) ? d : best, null); return { most_consistent: top ? { name: top.name || top.feature, coefficient_variation: top.coefficient_variation } : null };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown/stability?by=feature&metricKey=interactions&startDate={30_days_ago}",
              title: "Team Usage Consistency",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "avg_value", label: "Avg Interactions", format: "number" },
                { key: "coefficient_variation", label: "Consistency", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which teams delivered the most AI-assisted output this month?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={month_start}&endDate={today}" },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={month_start}&endDate={today}",
          code: "const top = data.reduce((best, d) => (d.loc_added || 0) > (best?.loc_added || 0) ? d : best, null); return { team: top?.name || top?.feature || null, loc_added: top?.loc_added || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={month_start}&endDate={today}",
              title: "Team Output (LOC Added)",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "loc_added", label: "LOC Added", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which team has the highest share of Agent usage?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}" },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => (d.agent_usage_rate || 0) > (best?.agent_usage_rate || 0) ? d : best, null); return { team: top?.name || top?.feature || null, agent_usage_rate: top?.agent_usage_rate || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
              title: "Agent Usage by Team",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "agent_usage_rate", label: "Agent Usage", format: "percentage" },
                { key: "chat_usage_rate", label: "Chat Usage", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },

  // --- Tooling and Model Mix ---
  {
    user: "Which IDEs are most used for AI interactions by team?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=ide&segment=Backend-Platform&startDate={30_days_ago}" },

      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=ide&segment=Backend-Platform&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => (d.interactions || 0) > (best?.interactions || 0) ? d : best, null); return { ide: top?.ide || top?.name || null, interactions: top?.interactions || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=ide&segment=Backend-Platform&startDate={30_days_ago}",
              title: "Backend-Platform IDE Usage",
              tableColumns: [
                { key: "name", label: "IDE" },
                { key: "interactions", label: "Interactions", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "How does model usage vary by programming language?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=language_model&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=language_model&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => (d.interactions || 0) > (best?.interactions || 0) ? d : best, null); return { top_pair: top?.name || null, interactions: top?.interactions || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=language_model&startDate={30_days_ago}",
              title: "Language vs Model Usage",
              tableColumns: [
                { key: "language", label: "Language" },
                { key: "model", label: "Model" },
                { key: "interactions", label: "Interactions", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which model has the best acceptance rate for TypeScript work?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=language_model&language=typescript&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=language_model&language=typescript&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => (d.acceptance_rate || 0) > (best?.acceptance_rate || 0) ? d : best, null); return { model: top?.model || top?.name || null, acceptance_rate: top?.acceptance_rate || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=language_model&language=typescript&startDate={30_days_ago}",
              title: "TypeScript Model Quality",
              tableColumns: [
                { key: "model", label: "Model" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
                { key: "suggestions", label: "Suggestions", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "What is the distribution of interactions by model for the last month?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=model&startDate={last_month_start}&endDate={last_month_end}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=model&startDate={last_month_start}&endDate={last_month_end}",
          code: "const total = data.reduce((s, d) => s + (d.interactions || 0), 0); const top = data.reduce((best, d) => (d.interactions || 0) > (best?.interactions || 0) ? d : best, null); return { total, top_model: top?.model || top?.name || null, top_interactions: top?.interactions || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=model&startDate={last_month_start}&endDate={last_month_end}",
              title: "Model Distribution (Last Month)",
              tableColumns: [
                { key: "name", label: "Model" },
                { key: "interactions", label: "Interactions", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which model is most used by the Backend-Platform team?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=model&segment=Backend-Platform&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=model&segment=Backend-Platform&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => (d.interactions || 0) > (best?.interactions || 0) ? d : best, null); return { model: top?.model || top?.name || null, interactions: top?.interactions || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=model&segment=Backend-Platform&startDate={30_days_ago}",
              title: "Backend-Platform Model Usage",
              tableColumns: [
                { key: "name", label: "Model" },
                { key: "interactions", label: "Interactions", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which language-model pair drives the most LOC added?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=language_model&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=language_model&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => (d.loc_added || 0) > (best?.loc_added || 0) ? d : best, null); return { pair: top?.name || null, loc_added: top?.loc_added || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=language_model&startDate={30_days_ago}",
              title: "LOC Added by Language and Model",
              tableColumns: [
                { key: "language", label: "Language" },
                { key: "model", label: "Model" },
                { key: "loc_added", label: "LOC Added", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Are we over-reliant on a single model provider?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=model&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=model&startDate={30_days_ago}",
          code: "const total = data.reduce((s, d) => s + (d.interactions || 0), 0); const top = data.reduce((best, d) => (d.interactions || 0) > (best?.interactions || 0) ? d : best, null); const share = total ? (top?.interactions || 0) / total : 0; return { top_model: top?.model || top?.name || null, share };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=model&startDate={30_days_ago}",
              title: "Model Reliance",
              tableColumns: [
                { key: "name", label: "Model" },
                { key: "interactions", label: "Interactions", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "What is the trend of model adoption for o1-preview over 30 days?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/trends?startDate={30_days_ago}&model=o1-preview" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={30_days_ago}&model=o1-preview",
          code: "const first = data[0]?.interactions ?? 0; const last = data[data.length - 1]?.interactions ?? 0; return { first, last, delta: last - first };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartChart",
              apiEndpoint: "/api/metrics/trends?startDate={30_days_ago}&model=o1-preview",
              title: "o1-preview Adoption Trend",
              chartSeries: [{ key: "interactions", label: "Interactions", color: "#a855f7" }],
            },
          },
        },
      },
    ],
  },

  // --- Risk and Opportunity ---
  {
    user: "Which users show declining AI usage over the last month?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/users/change?metricKey=interactions&startDate={30_days_ago}&endDate={today}&compareStart={60_days_ago}&compareEnd={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users/change?metricKey=interactions&startDate={30_days_ago}&endDate={today}&compareStart={60_days_ago}&compareEnd={30_days_ago}",
          code: "const declining = data.filter(u => (u.delta || 0) < 0).sort((a,b) => a.delta - b.delta).slice(0,10).map(u => ({ user: u.user_login, delta: u.delta, delta_pct: u.delta_pct })); return { declining_users: declining };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/users/change?metricKey=interactions&startDate={30_days_ago}&endDate={today}&compareStart={60_days_ago}&compareEnd={30_days_ago}",
              title: "User Usage Change",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "current_value", label: "Current", format: "number" },
                { key: "previous_value", label: "Previous", format: "number" },
                { key: "delta", label: "Delta", format: "number" },
                { key: "delta_pct", label: "Delta %", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Who has high suggestions but low acceptance rate (training candidates)?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/users?startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate={30_days_ago}",
          code: "const flagged = data.filter(u => (u.suggestions || 0) > 50 && (u.acceptance_rate || 0) < 0.2).slice(0,5).map(u => ({ user: u.user_login, suggestions: u.suggestions, rate: u.acceptance_rate })); return { candidates: flagged };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/users?startDate={30_days_ago}",
              title: "Training Candidates",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "suggestions", label: "Suggestions", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which teams have the lowest adoption by interactions per active user?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
          code: "const low = data.slice().sort((a,b) => (a.interactions_per_user || 0) - (b.interactions_per_user || 0)).slice(0,5).map(d => ({ team: d.name, interactions_per_user: d.interactions_per_user })); return { lowest: low };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
              title: "Lowest Adoption (Interactions per User)",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "interactions_per_user", label: "Interactions per User", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which teams show high suggested deletions but low actual deletions?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
          code: "const flagged = data.filter(d => (d.loc_suggested_to_delete || 0) > 50 && (d.loc_deleted || 0) < 10).slice(0,5).map(d => ({ team: d.name, suggested: d.loc_suggested_to_delete, deleted: d.loc_deleted })); return { teams: flagged };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=feature&startDate={30_days_ago}",
              title: "Deletion Gap by Team",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "loc_suggested_to_delete", label: "Suggested Deletes", format: "number" },
                { key: "loc_deleted", label: "Actual Deletes", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Who are the most inactive users in the last 30 days?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/users?startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate={30_days_ago}",
          code: "const low = data.slice().sort((a,b) => (a.interactions || 0) - (b.interactions || 0)).slice(0,5).map(u => ({ user: u.user_login, interactions: u.interactions })); return { users: low };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/users?startDate={30_days_ago}",
              title: "Least Active Users",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "interactions", label: "Interactions", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which teams show sudden drops in usage week-over-week?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: {
          endpoint: "/api/metrics/breakdown/compare?by=feature&metricKey=interactions&startDate={7_days_ago}&endDate={today}&compareStart={14_days_ago}&compareEnd={7_days_ago}",
        },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown/compare?by=feature&metricKey=interactions&startDate={7_days_ago}&endDate={today}&compareStart={14_days_ago}&compareEnd={7_days_ago}",
          code: "const top = data.reduce((best, d) => (d.delta ?? Infinity) < (best?.delta ?? Infinity) ? d : best, null); return { team: top?.name || top?.feature || null, delta: top?.delta || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown/compare?by=feature&metricKey=interactions&startDate={7_days_ago}&endDate={today}&compareStart={14_days_ago}&compareEnd={7_days_ago}",
              title: "Week-over-Week Drops",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "delta", label: "Change", format: "number" },
                { key: "delta_pct", label: "Change %", format: "percentage" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which users have the largest gap between suggested and accepted LOC?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/users?startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate={30_days_ago}",
          code: "const gaps = data.map(u => ({ user: u.user_login, gap: (u.loc_suggested_to_add || 0) - (u.loc_added || 0) })).sort((a,b) => b.gap - a.gap).slice(0,5); return { top_gaps: gaps };",
        },
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/users?startDate={30_days_ago}",
              title: "Suggested vs Accepted LOC (Users)",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "loc_suggested_to_add", label: "Suggested Adds", format: "number" },
                { key: "loc_added", label: "Accepted Adds", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
  {
    user: "Which model-feature pairs have the lowest acceptance rate?",
    tool_steps: [
      {
        tool: "get_metrics_summary",
        args: { endpoint: "/api/metrics/breakdown?by=model_feature&startDate={30_days_ago}" },
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=model_feature&startDate={30_days_ago}",
          code: "const top = data.reduce((best, d) => (d.acceptance_rate ?? Infinity) < (best?.acceptance_rate ?? Infinity) ? d : best, null); return { pair: top?.name || null, acceptance_rate: top?.acceptance_rate || 0 };"
        }
      },
      {
        tool: "render_dashboard",
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartTable",
              apiEndpoint: "/api/metrics/breakdown?by=model_feature&startDate={30_days_ago}",
              title: "Lowest Model-Feature Acceptance",
              tableColumns: [
                { key: "name", label: "Model | Feature" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
                { key: "suggestions", label: "Suggestions", format: "number" },
              ],
            },
          },
        },
      },
    ],
  },
];
