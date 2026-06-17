import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    deviceId: v.string(),
    bugDescription: v.string(),
  },
  handler: async (ctx, { deviceId, bugDescription }) => {
    return await ctx.db.insert("cases", {
      deviceId,
      title: bugDescription.slice(0, 80),
      bugDescription,
      status: "planning",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    caseId: v.id("cases"),
    status: v.union(
      v.literal("planning"),
      v.literal("investigating"),
      v.literal("concluded"),
      v.literal("error")
    ),
    verdict: v.optional(
      v.object({
        hypothesis: v.string(),
        evidence: v.array(v.string()),
        sourcesChecked: v.array(v.string()),
        conclusion: v.string(),
        confidence: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
      })
    ),
  },
  handler: async (ctx, { caseId, status, verdict }) => {
    await ctx.db.patch(caseId, {
      status,
      ...(verdict ? { verdict } : {}),
      ...(status === "concluded" ? { concludedAt: Date.now() } : {}),
    });
  },
});

export const setSharedHit = mutation({
  args: {
    caseId: v.id("cases"),
    sharedHitCaseId: v.string(),
    sharedHitAge: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.caseId, {
      sharedHitCaseId: args.sharedHitCaseId,
      sharedHitAge: args.sharedHitAge,
      status: "concluded",
      concludedAt: Date.now(),
    });
  },
});

export const getById = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, { caseId }) => {
    return await ctx.db.get(caseId);
  },
});

export const listByDevice = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    return await ctx.db
      .query("cases")
      .withIndex("by_deviceId_createdAt", (q) => q.eq("deviceId", deviceId))
      .order("desc")
      .take(20);
  },
});
