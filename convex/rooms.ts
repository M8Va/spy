import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const words = [
  "مدرسة", "مستشفى", "مطعم", "سينما", "حديقة",
  "شاطئ", "مطار", "فندق", "سوق", "ملعب",
  "مكتبة", "متحف", "مقهى", "محطة", "مسجد",
  "منتزه", "مسبح", "مول", "مصنع", "مزرعة"
];

export const createRoom = mutation({
  args: {
    playerCount: v.number(),
    spyCount: v.number(),
    timeLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const word = words[Math.floor(Math.random() * words.length)];

    const roomId = await ctx.db.insert("rooms", {
      code,
      hostId: userId,
      playerCount: args.playerCount,
      spyCount: args.spyCount,
      timeLimit: args.timeLimit,
      word,
      status: "waiting",
    });

    await ctx.db.insert("players", {
      roomId,
      userId,
      isSpy: false,
      name: "Player 1",
    });

    return { roomId, code };
  },
});

export const joinRoom = mutation({
  args: {
    code: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();
    
    if (!room) throw new Error("Room not found");
    if (room.status !== "waiting") throw new Error("Game already started");

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    if (players.length >= room.playerCount) {
      throw new Error("Room is full");
    }

    const existingPlayer = players.find(p => p.userId === userId);
    if (existingPlayer) throw new Error("Already in room");

    await ctx.db.insert("players", {
      roomId: room._id,
      userId,
      isSpy: false,
      name: args.name,
    });

    return { roomId: room._id };
  },
});

export const startGame = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== userId) throw new Error("Not the host");

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (players.length < room.playerCount) {
      throw new Error("Not enough players");
    }

    // Randomly select spies
    const playerIds = players.map(p => p._id);
    const spyIds = new Set();
    while (spyIds.size < room.spyCount) {
      const randomIndex = Math.floor(Math.random() * playerIds.length);
      spyIds.add(playerIds[randomIndex]);
    }

    // Update player roles
    for (const player of players) {
      await ctx.db.patch(player._id, {
        isSpy: spyIds.has(player._id),
      });
    }

    await ctx.db.patch(args.roomId, {
      status: "playing",
      startTime: Date.now(),
    });
  },
});

export const getRoomState = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const currentPlayer = players.find(p => p.userId === userId);
    if (!currentPlayer) throw new Error("Not in room");

    return {
      room,
      players,
      isSpy: currentPlayer.isSpy,
      word: currentPlayer.isSpy ? null : room.word,
      timeLeft: room.startTime ? Math.max(0, room.timeLimit * 1000 - (Date.now() - room.startTime)) : null,
    };
  },
});
