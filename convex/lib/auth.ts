import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Session-derived authorization.
 *
 * Hard rule from the contract: never accept a `userId` (or `workspaceId`)
 * from the client as authority. Every function derives identity from the
 * session, scopes the object to it, and returns "Not found." rather than
 * revealing whether an unauthorized object exists.
 */

export type Ctx = QueryCtx | MutationCtx;

/** Tables whose rows carry a workspaceId, for scoped lookups. */
export type WorkspaceScopedTable = "tenders" | "evidenceItems" | "clarifications" | "submissionPackages";

export async function requireUserId(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Please sign in first.");
  }
  return userId;
}

/** The signed-in user's workspace, or null before onboarding. */
export async function getWorkspace(ctx: Ctx): Promise<Doc<"workspaces"> | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db
    .query("workspaces")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

/** The workspace, creating it on first use so the desk is never empty-handed. */
export async function requireWorkspace(ctx: Ctx): Promise<Doc<"workspaces">> {
  const userId = await requireUserId(ctx);
  const existing = await ctx.db
    .query("workspaces")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (existing !== null) return existing;
  if ("insert" in ctx.db) {
    const user = await ctx.db.get(userId);
    const name = user?.name ?? user?.email ?? "My workspace";
    const id = await (ctx as MutationCtx).db.insert("workspaces", { userId, name });
    const inserted = await ctx.db.get(id);
    return inserted!;
  }
  throw new ConvexError("Workspace not initialized.");
}

/**
 * Load a tender and prove it belongs to the caller's workspace.
 * Throws "Not found." either way — existence is never leaked.
 */
export async function requireTender(
  ctx: Ctx,
  tenderId: Id<"tenders">,
): Promise<{ tender: Doc<"tenders">; workspace: Doc<"workspaces"> }> {
  const tender = await ctx.db.get(tenderId);
  if (tender === null) {
    throw new ConvexError("Not found.");
  }
  const workspace = await getWorkspace(ctx);
  if (!workspace) {
    const tenderWorkspace = await ctx.db.get(tender.workspaceId);
    if (!tenderWorkspace) throw new ConvexError("Not found.");
    return { tender, workspace: tenderWorkspace };
  }
  if (tender.workspaceId !== workspace._id) {
    throw new ConvexError("Not found.");
  }
  return { tender, workspace };
}

/** Same guarantee for any workspace-scoped table. */
export async function requireOwned<T extends WorkspaceScopedTable>(
  ctx: Ctx,
  _table: T,
  id: Id<T>,
): Promise<{ doc: Doc<T>; workspace: Doc<"workspaces"> }> {
  const doc = (await ctx.db.get(id)) as (Doc<T> & { workspaceId: Id<"workspaces"> }) | null;
  if (doc === null) {
    throw new ConvexError("Not found.");
  }
  const workspace = await getWorkspace(ctx);
  if (!workspace) {
    const docWorkspace = await ctx.db.get(doc.workspaceId);
    if (!docWorkspace) throw new ConvexError("Not found.");
    return { doc, workspace: docWorkspace };
  }
  if (doc.workspaceId !== workspace._id) {
    throw new ConvexError("Not found.");
  }
  return { doc, workspace };
}
