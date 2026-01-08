var express = require("express");
var router = express.Router();
const { Conversation, Message } = require(__dirname + "/../model/Chat");
const User = require(__dirname + "/../model/User");

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;

    let conversations = await Conversation.find({
      "participants.userId": userId,
      isActive: true,
    })
      .sort({ lastMessageAt: -1 })
      .limit(20);

    if (conversations.length === 0) {
      const user = await User.findById(userId);
      const adminUser = await User.findOne({ role: "admin" });

      if (user && adminUser) {

        const conversation = new Conversation({
          participants: [
            {
              userId: userId,
              userName: user.firstName + " " + user.lastName,
              userEmail: user.email,
            },
            {
              userId: adminUser._id,
              userName: adminUser.firstName + " " + adminUser.lastName,
              userEmail: adminUser.email,
            },
          ],
          lastMessage: "Xin chào! Chúng tôi có thể giúp gì cho bạn?",
          lastMessageAt: new Date(),
          unreadCount: 1,
        });

        await conversation.save();

        const welcomeMessage = new Message({
          conversationId: conversation._id,
          senderId: adminUser._id,
          senderName: adminUser.firstName + " " + adminUser.lastName,
          content: "Xin chào! Chúng tôi có thể giúp gì cho bạn?",
          isRead: false,
        });

        await welcomeMessage.save();

        conversations = await Conversation.find({
          "participants.userId": userId,
          isActive: true,
        })
          .sort({ lastMessageAt: -1 })
          .limit(20);

        if (conversations.length > 0) {
          const messages = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: 1 })
            .limit(100);

          return res.render("chat.ejs", {
            conversations: conversations,
            currentUser: req.session.user,
            activeConversationId: conversation._id,
            activeConversation: conversation,
            messages: messages,
          });
        }
      }
    }

    if (conversations.length === 1) {
      const conversation = conversations[0];
      const messages = await Message.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 })
        .limit(100);

      return res.render("chat.ejs", {
        conversations: conversations,
        currentUser: req.session.user,
        activeConversationId: conversation._id,
        activeConversation: conversation,
        messages: messages,
      });
    }

    res.render("chat.ejs", {
      conversations: conversations,
      currentUser: req.session.user,
      activeConversationId: null,
      messages: [],
    });
  } catch (error) {
    console.error("Error loading chat page:", error);
    res.render("chat.ejs", {
      conversations: [],
      currentUser: req.session.user,
      activeConversationId: null,
      messages: [],
      error: "Có lỗi xảy ra khi tải trang chat",
    });
  }
});

router.get("/:conversationId", requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const conversationId = req.params.conversationId;

    const conversations = await Conversation.find({
      "participants.userId": userId,
      isActive: true,
    })
      .sort({ lastMessageAt: -1 })
      .limit(20);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.redirect("/chat");
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.redirect("/chat");
    }

    const messages = await Message.find({ conversationId: conversationId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.render("chat.ejs", {
      conversations: conversations,
      currentUser: req.session.user,
      activeConversationId: conversationId,
      activeConversation: conversation,
      messages: messages,
    });
  } catch (error) {
    console.error("Error loading conversation:", error);
    res.redirect("/chat");
  }
});

router.post("/create", requireAuth, async (req, res) => {

  return res.status(403).json({
    error: "Không thể tạo hội thoại mới. Chỉ có thể chat với admin mặc định."
  });
});

router.post("/send", requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ error: "conversationId and content are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: "You are not a participant" });
    }

    const message = new Message({
      conversationId: conversationId,
      senderId: userId,
      senderName: user.firstName + " " + user.lastName,
      content: content,
      isRead: false,
    });

    await message.save();

    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();
    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    await conversation.save();

    res.json({
      success: true,
      message: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Có lỗi xảy ra khi gửi tin nhắn" });
  }
});

module.exports = router;

