import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getUserContactsStatus = query({
  args: {searchQuery: v.string()},
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

    const conversations = await ctx.db.query("conversations").collect();

    const oneToOneConversations = conversations.filter(
      (conversation) =>
        conversation.participants.includes(user._id) && !conversation.isGroup
    );

    const participantLists = oneToOneConversations.map((conversation) => {
      return conversation.participants.filter(
        (participant) => participant !== user._id
      );
    });

    const flattenedParticipantLists = participantLists.flat();

    const statuses = await ctx.db.query("status").collect();

    const userContactsStatus = statuses.filter((status) =>
      flattenedParticipantLists.includes(status?.user)
    );

  const myStatus = statuses.filter((status) => {
    return status && user._id === status.user;
  });

      let filteredStatuses = userContactsStatus;

      // If searchQuery is not empty, apply filtering for both group and non-group chats
      if (args.searchQuery !== "") {
        filteredStatuses = userContactsStatus.filter((status) => {
            return (
              status.name
                ?.toUpperCase()
                .startsWith(args.searchQuery.toUpperCase()) ?? status.name
                ?.toUpperCase().includes(args.searchQuery.toUpperCase())
            );
          
        });
      }

    return {filteredStatuses: filteredStatuses ? filteredStatuses : userContactsStatus, myStatus: myStatus ?? null};

    
  },
});



export const updateTextStatus = mutation({
  args: {content: v.string(), backgroundColor: v.string(), textColor: v.string(), name: v.string(), user: v.id("users")},
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

     const prevStatus = await ctx.db.query("status").filter((q)=>q.eq(q.field("user"), user._id)).first();

     if(prevStatus){
      await ctx.db.delete(prevStatus._id);
     }
     await ctx.db.insert("status", {
      backgroundColor: args.backgroundColor,
      content: args.content,
      name: args.name,
      statusType: "text",
      textColor: args.textColor,
      user: args.user
     })
  },
});


export const updateImageStatus = mutation({
  args: {content: v.id("_storage"), backgroundColor: v.string(), textColor: v.string(), name: v.string(), user: v.id("users"), type: v.union(v.literal("image"), v.literal("text"), v.literal("video"))},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const url = (await ctx.storage.getUrl(args.content)) as string;
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

     const prevStatus = await ctx.db.query("status").filter((q)=>q.eq(q.field("user"), user._id)).first();

     if(prevStatus){
      await ctx.storage.delete(prevStatus.content.split("`")[1] as Id<"_storage">);
      await ctx.db.delete(prevStatus._id);
     }
     
     await ctx.db.insert("status", {
      backgroundColor: args.backgroundColor,
      content: url + "`" + args.content,
      name: args.name,
      statusType: args.type,
      textColor: args.textColor,
      user: args.user
     })
  },
});

export const removeStatus = mutation({
  args: { user: v.id("users")},
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

     const prevStatus = await ctx.db.query("status").filter((q)=>q.eq(q.field("user"), args.user)).first();

     if(prevStatus && prevStatus.statusType !== "text"){
      await ctx.storage.delete(prevStatus.content.split("`")[1] as Id<"_storage">);
     }

     
     await ctx.db.delete(prevStatus!._id);
     
    
  },
});
