document.getElementById('newChatBtn').onclick = function() {
  if (window.chatHistory) window.chatHistory = [];
  const chatBox = document.getElementById('chat-box');
  if (chatBox) chatBox.innerHTML = "";
  const input = document.getElementById('user-input');
  if (input) input.value = "";
  window.lastUserMessage = "";
};
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // Keep full string, including "data:image/png;base64,..."
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

// Track chat history for multi-turn context
let chatHistory = [];

async function sendImageToHuggingFace(base64Image, promptText) {
  // Build conversation context for multi-turn understanding
  const contextMessages = chatHistory.map(msg => {
    // Only include user and bot text, not images
    if (msg.className === "user" || msg.className === "bot") {
      // Remove HTML tags for context
      return `${msg.sender}: ${stripHTML(msg.text)}`;
    }
    return null;
  }).filter(Boolean);
  const fullPrompt = contextMessages.join("\n") + `\nYou: ${promptText}`;

  const response = await fetch("https://api-inference.huggingface.co/models/llava-hf/llava-1.5-7b-hf", {
    method: "POST",
    headers: {
      "Authorization": "Bearer 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",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: {
        image: base64Image,
        question: fullPrompt
      }
    })
  });

  const result = await response.json();
  return result;
}


// Handles image upload from chat UI, performs OCR, and sends result to AI
async function handleScreenshot(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function () {
    const imageData = reader.result;
    // Show image in chat as a user message
    appendMessage("You", `<img src='${imageData}' alt='Uploaded image' style='max-width: 200px; border-radius: 10px;' />`, "user");
    appendMessage("DAV AI", "Extracting text from image...", "bot");
    // OCR using Tesseract
    if (window.Tesseract) {
      const result = await window.Tesseract.recognize(imageData, 'eng', {
        logger: m => console.log(m)
      });
      const extractedText = result.data.text.trim();
      if (!extractedText) {
        appendMessage("DAV AI", "❌ Could not read the question. Please upload a clearer image.", "bot");
        return;
      }
      // Show extracted text as a user message
      appendMessage("You", extractedText, "user");
      // Now send to your AI model
      let aiReply = await askGroq(extractedText);
      appendMessage("DAV AI", aiReply, "bot");
    } else {
      appendMessage("DAV AI", "❌ OCR library not loaded.", "bot");
    }
  };
  reader.readAsDataURL(file);
}

async function askGroq(prompt, memoryLength = 20) {
  try {
    // Get last N messages for short-term memory
    const context = chatHistory
      .filter(msg => msg.className === "user" || msg.className === "bot")
      .slice(-memoryLength)
      .map(msg => ({
        role: msg.className === "user" ? "user" : "assistant",
        content: stripHTML(msg.text)
      }));

    // Add the current user prompt
    context.push({ role: "user", content: prompt });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer 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`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: "You are a helpful AI for DAV students." },
          ...context
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API error:", error);
      return "❌ No response from AI.";
    }

    const data = await response.json();
    if (
      data &&
      Array.isArray(data.choices) &&
      data.choices.length > 0 &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      return data.choices[0].message.content;
    } else {
      console.error("Groq API unexpected response:", data);
      return "❌ No response from AI.";
    }
  } catch (err) {
    console.error("Groq API fetch error:", err);
    return "❌ No response from AI.";
  }
}

const form = document.getElementById("chat-form");
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const userText = input.value.trim();
  if (userText === "") return;

  appendMessage("You", userText, "user");
  input.value = "";

  // Store last user message for regenerate button
  window.lastUserMessage = userText;

  setTimeout(async () => {
    let reply;

    if (userText.toLowerCase().startsWith("image:")) {
      const prompt = userText.slice(6).trim();
      reply = await generateImage(prompt);
    } else {
      // Try AI first
      try {
    reply = getAIResponse(userText); // 🔍 Try your logic first

if (reply.startsWith("❌")) {
  // If your logic fails, ask Groq
  reply = await askGroq(userText);
}

      } catch {
        // fallback to local book logic
        reply = getAIResponse(userText);
      }

      speakText(stripHTML(reply));
    }

    appendMessage("DAV AI", reply, "bot");
  }, 500);
});

async function generateImage(prompt) {
  try {
    const response = await fetch("https://first-code-ai.vercel.app/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ API error:", error);
      return "❌ Image generation failed. Please try again.";
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    return `<strong>🎨 AI Image:</strong><br><img src="${imageUrl}" alt="Generated image" style="max-width:100%; border-radius: 10px; margin-top: 10px;" />`;
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return "❌ Something went wrong while generating the image.";
  }
}

function appendMessage(sender, text, className) {
  // Add message to chat history
  chatHistory.push({ sender, text, className });
  const wrapper = document.createElement("div");
  wrapper.classList.add("chat-wrapper", className);

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("chat-message", className);
  msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;

  const time = document.createElement("span");
  time.className = "msg-time";
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  wrapper.appendChild(msgDiv);
  wrapper.appendChild(time);

  if (className === "bot") {
    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "feedback-buttons";
    buttonsDiv.style.display = "flex";
    buttonsDiv.style.gap = "2px";
    buttonsDiv.style.marginTop = "4px";
    // Like button
    const likeBtn = document.createElement("button");
    likeBtn.title = "Like";
    likeBtn.innerHTML = "<svg width='18' height='18' viewBox='0 0 20 20' style='vertical-align:middle'><path d='M2 10v8h4V10H2zm16.2-2.4c-.3-.4-.8-.6-1.3-.6h-5.1l.7-3.4c.1-.5-.1-1-.5-1.3-.4-.3-.9-.3-1.3-.1l-1.2.7c-.4.2-.6.7-.5 1.1l.7 3.5H6c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h9c.5 0 .9-.3 1-.8l2-8c.1-.5 0-1-.3-1.3z' fill='#888'/></svg>";
    likeBtn.style.padding = "2px";
    likeBtn.style.background = "none";
    likeBtn.style.border = "none";
    likeBtn.style.cursor = "pointer";
    likeBtn.onclick = () => {
      likeBtn.classList.add("selected");
      dislikeBtn.classList.remove("selected");
    };
    // Dislike button
    const dislikeBtn = document.createElement("button");
    dislikeBtn.title = "Dislike";
    dislikeBtn.innerHTML = "<svg width='18' height='18' viewBox='0 0 20 20' style='vertical-align:middle'><path d='M18 10V2h-4v8h4zm-16.2 2.4c.3.4.8.6 1.3.6h5.1l-.7 3.4c-.1.5.1 1 .5 1.3.4.3.9.3 1.3.1l1.2-.7c.4-.2.6-.7.5-1.1l-.7-3.5H14c.6 0 1-.4 1-1v-8c0-.6-.4-1-1-1H5c-.5 0-.9.3-1 .8l-2 8c-.1.5 0 1 .3 1.3z' fill='#888'/></svg>";
    dislikeBtn.style.padding = "2px";
    dislikeBtn.style.background = "none";
    dislikeBtn.style.border = "none";
    dislikeBtn.style.cursor = "pointer";
    dislikeBtn.onclick = () => {
      dislikeBtn.classList.add("selected");
      likeBtn.classList.remove("selected");
    };
    // Regenerate button
    const regenBtn = document.createElement("button");
    regenBtn.title = "Regenerate";
    regenBtn.innerHTML = "<svg width='18' height='18' viewBox='0 0 20 20' style='vertical-align:middle'><path d='M10 2v2a6 6 0 1 1-6 6H2a8 8 0 1 0 8-8z' fill='#888'/></svg>";
    regenBtn.style.padding = "2px";
    regenBtn.style.background = "none";
    regenBtn.style.border = "none";
    regenBtn.style.cursor = "pointer";
    regenBtn.onclick = () => {
      // Regenerate response (re-call last AI)
      if (typeof window.lastUserMessage === 'string') {
        appendMessage("DAV AI", "Regenerating...", "bot");
        setTimeout(async () => {
          let reply = await askGroq(window.lastUserMessage);
          appendMessage("DAV AI", reply, "bot");
        }, 500);
      }
    };
    // Copy button
    const copyBtn = document.createElement("button");
    copyBtn.title = "Copy";
    copyBtn.innerHTML = "<svg width='18' height='18' viewBox='0 0 20 20' style='vertical-align:middle'><rect x='4' y='4' width='12' height='12' rx='2' fill='#888'/></svg>";
    copyBtn.style.padding = "2px";
    copyBtn.style.background = "none";
    copyBtn.style.border = "none";
    copyBtn.style.cursor = "pointer";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(stripHTML(text));
      copyBtn.classList.add("selected");
      setTimeout(() => copyBtn.classList.remove("selected"), 800);
    };
    // Read aloud button
    const speakBtn = document.createElement("button");
    speakBtn.title = "Read aloud";
    speakBtn.innerHTML = "<svg width='18' height='18' viewBox='0 0 20 20' style='vertical-align:middle'><path d='M3 8v4h4l5 5V3L7 8H3z' fill='#888'/></svg>";
    speakBtn.style.padding = "2px";
    speakBtn.style.background = "none";
    speakBtn.style.border = "none";
    speakBtn.style.cursor = "pointer";
    speakBtn.onclick = () => speakText(stripHTML(text));

    buttonsDiv.appendChild(likeBtn);
    buttonsDiv.appendChild(dislikeBtn);
    buttonsDiv.appendChild(regenBtn);
    buttonsDiv.appendChild(copyBtn);
    buttonsDiv.appendChild(speakBtn);
    wrapper.appendChild(buttonsDiv);
  }

  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function getAIResponse(message) {
  const msg = message.toLowerCase();
  const classMatch = msg.match(/class\s*([1-9]|1[0-2])/);
  const classNum = classMatch ? `Class ${classMatch[1]}` : null;

  if (msg.includes("bhasha abhyas") && msg.includes("class 5")) {
    return `Class 5 Bhasha Abhyas: <a href="https://drive.google.com/file/d/1ELgKoWlkj_YQimqUEFpopRkF-DOf02J-/view" target="_blank">Open Book</a>`;
  }
  if (msg.includes("my english reader") && msg.includes("class 5")) {
    return `Class 5 My English Reader: <a href="https://drive.google.com/file/d/1KBvpL0z3VgVt45lwBP-M_9v50VVn5tnA/view" target="_blank">Open Book</a>`;
  }
  if (msg.includes("surbhi") && msg.includes("class 5")) {
    return `Class 5 Surbhi: <a href="https://drive.google.com/file/d/1I_5m_mRJuWKiuWQ8A7bWlcorH7sJosw4/view" target="_blank">Open Book</a>`;
  }

  if (msg.match(/class\s*([1-7])\s*(books)?/)) {
    return showFullClassBooks(classNum);
  }

  const subjectMatch = msg.match(/(english (practice|reader|literature)?|maths?|science|sst|social|hindi( reader| abhyas)?|computer|g\.?k\.?|moral|value|sanskrit)/);
  const rawSubject = subjectMatch ? subjectMatch[0].toLowerCase() : null;

  if (classNum && rawSubject) {
    const subjects = Object.keys(bookData[classNum] || {});
    const match = subjects.find(sub => sub.toLowerCase().includes(rawSubject));
    if (match) {
      const url = bookData[classNum][match];
      return `📘 <strong>${classNum} - ${match}:</strong> <a href="${url}" target="_blank">Open Book</a>`;
    }
  }

  if (classNum && !rawSubject) {
    return showFullClassBooks(classNum);
  }

  if (msg.match(/(^|\s)(hello|hi|hey)(\s|$)/)) {
    return "Hello! I’m your DAV AI Assistant. Ask me for any DAV book like ‘Class 3 Science’ or ‘Class 1 books’.";
  }

  // If not found, suggest web search
  return "❌ Sorry, I couldn’t find that book. Try asking like: ‘class 4 hindi abhyas’ or ‘class 2 books’.<br>" + getWebSearchLink(message);
}

function showFullClassBooks(classNum) {
  if (!bookData[classNum]) return "❌ Class not found.";
  const books = bookData[classNum];
  let response = `📚 <strong>${classNum} Books:</strong><br>`;
  for (const subject in books) {
    response += `🔹 <strong>${subject}:</strong> <a href="${books[subject]}" target="_blank">Open Book</a><br>`;
  }
  return response;
}

// Helper to generate DuckDuckGo search link
function getWebSearchLink(query) {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  return `<a href='${url}' target='_blank' style='color:#0078fe;text-decoration:underline;'>🔎 Search the web for "${stripHTML(query)}"</a>`;
}

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN'; // Use 'hi-IN' for Hindi if needed
  speechSynthesis.speak(utterance);
}
function stripHTML(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// Keep your full bookData here (not repeated here due to size)


const bookData = {
  "Class 1": {
    "English Practice": "https://drive.google.com/file/d/1F7RL1ipEMaJYzO_TMEe3XXHhAZzMOM2K/view",
    "Maths": "https://drive.google.com/file/d/1RRCvOgtZMPuNlWvO70i8ceEE5eh9mVE2/view",
    "G.K.": "http://davcae.net.in/File/kid%20wiz%201.pdf",
    "Hindi": "https://drive.google.com/file/d/1bmM6dDqqyQUCPL47Fvrc_A_HApl8-Q9g/view"
  },
  "Class 2": {
    "English Practice": "https://drive.google.com/file/d/1lyaYjFim4dme3_B6uaojPmt1DKDXJVeM/view",
    "Maths": "https://drive.google.com/file/d/1_B5iL2OaDxeATiPbGIh2AYJx3fNXDZkd/view",
    "G.K.": "https://drive.google.com/file/d/1kwDHu_KfJ4w_IAfnDHbepCg6JHgfywpW/view",
    "Hindi": "http://davcae.net.in/File/Bhasha%20Madhuri%20Class%20II%20Final%202023.pdf"
  },
  "Class 3": {
    "English Reader": "https://drive.google.com/file/d/1U4oGdHRPCDLgz9ktg9h5qY_XkaQOAR6d/view",
    "English Practice": "https://drive.google.com/file/d/1QON0zF-MsLK2HGbGvscn3mhEvzR6D7J7/view",
    "Maths": "https://drive.google.com/file/d/1rR6axOAhGBOusHD2f1QKrztRB9oDFyFn/view",
    "Science": "https://drive.google.com/file/d/1MDNQ_oLYNxVrRL3YDL3y_GZYGkPf0Zu1/view",
    "SST": "https://drive.google.com/file/d/1o_4Am3vpoUKOXk6wPX4UJc_R3Wdz_UQp/view",
    "Computer": "https://drive.google.com/file/d/1fV9NBsEMaGrScCeZUsmtMJm02e6HJSwH/view",
    "Hindi Reader": "https://drive.google.com/file/d/1q0ErPOoW1yXeXCuId50w29JSY8yUJONN/view",
    "Hindi Abhyas": "https://drive.google.com/file/d/1_3km0IQceq-iG-yYtyDL0M3_kl_hvRQ0/view",
    "Moral Science": "https://drive.google.com/file/d/1kBPAGjHLrQk_R6iB89_iES8OmCej6Od2/view"
  },
  "Class 4": {
    "English Reader": "https://drive.google.com/file/d/1nWp53OdP4Qy9QXx5Sk9iD68Qtcv1XY-E/view",
    "English Practice": "https://drive.google.com/file/d/1N7COEF07vY5r8lEYHTu8w5HbUuMD40lY/view",
    "Maths": "https://drive.google.com/file/d/14K3Zw7_fqIpmi7O7u6MN8ftalrNylIRk/view",
    "Science": "https://drive.google.com/file/d/1A6kFcXVEvdvV5PevYyz0RCF9TS9K6b6z/view",
    "SST": "https://drive.google.com/file/d/1kFevxZzkPGWSSfajfs8cGr3fI2FevA6w/view",
    "Computer": "https://drive.google.com/file/d/1jVR5pRoTKxXns7Yb2VkAqHL5G0CuCQuR/view",
    "Hindi Reader": "https://drive.google.com/file/d/1zuE5-E_FXLtE5vBP2O1Oae_ZhfPMMJnZ/view",
    "Hindi Abhyas": "https://drive.google.com/file/d/1_MjIJTNZ9ir22ToGZ0azsD5pOcgma6Fs/view",
    "Moral Science": "https://drive.google.com/file/d/1vbE5XYXYgbGZ66Gu7V4ocv4_4sdIivXU/view"
  },
  "Class 5": {
    "English Reader": "https://drive.google.com/file/d/1jx0HuSxQllJgk5X_yR0cWku8ECZQ4LxP/view",
    "English Practice": "https://drive.google.com/file/d/1o07CEgrD8PAVq2Kg8qzN6L6vQ9aYuyEw/view",
    "Maths": "https://drive.google.com/file/d/1tN08dOSlvzPSsmHPTzng_oKh-lcCvtqL/view",
    "Science": "https://drive.google.com/file/d/1FqlFC3zBTvGLJtUPBKwNdbMiC7_hBxdI/view",
    "SST": "https://drive.google.com/file/d/1DptdCoRleWBz9Gf0VwOdrrDX3LLfMyG/view",
    "Computer": "https://drive.google.com/file/d/1_vtbZlyy3rk5cu7nx9VKMvqOC7t_R9EX/view",
    "Hindi Reader": "https://drive.google.com/file/d/1tI4fDNnPuvogPH9KnBym7z5kFuSExGZ4/view",
    "Hindi Abhyas": "https://drive.google.com/file/d/17-XzDQcDF8hHQF19HOsm6ZfbKpzxEjM1/view",
    "Moral Science": "https://drive.google.com/file/d/1N2OkU4Ida_aZhCVQGVbm_6hlbTyQ_5JU/view"
  },
  "Class 6": {
    "English Literature": "https://drive.google.com/file/d/1DWq8efq0TGb5sdWJ8UZ-_iyAJeZvhc9q/view",
    "English Practice": "https://drive.google.com/file/d/1cXK8ZlUljzPckmTDNGdFVuNcfOHqbyP1/view",
    "Maths": "https://drive.google.com/file/d/1E5miEknDIdD2rqyMdkbACc2ATPOA6e8v/view",
    "Science": "https://drive.google.com/file/d/1FUVPhT6HzKWdt9jTf1LNKmlbtA3K74vx/view",
    "SST": "https://drive.google.com/file/d/1rlZK3Ibf0SMYIlgUqorZgx-kXDoLtjK1/view",
    "Computer": "https://drive.google.com/file/d/1Oq2eOwTyi-7v-uJfZDfHO_6HxHeMRlVv/view",
    "Hindi Reader": "https://drive.google.com/file/d/1vWq9g1dAD2Mt3S12oD6d-9xgExGdxScL/view",
    "Hindi Abhyas": "https://drive.google.com/file/d/1ok1zzmWz-HNirOcEdA2qJvGvZOs2ZnA7/view",
    "Sanskrit": "https://drive.google.com/file/d/1ODeu6fNYZswWUw0_dWzpU5HdNZXiy0aW/view",
    "Moral Science": "https://drive.google.com/file/d/1F1iNAC2TiEBDdfgAKY_YMke5Fq6gOGU9/view"
  },
  "Class 7": {
    "English Literature": "https://drive.google.com/file/d/1do3RSbEvnKHDKk5lNJUtT-WkHjVPtd3K/view",
    "English Practice": "https://drive.google.com/file/d/1WY61cYYRyK5JwSUGfJ5FSqqISVZjH94n/view",
    "Maths": "https://drive.google.com/file/d/1M-y85rptbfreVE5sjUy_uzp551k1gDhz/view",
    "Science": "https://drive.google.com/file/d/1SLdGpRDUkSZuL9b2k9ksbg-cCbEn1tP_/view",
    "SST": "https://drive.google.com/file/d/1Yok4ib1-yW0cPQbhBMYOEGQDZ3vOTW7X/view",
    "Computer": "https://drive.google.com/file/d/1zT_aTbZXhU0tdnRjoZZaaR8aD4ItnTjE/view",
    "Hindi Reader": "https://drive.google.com/file/d/1z19HdQ1MOUyCh1lwltcKZ-Y8xjQTrQSK/view",
    "Hindi Abhyas": "https://drive.google.com/file/d/1I8m2pLDo7bZ_iqNnkRkFKdjquRVgqPlN/view",
    "Sanskrit": "https://drive.google.com/file/d/1UOXA_lJwAJzDeZrECVdugWDs8FsbThs6/view",
    "Moral Science": "https://drive.google.com/file/d/1S6I-GHTY5T6MlB7TguR3qYqV0CKg27Ve/view"
  }
};
