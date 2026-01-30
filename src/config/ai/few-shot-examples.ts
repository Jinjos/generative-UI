export interface FewShotExample {
  user: string;
  tool_steps: {
    tool: "get_metrics_summary" | "analyze_data_with_code" | "render_dashboard" | "get_current_page_view";
    args: Record<string, unknown>;
  }[];
}

export const FEW_SHOT_EXAMPLES: FewShotExample[] = [
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
  // --- ROI & Velocity (High-Level) ---
  {
    user: "Show me a full dashboard of our AI code adoption: I want to see total lines of code added vs. acceptance rate.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/summary" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/summary",
          code: "const row = data[0] || {}; return { total_loc_added: row.total_loc_added ?? row.loc_added ?? 0, acceptance_rate: row.acceptance_rate ?? 0 };"
        }
      },

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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={7_days_ago}",
          code: "const first = data[0]?.loc_added ?? 0; const last = data[data.length - 1]?.loc_added ?? 0; return { first, last, delta: last - first, accelerating: last > first };"
        }
      },

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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/summary",
          code: "const row = data[0] || {}; const suggestions = row.total_suggestions ?? row.suggestions ?? 0; const acceptances = row.total_acceptances ?? row.acceptances ?? 0; return { suggestions, acceptances, ratio: acceptances ? suggestions / acceptances : 0 };"
        }
      },

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
                { key: "total_suggestions", label: "Suggestions", format: "number" },
                { key: "total_acceptances", label: "Acceptances", format: "number" },
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
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/users/usage-rate" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users/usage-rate",
          code: "const row = data[0] || {}; return { agent_user_rate: row.agent_user_rate ?? 0, chat_user_rate: row.chat_user_rate ?? 0, both_user_rate: row.both_user_rate ?? 0 };"
        }
      },

      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { 
              component: "KPIGrid", 
              apiEndpoint: "/api/metrics/users/usage-rate", 
              title: "Adoption", 
              kpiDefinitions: [
                { key: "agent_user_rate", label: "Agent Users", format: "percentage" },
                { key: "chat_user_rate", label: "Chat Users", format: "percentage" },
                { key: "both_user_rate", label: "Both", format: "percentage" }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={14_days_ago}",
          code: "const mid = Math.floor(data.length / 2); const sum = (rows) => rows.reduce((s, d) => s + (d.loc_added || 0), 0); const prev = sum(data.slice(0, mid)); const curr = sum(data.slice(mid)); return { prev, curr, delta: curr - prev, trending: curr >= prev ? 'up' : 'down' };"
        }
      },

      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { 
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/trends?startDate={14_days_ago}", 
              title: "Velocity Trend",
              chartSeries: [{ key: "loc_added", label: "LOC Added", color: "#10b981" }]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/summary",
          code: "const find = (label) => data.find(d => String(d.name || d.feature || '').toLowerCase().includes(label.toLowerCase())); const qa = find('QA'); const backend = find('Backend-Core'); const qaRate = qa?.acceptance_rate ?? 0; const backendRate = backend?.acceptance_rate ?? 0; const winner = qaRate === backendRate ? 'tie' : (qaRate > backendRate ? (qa?.name || qa?.feature) : (backend?.name || backend?.feature)); return { qa_rate: qaRate, backend_rate: backendRate, winner };"
        }
      },

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
              title: "Daily Quality Comparison",
              chartSeries: [
                { key: "QA", label: "QA", color: "#3b82f6" },
                { key: "Backend", label: "Backend", color: "#10b981" }
              ] 
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature",
          code: "const top = data.reduce((best, d) => (d.interactions || 0) > (best?.interactions || 0) ? d : best, null); return { top: top ? { name: top.name || top.feature, interactions: top.interactions } : null };"
        }
      },
      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { 
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/breakdown?by=feature", 
              title: "Interactions by Team",
              tableColumns: [
                { key: "name", label: "Team" },
                { key: "interactions", label: "Interactions", format: "number" }
              ]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature",
          code: "const top = data.reduce((best, d) => (d.suggestions || 0) > (best?.suggestions || 0) ? d : best, null); return { top: top ? { name: top.name || top.feature, suggestions: top.suggestions } : null };"
        }
      },

      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { 
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/breakdown?by=feature", 
              title: "Generation Activity by Team",
              xAxisKey: "name",
              chartSeries: [{ key: "suggestions", label: "Suggestions", color: "#f59e0b" }]
            }
          }
        } 
      }
    ]
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
    user: "Is the Backend-Platform team more efficient (higher acceptance rate) than the QA team?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"Platform\", \"segment\": \"Backend-Platform\" }&entityB={ \"label\": \"QA\", \"segment\": \"QA\" }&metricKey=acceptance_rate" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"Platform\", \"segment\": \"Backend-Platform\" }&entityB={ \"label\": \"QA\", \"segment\": \"QA\" }&metricKey=acceptance_rate",
          code: "const find = (label) => data.find(d => String(d.name || d.feature || '').toLowerCase().includes(label.toLowerCase())); const backend = find('Backend-Platform'); const qa = find('QA'); const backendRate = backend?.acceptance_rate ?? 0; const qaRate = qa?.acceptance_rate ?? 0; const winner = backendRate === qaRate ? 'tie' : (backendRate > qaRate ? (backend?.name || backend?.feature) : (qa?.name || qa?.feature)); return { backend_rate: backendRate, qa_rate: qaRate, winner };"
        }
      },
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
        tool: "get_metrics_summary", 
        args: { endpoint: "/api/metrics/breakdown?by=feature" } 
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=feature",
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
              apiEndpoint: "/api/metrics/breakdown?by=feature", 
              title: "Refactoring Leaderboard", 
              tableColumns: [
                { key: "name", label: "Team" }, 
                { key: "loc_deleted", label: "Lines Deleted", format: "number" }
              ]
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
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/breakdown?by=language_model&language=typescript&startDate={30_days_ago}" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=language_model&language=typescript&startDate={30_days_ago}",
          code: "const pick = (name) => data.find(d => d.model === name) || {}; const gpt = pick('gpt-4o'); const claude = pick('claude-3-5-sonnet'); const gptRate = gpt.acceptance_rate || 0; const claudeRate = claude.acceptance_rate || 0; const winner = gptRate === claudeRate ? 'tie' : (gptRate > claudeRate ? 'gpt-4o' : 'claude-3-5-sonnet'); return { winner, gpt_4o_rate: gptRate, claude_rate: claudeRate };"
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
              title: "Model Quality (TypeScript)",
              tableColumns: [
                { key: "model", label: "Model" },
                { key: "language", label: "Language" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
                { key: "interactions", label: "Interactions", format: "number" }
              ]
            }
          }
        }
      }
    ]
  },
  {
    user: "What is the acceptance rate for o1-preview? Is it worth the cost compared to llama-3-70b?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/breakdown?by=model" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=model",
          code: "const find = (label) => data.find(d => String(d.model || d.name || '').toLowerCase() === label.toLowerCase()); const o1 = find('o1-preview'); const llama = find('llama-3-70b'); const o1Rate = o1?.acceptance_rate ?? 0; const llamaRate = llama?.acceptance_rate ?? 0; const winner = o1Rate === llamaRate ? 'tie' : (o1Rate > llamaRate ? (o1?.model || o1?.name) : (llama?.model || llama?.name)); return { o1_rate: o1Rate, llama_rate: llamaRate, winner };"
        }
      },

      {
        tool: "render_dashboard", 
        args: { 
          config: {
            layout: "single",
            config: { 
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/breakdown?by=model", 
              title: "Model Acceptance Rates",
              tableColumns: [
                { key: "model", label: "Model" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
                { key: "interactions", label: "Interactions", format: "number" }
              ]
            }
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
          tool: "analyze_data_with_code",
          args: {
            endpoint: "/api/metrics/breakdown?by=model",
            code: "const total = data.reduce((s, d) => s + (d.interactions || 0), 0); const top = data.reduce((best, d) => (d.interactions || 0) > (best?.interactions || 0) ? d : best, null); const share = total ? (top?.interactions || 0) / total : 0; return { top_model: top?.model || top?.name || null, share };"
          }
        },

        {
          tool: "render_dashboard", 
          args: { 
            config: {
              layout: "single",
              config: {
                component: "SmartChart", 
                apiEndpoint: "/api/metrics/breakdown?by=model", 
                title: "Provider Distribution",
                xAxisKey: "name",
                chartSeries: [{ key: "interactions", label: "Interactions", color: "#8b5cf6" }]
              }
            }
          } 
        }
      ]
    },
  
  {
    user: "For developers using o1-preview, what is their average LOC added per user?",
    tool_steps: [
      {
        tool: "get_metrics_summary", 
        args: { endpoint: "/api/metrics/breakdown?by=model&model=o1-preview" } 
      },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=model&model=o1-preview",
          code: "const row = data[0] || {}; const total = row.total_loc_added ?? row.loc_added ?? 0; const users = row.active_users_count ?? 0; const avg = row.loc_added_per_user ?? (users ? total / users : 0); return { avg_loc_added_per_user: avg };"
        }
      },

      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/breakdown?by=model&model=o1-preview", 
              title: "Avg LOC per User (o1-preview)",
              tableColumns: [
                { key: "model", label: "Model" },
                { key: "loc_added_per_user", label: "Avg LOC Added", format: "number" },
                { key: "interactions", label: "Interactions", format: "number" }
              ]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={7_days_ago}&model=claude-3-5-sonnet",
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
              apiEndpoint: "/api/metrics/trends?startDate={7_days_ago}&model=claude-3-5-sonnet", 
              title: "Claude 3.5 Weekly Trend",
              chartSeries: [{ key: "interactions", label: "Interactions", color: "#8b5cf6" }]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/summary?userLogin=brian_williams",
          code: "const row = data.find(d => String(d.user_name || '').toLowerCase() === 'brian williams' || String(d.user_login || '').toLowerCase() === 'brian_williams'); return { acceptance_rate: row?.acceptance_rate ?? 0 };"
        }
      },

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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"James\", \"userLogin\": \"james_wilson\" }&entityB={ \"label\": \"Brian\", \"userLogin\": \"brian_williams\" }&metricKey=acceptance_rate",
          code: "const pick = (name, login) => data.find(d => String(d.user_name || '').toLowerCase() === name || String(d.user_login || '').toLowerCase() === login); const brian = pick('brian williams', 'brian_williams'); const james = pick('james wilson', 'james_wilson'); const brianRate = brian?.acceptance_rate ?? 0; const jamesRate = james?.acceptance_rate ?? 0; const winner = brianRate === jamesRate ? 'tie' : (brianRate > jamesRate ? 'brian_williams' : 'james_wilson'); return { brian_rate: brianRate, james_rate: jamesRate, winner };"
        }
      },

      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "split",
            leftChart: { component: "CompareStatCard", apiEndpoint: "/api/metrics/compare/summary?entityA={ \"label\": \"James\", \"userLogin\": \"james_wilson\" }&entityB={ \"label\": \"Brian\", \"userLogin\": \"brian_williams\" }&metricKey=acceptance_rate", title: "Efficiency Comparison" },
            rightChart: { 
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/users", 
              title: "User Details",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "interactions", label: "Interactions", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" }
              ]
            }
          }
        }
      }
    ]
  },
  {
    user: "Who are my power users by interaction count?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/users" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users",
          code: "const top = [...data].sort((a, b) => (b.interactions || 0) - (a.interactions || 0)).slice(0, 10).map(d => ({ user: d.user_login, interactions: d.interactions || 0 })); return { top };"
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
              title: "Power Users", 
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
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/breakdown?by=language_model&userLogin=george_thompson" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=language_model&userLogin=george_thompson",
          code: "const models = [...data].sort((a, b) => (b.interactions || 0) - (a.interactions || 0)).slice(0, 5).map(d => ({ model: d.model || d.name, interactions: d.interactions || 0 })); return { models };"
        }
      },

      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/breakdown?by=language_model&userLogin=george_thompson", 
              title: "George's Model Lab", 
              tableColumns: [
                { key: "model", label: "AI Model" }, 
                { key: "language", label: "Language" }, 
                { key: "interactions", label: "Activity", format: "number" }
              ]
            }
          }
        }
      }
    ]
  },
  {
    user: "Identify users who have high 'Code Generation' but low 'Code Acceptance'. Who needs better prompt engineering training?",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/users" } },
      { tool: "analyze_data_with_code", args: { endpoint: "/api/metrics/users", code: "const matches = data.filter(u => u.suggestions > 50 && u.acceptance_rate < 0.2).map(u => ({ user: u.user_login, rate: u.acceptance_rate, suggestions: u.suggestions })); return { count: matches.length, users: matches.slice(0, 10) };" } },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/users", 
              title: "Efficiency Training Audit",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "suggestions", label: "Suggestions", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" }
              ]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={7_days_ago}&segment=QA",
          code: "const avg = data.reduce((s, d) => s + (d.acceptance_rate || 0), 0) / (data.length || 1); return { avg_acceptance_rate: avg };"
        }
      },

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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={2_days_ago}&userLogin=brian_williams",
          code: "const last = data[data.length - 1]?.acceptance_rate ?? 0; const prev = data[data.length - 2]?.acceptance_rate ?? 0; return { yesterday: last, day_before: prev, improved: last > prev };"
        }
      },

      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/trends?startDate={2_days_ago}&userLogin=brian_williams", 
              title: "Brian's Daily Quality",
              chartSeries: [{ key: "acceptance_rate", label: "Acceptance Rate", color: "#3b82f6" }]
            }
          }
        }
      }
    ]
  },
  {
    user: "Show contributors and LOC added this week.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/users?startDate={7_days_ago}" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate={7_days_ago}",
          code: "const top = [...data].sort((a, b) => (b.loc_added || 0) - (a.loc_added || 0)).slice(0, 10).map(d => ({ user: d.user_login, loc_added: d.loc_added || 0 })); return { top };"
        }
      },

      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/users?startDate={7_days_ago}", 
              title: "Weekly Contributors",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "loc_added", label: "LOC Added", format: "number" },
                { key: "interactions", label: "Interactions", format: "number" }
              ]
            }
          }
        }
      }
    ]
  },
  {
    user: "Compare gpt-4o vs o1-preview usage for the last 24 hours.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/breakdown?by=model&startDate={1_day_ago}" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=model&startDate={1_day_ago}",
          code: "const find = (label) => data.find(d => String(d.model || d.name || '').toLowerCase() === label.toLowerCase()); const gpt = find('gpt-4o'); const o1 = find('o1-preview'); const gptVal = gpt?.interactions ?? 0; const o1Val = o1?.interactions ?? 0; const winner = gptVal === o1Val ? 'tie' : (gptVal > o1Val ? (gpt?.model || gpt?.name) : (o1?.model || o1?.name)); return { gpt_4o: gptVal, o1_preview: o1Val, winner };"
        }
      },

      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/breakdown?by=model&startDate={1_day_ago}", 
              title: "Last 24h Model Usage",
              tableColumns: [
                { key: "model", label: "Model" },
                { key: "interactions", label: "Interactions", format: "number" }
              ]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={this_monday}&segment=Backend-Core",
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
              apiEndpoint: "/api/metrics/trends?startDate={this_monday}&segment=Backend-Core", 
              title: "Backend Velocity (Week-to-Date)",
              chartSeries: [{ key: "loc_added", label: "LOC Added", color: "#10b981" }]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/summary?startDate=2026-01-01&endDate=2026-01-31",
          code: "const row = data[0] || {}; const total = row.total_loc_added ?? row.loc_added ?? 0; return { total_loc_added: total };"
        }
      },

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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/summary?startDate=2025-12-01&endDate=2025-12-31",
          code: "const row = data[0] || {}; const rate = row.acceptance_rate ?? 0; return { acceptance_rate: rate };"
        }
      },

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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=model&startDate={last_month_start}&endDate={last_month_end}",
          code: "const top = data.reduce((best, d) => (d.interactions || 0) > (best?.interactions || 0) ? d : best, null); return { model: top?.model || top?.name || null, interactions: top?.interactions || 0 };"
        }
      },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: {
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/breakdown?by=model&startDate={last_month_start}&endDate={last_month_end}", 
              title: "Monthly Model Popularity",
              xAxisKey: "name",
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={30_days_ago}",
          code: "const first = data[0]?.active_users ?? 0; const last = data[data.length - 1]?.active_users ?? 0; return { first, last, delta: last - first };"
        }
      },

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
    user: "List developers and interactions between Jan 1st and Jan 15th.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/users?startDate=2026-01-01&endDate=2026-01-15" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate=2026-01-01&endDate=2026-01-15",
          code: "const users = data.slice(0, 10).map(d => ({ user: d.user_login, interactions: d.interactions || 0 })); return { users };"
        }
      },

      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/users?startDate=2026-01-01&endDate=2026-01-15", 
              title: "Developer Activity (Jan 1-15)",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "interactions", label: "Interactions", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" }
              ]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/summary?startDate=2026-01-05",
          code: "const row = data[0] || {}; return { total_interactions: row.total_interactions ?? row.interactions ?? 0, active_users_count: row.active_users_count ?? 0, acceptance_rate: row.acceptance_rate ?? 0 };"
        }
      },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "dashboard",
            headerStats: [{ title: "Post-Release Adoption", apiEndpoint: "/api/metrics/summary?startDate=2026-01-05", dataKey: "active_users_count" }],
            slotMain: { 
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/trends?startDate=2026-01-05", 
              title: "Daily Active Users since Jan 5",
              chartSeries: [{ key: "active_users", label: "Active Users", color: "#8b5cf6" }]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/summary?startDate=2026-01-01&endDate=2026-01-14",
          code: "const row = data[0] || {}; const total = row.total_loc_added ?? row.loc_added ?? 0; return { sprint_22_total_loc_added: total };"
        }
      },
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate=2026-01-01",
          code: "const totals = data.reduce((acc, d) => { acc.s += d.suggestions || 0; acc.a += d.acceptances || 0; return acc; }, { s: 0, a: 0 }); return { suggestions: totals.s, acceptances: totals.a, acceptance_rate: totals.s ? totals.a / totals.s : 0 };"
        }
      },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/trends?startDate=2026-01-01", 
              title: "Q1 Performance Trend",
              chartSeries: [
                { key: "suggestions", label: "Suggestions", color: "#94a3b8" },
                { key: "acceptances", label: "Acceptances", color: "#10b981" }
              ]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={last_friday}&endDate={last_monday}&segment=QA",
          code: "const weekend = data.filter(d => { const day = new Date(d.date).getUTCDay(); return day === 0 || day === 6; }); const weekday = data.filter(d => { const day = new Date(d.date).getUTCDay(); return day !== 0 && day !== 6; }); const avg = (rows) => rows.reduce((s, d) => s + (d.interactions || 0), 0) / (rows.length || 1); const weekendAvg = avg(weekend); const weekdayAvg = avg(weekday); return { weekendAvg, weekdayAvg, spike: weekendAvg > weekdayAvg * 1.2 };"
        }
      },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/trends?startDate={last_friday}&endDate={last_monday}&segment=QA", 
              title: "Weekend QA Activity",
              chartSeries: [{ key: "interactions", label: "Interactions", color: "#8b5cf6" }]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/summary?startDate=2026-01-01&userLogin=james_wilson",
          code: "const row = data.find(d => String(d.user_name || '').toLowerCase() === 'james wilson' || String(d.user_login || '').toLowerCase() === 'james_wilson') || {}; return { interactions: row.interactions ?? 0, loc_added: row.loc_added ?? 0, acceptance_rate: row.acceptance_rate ?? 0 };"
        }
      },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "dashboard",
            headerStats: [{ title: "Total Impact", apiEndpoint: "/api/metrics/summary?userLogin=james_wilson", dataKey: "total_loc_added" }],
            slotMain: { 
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/trends?userLogin=james_wilson", 
              title: "James's YTD Growth",
              chartSeries: [{ key: "loc_added", label: "LOC Added", color: "#10b981" }]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/breakdown?by=ide&startDate={7_days_ago}&segment=Backend-Platform",
          code: "const top = data.reduce((best, d) => (d.interactions || 0) > (best?.interactions || 0) ? d : best, null); return { ide: top?.ide || top?.name || null, interactions: top?.interactions || 0 };"
        }
      },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/breakdown?by=ide&startDate={7_days_ago}&segment=Backend-Platform", 
              title: "Platform IDE Split",
              xAxisKey: "name",
              chartSeries: [{ key: "interactions", label: "Interactions", color: "#8b5cf6" }]
            }
          }
        }
      }
    ]
  },
  {
    user: "Show acceptance rates for TypeScript users in the last 3 days.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/users?startDate={3_days_ago}&language=typescript" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate={3_days_ago}&language=typescript",
          code: "const avg = data.reduce((s, d) => s + (d.acceptance_rate || 0), 0) / (data.length || 1); return { avg_acceptance_rate: avg };"
        }
      },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/users?startDate={3_days_ago}&language=typescript", 
              title: "TypeScript User Quality",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
                { key: "interactions", label: "Interactions", format: "number" }
              ]
            }
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
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/compare/summary?startDate=2026-01-01&endDate=2026-01-07&entityA={ \"label\": \"Brian\", \"userLogin\": \"brian_williams\" }&entityB={ \"label\": \"George\", \"userLogin\": \"george_thompson\" }&metricKey=acceptance_rate",
          code: "const pick = (name, login) => data.find(d => String(d.user_name || '').toLowerCase() === name || String(d.user_login || '').toLowerCase() === login); const brian = pick('brian williams', 'brian_williams'); const george = pick('george thompson', 'george_thompson'); const brianRate = brian?.acceptance_rate ?? 0; const georgeRate = george?.acceptance_rate ?? 0; const winner = brianRate === georgeRate ? 'tie' : (brianRate > georgeRate ? 'brian_williams' : 'george_thompson'); return { brian_rate: brianRate, george_rate: georgeRate, winner };"
        }
      },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "split",
            leftChart: { component: "CompareStatCard", apiEndpoint: "/api/metrics/compare/summary?startDate=2026-01-01&endDate=2026-01-07&entityA={ \"label\": \"Brian\", \"userLogin\": \"brian_williams\" }&entityB={ \"label\": \"George\", \"userLogin\": \"george_thompson\" }&metricKey=acceptance_rate", title: "Early Jan Quality Gap" },
            rightChart: { 
              component: "SmartChart", 
              apiEndpoint: "/api/metrics/compare/trends?startDate=2026-01-01&endDate=2026-01-07&queries=[{\"label\":\"Brian\",\"userLogin\":\"brian_williams\"},{\"label\":\"George\",\"userLogin\":\"george_thompson\"}]&metricKey=acceptance_rate", 
              title: "Quality Over Time",
              chartSeries: [
                { key: "Brian", label: "Brian", color: "#3b82f6" },
                { key: "George", label: "George", color: "#10b981" }
              ]
            }
          }
        }
      }
    ]
  },
  {
    user: "Show me the trend of o1-preview adoption since Jan 10th.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/trends?startDate={query_date}&model=o1-preview" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/trends?startDate={query_date}&model=o1-preview",
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
              apiEndpoint: "/api/metrics/trends?startDate={query_date}&model=o1-preview", 
              title: "o1-preview Adoption Trend",
              chartSeries: [{ key: "interactions", label: "Interactions", color: "#8b5cf6" }]
            }
          }
        }
      }
    ]
  },
  {
    user: "Rank users by interactions for the last 48 hours.",
    tool_steps: [
      { tool: "get_metrics_summary", args: { endpoint: "/api/metrics/users?startDate={2_days_ago}" } },
      {
        tool: "analyze_data_with_code",
        args: {
          endpoint: "/api/metrics/users?startDate={2_days_ago}",
          code: "const ranked = [...data].sort((a, b) => (b.interactions || 0) - (a.interactions || 0)).slice(0, 10).map(d => ({ user: d.user_login, interactions: d.interactions || 0 })); return { ranked };"
        }
      },
      {
        tool: "render_dashboard", 
        args: {
          config: {
            layout: "single",
            config: { 
              component: "SmartTable", 
              apiEndpoint: "/api/metrics/users?startDate={2_days_ago}", 
              title: "Activity Leaderboard (48h)",
              tableColumns: [
                { key: "user_login", label: "User" },
                { key: "interactions", label: "Interactions", format: "number" },
                { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" }
              ]
            }
          }
        }
      }
    ]
  }
];
