// Chat functionality with Socket.IO
let socket = null;
let currentConversationId = null;
let currentUserId = null;

document.addEventListener("DOMContentLoaded", function () {
  // Initialize Socket.IO
  initializeSocket();

  // Select conversation item
  const conversationItems = document.querySelectorAll(".conversation-item");
  conversationItems.forEach((item) => {
    item.addEventListener("click", function () {
      const conversationId = this.getAttribute("data-conversation-id");
      if (conversationId) {
        window.location.href = "/chat/" + conversationId;
      }
    });
  });

  // Create conversation button - DISABLED (chỉ chat với admin mặc định)
  // const createButtons = document.querySelectorAll(
  //   "#createConversationBtn, #createFirstConversationBtn, #createConversationEmptyBtn"
  // );
  // createButtons.forEach((btn) => {
  //   btn.addEventListener("click", function () {
  //     createConversation();
  //   });
  // });

  // Send message
  const sendMessageBtn = document.getElementById("sendMessageBtn");
  const messageInput = document.getElementById("messageInput");

  if (sendMessageBtn && messageInput) {
    sendMessageBtn.addEventListener("click", function () {
      sendMessage();
    });

    messageInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    });

    // Typing indicator
    let typingTimeout;
    messageInput.addEventListener("input", function () {
      if (currentConversationId && socket) {
        socket.emit("typing", {
          conversationId: currentConversationId,
          userId: currentUserId,
          userName: getCurrentUserName(),
          isTyping: true,
        });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          if (socket) {
            socket.emit("typing", {
              conversationId: currentConversationId,
              userId: currentUserId,
              userName: getCurrentUserName(),
              isTyping: false,
            });
          }
        }, 1000);
      }
    });
  }

  // Auto scroll to bottom of messages
  const chatMessages = document.getElementById("chatMessages");
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Get current conversation ID from URL
  const pathParts = window.location.pathname.split("/");
  const conversationId = pathParts[pathParts.length - 1];
  if (conversationId && conversationId !== "chat") {
    currentConversationId = conversationId;
  }
});

// Initialize Socket.IO connection
function initializeSocket() {
  // Get user ID from page
  const chatMain = document.querySelector('.chat-main[data-user-id]');
  currentUserId = chatMain ? chatMain.getAttribute('data-user-id') : null;

  if (!currentUserId) {
    console.warn("User ID not found, Socket.IO will not connect");
    return;
  }

  // Connect to Socket.IO server
  socket = io();

  // Join chat
  socket.on("connect", () => {
    console.log("Connected to chat server");
    
    if (currentConversationId) {
      socket.emit("join", {
        userId: currentUserId,
        conversationId: currentConversationId,
      });
    } else {
      socket.emit("join", {
        userId: currentUserId,
      });
    }
  });

  // Handle new message
  socket.on("new_message", (messageData) => {
    if (messageData.conversationId === currentConversationId) {
      const isOwnMessage = messageData.senderId.toString() === currentUserId.toString();
      addMessageToUI(messageData, isOwnMessage);
    }
  });

  // Handle conversation update
  socket.on("conversation_updated", (data) => {
    // Update conversation list if needed
    updateConversationInList(data);
  });

  // Handle typing indicator
  socket.on("user_typing", (data) => {
    if (data.userId !== currentUserId && data.isTyping) {
      showTypingIndicator(data.userName);
    } else {
      hideTypingIndicator();
    }
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error:", error);
    alert("Có lỗi xảy ra: " + (error.message || "Unknown error"));
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Disconnected from chat server");
  });
}

// Get current user name
function getCurrentUserName() {
  const chatMain = document.querySelector('.chat-main[data-user-name]');
  return chatMain ? chatMain.getAttribute('data-user-name') : 'User';
}

// Create new conversation
function createConversation() {
  fetch("/chat/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Redirect to the new conversation
        window.location.href = "/chat/" + data.conversationId;
      } else {
        alert("Có lỗi xảy ra khi tạo hội thoại: " + (data.error || "Unknown error"));
      }
    })
    .catch((error) => {
      console.error("Error creating conversation:", error);
      alert("Có lỗi xảy ra khi tạo hội thoại");
    });
}

// Send message via Socket.IO
function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value.trim();

  if (!message) {
    return;
  }

  if (!currentConversationId || currentConversationId === "chat") {
    alert("Vui lòng chọn một hội thoại");
    return;
  }

  if (!socket || !socket.connected) {
    // Fallback to REST API if socket not connected
    sendMessageViaAPI(message);
    return;
  }

  // Send via Socket.IO
  socket.emit("send_message", {
    conversationId: currentConversationId,
    content: message,
    senderId: currentUserId,
  });

  // Clear input
  messageInput.value = "";

  // Stop typing indicator
  if (socket) {
    socket.emit("typing", {
      conversationId: currentConversationId,
      userId: currentUserId,
      userName: getCurrentUserName(),
      isTyping: false,
    });
  }
}

// Fallback: Send message via REST API
function sendMessageViaAPI(message) {
  fetch("/chat/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversationId: currentConversationId,
      content: message,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Message will be added via socket or reload
        location.reload();
      } else {
        alert("Có lỗi xảy ra khi gửi tin nhắn: " + (data.error || "Unknown error"));
      }
    })
    .catch((error) => {
      console.error("Error sending message:", error);
      alert("Có lỗi xảy ra khi gửi tin nhắn");
    });
}

// Add message to UI (helper function)
function addMessageToUI(messageData, isOwnMessage) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  // Remove no-messages div if exists
  const noMessages = chatMessages.querySelector(".no-messages");
  if (noMessages) {
    noMessages.remove();
  }

  // Check if message already exists (prevent duplicates)
  const existingMessage = chatMessages.querySelector(`[data-message-id="${messageData._id}"]`);
  if (existingMessage) {
    return;
  }

  const messageWrapper = document.createElement("div");
  messageWrapper.className = "message-wrapper " + (isOwnMessage ? "own-message" : "other-message");
  messageWrapper.setAttribute("data-message-id", messageData._id);

  const messageBubble = document.createElement("div");
  messageBubble.className = "message-bubble";

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";
  messageContent.textContent = messageData.content || messageData;

  const messageTime = document.createElement("div");
  messageTime.className = "message-time";
  const messageDate = messageData.createdAt ? new Date(messageData.createdAt) : new Date();
  messageTime.textContent = messageDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageBubble.appendChild(messageContent);
  messageBubble.appendChild(messageTime);
  messageWrapper.appendChild(messageBubble);
  chatMessages.appendChild(messageWrapper);

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Mark as read if it's not our message
  if (!isOwnMessage && socket && socket.connected) {
    socket.emit("mark_as_read", {
      conversationId: currentConversationId,
      userId: currentUserId,
    });
  }
}

// Update conversation in list
function updateConversationInList(data) {
  const conversationItem = document.querySelector(
    `[data-conversation-id="${data.conversationId}"]`
  );
  if (conversationItem) {
    // Update last message preview
    const preview = conversationItem.querySelector(".conversation-preview");
    if (preview && data.lastMessage) {
      preview.textContent = data.lastMessage;
    }

    // Update unread count
    const unreadBadge = conversationItem.querySelector(".conversation-unread");
    if (data.unreadCount > 0) {
      if (unreadBadge) {
        unreadBadge.textContent = data.unreadCount;
      } else {
        const meta = conversationItem.querySelector(".conversation-meta");
        if (meta) {
          const badge = document.createElement("span");
          badge.className = "conversation-unread";
          badge.textContent = data.unreadCount;
          meta.appendChild(badge);
        }
      }
    } else if (unreadBadge) {
      unreadBadge.remove();
    }
  }
}

// Show typing indicator
let typingIndicator = null;
function showTypingIndicator(userName) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  // Remove existing indicator
  hideTypingIndicator();

  typingIndicator = document.createElement("div");
  typingIndicator.className = "message-wrapper other-message";
  typingIndicator.id = "typing-indicator";
  typingIndicator.innerHTML = `
    <div class="message-bubble">
      <div class="message-content">
        <em>${userName} đang nhập...</em>
      </div>
    </div>
  `;
  chatMessages.appendChild(typingIndicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
  if (typingIndicator) {
    typingIndicator.remove();
    typingIndicator = null;
  }
}


