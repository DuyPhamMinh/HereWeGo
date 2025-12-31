// Chat functionality
document.addEventListener("DOMContentLoaded", function () {
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

  // Create conversation button
  const createButtons = document.querySelectorAll(
    "#createConversationBtn, #createFirstConversationBtn, #createConversationEmptyBtn"
  );
  createButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      createConversation();
    });
  });

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
  }

  // Auto scroll to bottom of messages
  const chatMessages = document.getElementById("chatMessages");
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

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

// Send message (mock function for now)
function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value.trim();

  if (!message) {
    return;
  }

  // Get current conversation ID from URL
  const pathParts = window.location.pathname.split("/");
  const conversationId = pathParts[pathParts.length - 1];

  if (!conversationId || conversationId === "chat") {
    alert("Vui lòng chọn một hội thoại");
    return;
  }

  // For now, just show the message in the UI (mock)
  // In the future, this will send to the server
  addMessageToUI(message, true);

  // Clear input
  messageInput.value = "";

  // Scroll to bottom
  const chatMessages = document.getElementById("chatMessages");
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // TODO: Implement actual API call to send message
  console.log("Sending message:", message, "to conversation:", conversationId);
}

// Add message to UI (helper function)
function addMessageToUI(content, isOwnMessage) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  // Remove no-messages div if exists
  const noMessages = chatMessages.querySelector(".no-messages");
  if (noMessages) {
    noMessages.remove();
  }

  const messageWrapper = document.createElement("div");
  messageWrapper.className = "message-wrapper " + (isOwnMessage ? "own-message" : "other-message");

  const messageBubble = document.createElement("div");
  messageBubble.className = "message-bubble";

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";
  messageContent.textContent = content;

  const messageTime = document.createElement("div");
  messageTime.className = "message-time";
  const now = new Date();
  messageTime.textContent = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageBubble.appendChild(messageContent);
  messageBubble.appendChild(messageTime);
  messageWrapper.appendChild(messageBubble);
  chatMessages.appendChild(messageWrapper);

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

