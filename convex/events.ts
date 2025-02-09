import { ConvexError } from "convex/values";
import { query } from "./_generated/server";

export const getAllEvents = query({
  args: {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const events = await ctx.db.query("events").collect();

   return events;
  },
});
