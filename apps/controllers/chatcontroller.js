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
    const conversations = await Conversation.find({
      "participants.userId": userId,
      isActive: true,
    })
      .sort({ lastMessageAt: -1 })
      .limit(20);

    // Mock data nếu chưa có hội thoại nào
    let mockConversations = [];
    if (conversations.length === 0) {
      mockConversations = [
        {
          _id: "mock_conv_1",
          participants: [
            {
              userId: userId,
              userName: req.session.user.firstName + " " + req.session.user.lastName,
              userEmail: req.session.user.email,
            },
            {
              userId: "mock_admin_1",
              userName: "Admin Support",
              userEmail: "admin@herewego.com",
            },
          ],
          lastMessage: "Xin chào! Tôi có thể giúp gì cho bạn?",
          lastMessageAt: new Date(),
          unreadCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "mock_conv_2",
          participants: [
            {
              userId: userId,
              userName: req.session.user.firstName + " " + req.session.user.lastName,
              userEmail: req.session.user.email,
            },
            {
              userId: "mock_admin_2",
              userName: "Tour Guide",
              userEmail: "guide@herewego.com",
            },
          ],
          lastMessage: "Bạn có muốn đặt tour không?",
          lastMessageAt: new Date(Date.now() - 3600000),
          unreadCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }

    res.render("chat.ejs", {
      conversations: conversations.length > 0 ? conversations : mockConversations,
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

    // Mock conversations nếu chưa có
    let mockConversations = [];
    if (conversations.length === 0) {
      mockConversations = [
        {
          _id: "mock_conv_1",
          participants: [
            {
              userId: userId,
              userName: req.session.user.firstName + " " + req.session.user.lastName,
              userEmail: req.session.user.email,
            },
            {
              userId: "mock_admin_1",
              userName: "Admin Support",
              userEmail: "admin@herewego.com",
            },
          ],
          lastMessage: "Xin chào! Tôi có thể giúp gì cho bạn?",
          lastMessageAt: new Date(),
          unreadCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }

    // Kiểm tra nếu là mock conversation
    if (conversationId.startsWith("mock_")) {
      const mockMessages = [
        {
          _id: "mock_msg_1",
          conversationId: conversationId,
          senderId: conversationId === "mock_conv_1" ? "mock_admin_1" : "mock_admin_2",
          senderName: conversationId === "mock_conv_1" ? "Admin Support" : "Tour Guide",
          content: conversationId === "mock_conv_1" 
            ? "Xin chào! Tôi có thể giúp gì cho bạn?" 
            : "Bạn có muốn đặt tour không?",
          isRead: true,
          createdAt: new Date(Date.now() - 7200000),
          updatedAt: new Date(Date.now() - 7200000),
        },
        {
          _id: "mock_msg_2",
          conversationId: conversationId,
          senderId: userId,
          senderName: req.session.user.firstName + " " + req.session.user.lastName,
          content: "Tôi muốn hỏi về tour du lịch Đà Lạt",
          isRead: true,
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 3600000),
        },
        {
          _id: "mock_msg_3",
          conversationId: conversationId,
          senderId: conversationId === "mock_conv_1" ? "mock_admin_1" : "mock_admin_2",
          senderName: conversationId === "mock_conv_1" ? "Admin Support" : "Tour Guide",
          content: "Chúng tôi có nhiều tour Đà Lạt rất hấp dẫn. Bạn muốn tour mấy ngày?",
          isRead: true,
          createdAt: new Date(Date.now() - 1800000),
          updatedAt: new Date(Date.now() - 1800000),
        },
        {
          _id: "mock_msg_4",
          conversationId: conversationId,
          senderId: userId,
          senderName: req.session.user.firstName + " " + req.session.user.lastName,
          content: "Tôi muốn tour 3 ngày 2 đêm",
          isRead: true,
          createdAt: new Date(Date.now() - 900000),
          updatedAt: new Date(Date.now() - 900000),
        },
      ];

      const activeConversation = mockConversations.find(
        (c) => c._id === conversationId
      ) || mockConversations[0];

      return res.render("chat.ejs", {
        conversations: mockConversations,
        currentUser: req.session.user,
        activeConversationId: conversationId,
        activeConversation: activeConversation,
        messages: mockMessages,
      });
    }

    // Lấy hội thoại thực
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
      conversations: conversations.length > 0 ? conversations : mockConversations,
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

// POST /chat/create - Tạo hội thoại mới
router.post("/create", requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Tạo hội thoại với admin (mock)
    const adminUser = {
      userId: "admin_support",
      userName: "Admin Support",
      userEmail: "admin@herewego.com",
    };

    const conversation = new Conversation({
      participants: [
        {
          userId: userId,
          userName: user.firstName + " " + user.lastName,
          userEmail: user.email,
        },
        adminUser,
      ],
      lastMessage: "",
      lastMessageAt: new Date(),
      unreadCount: 0,
    });

    await conversation.save();

    res.json({
      success: true,
      conversationId: conversation._id,
      message: "Hội thoại đã được tạo thành công",
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Có lỗi xảy ra khi tạo hội thoại" });
  }
});

module.exports = router;

