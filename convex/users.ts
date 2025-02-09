/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const createUser = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    image: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("users", {
      tokenIdentifier: args.tokenIdentifier,
      email: args.email,
      name: args.name,
      image: args.image,
      isOnline: true,
    });
  },
});

export const updateUser = internalMutation({
  args: { tokenIdentifier: v.string(), image: v.string() },
  async handler(ctx, args) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(user._id, {
      image: args.image,
    });
  },
});

export const setUserOnline = internalMutation({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();

    if (!user) {
      console.log("User not found");
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(user._id, { isOnline: true });
  },
});

export const setUserOffline = internalMutation({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();

    if (!user) {
      console.log("User not found");
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(user._id, { isOnline: false });
  },
});

export const getUsers = query({
  args: {searchUser: v.optional(v.string())},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }
    const users = await ctx.db.query("users").collect();
     let defaultUsers;
      if(args.searchUser === "" || !args.searchUser){
       defaultUsers =  users.filter(
          (user) => user.tokenIdentifier !== identity.tokenIdentifier
        );
      }
      if(args.searchUser !== "" && args.searchUser){
        const initialUsers = users.filter(
          (user) => user.tokenIdentifier !== identity.tokenIdentifier
        );
        defaultUsers = initialUsers.filter((user)=>args.searchUser &&
        ( user.name?.toLowerCase().startsWith(args.searchUser.toLowerCase()) || user.name?.toLowerCase().includes(args.searchUser.toLowerCase())))
      }
    return  defaultUsers
  },
});
export const getMe = query({
  args: {},
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
    return user;
  },
});

export const getGroupMembers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }
    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first();

    if (!conversation) {
      // throw new ConvexError("Conversation not found");
      return null;
    }

    const users = await ctx.db.query("users").collect();
    const groupMembers = users.filter((user) =>
      conversation.participants.includes(user._id)
    );

    return groupMembers;
  },
});
export const getGemini = query({
  args: {},
  handler: async (ctx) => {
    const gemini = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), "Gemini AI"))
      .first();

    return gemini;
  },
});
