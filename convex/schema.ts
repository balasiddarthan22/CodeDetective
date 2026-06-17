import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const verdictValidator = v.object({
  hypothesis: v.string(),
  evidence: v.array(v.string()),
  sourcesChecked: v.array(v.string()),
  conclusion: v.string(),
  confidence: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
});

export default defineSchema({
  cases: defineTable({
    deviceId: v.string(),
    title: v.string(),
    bugDescription: v.string(),
    status: v.union(
      v.literal("planning"),
      v.literal("investigating"),
      v.literal("concluded"),
      v.literal("error")
    ),
    verdict: v.optional(verdictValidator),
    sharedHitCaseId: v.optional(v.string()),
    sharedHitAge: v.optional(v.string()),
    createdAt: v.number(),
    concludedAt: v.optional(v.number()),
  })
    .index("by_deviceId", ["deviceId"])
    .index("by_deviceId_createdAt", ["deviceId", "createdAt"]),

  investigationSteps: defineTable({
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
    createdAt: v.number(),
  }).index("by_caseId", ["caseId"]),

  sharedCases: defineTable({
    originalCaseId: v.id("cases"),
    bugDescription: v.string(),
    verdict: verdictValidator,
    supermemoryId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});
