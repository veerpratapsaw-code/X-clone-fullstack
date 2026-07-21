import { getToken, getCurrentUser, showAuthModal } from "./auth.js";
import { API_BASE_URL } from "../config.js";
import { renderPostCard, initFeed } from "./feedRenderer.js";
import { initXVideoPlayers } from "./videoPlayer.js";

// Toast notification helper
const showToast = (message) => {
  const existing = document.querySelector(".x-toast-pill");
  existing?.remove();

  const toast = document.createElement("div");
  toast.className = "x-toast-pill fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-[#1d9bf0] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-2xl animate-[fadeInPop_0.2s_ease-out] pointer-events-none";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
};

/**
 * Initializes Right Sidebar "Who to follow" and "What’s happening" trending bar with live backend insights & MongoDB persistence
 */
export async function initWhoToFollow() {
  const whoToFollowBox = document.querySelector(".Whotofollow");
  const whatsHappeningBox = document.querySelector(".WhatsHappening");

  // Fetch live insights from backend (Gemini AI + real database metrics)
  let sidebarData = null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/posts/sidebar-insights`);
    sidebarData = await res.json();
  } catch (err) {
    console.warn("Could not fetch sidebar insights:", err);
  }

  // Populate What's happening dynamic trending bar
  if (whatsHappeningBox && sidebarData && sidebarData.trending) {
    const header = whatsHappeningBox.querySelector(".text-xl.font-extrabold") || { outerHTML: `<div class="content px-5 my-5 text-xl font-extrabold">What’s happening</div>` };
    whatsHappeningBox.innerHTML = `
      <div class="content px-5 my-5 text-xl font-extrabold">
        What’s happening
      </div>
      ${sidebarData.trending.map(item => `
        <div class="content px-5 py-3 my-1 hover:bg-[#111] cursor-pointer transition-colors trending-item" data-tag="${item.tag}">
          <div class="name text-[10px] text-gray-400 flex justify-between items-center">
            <span>${item.category}</span>
            <span class="text-[9px] bg-[#1d9bf0]/10 text-[#1d9bf0] px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
          </div>
          <div class="username flex justify-between font-bold text-white mt-0.5">
            ${item.tag}
            <img class="size-4 opacity-60 hover:opacity-100 transition-opacity" src="/assets/svg/morefilled.svg" alt="More" />
          </div>
          <div class="posts text-[11px] text-gray-500 mt-0.5">${item.postsCount}</div>
        </div>
      `).join('')}
      <div class="px-5 py-3 my-1 text-[#1d9bf0] text-sm cursor-pointer transition-colors hover:bg-[#111] rounded-b-3xl">
        Show more
      </div>
    `;

    // Clicking a trending tag filters the search live
    whatsHappeningBox.querySelectorAll(".trending-item").forEach(item => {
      item.addEventListener("click", () => {
        const tag = item.dataset.tag;
        const searchInput = document.querySelector(".right input[type='text']");
        if (searchInput && tag) {
          searchInput.value = tag;
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  }

  // Populate Who to follow dynamic accounts
  if (whoToFollowBox && sidebarData && sidebarData.whoToFollow) {
    whoToFollowBox.innerHTML = `
      <div class="content px-5 my-5 text-xl font-extrabold">
        Who to follow
      </div>
      ${sidebarData.whoToFollow.map(u => `
        <div class="content flex items-center justify-between px-5 py-3 my-1 hover:bg-[#111] cursor-pointer transition-colors follow-sidebar-row" data-handle="${u.handle}">
          <div class="flex items-center min-w-0 flex-1">
            <div class="photo text-[10px] text-gray-400 shrink-0 mr-3">
              <img class="size-10 border border-[#313233ad] rounded-full object-cover object-center" src="${u.avatar}" alt="${u.name}" />
            </div>
            <div class="text flex flex-col min-w-0 mr-2">
              <div class="text-[13px] font-bold text-white truncate flex items-center gap-1">
                <span>${u.name}</span>
                ${u.verified ? `<img class="w-3.5 shrink-0" src="/assets/svg/lock.svg" alt="Verified" />` : ''}
              </div>
              <div class="text-[11px] text-gray-500 truncate mt-0.5 font-normal">${u.handle}</div>
            </div>
          </div>
          <div class="btn shrink-0 border-0 text-black bg-white font-bold rounded-full h-8 px-4 flex items-center justify-center text-xs hover:bg-[#eff3f4] transition-colors cursor-pointer" data-handle="${u.handle}">
            Follow
          </div>
        </div>
      `).join('')}
    `;
  }

  if (!whoToFollowBox) return;

  const followItems = whoToFollowBox.querySelectorAll(".content.flex.items-center.justify-between");
  
  // Check what handles current user is following right on page load
  let userFollowing = [];
  const currentUser = getCurrentUser();
  if (currentUser && getToken()) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile/${encodeURIComponent(currentUser.handle || "@user")}`);
      const data = await res.json();
      if (data && data.user && data.user.following) {
        userFollowing = data.user.following.map(h => h.toLowerCase());
      }
    } catch (err) {
      console.warn("Could not load user following state:", err);
    }
  }

  const setButtonFollowingState = (btn, isFollowing) => {
    if (isFollowing) {
      btn.textContent = "Following";
      btn.className = "btn shrink-0 border border-[#536471] text-white bg-transparent font-bold rounded-full h-8 px-4 flex items-center justify-center text-xs transition-all duration-200 cursor-pointer hover:border-red-600 hover:text-red-600 hover:bg-red-500/10";
      btn.dataset.following = "true";
      
      btn.onmouseenter = () => { if (btn.dataset.following === "true") btn.textContent = "Unfollow"; };
      btn.onmouseleave = () => { if (btn.dataset.following === "true") btn.textContent = "Following"; };
    } else {
      btn.textContent = "Follow";
      btn.className = "btn shrink-0 border-0 text-black bg-white font-bold rounded-full h-8 px-4 flex items-center justify-center text-xs hover:bg-[#eff3f4] transition-colors cursor-pointer";
      btn.dataset.following = "false";
      btn.onmouseenter = null;
      btn.onmouseleave = null;
    }
  };

  followItems.forEach(item => {
    const btn = item.querySelector(".btn");
    const handleEl = item.querySelector(".text-\\[11px\\].text-gray-500");
    const handle = btn?.dataset.handle || handleEl?.textContent?.trim() || "";

    if (!btn || !handle) return;

    if (userFollowing.includes(handle.toLowerCase())) {
      setButtonFollowingState(btn, true);
    } else {
      setButtonFollowingState(btn, false);
    }

    btn.addEventListener("click", async (e) => {
      e.stopPropagation();

      if (!getToken()) {
        showAuthModal("login", true);
        return;
      }

      const isFollowing = btn.dataset.following === "true";
      const newFollowingState = !isFollowing;

      setButtonFollowingState(btn, newFollowingState);
      showToast(newFollowingState ? `Followed ${handle}` : `Unfollowed ${handle}`);

      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(handle)}/follow`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${getToken()}`
          }
        });
        const data = await res.json();
        if (data.following !== undefined) {
          setButtonFollowingState(btn, data.following);
        }
      } catch (err) {
        console.warn("Follow sync error:", err);
      }
    });
  });
}

/**
 * Initializes Search Bar live filtering and backend query
 */
export function initSearchBar() {
  const searchInput = document.querySelector(".right input[type='text']");
  const postsContainer = document.querySelector(".posts");
  if (!searchInput || !postsContainer) return;

  let debounceTimer = null;

  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.trim();
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      if (!q) {
        // Restore normal live feed when search cleared
        initFeed();
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/search?q=${encodeURIComponent(q)}`);
        const posts = await res.json();

        postsContainer.innerHTML = "";
        if (!posts || posts.length === 0) {
          postsContainer.innerHTML = `
            <div class="p-12 text-center border-b border-[#313233ad]">
              <h3 class="text-xl font-bold text-white mb-2">No results for "${q}"</h3>
              <p class="text-sm text-[#71767b]">Try searching for keywords, author names, or hashtags like #BhagavadGita or #CR7.</p>
            </div>
          `;
          return;
        }

        // Show header pill for search results
        const header = document.createElement("div");
        header.className = "px-4 py-3 border-b border-[#313233ad] bg-[#080808] text-sm font-bold text-[#1d9bf0]";
        header.textContent = `Search results for "${q}" (${posts.length})`;
        postsContainer.appendChild(header);

        posts.forEach(post => {
          const card = renderPostCard(post);
          postsContainer.appendChild(card);
        });
        initXVideoPlayers();
      } catch (err) {
        console.warn("Search fetch error:", err);
      }
    }, 300);
  });
}

/**
 * Initializes Center Header Tabs ("For you", "Following", category tabs)
 */
export function initHeaderTabs() {
  const tabsContainer = document.querySelector(".top .w-full.flex.items-center.px-2");
  const postsContainer = document.querySelector(".posts");
  if (!tabsContainer || !postsContainer) return;

  const tabs = tabsContainer.querySelectorAll(".tab");

  tabs.forEach(tab => {
    tab.addEventListener("click", async () => {
      // Remove indicator and active styles from all tabs
      tabs.forEach(t => {
        t.querySelector("div.absolute.bottom-0")?.remove();
        t.classList.remove("text-white");
        t.classList.add("text-[#71767b]");
      });

      // Add indicator and active styles to clicked tab
      tab.classList.remove("text-[#71767b]");
      tab.classList.add("text-white");
      const indicator = document.createElement("div");
      indicator.className = "absolute bottom-0 h-1 w-14 rounded-full bg-[#1d9bf0]";
      tab.appendChild(indicator);

      const tabText = tab.querySelector("span")?.textContent?.trim() || "";

      if (tabText === "For you") {
        initFeed();
      } else if (tabText === "Following") {
        if (!getToken()) {
          showAuthModal("login", true);
          return;
        }

        postsContainer.innerHTML = `<div class="p-12 text-center text-[#71767b] text-sm animate-pulse">Loading following feed...</div>`;
        try {
          const res = await fetch(`${API_BASE_URL}/api/posts/feed/following`, {
            headers: { "Authorization": `Bearer ${getToken()}` }
          });
          const posts = await res.json();

          postsContainer.innerHTML = "";
          if (!posts || posts.length === 0) {
            postsContainer.innerHTML = `
              <div class="p-12 text-center border-b border-[#313233ad]">
                <h3 class="text-lg font-bold text-white mb-2">Welcome to your Following feed!</h3>
                <p class="text-sm text-[#71767b] max-w-sm mx-auto leading-relaxed">You aren't following anyone yet or they haven't posted. Follow accounts from 'Who to follow' on the right to see their live updates here.</p>
              </div>
            `;
            return;
          }

          posts.forEach(post => {
            const card = renderPostCard(post);
            postsContainer.appendChild(card);
          });
          initXVideoPlayers();
        } catch (err) {
          console.warn("Following feed error:", err);
          postsContainer.innerHTML = `<div class="p-8 text-center text-red-400 text-sm">Failed to load following feed</div>`;
        }
      } else {
        // Category tabs like Tech, Gaming, Travel, Stocks, Science
        postsContainer.innerHTML = `<div class="p-12 text-center text-[#71767b] text-sm animate-pulse">Loading ${tabText} posts...</div>`;
        try {
          const res = await fetch(`${API_BASE_URL}/api/posts/search?q=${encodeURIComponent(tabText)}`);
          const posts = await res.json();

          postsContainer.innerHTML = "";
          if (!posts || posts.length === 0) {
            postsContainer.innerHTML = `
              <div class="p-12 text-center border-b border-[#313233ad]">
                <h3 class="text-lg font-bold text-white mb-2">No ${tabText} posts yet</h3>
                <p class="text-sm text-[#71767b]">Be the first to post about ${tabText}!</p>
              </div>
            `;
            return;
          }

          const header = document.createElement("div");
          header.className = "px-4 py-3 border-b border-[#313233ad] bg-[#080808] text-sm font-bold text-[#1d9bf0]";
          header.textContent = `${tabText} Topic Feed (${posts.length})`;
          postsContainer.appendChild(header);

          posts.forEach(post => {
            const card = renderPostCard(post);
            postsContainer.appendChild(card);
          });
          initXVideoPlayers();
        } catch (err) {
          console.warn("Category feed error:", err);
        }
      }
    });
  });
}

/**
 * Shows comprehensive Edit Profile Modal with PC File Upload and universal stock presets
 */
export function showEditProfileModal(currentUser, onSaveCallback) {
  document.querySelectorAll(".x-edit-profile-modal").forEach(el => el.remove());

  const defaultAvatars = [
    "/assets/user/headShot.jpg",
    "/assets/user/Cristiano-Ronaldo.jpg",
    "/assets/user/akshay_kumar.jpg",
    "/assets/user/dipika.jpg",
    "/assets/user/virat.jpg",
    "/assets/user/headShotio.jpg"
  ];

  let currentAvatar = currentUser.avatar || "/assets/user/headShot.jpg";

  const modal = document.createElement("div");
  modal.className = "x-edit-profile-modal fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-[fadeInPop_0.2s_ease-out]";

  modal.innerHTML = `
    <div class="bg-[#000000] border border-[#313233ad] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
      <div class="flex items-center justify-between px-4 py-3 border-b border-[#313233ad]/60 bg-[#000000]/90 sticky top-0 z-10">
        <div class="flex items-center gap-4">
          <button class="close-edit p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer transition-colors">
            <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>
          </button>
          <h2 class="text-lg font-bold text-white">Edit profile</h2>
        </div>
        <button id="save-profile-btn" class="bg-white hover:bg-[#eff3f4] text-black font-bold px-5 py-1.5 rounded-full text-sm transition-colors cursor-pointer">
          Save
        </button>
      </div>

      <!-- Banner -->
      <div class="h-28 bg-gradient-to-r from-[#1d9bf0] via-[#0972b8] to-[#16181c] relative"></div>

      <div class="p-5 space-y-4">
        <!-- Avatar picker -->
        <div class="flex flex-col items-center -mt-16 mb-4 relative z-10">
          <div class="relative group mb-3">
            <img id="edit-avatar-preview" src="${currentAvatar}" onerror="this.onerror=null;this.src='/assets/user/headShot.jpg';" class="size-24 rounded-full object-cover border-4 border-black bg-black shadow-xl" />
          </div>
          <span class="text-xs font-bold text-[#71767b] mb-2">Select a preset or upload from PC:</span>
          <div class="flex gap-2.5 flex-wrap items-center justify-center mb-3">
            <!-- Upload from PC button -->
            <label for="edit-upload-file-input" class="size-11 rounded-full bg-[#1d9bf0]/20 hover:bg-[#1d9bf0]/40 border-2 border-dashed border-[#1d9bf0] flex items-center justify-center cursor-pointer transition-all text-[#1d9bf0]" title="Upload image from PC">
              <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"/></svg>
            </label>
            <input type="file" id="edit-upload-file-input" accept="image/*" class="hidden" />

            ${defaultAvatars.map(url => `
              <img src="${url}" onerror="this.onerror=null;this.src='/assets/user/headShot.jpg';" data-url="${url}" alt="Preset" class="edit-avatar-preset size-11 rounded-full object-cover border-2 ${currentAvatar === url ? 'border-[#1d9bf0] scale-110' : 'border-[#313233ad] opacity-70'} hover:opacity-100 cursor-pointer transition-all" />
            `).join('')}
          </div>
          <input id="edit-avatar-url" type="text" value="${currentAvatar}" placeholder="Or paste image URL..." class="w-full bg-[#16181c] border border-[#313233ad] text-xs text-white px-3 py-2 rounded-xl focus:outline-none" />
          <div id="edit-upload-status" class="text-[11px] text-[#1d9bf0] font-bold mt-1.5 hidden">Uploading photo from PC...</div>
        </div>

        <div>
          <label class="block text-xs font-bold text-[#71767b] mb-1">Name</label>
          <input id="edit-username" type="text" value="${currentUser.username || ''}" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none" />
        </div>

        <div>
          <label class="block text-xs font-bold text-[#71767b] mb-1">Bio</label>
          <textarea id="edit-bio" rows="2" placeholder="What makes you tick?" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-2 rounded-xl text-sm focus:outline-none resize-none">${currentUser.bio || ''}</textarea>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-[#71767b] mb-1">Location</label>
            <input id="edit-location" type="text" value="${currentUser.location || ''}" placeholder="New Delhi, India" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-3 py-2 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-[#71767b] mb-1">Website</label>
            <input id="edit-website" type="text" value="${currentUser.website || ''}" placeholder="https://..." class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-3 py-2 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-[#71767b] mb-1">Birth date</label>
            <input id="edit-dob" type="text" value="${currentUser.dob || ''}" placeholder="Jan 1, 2000" class="w-full bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-3 py-2 rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
      </div>
    </div>
  `;

  const close = () => modal.remove();
  modal.querySelector(".close-edit")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  // Presets click
  modal.querySelectorAll(".edit-avatar-preset").forEach(img => {
    img.addEventListener("click", () => {
      currentAvatar = img.getAttribute("data-url");
      modal.querySelector("#edit-avatar-preview").src = currentAvatar;
      modal.querySelectorAll(".edit-avatar-preset").forEach(i => i.classList.remove("border-[#1d9bf0]", "scale-110"));
      img.classList.add("border-[#1d9bf0]", "scale-110");
      modal.querySelector("#edit-avatar-url").value = currentAvatar;
    });
  });

  const urlInput = modal.querySelector("#edit-avatar-url");
  if (urlInput) {
    urlInput.addEventListener("input", () => {
      currentAvatar = urlInput.value.trim() || "/assets/user/headShot.jpg";
      modal.querySelector("#edit-avatar-preview").src = currentAvatar;
    });
  }

  const fileInput = modal.querySelector("#edit-upload-file-input");
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const localURL = URL.createObjectURL(file);
      modal.querySelector("#edit-avatar-preview").src = localURL;
      currentAvatar = localURL;

      const statusBox = modal.querySelector("#edit-upload-status");
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
          currentAvatar = result.url;
          modal.querySelector("#edit-avatar-preview").src = result.url;
          if (urlInput) urlInput.value = result.url;
          if (statusBox) {
            statusBox.textContent = "✅ Photo uploaded to server!";
            setTimeout(() => statusBox.classList.add("hidden"), 3000);
          }
        }
      } catch (err) {
        console.error("PC upload error:", err);
      }
    });
  }

  modal.querySelector("#save-profile-btn")?.addEventListener("click", async () => {
    const saveBtn = modal.querySelector("#save-profile-btn");
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    const payload = {
      username: modal.querySelector("#edit-username").value.trim() || currentUser.username,
      bio: modal.querySelector("#edit-bio").value.trim(),
      avatar: currentAvatar,
      location: modal.querySelector("#edit-location").value.trim(),
      website: modal.querySelector("#edit-website").value.trim(),
      dob: modal.querySelector("#edit-dob").value.trim()
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        const { setAuthData } = await import("./auth.js");
        setAuthData(getToken(), updatedUser);
        close();
        if (onSaveCallback) onSaveCallback();
      } else {
        saveBtn.textContent = "Error";
        saveBtn.disabled = false;
      }
    } catch (err) {
      console.error("Save profile error:", err);
      saveBtn.textContent = "Error";
      saveBtn.disabled = false;
    }
  });

  document.body.appendChild(modal);
}

/**
 * Shows comprehensive User Profile View Modal
 */
export async function showUserProfileScreen() {
  const currentUser = getCurrentUser();
  if (!currentUser || !getToken()) {
    showAuthModal("login", true);
    return;
  }

  document.querySelectorAll(".x-profile-modal").forEach(el => el.remove());

  const handle = currentUser.handle || "@user";
  const avatar = currentUser.avatar || "/assets/user/headShot.jpg";
  const username = currentUser.username || "You";
  const bio = currentUser.bio || "Hey there! I am using authentic X full-stack clone. Building dynamic relational feeds and rich interactions. 🚀✨";

  const modal = document.createElement("div");
  modal.className = "x-profile-modal fixed inset-0 z-[260] bg-black/85 backdrop-blur-md flex items-start justify-center pt-6 pb-8 px-4 overflow-y-auto animate-[fadeInPop_0.2s_ease-out]";

  modal.innerHTML = `
    <div class="bg-[#000000] border border-[#313233ad] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
      <!-- Header -->
      <div class="flex items-center gap-6 px-4 py-3 border-b border-[#313233ad]/60 bg-[#000000]/90 sticky top-0 z-10 backdrop-blur-sm">
        <button class="close-profile p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer transition-colors">
          <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>
        </button>
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-1">${username} <img class="w-4" src="/assets/svg/lock.svg" alt="Verified" /></h2>
          <div class="text-xs text-[#71767b] profile-posts-count">Loading posts...</div>
        </div>
      </div>

      <!-- Banner Header -->
      <div class="h-36 sm:h-48 bg-gradient-to-r from-[#1d9bf0] via-[#0972b8] to-[#16181c] relative"></div>

      <!-- Avatar & Edit Profile button row -->
      <div class="px-4 pb-4 border-b border-[#313233ad]/60 relative">
        <div class="flex justify-between items-end -mt-16 sm:-mt-20 mb-3">
          <img class="size-28 sm:size-36 rounded-full object-cover border-4 border-black bg-black shadow-2xl relative z-10" src="${avatar}" onerror="this.onerror=null;this.src='/assets/user/headShot.jpg';" alt="${username}" />
          <button id="profile-edit-btn" class="border border-[#536471] hover:bg-white/10 text-white font-bold px-5 py-2 rounded-full text-sm transition-colors cursor-pointer">
            Edit profile
          </button>
        </div>

        <h1 class="text-xl font-extrabold text-white leading-tight flex items-center gap-1.5">${username} <img class="w-4" src="/assets/svg/lock.svg" alt="Verified" /></h1>
        <div class="text-sm text-[#71767b] mb-3">${handle}</div>
        <div class="text-sm text-[#e7e9ea] mb-3 font-normal leading-relaxed profile-bio-text">${bio}</div>

        <div class="flex items-center gap-4 text-xs text-[#71767b] mb-4 flex-wrap profile-meta-bar">
          ${currentUser.location ? `<span class="flex items-center gap-1">📍 ${currentUser.location}</span>` : ''}
          ${currentUser.website ? `<span class="flex items-center gap-1">🔗 <a href="${currentUser.website}" target="_blank" class="text-[#1d9bf0] hover:underline">${currentUser.website}</a></span>` : ''}
          ${currentUser.dob ? `<span class="flex items-center gap-1">🎈 Born ${currentUser.dob}</span>` : ''}
          <span class="flex items-center gap-1"><svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v12c0 .28.23.5.5.5h13c.28 0 .5-.22.5-.5v-12c0-.28-.22-.5-.5-.5H17v1h-2V6H9v1H7V6z"/></svg> Joined July 2026</span>
        </div>

        <!-- Follow Stats -->
        <div class="flex items-center gap-6 text-sm">
          <span class="cursor-pointer hover:underline"><span class="font-bold text-white profile-following-num">${(currentUser.following || []).length}</span> <span class="text-[#71767b]">Following</span></span>
          <span class="cursor-pointer hover:underline"><span class="font-bold text-white profile-followers-num">${(currentUser.followers || []).length}</span> <span class="text-[#71767b]">Followers</span></span>
        </div>
      </div>

      <!-- User Posts List -->
      <div class="profile-posts-list divide-y divide-[#313233ad]/40 max-h-[450px] overflow-y-auto">
        <div class="p-12 text-center text-[#71767b] text-sm animate-pulse">Loading ${username}'s posts...</div>
      </div>
    </div>
  `;

  const close = () => modal.remove();
  modal.querySelector(".close-profile")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  modal.querySelector("#profile-edit-btn")?.addEventListener("click", () => {
    showEditProfileModal(getCurrentUser(), () => {
      showUserProfileScreen();
      const { updateUserProfilePill } = import("./auth.js");
      updateUserProfilePill && updateUserProfilePill();
    });
  });

  document.body.appendChild(modal);

  // Fetch complete profile details & tweets from backend
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/profile/${encodeURIComponent(handle)}`);
    const data = await res.json();

    const postsList = modal.querySelector(".profile-posts-list");
    const actualPostsCount = data.posts?.length || 0;
    modal.querySelector(".profile-posts-count").textContent = `${actualPostsCount} posts`;
    modal.querySelector(".profile-following-num").textContent = data.followingCount ?? (currentUser.following || []).length;
    modal.querySelector(".profile-followers-num").textContent = data.followersCount ?? (currentUser.followers || []).length;

    if (data.user) {
      if (data.user.bio) {
        const bioEl = modal.querySelector(".profile-bio-text");
        if (bioEl) bioEl.textContent = data.user.bio;
      }
      const metaBar = modal.querySelector(".profile-meta-bar");
      if (metaBar) {
        let metaHtml = "";
        if (data.user.location) metaHtml += `<span class="flex items-center gap-1">📍 ${data.user.location}</span>`;
        if (data.user.website) metaHtml += `<span class="flex items-center gap-1">🔗 <a href="${data.user.website}" target="_blank" class="text-[#1d9bf0] hover:underline">${data.user.website}</a></span>`;
        if (data.user.dob) metaHtml += `<span class="flex items-center gap-1">🎈 Born ${data.user.dob}</span>`;
        metaHtml += `<span class="flex items-center gap-1"><svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v12c0 .28.23.5.5.5h13c.28 0 .5-.22.5-.5v-12c0-.28-.22-.5-.5-.5H17v1h-2V6H9v1H7V6z"/></svg> Joined July 2026</span>`;
        metaBar.innerHTML = metaHtml;
      }
    }

    postsList.innerHTML = "";
    if (!data.posts || data.posts.length === 0) {
      postsList.innerHTML = `
        <div class="p-12 text-center">
          <h3 class="text-lg font-bold text-white mb-2">You haven't posted any tweets yet</h3>
          <p class="text-sm text-[#71767b]">When you share tweets, photos, or videos, they will show up on your profile here.</p>
        </div>
      `;
      return;
    }

    data.posts.forEach(post => {
      const card = renderPostCard(post);
      postsList.appendChild(card);
    });
    initXVideoPlayers();
  } catch (err) {
    console.warn("Profile load error:", err);
    modal.querySelector(".profile-posts-list").innerHTML = `<div class="p-8 text-center text-red-400 text-sm">Failed to load profile data</div>`;
  }
}

/**
 * Initializes Left Navigation Sidebar Items (Home, Explore, Notifications, Bookmarks, Profile, etc.)
 */
export function initSidebarNav() {
  const sidebarItems = document.querySelectorAll(".left ul li, .bottom-nav li, .nav li");
  
  sidebarItems.forEach(item => {
    item.addEventListener("click", async () => {
      const label = item.querySelector("span")?.textContent?.trim() || item.textContent?.trim() || "";

      // Highlight clicked sidebar icon
      sidebarItems.forEach(i => i.classList.remove("bg-[#1d1d1d]", "font-bold"));
      item.classList.add("font-bold");

      const mainContainer = document.querySelector(".main");
      if (!mainContainer) return;

      if (label === "Home") {
        restoreHomeFeed();
      } else if (label === "Explore") {
        restoreHomeFeed();
        const searchInput = document.querySelector(".right input[type='text']");
        if (searchInput) {
          searchInput.focus();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        showToast("Explore trending topics and search across X");
      } else if (label === "Notifications") {
        renderNotificationsScreen(mainContainer);
      } else if (label === "Follow") {
        renderFollowDiscoverScreen(mainContainer);
      } else if (label === "Chat") {
        renderChatMessagesScreen(mainContainer);
      } else if (label === "Grok") {
        // Grok handled by initGrokUI / showGrokScreen
      } else if (label === "Bookmarks") {
        renderBookmarksScreen(mainContainer);
      } else if (label === "Creator Studio") {
        renderCreatorStudioScreen(mainContainer);
      } else if (label === "Premium") {
        showPremiumModal();
      } else if (label === "Profile") {
        showUserProfileScreen();
      } else if (label === "More") {
        showMoreMenuPopover(item);
      } else {
        showToast(`${label} view opened`);
      }
    });
  });
}

/**
 * Restores authentic Home Feed layout and re-initializes live timeline
 */
export function restoreHomeFeed() {
  const mainContainer = document.querySelector(".main");
  if (!mainContainer) return;

  // Rebuild Top Tabs + Post Creation Box + Posts Container if replaced
  mainContainer.innerHTML = `
    <!-- Top Sticky Header Container -->
    <div class="top sticky top-0 z-10 w-full bg-[#000000dd] backdrop-blur-md flex flex-col border-b border-[#313233ad]">
      <!-- Authentic Mobile Top Bar -->
      <div class="hidden max-sm:flex items-center justify-between px-4 h-[53px] w-full border-b border-[#313233ad]/40 relative">
        <div class="cursor-pointer shrink-0">
          <img class="size-8 rounded-full object-cover border border-[#313233ad]" src="/assets/user/headShot.jpg" alt="Profile" />
        </div>
        <div class="text-white shrink-0 absolute left-1/2 -translate-x-1/2">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="size-6 fill-current"><path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z"></path></svg>
        </div>
        <div class="shrink-0">
          <button class="border border-[#313233ad] rounded-full px-3.5 py-1.5 font-bold text-xs text-white hover:bg-[#181818] transition-colors cursor-pointer">Subscribe</button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs grid grid-cols-2 text-center text-sm font-bold text-[#71767b]">
        <div class="tab cursor-pointer hover:bg-[#181818] transition-colors flex justify-center py-3.5 relative text-white">
          <span>For you</span>
          <div class="absolute bottom-0 h-1 w-14 bg-[#1d9bf0] rounded-full"></div>
        </div>
        <div class="tab cursor-pointer hover:bg-[#181818] transition-colors flex justify-center py-3.5 relative">
          <span>Following</span>
        </div>
      </div>
    </div>

    <!-- Create Post Section -->
    <div class="postbox w-full border-b border-[#313233ad] p-4 flex gap-3">
      <img class="size-10 rounded-full object-cover border border-[#313233ad]" src="/assets/user/headShot.jpg" alt="User" />
      <div class="flex-1">
        <textarea id="create-post-textarea" placeholder="What is happening?!" class="w-full bg-transparent text-white placeholder-[#71767b] text-lg focus:outline-none resize-none overflow-hidden pr-2" rows="2"></textarea>
        <div id="media-preview-container" class="hidden mb-3 relative rounded-2xl overflow-hidden border border-[#313233ad] max-h-80 bg-black/40">
          <button id="remove-media-btn" class="absolute top-3 left-3 size-8 bg-black/75 hover:bg-black text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg z-10">✕</button>
          <div id="media-preview-content" class="w-full flex justify-center"></div>
        </div>
        <div class="flex items-center justify-between border-t border-[#313233ad]/60 pt-3 mt-1">
          <div class="flex items-center gap-1 sm:gap-3 text-[#1d9bf0]">
            <label for="post-media-input" class="p-2 hover:bg-[#1d9bf0]/10 rounded-full cursor-pointer transition-colors" title="Media">
              <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"/></svg>
            </label>
            <input type="file" id="post-media-input" accept="image/*,video/*" class="hidden" />
          </div>
          <button id="submit-post-btn" class="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-full text-sm transition-all cursor-pointer shadow-md">Post</button>
        </div>
      </div>
    </div>

    <!-- Posts Feed Container -->
    <div class="posts divide-y divide-[#313233ad]/40"></div>
  `;

  initFeed();
  // Re-bind top tabs and post creator module
  initHeaderTabs();
  // Re-import dynamic create post logic if needed or trigger event
  window.dispatchEvent(new Event("x:restore-home"));
}

/**
 * Render Follow & Discover Creators Screen (`Follow` pill)
 */
function renderFollowDiscoverScreen(mainContainer) {
  const creators = [
    { handle: "@GrokAI", name: "Grok AI Engine [AI Controlled]", bio: "Real-time AI neural reasoning and coding assistant powered by Gemini. Controlled autonomously by agent.", followers: "42.8M", avatar: "/assets/user/headShot.jpg", verified: true },
    { handle: "@Cristiano", name: "Cristiano Ronaldo [Human Controlled]", bio: "Football player & athlete. Al Nassr FC. Controlled by human user.", followers: "112.4M", avatar: "/assets/user/Cristiano-Ronaldo.jpg", verified: true },
    { handle: "@ElonMusk", name: "Elon Musk [Human Controlled]", bio: "Accelerating sustainable energy & AI. X Corp, Tesla, SpaceX.", followers: "198.2M", avatar: "/assets/user/headShot.jpg", verified: true },
    { handle: "@GeminiLive", name: "Gemini DeepMind [AI Controlled]", bio: "Multimodal AI breakthroughs, reasoning engines, and autonomous multi-agent systems.", followers: "28.5M", avatar: "/assets/user/headShotio.jpg", verified: true },
    { handle: "@AkshayKumar", name: "Akshay Kumar [Human Controlled]", bio: "Indian actor & film producer. Entertaining audiences globally.", followers: "68.9M", avatar: "/assets/user/akshay_kumar.jpg", verified: true },
    { handle: "@TechPulseAI", name: "TechPulse Autonomous AI [AI Controlled]", bio: "Real-time daily tech digest and Silicon Valley intelligence tracker.", followers: "14.5M", avatar: "/assets/user/virat.jpg", verified: true }
  ];

  mainContainer.innerHTML = `
    <div class="sticky top-0 z-10 w-full bg-[#000000dd] backdrop-blur-md px-4 py-3 border-b border-[#313233ad]">
      <h1 class="text-xl font-extrabold text-white">Connect & Follow</h1>
      <p class="text-xs text-[#71767b]">Suggested accounts, top creators, and topics for your timeline</p>
    </div>
    <div class="divide-y divide-[#313233ad]/40">
      ${creators.map(c => `
        <div class="p-4 flex items-start justify-between gap-3 hover:bg-[#080808] transition-colors">
          <div class="flex items-start gap-3 min-w-0">
            <img src="${c.avatar}" class="size-12 rounded-full object-cover border border-[#313233ad] shrink-0" alt="${c.name}" />
            <div class="min-w-0">
              <div class="flex items-center gap-1 font-bold text-white text-sm truncate">${c.name} ${c.verified ? '<img class="size-4" src="/assets/svg/lock.svg" />' : ''}</div>
              <div class="text-xs text-[#71767b] mb-1.5">${c.handle} · ${c.followers} followers</div>
              <p class="text-xs text-[#e7e9ea] leading-relaxed line-clamp-2">${c.bio}</p>
            </div>
          </div>
          <button class="follow-screen-btn bg-white hover:bg-[#eff3f4] text-black font-bold px-4 py-1.5 rounded-full text-xs transition-colors shrink-0 cursor-pointer shadow-md" data-handle="${c.handle}">Follow</button>
        </div>
      `).join('')}
    </div>
  `;

  mainContainer.querySelectorAll(".follow-screen-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!getToken()) {
        showAuthModal("login", true);
        return;
      }
      const isFollowing = btn.textContent === "Following";
      if (isFollowing) {
        btn.textContent = "Follow";
        btn.className = "follow-screen-btn bg-white hover:bg-[#eff3f4] text-black font-bold px-4 py-1.5 rounded-full text-xs transition-colors shrink-0 cursor-pointer shadow-md";
        showToast(`Unfollowed ${btn.dataset.handle}`);
      } else {
        btn.textContent = "Following";
        btn.className = "follow-screen-btn border border-[#536471] bg-transparent text-white font-bold px-4 py-1.5 rounded-full text-xs transition-colors shrink-0 cursor-pointer hover:border-red-500 hover:text-red-500";
        showToast(`Followed ${btn.dataset.handle}`);
      }
      try {
        await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(btn.dataset.handle)}/follow`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${getToken()}` }
        });
      } catch (err) {
        console.warn("Follow screen API sync error:", err);
      }
    });
  });
}

/**
 * Render Direct Messages (`Chat` pill)
 */
function renderChatMessagesScreen(mainContainer) {
  const chats = [
    { handle: "@GrokAI", name: "Grok AI Engine [AI Controlled]", lastMsg: "⚡ Mention me anytime in posts for real-time code and neural completion!", time: "1m ago", avatar: "/assets/user/headShot.jpg", unread: true },
    { handle: "@vps", name: "Veer Pratap Saw [Human Controlled]", lastMsg: "Hey! Just deployed our Grok AI and full-stack engine 🚀", time: "2m ago", avatar: "/assets/user/headShot.jpg", unread: true },
    { handle: "@Cristiano", name: "Cristiano Ronaldo [Human Controlled]", lastMsg: "SIUUU! Great updates on the feed aesthetics today.", time: "1h ago", avatar: "/assets/user/Cristiano-Ronaldo.jpg", unread: false },
    { handle: "@GeminiLive", name: "Gemini DeepMind [AI Controlled]", lastMsg: "Multimodal video analysis model checkpoint ready for testing.", time: "3h ago", avatar: "/assets/user/headShotio.jpg", unread: false }
  ];

  mainContainer.innerHTML = `
    <div class="sticky top-0 z-10 w-full bg-[#000000dd] backdrop-blur-md px-4 py-3 border-b border-[#313233ad] flex items-center justify-between">
      <div>
        <h1 class="text-xl font-extrabold text-white">Messages</h1>
        <p class="text-xs text-[#71767b]">Real-time direct messaging and private conversations</p>
      </div>
      <button class="p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer" title="New Message">
        <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
      <div class="md:col-span-5 border-b md:border-b-0 md:border-r border-[#313233ad] divide-y divide-[#313233ad]/40">
        ${chats.map((c, idx) => `
          <div class="chat-thread-item p-4 flex items-center gap-3 ${idx === 0 ? 'bg-[#16181c]' : 'hover:bg-[#080808]'} transition-colors cursor-pointer">
            <div class="relative shrink-0">
              <img src="${c.avatar}" class="size-11 rounded-full object-cover border border-[#313233ad]" />
              ${c.unread ? '<span class="absolute top-0 right-0 size-3 bg-[#1d9bf0] rounded-full border-2 border-black"></span>' : ''}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between text-xs mb-0.5">
                <span class="font-bold text-white truncate">${c.name}</span>
                <span class="text-[#71767b] shrink-0">${c.time}</span>
              </div>
              <p class="text-xs ${c.unread ? 'text-white font-medium' : 'text-[#71767b]'} truncate">${c.lastMsg}</p>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="md:col-span-7 flex flex-col justify-between p-4 min-h-[400px] bg-[#050505]">
        <!-- Active Conversation Header -->
        <div class="flex items-center gap-3 border-b border-[#313233ad]/50 pb-3 mb-4">
          <img src="/assets/user/headShot.jpg" class="size-9 rounded-full object-cover border border-[#313233ad]" />
          <div>
            <div class="font-bold text-white text-sm">Veer Pratap Saw</div>
            <div class="text-[11px] text-[#1d9bf0]">Online</div>
          </div>
        </div>
        <!-- Messages -->
        <div class="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[340px] pr-1" id="chat-messages-box">
          <div class="flex items-start gap-2.5">
            <img src="/assets/user/headShot.jpg" class="size-7 rounded-full shrink-0" />
            <div class="bg-[#16181c] border border-[#313233ad] text-white px-3.5 py-2 rounded-2xl rounded-tl-sm text-xs max-w-[80%]">
              Hey! Just deployed our Grok AI and full-stack engine 🚀
            </div>
          </div>
        </div>
        <!-- Input -->
        <div class="mt-4 flex gap-2">
          <input type="text" id="chat-input-msg" placeholder="Start a new message..." class="flex-1 bg-[#16181c] border border-[#313233ad] focus:border-[#1d9bf0] text-white px-4 py-2.5 rounded-full text-xs focus:outline-none" />
          <button id="chat-send-btn" class="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-5 py-2 rounded-full text-xs cursor-pointer shadow-md">Send</button>
        </div>
      </div>
    </div>
  `;

  const sendBtn = mainContainer.querySelector("#chat-send-btn");
  const inputEl = mainContainer.querySelector("#chat-input-msg");
  const box = mainContainer.querySelector("#chat-messages-box");

  const sendDirectMsg = () => {
    const txt = inputEl.value.trim();
    if (!txt) return;
    box.insertAdjacentHTML("beforeend", `
      <div class="flex justify-end animate-fade-in">
        <div class="bg-[#1d9bf0] text-white px-3.5 py-2 rounded-2xl rounded-br-sm text-xs max-w-[80%] shadow-md font-medium">${txt}</div>
      </div>
    `);
    inputEl.value = "";
    box.scrollTop = box.scrollHeight;
  };

  sendBtn?.addEventListener("click", sendDirectMsg);
  inputEl?.addEventListener("keydown", (e) => { if (e.key === "Enter") sendDirectMsg(); });
}

/**
 * Render Creator Studio (`Creator Studio` pill)
 */
async function renderCreatorStudioScreen(mainContainer) {
  const currentUser = getCurrentUser();
  if (!currentUser || !getToken()) {
    showAuthModal("login", true);
    return;
  }

  mainContainer.innerHTML = `<div class="p-12 text-center text-[#71767b] text-sm animate-pulse">Loading Creator Studio & Analytics...</div>`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/users/profile/${encodeURIComponent(currentUser.handle || "@user")}`);
    const data = await res.json();
    const posts = data.posts || [];

    const totalPosts = posts.length;
    let totalLikes = 0;
    let totalReplies = 0;
    let totalViews = 0;

    posts.forEach(p => {
      totalLikes += (p.likes?.length || 0);
      totalReplies += (p.repliesCount || p.replies?.length || 0);
      totalViews += (p.views || ((p.likes?.length || 0) * 320 + 1420));
    });

    const displayImpressions = totalViews + (totalPosts * 4200) + 124852;
    const displayLikes = totalLikes + 84;
    const engagementRate = ((displayLikes + totalReplies) / Math.max(1, totalPosts * 120 + 1200) * 100).toFixed(1);
    const followersCount = data.followersCount ?? (currentUser.followers || []).length;
    const estRevenue = ((displayImpressions * 0.00114) + (displayLikes * 0.08)).toFixed(2);

    const topTweets = [...posts].sort((a, b) => {
      const scoreA = (a.likes?.length || 0) * 10 + (a.views || 0);
      const scoreB = (b.likes?.length || 0) * 10 + (b.views || 0);
      return scoreB - scoreA;
    }).slice(0, 5);

    mainContainer.innerHTML = `
      <div class="sticky top-0 z-10 w-full bg-[#000000dd] backdrop-blur-md px-4 py-3 border-b border-[#313233ad] flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold text-white">Creator Studio & Analytics</h1>
          <p class="text-xs text-[#71767b]">Monitor real-time tweet performance, impressions, and monetization metrics</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button id="studio-export-btn" class="border border-[#536471] hover:bg-white/10 text-white font-bold px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-colors cursor-pointer" title="Download Report">
            <svg class="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Export CSV
          </button>
          <button id="studio-payout-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-full text-xs transition-colors cursor-pointer shadow-md">
            Request $${estRevenue} Payout
          </button>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-[#16181c] border border-[#313233ad] p-4 rounded-2xl relative overflow-hidden group hover:border-[#1d9bf0] transition-colors">
            <div class="text-xs font-bold text-[#71767b] mb-1">Total Impressions</div>
            <div class="text-2xl font-black text-white">${displayImpressions.toLocaleString()}</div>
            <div class="text-[11px] text-emerald-400 mt-1">↑ +24.8% vs last month</div>
          </div>
          <div class="bg-[#16181c] border border-[#313233ad] p-4 rounded-2xl relative overflow-hidden group hover:border-[#1d9bf0] transition-colors">
            <div class="text-xs font-bold text-[#71767b] mb-1">Engagement Rate</div>
            <div class="text-2xl font-black text-[#1d9bf0]">${engagementRate}%</div>
            <div class="text-[11px] text-emerald-400 mt-1">↑ +1.2% above industry avg</div>
          </div>
          <div class="bg-[#16181c] border border-[#313233ad] p-4 rounded-2xl relative overflow-hidden group hover:border-[#1d9bf0] transition-colors">
            <div class="text-xs font-bold text-[#71767b] mb-1">Total Followers</div>
            <div class="text-2xl font-black text-white">${followersCount.toLocaleString()}</div>
            <div class="text-[11px] text-emerald-400 mt-1">↑ Real-time tracked</div>
          </div>
          <div class="bg-[#16181c] border border-[#313233ad] p-4 rounded-2xl relative overflow-hidden group hover:border-[#1d9bf0] transition-colors">
            <div class="text-xs font-bold text-[#71767b] mb-1">Est. Revenue</div>
            <div class="text-2xl font-black text-amber-400">$${estRevenue}</div>
            <div class="text-[11px] text-[#71767b] mt-1">Next payout: Aug 1</div>
          </div>
        </div>

        <!-- Analytics Overview & Controls -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="md:col-span-2 bg-[#16181c] border border-[#313233ad] rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-white text-sm flex items-center gap-2">
                <span>🔥 Top Performing Tweets</span>
                <span class="text-xs text-[#71767b] font-normal">(${topTweets.length} shown)</span>
              </h3>
              <span class="text-[11px] bg-[#1d9bf0]/10 text-[#1d9bf0] px-2.5 py-1 rounded-full font-bold">Real-time DB ranking</span>
            </div>

            <div class="divide-y divide-[#313233ad]/40 text-xs">
              ${topTweets.length === 0 ? `
                <div class="py-8 text-center text-[#71767b]">
                  You haven't posted any tweets yet. Start posting from Home to see real-time engagement!
                </div>
              ` : topTweets.map(t => {
                const views = t.views || ((t.likes?.length || 0) * 320 + 4200);
                return `
                  <div class="py-3.5 flex justify-between items-center gap-4 hover:bg-white/[0.03] px-2 rounded-xl transition-colors cursor-pointer studio-tweet-row" data-id="${t._id || t.id}">
                    <div class="flex-1 min-w-0">
                      <p class="text-white font-medium truncate">${t.text || "Media post"}</p>
                      <div class="flex items-center gap-3 mt-1 text-[11px] text-[#71767b]">
                        <span>❤️ ${t.likes?.length || 0} Likes</span>
                        <span>💬 ${t.repliesCount || t.replies?.length || 0} Replies</span>
                        <span>🔁 ${t.repostsCount || 0} Reposts</span>
                      </div>
                    </div>
                    <span class="text-[#1d9bf0] font-bold shrink-0">${views.toLocaleString()} impressions</span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Quick Creator Actions / Tips -->
          <div class="bg-[#16181c] border border-[#313233ad] rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-white text-sm mb-3">Audience Growth Insights</h3>
              <div class="space-y-3 text-xs text-[#e7e9ea] leading-relaxed">
                <div class="p-3 rounded-xl bg-white/[0.03] border border-[#313233ad]/60">
                  <span class="text-[#ffad1f] font-bold">💡 Tip 1:</span> Posting photos & videos increases total reach and impressions by up to 2.4x.
                </div>
                <div class="p-3 rounded-xl bg-white/[0.03] border border-[#313233ad]/60">
                  <span class="text-[#1d9bf0] font-bold">🤖 Grok AI Advantage:</span> Use Grok AI in the sidebar to generate high-converting hooks and viral tweet threads in seconds!
                </div>
                <div class="p-3 rounded-xl bg-white/[0.03] border border-[#313233ad]/60">
                  <span class="text-emerald-400 font-bold">💰 Creator Payouts:</span> Payouts trigger automatically once your estimated revenue crosses the $50 threshold.
                </div>
              </div>
            </div>
            
            <button id="studio-grok-shortcut" class="mt-4 w-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-2.5 rounded-full text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg">
              Launch Grok AI Studio
            </button>
          </div>
        </div>
      </div>
    `;

    mainContainer.querySelector("#studio-export-btn")?.addEventListener("click", () => {
      let csvContent = "data:text/csv;charset=utf-8,Tweet Text,Likes,Replies,Views\n";
      topTweets.forEach(t => {
        const cleanText = (t.text || "Media").replace(/,/g, " ");
        csvContent += `"${cleanText}",${t.likes?.length || 0},${t.repliesCount || 0},${t.views || ((t.likes?.length || 0) * 320 + 4200)}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `X_Analytics_${currentUser.handle || 'Report'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("📈 CSV Analytics Report downloaded successfully!");
    });

    mainContainer.querySelector("#studio-payout-btn")?.addEventListener("click", () => {
      showToast(`🎉 Payout request submitted for $${estRevenue}! Expected transfer by Aug 1.`);
    });

    mainContainer.querySelector("#studio-grok-shortcut")?.addEventListener("click", () => {
      const grokPill = Array.from(document.querySelectorAll(".left ul li, .nav li")).find(li => li.textContent.includes("Grok"));
      if (grokPill) grokPill.click();
    });

  } catch (err) {
    console.error("Creator studio load error:", err);
    mainContainer.innerHTML = `<div class="p-8 text-center text-red-400 text-sm">Failed to load real-time analytics data</div>`;
  }
}

/**
 * Render Bookmarks Screen (`Bookmarks` pill)
 */
async function renderBookmarksScreen(mainContainer) {
  if (!getToken()) {
    showAuthModal("login", true);
    return;
  }

  mainContainer.innerHTML = `<div class="p-12 text-center text-[#71767b] text-sm animate-pulse">Loading Bookmarks...</div>`;
  try {
    const res = await fetch(`${API_BASE_URL}/api/posts/user/bookmarks`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    });
    const posts = await res.json();

    mainContainer.innerHTML = "";
    const header = document.createElement("div");
    header.className = "sticky top-0 z-10 w-full bg-[#000000dd] backdrop-blur-md px-4 py-3 border-b border-[#313233ad] flex items-center justify-between";
    header.innerHTML = `<div><h1 class="text-xl font-extrabold text-white">Bookmarks</h1><p class="text-xs text-[#71767b]">${posts.length || 0} saved posts</p></div>`;
    mainContainer.appendChild(header);

    if (!posts || posts.length === 0) {
      mainContainer.innerHTML += `
        <div class="p-12 text-center">
          <h3 class="text-xl font-bold text-white mb-2">Save posts for later</h3>
          <p class="text-sm text-[#71767b] max-w-sm mx-auto leading-relaxed">Don't let the good ones fly away! Bookmark posts to easily find them again right here.</p>
        </div>
      `;
      return;
    }

    const listDiv = document.createElement("div");
    listDiv.className = "divide-y divide-[#313233ad]/40";
    posts.forEach(post => {
      const card = renderPostCard(post);
      listDiv.appendChild(card);
    });
    mainContainer.appendChild(listDiv);
    initXVideoPlayers();
  } catch (err) {
    console.warn("Bookmarks load error:", err);
    mainContainer.innerHTML = `<div class="p-8 text-center text-red-400 text-sm">Failed to load bookmarks</div>`;
  }
}

/**
 * Render Notifications Screen (`Notifications` pill)
 */
function renderNotificationsScreen(mainContainer) {
  mainContainer.innerHTML = `
    <div class="sticky top-0 z-10 w-full bg-[#000000dd] backdrop-blur-md px-4 py-3 border-b border-[#313233ad]">
      <h1 class="text-xl font-extrabold text-white">Notifications</h1>
      <p class="text-xs text-[#71767b]">Recent activity, likes, replies, and mentions</p>
    </div>
    <div class="divide-y divide-[#313233ad]/40">
      <div class="p-4 px-6 flex items-start gap-4 hover:bg-[#080808] transition-colors cursor-pointer">
        <div class="p-2 bg-[#f91880]/20 rounded-full text-[#f91880] shrink-0"><svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg></div>
        <div>
          <div class="flex items-center gap-2 mb-1"><img class="size-8 rounded-full object-cover border border-[#313233ad]" src="/assets/user/Cristiano-Ronaldo.jpg" alt="Ronaldo" /><span class="font-bold text-white text-sm">Cristiano Ronaldo</span> <span class="text-[#71767b] text-xs">liked your post</span></div>
          <div class="text-xs text-[#71767b] line-clamp-2">"Introducing our new Gemini-powered Grok integration built inside X..."</div>
        </div>
      </div>
      <div class="p-4 px-6 flex items-start gap-4 hover:bg-[#080808] transition-colors cursor-pointer">
        <div class="p-2 bg-[#1d9bf0]/20 rounded-full text-[#1d9bf0] shrink-0"><svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></div>
        <div>
          <div class="flex items-center gap-2 mb-1"><img class="size-8 rounded-full object-cover border border-[#313233ad]" src="/assets/user/akshay_kumar.jpg" alt="Akshay" /><span class="font-bold text-white text-sm">Akshay Kumar</span> <span class="text-[#71767b] text-xs">followed you</span></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Show Premium Modal (`Premium` pill)
 */
export function showPremiumModal() {
  document.querySelectorAll(".x-premium-modal").forEach(el => el.remove());
  const modal = document.createElement("div");
  modal.className = "x-premium-modal fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeInPop_0.2s_ease-out]";
  modal.innerHTML = `
    <div class="bg-[#000000] border border-[#313233ad] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-center">
      <button class="close-premium absolute top-5 left-5 p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer"><svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg></button>
      <div class="size-16 rounded-2xl bg-gradient-to-tr from-[#1d9bf0] to-black border border-white/20 mx-auto flex items-center justify-center shadow-2xl mb-4"><img src="/assets/svg/premium.svg" class="size-9 invert" /></div>
      <h2 class="text-2xl font-black text-white mb-2">Upgrade to X Premium</h2>
      <p class="text-xs text-[#71767b] mb-6 max-w-md mx-auto">Get the verified blue checkmark, prioritized replies, AI access with Grok, and zero ads.</p>
      <div class="grid grid-cols-3 gap-3 mb-6 text-left">
        <div class="p-4 bg-[#16181c] border border-[#313233ad] rounded-2xl flex flex-col justify-between"><div><div class="text-xs font-bold text-white">Basic</div><div class="text-lg font-black text-[#1d9bf0]">$3<span class="text-[10px] text-[#71767b]">/mo</span></div></div><button class="mt-3 w-full bg-white/10 hover:bg-white/20 text-white font-bold py-1.5 rounded-full text-[11px]">Select</button></div>
        <div class="p-4 bg-[#1d9bf0]/15 border-2 border-[#1d9bf0] rounded-2xl flex flex-col justify-between relative"><span class="absolute -top-2.5 right-3 bg-[#1d9bf0] text-black font-black text-[9px] px-2 py-0.5 rounded-full uppercase">Popular</span><div><div class="text-xs font-bold text-white">Premium</div><div class="text-lg font-black text-[#1d9bf0]">$8<span class="text-[10px] text-[#71767b]">/mo</span></div></div><button class="mt-3 w-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-1.5 rounded-full text-[11px]">Select</button></div>
        <div class="p-4 bg-[#16181c] border border-[#313233ad] rounded-2xl flex flex-col justify-between"><div><div class="text-xs font-bold text-white">Premium+</div><div class="text-lg font-black text-[#1d9bf0]">$16<span class="text-[10px] text-[#71767b]">/mo</span></div></div><button class="mt-3 w-full bg-white/10 hover:bg-white/20 text-white font-bold py-1.5 rounded-full text-[11px]">Select</button></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".close-premium").addEventListener("click", () => modal.remove());
}

/**
 * Show More Menu Popover (`More` pill) anchored to left sidebar
 */
function showMoreMenuPopover(anchorItem) {
  document.querySelectorAll(".x-more-popover").forEach(el => el.remove());
  const popover = document.createElement("div");
  popover.className = "x-more-popover fixed w-60 bg-[#000000] border border-[#313233ad] rounded-2xl shadow-2xl z-[500] overflow-hidden animate-[fadeInPop_0.15s_ease-out] divide-y divide-[#313233ad]/40 text-sm font-bold text-white";
  
  if (anchorItem && anchorItem.getBoundingClientRect) {
    const rect = anchorItem.getBoundingClientRect();
    popover.style.left = `${Math.max(12, rect.left)}px`;
    popover.style.bottom = `${window.innerHeight - rect.top + 10}px`;
  } else {
    popover.style.left = "16px";
    popover.style.bottom = "80px";
  }

  popover.innerHTML = `
    <div class="p-3.5 px-4 hover:bg-[#181818] cursor-pointer flex items-center gap-3 transition-colors">⚙️ Settings and privacy</div>
    <div class="p-3.5 px-4 hover:bg-[#181818] cursor-pointer flex items-center gap-3 transition-colors">💸 Monetization</div>
    <div class="p-3.5 px-4 hover:bg-[#181818] cursor-pointer flex items-center gap-3 transition-colors">❓ Help Center</div>
    <div class="p-3.5 px-4 hover:bg-[#181818] cursor-pointer flex items-center gap-3 transition-colors">🌙 Display & Dark mode</div>
  `;
  document.body.appendChild(popover);

  popover.querySelectorAll("div").forEach(item => {
    item.addEventListener("click", () => {
      showToast(`${item.textContent.trim()} selected`);
      popover.remove();
    });
  });

  const close = (e) => {
    if (!popover.contains(e.target) && (!anchorItem || !anchorItem.contains(e.target))) {
      popover.remove();
      window.removeEventListener("click", close);
    }
  };
  setTimeout(() => window.addEventListener("click", close), 10);
}

/**
 * Main initializer for all interactive Phase 2 buttons & navigation
 */
export function initInteractiveFeatures() {
  initWhoToFollow();
  initSearchBar();
  initHeaderTabs();
  initSidebarNav();
}
