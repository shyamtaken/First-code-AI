alert("JS is working!");

const davBooks = {
  "Class 7": {
    Science: "https://davbooklink.example.com/class7/science",
    Maths: "https://davbooklink.example.com/class7/maths",
    SST: "https://davbooklink.example.com/class7/sst",
    English: "https://davbooklink.example.com/class7/english"
  },
  "Class 6": {
    Science: "https://davbooklink.example.com/class6/science"
  }
  // Add more classes & subjects later
};

const form = document.getElementById("chat-form");
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const userText = input.value;
  appendMessage("You", userText, "user");
  input.value = "";

  // Simulated AI reply
  setTimeout(() => {
    const reply = getAIResponse(userText);
    appendMessage("DAV AI", reply, "bot");
  }, 500);
});

function appendMessage(sender, text, className) {
  const div = document.createElement("div");
  div.classList.add("chat-message", className); // two classes: chat-message + user or bot
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}


// Simple reply logic for now (placeholder)
function getAIResponse(message) {
  message = message.toLowerCase();
function getAIResponse(message) {
  message = message.toLowerCase();

  // Try to find a matching class and subject
  for (let className in davBooks) {
    if (message.includes(className.toLowerCase())) {
      for (let subject in davBooks[className]) {
        if (message.includes(subject.toLowerCase())) {
          return `Here is the ${className} ${subject} book: ${davBooks[className][subject]}`;
        }
      }
    }
  }

  // Default responses
  if (message.includes("hello")) {
    return "Hello! How can I help you with your studies today?";
  }

  return "I'm still learning! Please ask about DAV books, chapters, or doubts.";
}

  if (message.includes("class 7 science")) {
    return "You can find the Class 7 Science book here: [DAV Book Link]";
  } else if (message.includes("hello")) {
    return "Hello! How can I help you with your studies today?";
  } else {
    return "I'm still learning! Please ask about books, chapters, or doubts.";
  }
}
