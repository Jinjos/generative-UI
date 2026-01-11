import { Room } from "../db/models";
import dbConnect from "../db/connect";
import { DashboardTool } from "../genui/schemas";

export class RoomService {
  /**
   * Fetches a room by ID or creates it if it doesn't exist.
   */
  static async getOrCreateRoom(roomId: string) {
    await dbConnect();
    
    let room = await Room.findOne({ roomId });
    
    if (!room) {
      room = await Room.create({
        roomId,
        messages: [],
        dashboardConfig: null
      });
      console.log(`🏠 [RoomService] Created new room: ${roomId}`);
    }
    
    return room;
  }

  /**
   * Updates the room state (messages and/or config).
   */
  static async updateRoom(roomId: string, updates: { messages?: unknown[]; config?: DashboardTool }) {
    await dbConnect();
    
    const updateData: Record<string, unknown> = { lastUpdated: new Date() };
    if (updates.messages) updateData.messages = updates.messages;
    if (updates.config) updateData.dashboardConfig = updates.config;

    const room = await Room.findOneAndUpdate(
      { roomId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    console.log(`🏠 [RoomService] Updated room: ${roomId}`);
    return room;
  }

  /**
   * Specifically adds a single message to the history.
   */
  static async addMessage(roomId: string, message: unknown) {
    await dbConnect();
    console.log(`🏠 [RoomService] Adding message to room: ${roomId}`, JSON.stringify(message).substring(0, 100));
    return await Room.findOneAndUpdate(
      { roomId },
      { 
        $push: { messages: message },
        $set: { lastUpdated: new Date() }
      },
      { new: true }
    );
  }
}
