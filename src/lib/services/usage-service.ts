import dbConnect from "@/lib/db/connect";
import { DailyUsage } from "@/lib/db/models";

export class UsageService {
  static async getMetrics(days = 30) {
    await dbConnect();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const data = await DailyUsage.find({
      date: { $gte: cutoffDate }
    }).sort({ date: 1 }).lean();

    // Calculate Summary Metrics
    const total_hours = data.reduce((acc, curr) => acc + (curr.estimated_hours_saved || 0), 0);
    const total_lines = data.reduce((acc, curr) => acc + (curr.lines_accepted || 0), 0);
    const total_suggestions = data.reduce((acc, curr) => acc + (curr.suggestions_count || 0), 0);
    
    // Calculate simple adoption rate (avg active users / hypothetical max users 2000)
    // In a real app, max users would be dynamic.
    const avg_active_users = data.length > 0 
      ? Math.round(data.reduce((acc, curr) => acc + (curr.active_users || 0), 0) / data.length)
      : 0;

    return {
      summary: {
        total_hours_saved: Math.round(total_hours),
        total_lines_accepted: total_lines,
        total_suggestions: total_suggestions,
        avg_active_users: avg_active_users,
      },
      trends: data.map(d => ({
        date: (d.date as Date).toISOString().split('T')[0],
        active_users: d.active_users,
        suggestions_count: d.suggestions_count,
        lines_accepted: d.lines_accepted,
        estimated_hours_saved: d.estimated_hours_saved
      }))
    };
  }
}
