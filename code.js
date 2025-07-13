
const form = document.getElementById("chat-form");
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const userText = input.value.trim();
  if (userText === "") return;
  appendMessage("You", userText, "user");
  input.value = "";

setTimeout(() => {
  const reply = getAIResponse(userText);
  appendMessage("DAV AI", reply, "bot");
  speakText(stripHTML(reply)); // 👈 AI voice will speak the reply
}, 500);
});

function appendMessage(sender, text, className) {
  const div = document.createElement("div");
  div.classList.add("chat-message", className);
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function getAIResponse(message) {
  const msg = message.toLowerCase();
  const classMatch = msg.match(/class\s*([1-9]|1[0-2])/);
  const classNum = classMatch ? `Class ${classMatch[1]}` : null;

  // Special book detection (Class 5)
  if (msg.includes("bhasha abhyas") && msg.includes("class 5")) {
    return `Class 5 Bhasha Abhyas: <a href="https://drive.google.com/file/d/1ELgKoWlkj_YQimqUEFpopRkF-DOf02J-/view" target="_blank">Open Book</a>`;
  }
  if (msg.includes("my english reader") && msg.includes("class 5")) {
    return `Class 5 My English Reader: <a href="https://drive.google.com/file/d/1KBvpL0z3VgVt45lwBP-M_9v50VVn5tnA/view" target="_blank">Open Book</a>`;
  }
  if (msg.includes("surbhi") && msg.includes("class 5")) {
    return `Class 5 Surbhi: <a href="https://drive.google.com/file/d/1I_5m_mRJuWKiuWQ8A7bWlcorH7sJosw4/view" target="_blank">Open Book</a>`;
  }

  // Full class listing like "class 4 books"
  if (msg.match(/class\s*([1-7])\s*(books)?/)) {
    return showFullClassBooks(classNum);
  }

  // Individual subject detection
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

  // Greeting
  if (msg.match(/(^|\s)(hello|hi|hey)(\s|$)/)) {
    return "Hello! I’m your DAV AI Assistant. Ask me for any DAV book like ‘Class 3 Science’ or ‘Class 1 books’.";
  }

  return "❌ Sorry, I couldn’t find that book. Try asking like: ‘class 4 hindi abhyas’ or ‘class 2 books’.";
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
