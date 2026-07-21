import { API_BASE_URL } from "../config.js";

let grokChatHistory = [];
let isGrokActive = false;

// Initialize Grok UI click listener from Sidebar and Navigation
export function initGrokUI() {
  const sidebarItems = document.querySelectorAll('.sidebar li, .bottom-nav li, .nav li, ul li');
  sidebarItems.forEach((item) => {
    const text = item.textContent || "";
    const img = item.querySelector('img');
    if (text.includes("Grok") || (img && img.src && img.src.includes("grok.svg"))) {
      item.addEventListener("click", () => {
        showGrokScreen();
      });
    }
  });
}

// Renders the full authentic X Grok Screen inside .main
export function showGrokScreen() {
  const mainContainer = document.querySelector(".main");
  if (!mainContainer) return;

  isGrokActive = true;

  // Highlight Grok in sidebar
  document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('font-bold', 'text-white'));

  // Build the authentic X Grok UI structure
  mainContainer.innerHTML = `
    <!-- Grok Sticky Header -->
    <div class="sticky top-0 z-40 w-full bg-[#000000dd] backdrop-blur-md flex items-center justify-between px-4 py-3 border-b border-[#313233ad]">
      <div class="flex items-center gap-3">
        <button class="grok-back-btn p-2 hover:bg-[#181818] rounded-full transition-colors text-white xl:hidden">
          <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/></svg>
        </button>
        <div class="flex items-center gap-2">
          <span class="text-xl font-bold text-white tracking-tight">Grok</span>
          <span class="px-2 py-0.5 text-[10px] font-bold bg-[#1d9bf0]/20 text-[#1d9bf0] border border-[#1d9bf0]/40 rounded-full uppercase tracking-wider">Gemini 1.5 Powered</span>
        </div>
      </div>

      <!-- Mode Selector & Clear Button -->
      <div class="flex items-center gap-2">
        <div class="flex bg-[#16181c] border border-[#313233ad] rounded-full p-1 text-xs font-semibold text-[#71767b]">
          <button class="grok-mode-btn active bg-white text-black px-3 py-1 rounded-full transition-all shadow-sm">Regular</button>
          <button class="grok-mode-btn px-3 py-1 hover:text-white rounded-full transition-all">Fun Mode</button>
        </div>
        <button class="grok-clear-btn p-2 hover:bg-[#181818] rounded-full transition-colors text-[#71767b] hover:text-white" title="New Chat">
          <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
      </div>
    </div>

    <!-- Grok Chat Area / Welcome Screen -->
    <div class="grok-chat-container flex flex-col justify-between min-h-[calc(100vh-140px)] px-4 py-6">
      
      <!-- Messages List -->
      <div class="grok-messages flex-1 flex flex-col gap-6 overflow-y-auto pb-6">
        ${grokChatHistory.length === 0 ? renderGrokWelcomeGrid() : renderChatHistory()}
      </div>

      <!-- Bottom Chat Input Bar -->
      <div class="sticky bottom-4 z-20 mt-4">
        <div class="relative bg-[#16181c] border border-[#313233ad] focus-within:border-[#1d9bf0] rounded-2xl p-3 shadow-2xl transition-all">
          <textarea 
            id="grok-input-textarea"
            rows="1" 
            placeholder="Ask Grok anything..." 
            class="w-full bg-transparent text-white placeholder-[#71767b] text-sm focus:outline-none resize-none pr-12 max-h-36 overflow-y-auto"
          ></textarea>
          
          <div class="flex items-center justify-between pt-2 border-t border-[#313233ad]/40 mt-2">
            <div class="flex items-center gap-2 text-[#71767b] text-xs">
              <button class="flex items-center gap-1.5 px-2.5 py-1 hover:bg-white/5 rounded-full transition-colors border border-transparent hover:border-[#313233ad]">
                <svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                DeepSearch
              </button>
              <button class="flex items-center gap-1.5 px-2.5 py-1 hover:bg-white/5 rounded-full transition-colors border border-transparent hover:border-[#313233ad]">
                <svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                Think
              </button>
            </div>

            <button id="grok-send-btn" class="size-8 bg-white hover:bg-[#eff3f4] text-black rounded-full flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer">
              <svg class="size-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      </div>

    </div>
  `;

  bindGrokEvents();
}

function renderGrokWelcomeGrid() {
  return `
    <div class="grok-welcome flex flex-col items-center justify-center my-auto py-10 text-center animate-fade-in">
      <div class="size-16 rounded-2xl bg-gradient-to-tr from-[#1d9bf0] via-black to-[#333] border border-white/20 flex items-center justify-center shadow-2xl mb-5">
        <img src="/assets/svg/grok.svg" alt="Grok" class="size-9 invert" />
      </div>
      <h2 class="text-3xl font-extrabold text-white tracking-tight mb-2">Grok AI</h2>
      <p class="text-[#71767b] text-sm max-w-md mb-8">
        Your real-time intelligence assistant built inside X. Ask a question, explore data, or generate content instantly.
      </p>

      <!-- Quick Prompt Suggestion Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left">
        <button class="grok-chip bg-[#16181c] hover:bg-[#1c1f24] border border-[#313233ad] hover:border-[#1d9bf0]/50 rounded-2xl p-4 transition-all group flex flex-col gap-1.5 cursor-pointer">
          <div class="flex items-center gap-2 text-xs font-bold text-[#1d9bf0]">
            <span>⚡ Trending</span>
          </div>
          <span class="text-sm font-semibold text-[#e7e9ea] group-hover:text-white">Summarize breaking news & trending topics on X</span>
        </button>

        <button class="grok-chip bg-[#16181c] hover:bg-[#1c1f24] border border-[#313233ad] hover:border-[#1d9bf0]/50 rounded-2xl p-4 transition-all group flex flex-col gap-1.5 cursor-pointer">
          <div class="flex items-center gap-2 text-xs font-bold text-amber-400">
            <span>🚀 Viral Creator</span>
          </div>
          <span class="text-sm font-semibold text-[#e7e9ea] group-hover:text-white">Draft a high-engagement tweet thread about AI</span>
        </button>

        <button class="grok-chip bg-[#16181c] hover:bg-[#1c1f24] border border-[#313233ad] hover:border-[#1d9bf0]/50 rounded-2xl p-4 transition-all group flex flex-col gap-1.5 cursor-pointer">
          <div class="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <span>💻 Code Assistant</span>
          </div>
          <span class="text-sm font-semibold text-[#e7e9ea] group-hover:text-white">Explain how Quantum Computing works in simple terms</span>
        </button>

        <button class="grok-chip bg-[#16181c] hover:bg-[#1c1f24] border border-[#313233ad] hover:border-[#1d9bf0]/50 rounded-2xl p-4 transition-all group flex flex-col gap-1.5 cursor-pointer">
          <div class="flex items-center gap-2 text-xs font-bold text-purple-400">
            <span>💡 Brainstorm</span>
          </div>
          <span class="text-sm font-semibold text-[#e7e9ea] group-hover:text-white">Give me 3 creative video hooks for tech creators</span>
        </button>
      </div>
    </div>
  `;
}

function renderChatHistory() {
  return grokChatHistory.map((msg) => {
    if (msg.role === "user") {
      return `
        <div class="flex justify-end animate-fade-in">
          <div class="bg-[#1d9bf0] text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] text-sm shadow-md font-medium">
            ${msg.text}
          </div>
        </div>
      `;
    } else {
      // Format markdown-like line breaks and basic code blocks for sleek display
      const formattedText = msg.text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
        .replace(/\n\n/g, '<div class="my-2"></div>')
        .replace(/\n/g, '<br/>')
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-black/80 border border-[#313233ad] rounded-xl p-3 my-2 text-xs font-mono overflow-x-auto text-emerald-300">$1</pre>');

      return `
        <div class="flex items-start gap-3 animate-fade-in">
          <div class="size-8 rounded-full bg-black border border-[#313233ad] flex items-center justify-center shrink-0 shadow-md">
            <img src="/assets/svg/grok.svg" alt="Grok" class="size-4 invert" />
          </div>
          <div class="flex-1 bg-[#16181c] border border-[#313233ad] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-[#e7e9ea] shadow-lg leading-relaxed">
            <div class="flex items-center justify-between border-b border-[#313233ad]/40 pb-2 mb-2">
              <span class="font-bold text-white text-xs">Grok AI</span>
              <span class="text-[10px] text-[#71767b]">Just now</span>
            </div>
            <div class="grok-response-content">${formattedText}</div>
          </div>
        </div>
      `;
    }
  }).join("");
}

function bindGrokEvents() {
  const textarea = document.getElementById("grok-input-textarea");
  const sendBtn = document.getElementById("grok-send-btn");
  const messagesContainer = document.querySelector(".grok-messages");
  const clearBtn = document.querySelector(".grok-clear-btn");
  const modeBtns = document.querySelectorAll(".grok-mode-btn");

  if (!textarea || !sendBtn || !messagesContainer) return;

  // Mode switching
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modeBtns.forEach(b => {
        b.classList.remove("active", "bg-white", "text-black", "shadow-sm");
        b.classList.add("hover:text-white");
      });
      btn.classList.add("active", "bg-white", "text-black", "shadow-sm");
      btn.classList.remove("hover:text-white");
    });
  });

  // Clear / New Chat
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      grokChatHistory = [];
      messagesContainer.innerHTML = renderGrokWelcomeGrid();
      bindSuggestionChips();
    });
  }

  // Suggestion chips
  bindSuggestionChips();

  // Auto resize textarea
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  });

  // Send message function
  const sendMessage = async (customPrompt = null) => {
    const promptText = customPrompt || textarea.value.trim();
    if (!promptText) return;

    if (!customPrompt) {
      textarea.value = "";
      textarea.style.height = "auto";
    }

    // Add user message to history
    grokChatHistory.push({ role: "user", text: promptText });
    messagesContainer.innerHTML = renderChatHistory();
    
    // Add temporary loading indicator for Grok
    const loadingId = "grok-loading-" + Date.now();
    messagesContainer.insertAdjacentHTML("beforeend", `
      <div id="${loadingId}" class="flex items-start gap-3 animate-pulse">
        <div class="size-8 rounded-full bg-black border border-[#313233ad] flex items-center justify-center shrink-0">
          <img src="/assets/svg/grok.svg" alt="Grok" class="size-4 invert" />
        </div>
        <div class="bg-[#16181c] border border-[#313233ad] rounded-2xl px-4 py-3 text-sm text-[#71767b]">
          Grok is thinking...
        </div>
      </div>
    `);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const res = await fetch(`${API_BASE_URL}/api/grok/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          history: grokChatHistory.slice(0, -1) // Send previous turns
        })
      });

      const data = await res.json();
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();

      if (res.ok && data.reply) {
        grokChatHistory.push({ role: "model", text: data.reply });
      } else {
        grokChatHistory.push({ 
          role: "model", 
          text: `⚠️ **Error**: ${data.message || "Could not reach Grok servers at the moment."}` 
        });
      }

      messagesContainer.innerHTML = renderChatHistory();
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (err) {
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();
      
      grokChatHistory.push({ 
        role: "model", 
        text: `⚠️ **Network Error**: Unable to connect to Grok AI backend (${err.message})` 
      });
      messagesContainer.innerHTML = renderChatHistory();
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  sendBtn.addEventListener("click", () => sendMessage());
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function bindSuggestionChips() {
    document.querySelectorAll(".grok-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const text = chip.querySelector("span:last-child")?.textContent?.trim();
        if (text) {
          sendMessage(text);
        }
      });
    });
  }
}
