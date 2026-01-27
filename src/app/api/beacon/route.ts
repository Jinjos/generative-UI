import { NextResponse } from "next/server";
import { z } from "zod";
import { redisClient, getContextKey } from "@/lib/db/redis";

// Validation Schema for the Beacon Payload
const ComponentViewSchema = z.object({
  component: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  endpoint: z.string().optional(),
  params: z.record(z.unknown()).optional(),
});

const BeaconSchema = z.object({
  sessionId: z.string(), // We need to know WHO this is for
  page: z.string(),
  pathname: z.string(),
  views: z.array(ComponentViewSchema).optional().default([]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate payload
    const result = BeaconSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid beacon payload", details: result.error.errors },
        { status: 400 }
      );
    }

    const { sessionId, ...contextData } = result.data;
    const redisKey = getContextKey(sessionId);

    // Save to Redis with a short TTL (5 minutes)
    // We only care about "live" context. If the user is idle for 5 mins, 
    // the context is likely stale anyway.
    await redisClient.set(redisKey, JSON.stringify(contextData), "EX", 300);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Beacon API] Error processing beacon:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
