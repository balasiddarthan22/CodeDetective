import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addSharedCase = mutation({
  args: {
    originalCaseId: v.id("cases"),
    bugDescription: v.string(),
    verdict: v.object({
      hypothesis: v.string(),
      evidence: v.array(v.string()),
      sourcesChecked: v.array(v.string()),
      conclusion: v.string(),
      confidence: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    }),
    supermemoryId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sharedCases", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const recentShared = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return await ctx.db
      .query("sharedCases")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

export const findSimilar = query({
  args: { bugDescription: v.string() },
  handler: async (ctx, { bugDescription }) => {
    // Fetch recent shared cases and return them — caller does similarity matching
    const cases = await ctx.db
      .query("sharedCases")
      .withIndex("by_createdAt")
      .order("desc")
      .take(100);
    return cases;
  },
});
