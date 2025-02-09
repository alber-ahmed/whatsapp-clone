import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const sendTextMessage = mutation({
  args: {
    sender: v.string(),
    content: v.string(),
    conversation: v.id("conversations"),
    selectedConversation: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
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
      .filter((q) => q.eq(q.field("_id"), args.conversation))
      .first();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    if (!conversation.participants.includes(user._id)) {
      throw new ConvexError("You are not part of this conversation");
    }

    await ctx.db.insert("messages", {
      sender: args.sender,
      content: args.content,
      conversation: args.conversation,
      messageType: "text",
    });
    // TODO: Add gemini support
    if (
      args.content.startsWith("@gemini") ||
      (args.selectedConversation.name === "Gemini AI" &&
        !args.selectedConversation.isGroup)
    ) {
      await ctx.scheduler.runAfter(0, api.messages.generateGeminiMessage, {
        content: args.content,
        messageType: "text",
        conversation: args.conversation,
      });
    }
  },
});

export const getMessages = query({
  args: {
    conversation: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation", args.conversation)
      )
      .collect();

    const userProfileCache = new Map();

    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        if (message.sender === "Gemini AI") {
          const image =
            message.messageType === "text" ? "/gemini.jpg" : "dall-e.png";
          return { ...message, sender: { name: "Gemini AI", image } };
        }
        let sender;
        // Check if sender profile is in cache
        if (userProfileCache.has(message.sender)) {
          sender = userProfileCache.get(message.sender);
        } else {
          // Fetch sender profile from the database
          sender = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), message.sender))
            .first();
          // Cache the sender profile
          userProfileCache.set(message.sender, sender);
        }

        return { ...message, sender };
      })
    );

    return messagesWithSender;
  },
});

export const sendImage = mutation({
  args: {
    imgId: v.id("_storage"),
    sender: v.id("users"),
    conversation: v.id("conversations"),
    imageName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }
    const content = (await ctx.storage.getUrl(args.imgId)) as string;

    const totalContent = content + "`" + args.imageName + "`" + args.imgId;

    await ctx.db.insert("messages", {
      content: totalContent,
      sender: args.sender,
      messageType: "image",
      conversation: args.conversation,
    });
  },
});

export const sendVideo = mutation({
  args: {
    videoId: v.id("_storage"),
    sender: v.id("users"),
    conversation: v.id("conversations"),
    videoName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }
    const content = (await ctx.storage.getUrl(args.videoId)) as string;

    const totalContent = content + "`" + args.videoName + "`" + args.videoId;

    await ctx.db.insert("messages", {
      content: totalContent,
      sender: args.sender,
      messageType: "video",
      conversation: args.conversation,
    });
  },
});

export const sendFile = mutation({
  args: {
    fileId: v.id("_storage"),
    fileName: v.string(),
    sendMessageType: v.string(),
    sender: v.id("users"),
    conversation: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }
    const content = (await ctx.storage.getUrl(args.fileId)) as string;

    const totalContent = content + "`" + args.fileName + "`" + args.fileId;

    await ctx.db.insert("messages", {
      content: totalContent,
      sender: args.sender,
      messageType: args.sendMessageType,
      conversation: args.conversation,
    });
  },
});

export const generateGeminiMessage = action({
  args: {
    content: v.string(),
    conversation: v.id("conversations"),
    messageType: v.string(),
  },
  handler: async (ctx, args) => {
    function generateRandomID(length: number) {
      const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset[randomIndex];
      }
      return result;
    }
    const messageId = generateRandomID(32);
    await ctx.runMutation(api.messages.initializeGeminiMessage, {
      messageId: messageId,
      text: "",
      messageType: args.messageType,
      conversation: args.conversation,
    });
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" , systemInstruction: "You are an AI bot in a chat application. For the answer of a question you may need to refer to your previous answer. Answer questions in medium length until a user specifies.",});

    const prompt = args.content;

    const result = await model.generateContentStream(prompt);

    let fullResponse = ""
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      await ctx.runMutation(api.messages.sendGeminiMessage, {
        text: fullResponse,
        conversation: args.conversation,
        messageId: messageId,
        messageType: args.messageType,
      });
    }
  },
});
export const initializeGeminiMessage = mutation({
  args: {
    text: v.string(),
    messageType: v.string(),
    conversation: v.id("conversations"),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      geminiId: args.messageId,
      content: args.text,
      sender: "Gemini AI",
      messageType: args.messageType,
      conversation: args.conversation,
    });
  },
});

export const sendGeminiMessage = mutation({
  args: {
    text: v.string(),
    messageType: v.string(),
    conversation: v.id("conversations"),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const geminiMessage = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("geminiId"), args.messageId))
      .first();

    await ctx.db.patch(geminiMessage!._id, {
      content:  args.text,
    });
  },
});

export const sendAudioMessage = mutation({
  args: {
    audio: v.id("_storage"),
    sendMessageType: v.string(),
    sender: v.id("users"),
    conversation: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }
    const content = (await ctx.storage.getUrl(args.audio)) as string;
    const totalContent = content + "`" + args.audio;

    await ctx.db.insert("messages", {
      content: totalContent,
      sender: args.sender,
      messageType: args.sendMessageType,
      conversation: args.conversation,
    });
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    messageType: v.string(),
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

    if (args.messageType !== "text") {
      let deleteId = args.content.split("`")[2] as Id<"_storage">;

      if (args.messageType === "audio") {
        deleteId = args.content.split("`")[1] as Id<"_storage">;
      }
      await ctx.storage.delete(deleteId);
    }

    await ctx.db.delete(args.messageId);
  },
});

export const forwardMessage = mutation({
  args: {
    conversations: v.array(v.id("conversations")),
    content: v.string(),
    messageType: v.string(),
    gemini: v.id("users"),
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
    for (let index = 0; index < args.conversations.length; index++) {
      const element = args.conversations[index];
      const conversation = await ctx.db
        .query("conversations")
        .filter((q) => q.eq(q.field("_id"), element))
        .first();
      if (!conversation) {
        throw new ConvexError("Conversation not found");
      }
      if (
        args.content.split(",")[0].startsWith("@gemini") ||
        conversation?.participants.includes(args.gemini)
      ) {
        await ctx.scheduler.runAfter(0, api.messages.generateGeminiMessage, {
          content: args.content,
          messageType: args.messageType,
          conversation: element,
        });
      }
    }

    for (let index = 0; index < args.conversations.length; index++) {
      const element = args.conversations[index];
      await ctx.db.insert("messages", {
        sender: user._id,
        content: args.content + "`Forwarded",
        conversation: element,
        messageType: args.messageType,
      });
    }
  },
});
