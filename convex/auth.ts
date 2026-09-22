import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";

/**
 * Session identity for the workspace.
 *
 * Anonymous = one-click demo entry. Password = email + password, no
 * verification mail. Both mint the same `users` row keyed on a verified
 * subject, which is the only identity any function in this app trusts —
 * never an id supplied by a client.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Anonymous, Password],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      if (args.existingUserId) return args.existingUserId;
      const { emailVerified: _e, phoneVerified: _p, ...profile } = args.profile;
      return await ctx.db.insert("users", profile as never);
    },
  },
});
