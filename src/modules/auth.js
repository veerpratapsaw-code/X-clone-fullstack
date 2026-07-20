import { API_BASE_URL } from "../config.js";
import { showLandingAndOnboarding } from "./onboardingScreen.js";

// JWT and User Auth State Management

export const getToken = () => localStorage.getItem("x_auth_token") || null;
export const getCurrentUser = () => {
  try {
    const data = localStorage.getItem("x_current_user");
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

export const setAuthData = (token, user) => {
  if (token) localStorage.setItem("x_auth_token", token);
  if (user) localStorage.setItem("x_current_user", JSON.stringify(user));
  updateUserProfilePill();
};

export const logout = () => {
  localStorage.removeItem("x_auth_token");
  localStorage.removeItem("x_current_user");
  updateUserProfilePill();
  window.location.reload();
};

/**
 * Updates the left sidebar's bottom profile pill with the currently logged in user info
 */
export const updateUserProfilePill = () => {
  const user = getCurrentUser();
  const leftCol = document.querySelector(".left");
  if (!leftCol) return;

  // Find existing profile pill or insert it at the bottom of left sidebar
  let pill = leftCol.querySelector(".user-profile-pill");
  if (!pill) {
    pill = document.createElement("div");
    pill.className = "user-profile-pill mt-auto w-full mb-3";
    leftCol.appendChild(pill);
  }

  if (user) {
    pill.innerHTML = `
      <div class="flex items-center justify-between p-3 rounded-full hover:bg-[#181818] cursor-pointer transition-colors group relative" id="auth-user-pill">
        <div class="flex items-center gap-3 min-w-0">
          <img class="size-10 rounded-full object-cover shrink-0 border border-[#313233ad]" src="${user.avatar || '/assets/user/headShot.jpg'}" alt="${user.username}" />
          <div class="hidden xl:flex flex-col min-w-0 leading-tight">
            <span class="font-bold text-white text-sm truncate group-hover:underline flex items-center gap-1">
              ${user.username}
              ${user.verified ? `<img class="size-3.5 shrink-0" src="/assets/svg/lock.svg" alt="Verified" />` : ''}
            </span>
            <span class="text-[#71767b] text-xs truncate">${user.handle}</span>
          </div>
        </div>
        <div class="hidden xl:block text-[#71767b]">
          <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
        </div>
      </div>
    `;

    // Attach click for logout popover
    pill.querySelector("#auth-user-pill")?.addEventListener("click", (e) => {
      e.stopPropagation();
      showLogoutPopover(pill);
    });
  } else {
    pill.innerHTML = `
      <button class="w-full bg-transparent border border-[#313233ad] hover:bg-[#181818] text-white font-bold py-2.5 px-4 rounded-full text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg" id="open-login-btn">
        <span>Sign in / Sign up</span>
      </button>
    `;
    pill.querySelector("#open-login-btn")?.addEventListener("click", () => showAuthModal("login"));
  }
};

const showLogoutPopover = (anchorEl) => {
  document.querySelectorAll(".x-auth-popover").forEach(el => el.remove());
  const user = getCurrentUser();
  if (!user) return;

  const popover = document.createElement("div");
  popover.className = "x-auth-popover absolute bottom-20 left-4 w-64 bg-[#000000] border border-[#313233ad] rounded-2xl shadow-2xl z-50 overflow-hidden animate-[fadeInPop_0.15s_ease-out]";
  popover.innerHTML = `
    <div class="p-3 border-b border-[#313233ad]/50 text-xs text-[#71767b] font-mono">
      Logged in as <span class="text-white font-bold">${user.handle}</span>
    </div>
    <button class="w-full text-left px-4 py-3 text-sm text-[#f91880] hover:bg-[#181818] font-bold flex items-center gap-2.5 transition-colors cursor-pointer" id="do-logout-btn">
      <svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M16 13v-2H7V8l-5 4 5 4v-3h9zM20 3h-9c-1.1 0-2 .9-2 2v4h2V5h9v14h-9v-4H9v4c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
      Log out ${user.handle}
    </button>
  `;

  document.body.appendChild(popover);
  popover.querySelector("#do-logout-btn").addEventListener("click", logout);

  const closePopover = () => {
    popover.remove();
    window.removeEventListener("click", closePopover);
  };
  setTimeout(() => window.addEventListener("click", closePopover), 10);
};

/**
 * Shows the authentic X Login / Register Glassmorphic Modal
 */
export const showAuthModal = (initialMode = "login", isCompulsory = false) => {
  document.querySelectorAll(".x-auth-modal").forEach(el => el.remove());

  let mode = initialMode; // 'login' or 'register'

  const modal = document.createElement("div");
  modal.className = "x-auth-modal fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeInPop_0.2s_ease-out]";

  const renderModalContent = () => {
    modal.innerHTML = `
      <div class="bg-[#000000] border border-[#313233ad] rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        ${!isCompulsory ? `
          <button class="close-auth-modal absolute top-5 left-5 p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer transition-colors">
            <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>
          </button>
        ` : ''}
        <div class="flex justify-center mb-6">
          <svg class="size-8 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </div>
        
        <h2 class="text-2xl font-bold text-white text-center mb-6">
          ${mode === "login" ? "Sign in to X" : "Create your account"}
        </h2>

        <div id="auth-error-msg" class="hidden bg-red-500/20 border border-red-500/50 text-[#f91880] text-xs font-bold p-3 rounded-xl mb-4 text-center"></div>

        <form id="auth-form" class="space-y-4">
          ${mode === "register" ? `
            <div>
              <input required type="text" id="auth-username" placeholder="Full Name (e.g. Cristiano Ronaldo)" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors" />
            </div>
            <div>
              <input required type="text" id="auth-handle" placeholder="Username (e.g. @Cristiano)" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors" />
            </div>
          ` : ''}
          <div>
            <input required type="text" id="auth-email" placeholder="${mode === 'login' ? 'Phone, email, or @username' : 'Email address'}" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors" />
          </div>
          <div>
            <input required type="password" id="auth-password" placeholder="Password" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors" />
          </div>

          <button type="submit" class="w-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-3 px-4 rounded-full text-base cursor-pointer transition-colors shadow-lg mt-2 flex items-center justify-center">
            <span id="auth-submit-txt">${mode === "login" ? "Sign in" : "Sign up"}</span>
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-[#313233ad]/40 text-center text-sm text-[#71767b]">
          ${mode === "login" ? `Don't have an account? <button type="button" class="text-[#1d9bf0] font-bold hover:underline cursor-pointer" id="switch-to-register">Sign up</button>` : `Already have an account? <button type="button" class="text-[#1d9bf0] font-bold hover:underline cursor-pointer" id="switch-to-login">Sign in</button>`}
        </div>
      </div>
    `;

    if (!isCompulsory) {
      modal.querySelector(".close-auth-modal")?.addEventListener("click", () => modal.remove());
      modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    }

    modal.querySelector("#switch-to-register")?.addEventListener("click", () => { mode = "register"; renderModalContent(); });
    modal.querySelector("#switch-to-login")?.addEventListener("click", () => { mode = "login"; renderModalContent(); });

    // Auto-prefix '@' symbol on handle input field so user doesn't have to write it manually
    const handleInput = modal.querySelector("#auth-handle");
    if (handleInput) {
      handleInput.addEventListener("blur", () => {
        let val = handleInput.value.trim();
        if (val && !val.startsWith("@")) {
          handleInput.value = "@" + val;
        }
      });
      handleInput.addEventListener("input", (e) => {
        let val = handleInput.value;
        if (val && !val.startsWith("@") && val.length === 1 && e.inputType !== "deleteContentBackward") {
          handleInput.value = "@" + val;
        }
      });
    }

    // Handle Form Submit
    modal.querySelector("#auth-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errBox = modal.querySelector("#auth-error-msg");
      const submitBtn = modal.querySelector("button[type='submit']");
      const submitTxt = modal.querySelector("#auth-submit-txt");

      errBox.classList.add("hidden");
      submitBtn.disabled = true;
      submitTxt.textContent = "Processing...";

      try {
        let emailOrHandle = modal.querySelector("#auth-email")?.value.trim();
        const password = modal.querySelector("#auth-password")?.value.trim();

        if (mode === "login") {
          // If login input looks like a username handle (not an email or phone number) and doesn't start with @, add it
          if (emailOrHandle && !emailOrHandle.includes("@") && !/^\d+$/.test(emailOrHandle)) {
            emailOrHandle = "@" + emailOrHandle;
          }

          const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailOrHandle, password })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Login failed");

          setAuthData(data.token, data.user);
          modal.remove();
          window.location.reload();
        } else {
          const username = modal.querySelector("#auth-username")?.value.trim();
          let handle = modal.querySelector("#auth-handle")?.value.trim();
          if (handle && !handle.startsWith("@")) {
            handle = "@" + handle;
          }

          const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, handle, email: emailOrHandle, password })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Registration failed");

          setAuthData(data.token, data.user);
          modal.remove();
          window.location.reload();
        }
      } catch (err) {
        errBox.textContent = err.message;
        errBox.classList.remove("hidden");
        submitBtn.disabled = false;
        submitTxt.textContent = mode === "login" ? "Sign in" : "Sign up";
      }
    });
  };

  renderModalContent();
  document.body.appendChild(modal);
};

export function initAuth() {
  updateUserProfilePill();
  if (!getToken()) {
    showLandingAndOnboarding();
  }
}
