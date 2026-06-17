import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    caseId: v.id("cases"),
    deviceId: v.string(),
    kind: v.union(
      v.literal("plan"),
      v.literal("search_query"),
      v.literal("search_result"),
      v.literal("reasoning"),
      v.literal("fetch_url"),
      v.literal("fetch_result"),
      v.literal("conclusion")
    ),
    content: v.string(),
    systemLabel: v.union(
      v.literal("Supermemory"),
      v.literal("Hermes"),
      v.literal("TinyFish Search"),
      v.literal("TinyFish Fetch")
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("investigationSteps", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const byCaseId = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, { caseId }) => {
    return await ctx.db
      .query("investigationSteps")
      .withIndex("by_caseId", (q) => q.eq("caseId", caseId))
      .order("asc")
      .collect();
  },
});
