import { API_BASE_URL } from "../config.js";
import { setAuthData } from "./auth.js";

/**
 * Renders the full-screen Authentic X Landing & Multi-step Profile Setup Screen
 * when the user is not logged in.
 */
export function showLandingAndOnboarding() {
  // Hide main layout while on landing/onboarding screen
  const appContainer = document.querySelector(".app-container") || document.querySelector(".main-layout");
  if (appContainer) appContainer.classList.add("hidden");

  // Remove existing onboarding screen if present
  document.querySelectorAll(".x-landing-screen").forEach(el => el.remove());

  const landingScreen = document.createElement("div");
  landingScreen.className = "x-landing-screen fixed inset-0 z-[400] bg-black text-white flex flex-col justify-between overflow-y-auto";

  landingScreen.innerHTML = `
    <!-- Main Landing Grid -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-60px)] w-full items-center px-6 sm:px-12 xl:px-24">
      
      <!-- Left Column: Giant Outlined Geometric X Logo (Matches Screenshot) -->
      <div class="lg:col-span-6 flex items-center justify-center py-10 lg:py-0 order-2 lg:order-1">
        <div class="relative flex items-center justify-center">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="w-64 sm:w-80 lg:w-[420px] h-auto text-white fill-current transition-transform duration-700 hover:scale-105 select-none">
            <path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z"></path>
          </svg>
        </div>
      </div>

      <!-- Right Column: Happening Now & Direct Profile Setup -->
      <div class="lg:col-span-6 flex flex-col justify-center order-1 lg:order-2 py-8 lg:pl-12 max-w-xl mx-auto lg:mx-0 w-full">
        <!-- Small Mobile Header Logo -->
        <div class="mb-8 lg:hidden">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="size-10 fill-white"><path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z"></path></svg>
        </div>

        <h1 class="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight">
          Happening now.
        </h1>

        <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-6">
          Join X today.
        </h2>

        <!-- Direct Action Buttons (No Apple/Google Clutter) -->
        <div class="flex flex-col gap-3 w-full max-w-[320px]">
          <button id="start-create-account-btn" class="w-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-3.5 px-6 rounded-full text-base transition-all shadow-lg hover:shadow-[#1d9bf0]/20 cursor-pointer flex items-center justify-center gap-2">
            <span>Create account</span>
          </button>

          <p class="text-[11px] text-[#71767b] leading-relaxed mt-1">
            By signing up, you agree to the <a href="#" class="text-[#1d9bf0] hover:underline">Terms of Service</a> and <a href="#" class="text-[#1d9bf0] hover:underline">Privacy Policy</a>, including <a href="#" class="text-[#1d9bf0] hover:underline">Cookie Use</a>.
          </p>

          <div class="mt-8">
            <h3 class="font-bold text-white text-sm mb-3">Already have an account?</h3>
            <button id="start-sign-in-btn" class="w-full bg-transparent hover:bg-white/10 text-[#1d9bf0] border border-[#313233ad] hover:border-white font-bold py-3.5 px-6 rounded-full text-base transition-colors cursor-pointer flex items-center justify-center">
              <span>Sign in</span>
            </button>
          </div>
        </div>

      </div>

    </div>

    <!-- Authentic X Footer -->
    <footer class="w-full py-4 px-6 border-t border-[#313233ad]/30 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-[#71767b]">
      <span class="hover:underline cursor-pointer">About</span>
      <span class="hover:underline cursor-pointer">Get X App</span>
      <span class="hover:underline cursor-pointer">Grok</span>
      <span class="hover:underline cursor-pointer">Help Center</span>
      <span class="hover:underline cursor-pointer">Terms of Service</span>
      <span class="hover:underline cursor-pointer">Privacy Policy</span>
      <span class="hover:underline cursor-pointer">Cookie Policy</span>
      <span class="hover:underline cursor-pointer">Accessibility</span>
      <span class="hover:underline cursor-pointer">Ads info</span>
      <span class="hover:underline cursor-pointer">Blog</span>
      <span class="hover:underline cursor-pointer">Careers</span>
      <span class="hover:underline cursor-pointer">Brand Resources</span>
      <span class="hover:underline cursor-pointer">Advertising</span>
      <span class="hover:underline cursor-pointer">Marketing</span>
      <span class="hover:underline cursor-pointer">X for Business</span>
      <span class="hover:underline cursor-pointer">Developers</span>
      <span>© 2026 X Corp.</span>
    </footer>
  `;

  document.body.appendChild(landingScreen);

  // Bind Buttons
  landingScreen.querySelector("#start-create-account-btn").addEventListener("click", () => {
    openMultiStepOnboardingWizard();
  });

  landingScreen.querySelector("#start-sign-in-btn").addEventListener("click", () => {
    openDirectSignInModal();
  });
}

/**
 * Multi-Step Authentic X Profile Making Wizard (Collects Full Profile Before Entering X)
 */
function openMultiStepOnboardingWizard() {
  document.querySelectorAll(".x-onboarding-wizard").forEach(el => el.remove());

  let step = 1;
  const formData = {
    username: "",
    handle: "",
    email: "",
    password: "",
    dobMonth: "June",
    dobDay: "15",
    dobYear: "1998",
    avatar: "/assets/user/headShot.jpg",
    bio: "",
    location: "",
    website: "",
    interests: []
  };

  const wizard = document.createElement("div");
  wizard.className = "x-onboarding-wizard fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeInPop_0.2s_ease-out]";

  const renderStep = () => {
    wizard.innerHTML = `
      <div class="bg-[#000000] border border-[#313233ad] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-[#313233ad]/40 mb-6 sticky top-0 bg-black z-10">
          <div class="flex items-center gap-3">
            ${step > 1 ? `
              <button id="wizard-back-btn" class="p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer transition-colors">
                <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/></svg>
              </button>
            ` : ''}
            <button id="wizard-close-btn" class="p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer transition-colors">
              <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>
            </button>
          </div>
          <svg class="size-7 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <span class="text-xs font-bold text-[#71767b] px-3 py-1 bg-[#16181c] rounded-full border border-[#313233ad]">Step ${step} of 3</span>
        </div>

        <div id="wizard-error-msg" class="hidden bg-red-500/20 border border-red-500/50 text-[#f91880] text-xs font-bold p-3 rounded-xl mb-4 text-center"></div>

        <!-- Step Content -->
        ${step === 1 ? renderStep1(formData) : ''}
        ${step === 2 ? renderStep2(formData) : ''}
        ${step === 3 ? renderStep3(formData) : ''}

        <!-- Footer Action -->
        <div class="pt-6 mt-6 border-t border-[#313233ad]/40 flex justify-end">
          <button id="wizard-next-btn" class="w-full sm:w-auto min-w-[160px] bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-3 px-8 rounded-full text-base transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>${step === 3 ? "Complete & Enter X" : "Next step"}</span>
            <svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
          </button>
        </div>

      </div>
    `;

    bindStepEvents();
  };

  function renderStep1(data) {
    return `
      <div>
        <h2 class="text-2xl font-extrabold text-white mb-2">Create your account</h2>
        <p class="text-xs text-[#71767b] mb-6">Enter your core login details. Your @handle must be unique.</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-[#71767b] mb-1">Full Name</label>
            <input id="wiz-username" type="text" value="${data.username}" placeholder="e.g. Cristiano Ronaldo" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors" />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#71767b] mb-1">Unique Username (@handle)</label>
            <input id="wiz-handle" type="text" value="${data.handle}" placeholder="e.g. @Cristiano" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors font-mono" />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#71767b] mb-1">Email address</label>
            <input id="wiz-email" type="email" value="${data.email}" placeholder="e.g. cristiano@alnasr.com" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors" />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#71767b] mb-1">Password</label>
            <input id="wiz-password" type="password" value="${data.password}" placeholder="At least 6 characters" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors" />
          </div>

          <div class="pt-2">
            <label class="block text-xs font-bold text-white mb-1">Date of birth</label>
            <p class="text-[11px] text-[#71767b] mb-3">This will not be shown publicly. Confirm your age to view all authentic content.</p>
            <div class="grid grid-cols-3 gap-3">
              <select id="wiz-dob-month" class="bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none">
                ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => `<option value="${m}" ${data.dobMonth === m ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
              <select id="wiz-dob-day" class="bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none">
                ${Array.from({length: 31}, (_, i) => i + 1).map(d => `<option value="${d}" ${data.dobDay == d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
              <select id="wiz-dob-year" class="bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none">
                ${Array.from({length: 80}, (_, i) => 2010 - i).map(y => `<option value="${y}" ${data.dobYear == y ? 'selected' : ''}>${y}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderStep2(data) {
    const defaultAvatars = [
      "/assets/user/headShot.jpg",
      "https://cdn.pixabay.com/photo/2026/06/18/10/04/kitosonita-beach-10337616_960_720.jpg",
      "https://cdn.pixabay.com/photo/2026/02/05/22/12/olivcelso-desert-10106837_1280.png",
      "https://cdn.pixabay.com/photo/2026/03/03/10/12/tylijura-car-10153221_960_720.jpg",
      "https://cdn.pixabay.com/photo/2026/02/15/05/03/pheladii-man-10124061_1280.jpg",
      "https://stockcake.com/i/joyful-anime-girl_1732866_1246669"
    ];

    return `
      <div>
        <h2 class="text-2xl font-extrabold text-white mb-2">Pick your profile avatar & bio</h2>
        <p class="text-xs text-[#71767b] mb-6">Make your first impression before you enter X.</p>

        <!-- Avatar Selection -->
        <div class="flex flex-col items-center mb-6">
          <div class="relative group mb-3">
            <img id="wiz-avatar-preview" src="${data.avatar}" onerror="this.onerror=null;this.src='/assets/user/headShot.jpg';" alt="Avatar" class="size-24 rounded-full object-cover border-4 border-[#1d9bf0] shadow-xl" />
          </div>
          <span class="text-xs font-bold text-[#71767b] mb-2">Select a preset or upload from PC:</span>
          <div class="flex gap-2.5 flex-wrap items-center justify-center mb-3">
            <!-- Upload from PC button -->
            <label for="wiz-upload-file-input" class="wiz-avatar-upload size-11 rounded-full bg-[#1d9bf0]/20 hover:bg-[#1d9bf0]/40 border-2 border-dashed border-[#1d9bf0] flex items-center justify-center cursor-pointer transition-all text-[#1d9bf0]" title="Upload image from PC">
              <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"/></svg>
            </label>
            <input type="file" id="wiz-upload-file-input" accept="image/*" class="hidden" />

            ${defaultAvatars.map(url => `
              <img src="${url}" onerror="this.onerror=null;this.src='/assets/user/headShot.jpg';" data-url="${url}" alt="Preset" class="wiz-avatar-preset size-11 rounded-full object-cover border-2 ${data.avatar === url ? 'border-[#1d9bf0] scale-110' : 'border-[#313233ad] opacity-70'} hover:opacity-100 cursor-pointer transition-all" />
            `).join('')}
          </div>
          <input id="wiz-avatar-url" type="text" value="${data.avatar}" placeholder="Or paste image URL..." class="w-full max-w-sm bg-[#16181c] border border-[#313233ad] text-xs text-white px-3 py-2 rounded-xl focus:outline-none" />
          <div id="wiz-upload-status" class="text-[11px] text-[#1d9bf0] font-bold mt-1.5 hidden">Uploading photo from PC to server...</div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-[#71767b] mb-1">Your Bio / Headline</label>
            <textarea id="wiz-bio" rows="2" placeholder="What makes you tick? (e.g. Building next-gen AI tech @xCorp)" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none resize-none">${data.bio}</textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#71767b] mb-1">Location</label>
              <input id="wiz-location" type="text" value="${data.location}" placeholder="e.g. San Francisco, CA" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#71767b] mb-1">Website</label>
              <input id="wiz-website" type="text" value="${data.website}" placeholder="e.g. https://x.ai" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderStep3(data) {
    const topics = [
      { id: "Technology", label: "💻 Technology & Coding" },
      { id: "Artificial Intelligence", label: "🤖 Artificial Intelligence & LLMs" },
      { id: "Sports", label: "⚽ Sports & Football" },
      { id: "Gaming", label: "🎮 Gaming & Esports" },
      { id: "Crypto", label: "🚀 Crypto & Web3" },
      { id: "Cinema", label: "🎬 Cinema & Entertainment" },
      { id: "Music", label: "🎵 Music & Concerts" },
      { id: "Business", label: "📈 Business & Finance" },
      { id: "Science", label: "🔬 Space & Science" },
      { id: "Memes", label: "🔥 Viral Memes & Humor" }
    ];

    return `
      <div>
        <h2 class="text-2xl font-extrabold text-white mb-2">What do you want to see on X?</h2>
        <p class="text-xs text-[#71767b] mb-6">Select at least 3 topics to tailor your personalized timeline instantly.</p>

        <div class="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
          ${topics.map(t => {
            const isSelected = data.interests.includes(t.id);
            return `
              <div data-topic="${t.id}" class="wiz-topic-chip p-3.5 rounded-2xl border ${isSelected ? 'bg-[#1d9bf0]/20 border-[#1d9bf0] text-white' : 'bg-[#16181c] border-[#313233ad] text-[#71767b] hover:border-white/40'} font-bold text-xs flex items-center justify-between cursor-pointer transition-all select-none">
                <span>${t.label}</span>
                <div class="size-5 rounded-full border ${isSelected ? 'bg-[#1d9bf0] border-[#1d9bf0] text-white' : 'border-[#313233ad]'} flex items-center justify-center text-[10px]">
                  ${isSelected ? '✓' : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function bindStepEvents() {
    wizard.querySelector("#wizard-close-btn")?.addEventListener("click", () => wizard.remove());
    
    // Auto-prefix @ on handle input
    const handleInput = wizard.querySelector("#wiz-handle");
    if (handleInput) {
      handleInput.addEventListener("blur", () => {
        let val = handleInput.value.trim();
        if (val && !val.startsWith("@")) handleInput.value = "@" + val;
      });
    }

    // Preset avatars click
    wizard.querySelectorAll(".wiz-avatar-preset").forEach(img => {
      img.addEventListener("click", () => {
        formData.avatar = img.getAttribute("data-url");
        const preview = wizard.querySelector("#wiz-avatar-preview");
        if (preview) preview.src = formData.avatar;
        wizard.querySelectorAll(".wiz-avatar-preset").forEach(i => i.classList.remove("border-[#1d9bf0]", "scale-110"));
        img.classList.add("border-[#1d9bf0]", "scale-110");
        const urlInput = wizard.querySelector("#wiz-avatar-url");
        if (urlInput) urlInput.value = formData.avatar;
      });
    });

    const urlInput = wizard.querySelector("#wiz-avatar-url");
    if (urlInput) {
      urlInput.addEventListener("input", () => {
        formData.avatar = urlInput.value.trim() || "/assets/user/headShot.jpg";
        const preview = wizard.querySelector("#wiz-avatar-preview");
        if (preview) preview.src = formData.avatar;
      });
    }

    const fileInput = wizard.querySelector("#wiz-upload-file-input");
    if (fileInput) {
      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Immediate local preview
        const localURL = URL.createObjectURL(file);
        const preview = wizard.querySelector("#wiz-avatar-preview");
        if (preview) preview.src = localURL;
        formData.avatar = localURL;

        const statusBox = wizard.querySelector("#wiz-upload-status");
        if (statusBox) statusBox.classList.remove("hidden");

        const uploadData = new FormData();
        uploadData.append("file", file);

        try {
          const res = await fetch(`${API_BASE_URL}/api/upload`, {
            method: "POST",
            body: uploadData
          });
          const result = await res.json();
          if (res.ok && result.url) {
            formData.avatar = result.url;
            if (preview) preview.src = result.url;
            if (urlInput) urlInput.value = result.url;
            if (statusBox) {
              statusBox.textContent = "✅ Photo uploaded to server!";
              setTimeout(() => statusBox.classList.add("hidden"), 3000);
            }
          } else {
            throw new Error(result.message || "Upload failed");
          }
        } catch (err) {
          console.error("PC upload error:", err);
          if (statusBox) {
            statusBox.textContent = "❌ Upload failed, using local preview.";
            setTimeout(() => statusBox.classList.add("hidden"), 4000);
          }
        }
      });
    }

    // Topic chips click
    wizard.querySelectorAll(".wiz-topic-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const topic = chip.getAttribute("data-topic");
        if (formData.interests.includes(topic)) {
          formData.interests = formData.interests.filter(t => t !== topic);
        } else {
          formData.interests.push(topic);
        }
        renderStep();
      });
    });

    // Back Button
    wizard.querySelector("#wizard-back-btn")?.addEventListener("click", () => {
      if (step > 1) {
        saveCurrentStepData();
        step--;
        renderStep();
      }
    });

    // Next / Finish Button
    wizard.querySelector("#wizard-next-btn")?.addEventListener("click", async () => {
      saveCurrentStepData();
      const errBox = wizard.querySelector("#wizard-error-msg");
      if (errBox) errBox.classList.add("hidden");

      if (step === 1) {
        if (!formData.username || !formData.handle || !formData.email || !formData.password) {
          errBox.textContent = "Please fill in all core fields before continuing.";
          errBox.classList.remove("hidden");
          return;
        }
        if (formData.password.length < 6) {
          errBox.textContent = "Password must be at least 6 characters long.";
          errBox.classList.remove("hidden");
          return;
        }
        step = 2;
        renderStep();
      } else if (step === 2) {
        step = 3;
        renderStep();
      } else if (step === 3) {
        // Submit registration payload to server
        const nextBtn = wizard.querySelector("#wizard-next-btn");
        nextBtn.disabled = true;
        nextBtn.innerHTML = `<span>Creating account...</span>`;

        try {
          const dobString = `${formData.dobMonth} ${formData.dobDay}, ${formData.dobYear}`;
          let handle = formData.handle.startsWith("@") ? formData.handle : `@${formData.handle}`;

          const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: formData.username,
              handle: handle,
              email: formData.email,
              password: formData.password,
              avatar: formData.avatar,
              bio: formData.bio || "Hey there! I am using X.",
              dob: dobString,
              location: formData.location,
              website: formData.website,
              interests: formData.interests
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Registration failed");

          setAuthData(data.token, data.user);
          wizard.remove();
          window.location.reload();
        } catch (err) {
          if (errBox) {
            errBox.textContent = err.message;
            errBox.classList.remove("hidden");
          }
          nextBtn.disabled = false;
          nextBtn.innerHTML = `<span>Complete & Enter X</span>`;
        }
      }
    });
  }

  function saveCurrentStepData() {
    if (step === 1) {
      formData.username = wizard.querySelector("#wiz-username")?.value.trim() || "";
      formData.handle = wizard.querySelector("#wiz-handle")?.value.trim() || "";
      formData.email = wizard.querySelector("#wiz-email")?.value.trim() || "";
      formData.password = wizard.querySelector("#wiz-password")?.value || "";
      formData.dobMonth = wizard.querySelector("#wiz-dob-month")?.value || "June";
      formData.dobDay = wizard.querySelector("#wiz-dob-day")?.value || "15";
      formData.dobYear = wizard.querySelector("#wiz-dob-year")?.value || "1998";
    } else if (step === 2) {
      formData.bio = wizard.querySelector("#wiz-bio")?.value.trim() || "";
      formData.location = wizard.querySelector("#wiz-location")?.value.trim() || "";
      formData.website = wizard.querySelector("#wiz-website")?.value.trim() || "";
      formData.avatar = wizard.querySelector("#wiz-avatar-url")?.value.trim() || formData.avatar;
    }
  }

  renderStep();
  document.body.appendChild(wizard);
}

/**
 * Direct Sign In Modal when user clicks "Sign in" from landing page
 */
function openDirectSignInModal() {
  document.querySelectorAll(".x-direct-signin-modal").forEach(el => el.remove());

  const modal = document.createElement("div");
  modal.className = "x-direct-signin-modal fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeInPop_0.2s_ease-out]";

  modal.innerHTML = `
    <div class="bg-[#000000] border border-[#313233ad] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
      <button class="close-signin-modal absolute top-5 left-5 p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer transition-colors">
        <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>
      </button>

      <div class="flex justify-center mb-6">
        <svg class="size-8 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </div>

      <h2 class="text-2xl font-extrabold text-white text-center mb-6">Sign in to X</h2>

      <div id="signin-error-msg" class="hidden bg-red-500/20 border border-red-500/50 text-[#f91880] text-xs font-bold p-3 rounded-xl mb-4 text-center"></div>

      <form id="direct-signin-form" class="space-y-4">
        <div>
          <input required type="text" id="signin-email-handle" placeholder="Phone, email, or @username" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors" />
        </div>
        <div>
          <input required type="password" id="signin-password" placeholder="Password" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors" />
        </div>

        <button type="submit" class="w-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-3.5 px-4 rounded-full text-base cursor-pointer transition-colors shadow-lg mt-3 flex items-center justify-center">
          <span id="signin-submit-txt">Sign in</span>
        </button>
      </form>

      <div class="mt-6 pt-6 border-t border-[#313233ad]/40 text-center text-sm text-[#71767b]">
        Don't have an account? <button type="button" id="switch-to-wizard-btn" class="text-[#1d9bf0] font-bold hover:underline cursor-pointer">Sign up</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close-signin-modal").addEventListener("click", () => modal.remove());
  modal.querySelector("#switch-to-wizard-btn").addEventListener("click", () => {
    modal.remove();
    openMultiStepOnboardingWizard();
  });

  modal.querySelector("#direct-signin-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errBox = modal.querySelector("#signin-error-msg");
    const submitBtn = modal.querySelector("button[type='submit']");
    const submitTxt = modal.querySelector("#signin-submit-txt");

    errBox.classList.add("hidden");
    submitBtn.disabled = true;
    submitTxt.textContent = "Signing in...";

    try {
      let emailOrHandle = modal.querySelector("#signin-email-handle").value.trim();
      const password = modal.querySelector("#signin-password").value.trim();

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
    } catch (err) {
      errBox.textContent = err.message;
      errBox.classList.remove("hidden");
      submitBtn.disabled = false;
      submitTxt.textContent = "Sign in";
    }
  });
}
