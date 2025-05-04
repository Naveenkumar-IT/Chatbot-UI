const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatBox = document.getElementById("chatBox");
const suggestionsBox = document.getElementById("suggestionsBox");
const micBtn = document.getElementById("micBtn");
const themeToggle = document.getElementById("themeToggle");
const icon = themeToggle.querySelector("i");
const skills = [
  {
    keywords: ["hi", "hello", "hey"],
    response: {
      text: "👋 Hello! How can I assist you today?",
      suggestions: ["Check Time", "Check Date", "Tell me a joke"]
    }
  },
  {
    keywords: ["how are you"],
    response: { text: "😊 I'm doing great! Hope you are too." }
  },
  {
    keywords: ["time"],
    response: () => ({ text: `⏰ The time is ${new Date().toLocaleTimeString()}` })
  },
  {
    keywords: ["date", "day"],
    response: () => ({ text: `📅 Today is ${new Date().toLocaleDateString()}` })
  },
  {
    keywords: ["your name"],
    response: { text: "I'm Nova, your friendly assistant bot!" }
  },
  {
    keywords: ["joke"],
    response: { text: "😂 Why did the developer go broke? Because he used up all his cache!" }
  },
  {
    keywords: ["thank"],
    response: { text: "You're welcome! 😊" }
  },
  {
    keywords: ["bye"],
    response: { text: "👋 Goodbye! Have a great day!" }
  },
  {
    keywords: ["chatgpt"],
    response: () => {
      window.open("https://www.chatgpt.com", "_blank");
      return { text: "🤖 Opening Chatgpt for you!" };
    }
  },
  {
    keywords: ["github"],
    response: () => {
      window.open("https://www.github.com", "_blank");
      return { text: "💻 Taking you to GitHub!" };
    }
  },
  {
    keywords: ["instagram"],
    response: () => {
      window.open("https://www.instagram.com", "_blank");
      return { text: "📸 Opening Instagram!" };
    }
  },
  {
    keywords: ["open facebook"],
    response: () => {
      window.open("https://www.facebook.com", "_blank");
      return { text: "📘 Opening Facebook..." };
    }
  },
  {
    keywords: ["search", "google"],
    response: (userInput) => {
      // Convert to lowercase and remove common filler words
      let term = userInput.toLowerCase()
        .replace(/search|google|in|on|for|please|could you/g, "")
        .trim();
  
      // Remove leading "to" or "about" if present
      term = term.replace(/^(to|about)\s/, "");
  
      if (term.length > 0) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(term)}`, "_blank");
        return { text: `🔎 Searching "${term}" on Google...` };
      } else {
        return { text: "What would you like to search for on Google?" };
      }
    }
  },
  {
    keywords: ["youtube", "video", "watch"],
    response: (userInput) => {
      let term = userInput.toLowerCase()
        .replace(/youtube|video|watch|open|in|search|on|for|please/g, "")
        .trim();
  
      term = term.replace(/^(to|about)\s/, "");
  
      if (term.length > 0) {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, "_blank");
        return { text: `📺 Searching "${term}" on YouTube...` };
      } else {
        return { text: "What would you like to watch on YouTube?" };
      }
    }
  },
  {
    keywords: ["weather", "temperature", "forecast","climate"],
    response: () => {
      pendingSkill = "weather";
      return { text: "Sure! Please enter a city name 🌍" };
    }
  },      
  {
    keywords: [""], // Will match anything if nothing else does
    response: (userInput) => {
      const encoded = encodeURIComponent(userInput);
      return {
        text: `🤔 I'm not sure about that. Would you like to search "${userInput}" on Google?`,
        suggestions: [`Search "${userInput}" on Google`]
      };
    }
  }  
];

let pendingSkill = null;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.continuous = false;

micBtn.addEventListener("click", () => {
  recognition.start();
});

recognition.onstart = () => {
  micBtn.innerHTML = '<i class="fas fa-microphone-lines animate-pulse"></i>';
};

recognition.onend = () => {
  micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
};

recognition.onresult = (event) => {
  const voiceText = event.results[0][0].transcript;
  userInput.value = voiceText;
  handleUserMessage(); // Send as normal input
};

recognition.onerror = (event) => {
  alert("Voice input failed: " + event.error);
};

document.getElementById("clearChat").addEventListener("click", () => {
  localStorage.removeItem("chatHistory");
  chatBox.innerHTML = "";
});

// Load theme from localStorage
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  icon.classList.remove("fa-moon");
  icon.classList.add("fa-sun");
}

// Toggle Theme
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");

  if (isDark) {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
    localStorage.setItem("theme", "dark");
  } else {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
    localStorage.setItem("theme", "light");
  }
});

sendBtn.addEventListener("click", () => {
  handleUserMessage();
});

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleUserMessage();
  }
});

function handleUserMessage(textFromSuggestion = null) {
  const message = textFromSuggestion || userInput.value.trim();
  if (message === "") return;

  addMessage(message, "user");
  userInput.value = "";
  suggestionsBox.innerHTML = "";

  // 🌤️ Check for pending skill
  if (pendingSkill === "weather") {
    pendingSkill = null;
    showTypingAnimation();
    setTimeout(() => {
      removeTyping();
      fetchWeather(message); // message is treated as city name
    }, 1000);
    return;
  }

  // 1. Show typing animation
  setTimeout(() => {
    addMessage("", "bot", true); // Typing animation

    // 2. After delay, remove typing & show real message
    setTimeout(() => {
      removeTyping();

      const reply = generateReply(message);
      addMessage(reply.text, "bot");

      if (reply.suggestions) {
        showSuggestions(reply.suggestions);
      }
    }, 1000); // Time bot "thinks"
  }, 300); // Delay before typing appears
}

function addMessage(text, sender, isTemporary = false) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);

  if (isTemporary) {
    msgDiv.classList.add("typing");
    msgDiv.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    msgDiv.setAttribute("id", "typingIndicator");
  } else {
    msgDiv.innerText = text;
    saveMessageToHistory(text, sender);
  }

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function saveMessageToHistory(text, sender) {
  const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
  chatHistory.push({ text, sender });
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

function loadChatHistory() {
  const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
  chatHistory.forEach(({ text, sender }) => {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Call it when the page loads
window.addEventListener("load", loadChatHistory);

function showTypingAnimation() {
  const chatBox = document.getElementById("chatBox");
  const typing = document.createElement("div");
  typing.className = "message bot typing";
  typing.id = "typing-indicator";
  typing.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const typingMsg = document.getElementById("typingIndicator");
  if (typingMsg) typingMsg.remove();
}

function generateReply(userText) {
  const msg = userText.toLowerCase();

  for (let skill of skills) {
    if (skill.keywords.some(keyword => msg.includes(keyword))) {
      const response = typeof skill.response === "function"
        ? skill.response(userText)
        : skill.response;
      return response;
    }
  }
  
}

function fetchWeather(city) {
  const apiKey = "a8b5bc02a96b431c631092c2c1eb54cb"; // Replace with your OpenWeatherMap key
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log("Weather API response:", data); 
      if (data.cod === 200) {
        const weather = data.weather[0].description;
        const temp = data.main.temp;
        addMessage(`🌤️ Weather in ${city}: ${weather}, ${temp}°C`, "bot");
      } else {
        addMessage("❌ Couldn't find that city. Please try again.", "bot");
      }
    })
    .catch((err) => {
      console.error("Weather fetch error:", err); 
      addMessage("⚠️ Error fetching weather. Try again later.", "bot");
    });
}

function showSuggestions(options) {
  suggestionsBox.innerHTML = ""; // Clear old buttons
  options.forEach((text) => {
    const btn = document.createElement("button");
    btn.innerText = text;
    btn.addEventListener("click", () => {
      handleUserMessage(text);
    });
    suggestionsBox.appendChild(btn);
  });
}
