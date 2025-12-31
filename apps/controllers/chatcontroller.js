var express = require("express");
var router = express.Router();
const { Conversation, Message } = require(__dirname + "/../model/Chat");
const User = require(__dirname + "/../model/User");

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

// GET /chat - Hiển thị trang chat với danh sách hội thoại
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Lấy danh sách hội thoại của user
    let conversations = await Conversation.find({
      "participants.userId": userId,
      isActive: true,
    })
      .sort({ lastMessageAt: -1 })
      .limit(20);

    // Nếu chưa có hội thoại nào, tự động tạo hội thoại với admin và tin nhắn chào
    if (conversations.length === 0) {
      const user = await User.findById(userId);
      const adminUser = await User.findOne({ role: "admin" });

      if (user && adminUser) {
        // Tạo hội thoại mới
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

        // Tạo tin nhắn chào từ admin
        const welcomeMessage = new Message({
          conversationId: conversation._id,
          senderId: adminUser._id,
          senderName: adminUser.firstName + " " + adminUser.lastName,
          content: "Xin chào! Chúng tôi có thể giúp gì cho bạn?",
          isRead: false,
        });

        await welcomeMessage.save();

        // Lấy lại danh sách hội thoại
        conversations = await Conversation.find({
          "participants.userId": userId,
          isActive: true,
        })
          .sort({ lastMessageAt: -1 })
          .limit(20);

        // Nếu vừa tạo hội thoại mới, tự động mở hội thoại đó
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

    // Nếu chỉ có 1 hội thoại, tự động mở
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

// GET /chat/:conversationId - Hiển thị tin nhắn của một hội thoại
router.get("/:conversationId", requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const conversationId = req.params.conversationId;

    // Lấy danh sách hội thoại
    const conversations = await Conversation.find({
      "participants.userId": userId,
      isActive: true,
    })
      .sort({ lastMessageAt: -1 })
      .limit(20);

    // Lấy hội thoại
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.redirect("/chat");
    }

    // Kiểm tra user có trong hội thoại không
    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.redirect("/chat");
    }

    // Lấy tin nhắn
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

// POST /chat/create - Tạo hội thoại mới (DISABLED - Chỉ chat với admin mặc định)
router.post("/create", requireAuth, async (req, res) => {
  // Không cho phép tạo hội thoại mới, chỉ sử dụng hội thoại với admin mặc định
  return res.status(403).json({ 
    error: "Không thể tạo hội thoại mới. Chỉ có thể chat với admin mặc định." 
  });
});

// POST /chat/send - Gửi tin nhắn (REST API fallback)
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

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: "You are not a participant" });
    }

    // Create message
    const message = new Message({
      conversationId: conversationId,
      senderId: userId,
      senderName: user.firstName + " " + user.lastName,
      content: content,
      isRead: false,
    });

    await message.save();

    // Update conversation
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

