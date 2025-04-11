import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  rooms: defineTable({
    code: v.string(),
    hostId: v.id("users"),
    playerCount: v.number(),
    spyCount: v.number(),
    timeLimit: v.number(),
    word: v.string(),
    status: v.string(), // "waiting", "playing", "finished"
    startTime: v.optional(v.number()),
  }).index("by_code", ["code"]),

  players: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    isSpy: v.boolean(),
    name: v.string(),
  }).index("by_room", ["roomId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
