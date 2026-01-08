const { Conversation, Message } = require(__dirname + "/../model/Chat");
const User = require(__dirname + "/../model/User");

module.exports = function (io) {

  const userSockets = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", async (data) => {
      try {
        const { userId, conversationId } = data;

        if (!userId) {
          socket.emit("error", { message: "User ID is required" });
          return;
        }

        userSockets.set(userId, socket.id);
        socket.userId = userId;

        if (conversationId) {
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${userId} joined conversation ${conversationId}`);
        }

        socket.emit("joined", { success: true });
      } catch (error) {
        console.error("Error in join:", error);
        socket.emit("error", { message: "Error joining chat" });
      }
    });

    socket.on("send_message", async (data) => {
      try {
        const { conversationId, content, senderId } = data;

        if (!conversationId || !content || !senderId) {
          socket.emit("error", { message: "Missing required fields" });
          return;
        }

        const user = await User.findById(senderId);
        if (!user) {
          socket.emit("error", { message: "User not found" });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.userId.toString() === senderId.toString()
        );
        if (!isParticipant) {
          socket.emit("error", { message: "You are not a participant" });
          return;
        }

        const message = new Message({
          conversationId: conversationId,
          senderId: senderId,
          senderName: user.firstName + " " + user.lastName,
          content: content,
          isRead: false,
        });

        await message.save();

        conversation.lastMessage = content;
        conversation.lastMessageAt = new Date();

        const isAdmin = user.role === "admin";
        if (!isAdmin) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }
        await conversation.save();

        const messageData = {
          _id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          isRead: message.isRead,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        };

        io.to(`conversation:${conversationId}`).emit("new_message", messageData);

        conversation.participants.forEach((participant) => {

          const participantId = participant.userId.toString();
          const participantSocketId = userSockets.get(participantId);
          if (participantSocketId) {
            io.to(participantSocketId).emit("conversation_updated", {
              conversationId: conversation._id,
              lastMessage: conversation.lastMessage,
              lastMessageAt: conversation.lastMessageAt,
              unreadCount: conversation.unreadCount,
            });
          }
        });

        console.log(`Message sent in conversation ${conversationId} by user ${senderId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Error sending message" });
      }
    });

    socket.on("mark_as_read", async (data) => {
      try {
        const { conversationId, userId } = data;

        if (!conversationId || !userId) {
          socket.emit("error", { message: "Missing required fields" });
          return;
        }

        await Message.updateMany(
          {
            conversationId: conversationId,
            senderId: { $ne: userId },
            isRead: false,
          },
          {
            $set: { isRead: true },
          }
        );

        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          const unreadCount = await Message.countDocuments({
            conversationId: conversationId,
            isRead: false,
          });
          conversation.unreadCount = unreadCount;
          await conversation.save();

          conversation.participants.forEach((participant) => {
            const participantId = participant.userId.toString();
            const participantSocketId = userSockets.get(participantId);
            if (participantSocketId) {
              io.to(participantSocketId).emit("conversation_updated", {
                conversationId: conversation._id,
                unreadCount: conversation.unreadCount,
              });
            }
          });
        }

        socket.emit("marked_as_read", { success: true });
      } catch (error) {
        console.error("Error marking as read:", error);
        socket.emit("error", { message: "Error marking as read" });
      }
    });

    socket.on("typing", (data) => {
      const { conversationId, userId, userName, isTyping } = data;
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit("user_typing", {
          userId: userId,
          userName: userName,
          isTyping: isTyping,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (socket.userId) {
        userSockets.delete(socket.userId);
      }
    });
  });

  return io;
};

