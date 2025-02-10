import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const createConversation = mutation({
  args: {
    participants: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.id("_storage")),
    admin: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const existingConversation = await ctx.db
      .query("conversations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) =>
        q.or(
          q.eq(q.field("participants"), args.participants),
          q.eq(q.field("participants"), args.participants.reverse())
        )
      )
      .first();

    if (existingConversation) {
      return existingConversation._id;
    }

    let groupImage;

    if (args.groupImage) {
      groupImage =
        ((await ctx.storage.getUrl(args.groupImage)) as string) +
        "`" +
        args.groupImage;
    }

    const conversationId = await ctx.db.insert("conversations", {
      participants: args.participants,
      isGroup: args.isGroup,
      groupName: args.groupName,
      groupImage,
      admin: args.admin,
    });

    return conversationId;
  },
});

export const getMyConversations = query({
  args: {
    searchQuery: v.string(),
    isGroup: v.boolean(),
    isOneToOne: v.boolean(),
  },
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
    let myConversations;

    myConversations = conversations.filter((conversation) => {
      return conversation.participants.includes(user._id);
    });

    if (args.isGroup) {
      myConversations = myConversations.filter(
        (conversation) => conversation.isGroup === true
      );
    }
    if (args.isOneToOne) {
      myConversations = myConversations.filter(
        (conversation) => conversation.isGroup === false
      );
    }
    let filteredConversations = myConversations;

    // If searchQuery is not empty, apply filtering for both group and non-group chats
    if (args.searchQuery !== "") {
      filteredConversations = myConversations.filter((conversation) => {
        if (conversation.isGroup) {
          return (
            conversation.groupName
              ?.toUpperCase()
              .startsWith(args.searchQuery.toUpperCase()) ??
            conversation.groupName
              ?.toUpperCase()
              .includes(args.searchQuery.toUpperCase())
          );
        } else {
          return true; // We will filter non-group conversations later based on user names
        }
      });
    }

    const conversationsWithDetails = await Promise.all(
      filteredConversations.map(async (conversation) => {
        let userDetails: { name?: string } = {};

        if (!conversation.isGroup) {
          const otherUserId = conversation.participants.find(
            (id) => id !== user._id
          );
          const userProfile = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), otherUserId))
            .take(1);

          userDetails = userProfile[0];

          // If searchQuery exists, filter non-group chats by user name
          if (args.searchQuery !== "") {
            if (
              !userDetails?.name
                ?.toUpperCase()
                .startsWith(args.searchQuery.toUpperCase()) ||
              !userDetails?.name
                ?.toUpperCase()
                .includes(args.searchQuery.toUpperCase())
            ) {
              return null; // Skip this conversation if it doesn't match the search
            }
          }
        }

        const lastMessage = await ctx.db
          .query("messages")
          .filter((q) => q.eq(q.field("conversation"), conversation._id))
          .order("desc")
          .take(1);

        return {
          ...userDetails,
          ...conversation,
          lastMessage: lastMessage[0] || null,
        };
      })
    );
    return conversationsWithDetails.filter((conversation) => conversation !== null);
  },
});

export const removeUser = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    removedUserName: v.string(),
    message: v.optional(v.id("messages")),
  },
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
    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .unique();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, {
      participants: conversation.participants.filter(
        (participant) => participant !== args.userId
      ),
    });

    await ctx.db.insert("events", {
      conversation: args.conversationId,
      content: `${args.removedUserName} was removed by ${user.name}`,
      message: args?.message ?? undefined,
    });
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getSpecificCoversation = mutation({
  args: { conversationId: v.id("conversations") },
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

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .unique();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    let userDetails: { name?: string } = {};

    if (!conversation.isGroup) {
      const otherUserId = conversation.participants.find(
        (id) => id !== user._id
      );
      const userProfile = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), otherUserId))
        .take(1);

      userDetails = userProfile[0];
    }
    const lastMessage = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversation"), conversation._id))
      .order("desc")
      .take(1);

    return {
      ...userDetails,
      ...conversation,
      lastMessage: lastMessage[0] || null,
    };
  },
});

export const deleteGroup = mutation({
  args: { conversationId: v.id("conversations") },
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

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .unique();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    const conversationMessages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversation"), args.conversationId))
      .collect();

    for (const conversationMessage of conversationMessages) {
      await ctx.runMutation(api.messages.deleteMessage, {
        messageId: conversationMessage._id,
        content: conversationMessage.content,
        messageType: conversationMessage.messageType,
      });
    }
    await ctx.db.delete(args.conversationId);
  },
});

export const changeGroupImage = mutation({
  args: {
    conversationId: v.id("conversations"),
    imageId: v.id("_storage"),
    message: v.optional(v.id("messages")),
  },
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

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .unique();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }
    if (conversation.groupImage) {
      await ctx.storage.delete(
        conversation.groupImage.split("`")[1] as Id<"_storage">
      );
    }
    await ctx.db.insert("events", {
      conversation: args.conversationId,
      content: `Group Image was changed to by ${user.name}`,
      message: args?.message ?? undefined,
    });
    const groupImage =
      ((await ctx.storage.getUrl(args.imageId)) as string) + "`" + args.imageId;

    await ctx.db.patch(args.conversationId, { groupImage: groupImage });

    return groupImage;
  },
});

export const changeGroupName = mutation({
  args: {
    conversationId: v.id("conversations"),
    newName: v.string(),
    message: v.optional(v.id("messages")),
  },
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

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .unique();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    await ctx.db.insert("events", {
      conversation: args.conversationId,
      content: `Group name was changed to "${args.newName}" by ${user.name}`,
      message: args?.message ?? undefined,
    });

    await ctx.db.patch(args.conversationId, { groupName: args.newName });
  },
});

export const addMembers = mutation({
  args: {
    conversationId: v.id("conversations"),
    selectedUsers: v.array(v.id("users")),
    message: v.optional(v.id("messages")),
  },
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

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .unique();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }
    const currentParticipants = conversation?.participants || [];

    const updatedParticipants = [
      ...new Set([...currentParticipants, ...args.selectedUsers]),
    ];

    const userPromises = args.selectedUsers.map(async (id) => {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), id))
        .unique();
      return user?.name;
    });

    const userNames = await Promise.all(userPromises);

    await ctx.db.insert("events", {
      conversation: args.conversationId,
      content: `${userNames.join(", ")} ${args.selectedUsers.length === 1 ? "was" : "were"} added by ${user.name}`,
      message: args?.message ?? undefined,
    });
    await ctx.db.patch(args.conversationId, {
      participants: updatedParticipants,
    });
  },
});

export const leaveGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    message: v.optional(v.id("messages")),
  },
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

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .unique();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    const updatedParticipants = conversation.participants.filter(
      (participant) => participant !== args.userId
    );

    
    const leavingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .unique();

    const userName = leavingUser?.name;

    await ctx.db.insert("events", {
      conversation: args.conversationId,
      content: `${userName} left the group`,
      message: args?.message ?? undefined,
    });

    if (updatedParticipants.length === 0) {
      await ctx.db.delete(args.conversationId);
      return;
    }
    await ctx.db.patch(args.conversationId, {
      participants: updatedParticipants,
    });
    if(args.userId === conversation.admin){
      await ctx.db.patch(args.conversationId, {
        admin: updatedParticipants[0]
      });
      const newAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), updatedParticipants[0]))
      .unique();

      await ctx.db.insert("events", {
        conversation: args.conversationId,
        content: `${newAdmin?.name} has become the admin.`,
        message: args?.message ?? undefined,
      });
  

    }

  },
});
