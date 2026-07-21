import { getToken, getCurrentUser, showAuthModal } from "./auth.js";
import { API_BASE_URL } from "../config.js";
import { renderPostCard, initFeed } from "./feedRenderer.js";
import { initXVideoPlayers } from "./videoPlayer.js";
import { initialPosts } from "./feedData.js";

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

export function getPersistedUserFollowing() {
  const user = getCurrentUser();
  const userKey = "x_user_following_" + (user?.handle || "@default").toLowerCase();
  try {
    if (user && Array.isArray(user.following) && user.following.length > 0) {
      return user.following.map(h => h.toLowerCase());
    }
    const data = localStorage.getItem(userKey) || localStorage.getItem("x_user_following");
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed.map(h => h.toLowerCase());
    }
  } catch (e) {}
  const defaults = ["@cristiano", "@akshaykumar", "@akshay"];
  try { localStorage.setItem(userKey, JSON.stringify(defaults)); } catch (e) {}
  return defaults;
}

export function syncAllFollowButtons(handle, isFollowing) {
  if (!handle || typeof document === "undefined") return;
  const norm = handle.toLowerCase();
  const allBtns = document.querySelectorAll(`[data-handle]`);
  allBtns.forEach(btn => {
    const btnHandle = (btn.dataset.handle || "").toLowerCase();
    if (btnHandle === norm || (btnHandle === "@akshay" && norm === "@akshaykumar") || (btnHandle === "@akshaykumar" && norm === "@akshay")) {
      if (btn.classList.contains("post-inline-follow-btn") || btn.classList.contains("inline-follow-toggle-btn")) {
        if (isFollowing) {
          btn.textContent = "Following";
          btn.className = "post-inline-follow-btn border border-[#536471] text-white bg-transparent font-bold rounded-full text-[11px] px-2.5 py-0.5 transition-colors shrink-0 ml-2";
          btn.dataset.following = "true";
        } else {
          btn.textContent = "Follow";
          btn.className = "post-inline-follow-btn border-0 text-black bg-white font-bold rounded-full text-[11px] px-2.5 py-0.5 transition-colors shrink-0 ml-2 hover:bg-[#eff3f4]";
          btn.dataset.following = "false";
        }
      } else if (btn.classList.contains("btn")) {
        if (isFollowing) {
          btn.textContent = "Following";
          btn.className = "btn shrink-0 border border-[#536471] text-white bg-transparent font-bold rounded-full h-8 px-4 flex items-center justify-center text-xs transition-all duration-200 cursor-pointer hover:border-red-600 hover:text-red-600 hover:bg-red-500/10";
          btn.dataset.following = "true";
        } else {
          btn.textContent = "Follow";
          btn.className = "btn shrink-0 border-0 text-black bg-white font-bold rounded-full h-8 px-4 flex items-center justify-center text-xs hover:bg-[#eff3f4] transition-colors cursor-pointer";
          btn.dataset.following = "false";
        }
      }
    }
  });
}

if (typeof window !== "undefined" && !window._hasFollowBtnDelegate) {
  window._hasFollowBtnDelegate = true;
  document.addEventListener("click", async (e) => {
    const followBtn = e.target.closest(".post-inline-follow-btn, .inline-follow-toggle-btn");
    if (!followBtn) return;
    e.stopPropagation();
    const handle = followBtn.dataset.handle;
    if (!handle) return;

    const isFollowing = followBtn.dataset.following === "true" || followBtn.textContent.trim() === "Following";
    const newState = !isFollowing;

    updatePersistedUserFollowing(handle, newState);

    const currentUser = getCurrentUser();
    if (currentUser && getToken()) {
      try {
        await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(handle)}/follow`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${getToken()}` }
        });
      } catch (err) {}
    }

    showToast(newState ? `Followed ${handle}` : `Unfollowed ${handle}`);
  });
}

export function updatePersistedUserFollowing(handle, isFollowing) {
  if (!handle) return [];
  const list = new Set(getPersistedUserFollowing());
  const norm = handle.toLowerCase();
  if (isFollowing) {
    list.add(norm);
    if (norm === "@akshay") list.add("@akshaykumar");
    if (norm === "@akshaykumar") list.add("@akshay");
  } else {
    list.delete(norm);
    if (norm === "@akshay") list.delete("@akshaykumar");
    if (norm === "@akshaykumar") list.delete("@akshay");
  }
  const arr = Array.from(list);
  const user = getCurrentUser();
  const userKey = "x_user_following_" + (user?.handle || "@default").toLowerCase();
  try { localStorage.setItem(userKey, JSON.stringify(arr)); } catch (e) {}
  try { localStorage.setItem("x_user_following", JSON.stringify(arr)); } catch (e) {}
  try {
    if (user) {
      user.following = arr;
      setAuthData(getToken(), user);
    }
  } catch (e) {}
  syncAllFollowButtons(handle, isFollowing);
  return arr;
}

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
  let userFollowing = getPersistedUserFollowing();
  const currentUser = getCurrentUser();
  if (currentUser && getToken()) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile/${encodeURIComponent(currentUser.handle || "@user")}`);
      const data = await res.json();
      if (data && data.user && data.user.following) {
        userFollowing = data.user.following.map(h => h.toLowerCase());
        try { localStorage.setItem("x_user_following", JSON.stringify(userFollowing)); } catch (e) {}
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

    if (userFollowing.includes(handle.toLowerCase()) || (handle.toLowerCase() === "@akshay" && userFollowing.includes("@akshaykumar")) || (handle.toLowerCase() === "@akshaykumar" && userFollowing.includes("@akshay"))) {
      setButtonFollowingState(btn, true);
    } else {
      setButtonFollowingState(btn, false);
    }

    btn.addEventListener("click", async (e) => {
      e.stopPropagation();

      const isFollowing = btn.dataset.following === "true";
      const newFollowingState = !isFollowing;

      setButtonFollowingState(btn, newFollowingState);
      updatePersistedUserFollowing(handle, newFollowingState);
      showToast(newFollowingState ? `Followed ${handle}` : `Unfollowed ${handle}`);

      const activeTabSpan = document.querySelector('.top .tab.text-white span');
      if (activeTabSpan && activeTabSpan.textContent.trim() === "Following") {
        const followingTabEl = activeTabSpan.closest('.tab');
        if (followingTabEl) followingTabEl.click();
      }

      if (getToken()) {
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
            updatePersistedUserFollowing(handle, data.following);
          }
        } catch (err) {
          console.warn("Follow sync error:", err);
        }
      }
    });
  });
}

/**
 * Initializes Search Bar live filtering and backend query
 */
export function initSearchBar() {
  if (document.body.dataset.searchBarWired === "true") return;
  document.body.dataset.searchBarWired = "true";

  // When clicking, focusing, or typing inside the right column search bar, directly redirect to Explore section search bar!
  const redirectRightSearchToExplore = (e) => {
    const rightInput = e.target.closest(".right input[type='text'], #desktop-right-search-input");
    const rightContainer = e.target.closest(".right .sticky, .right-search-container");
    if (!rightInput && !rightContainer) return;

    // Remove any old popup
    document.getElementById("x-pc-search-popup")?.remove();
    document.getElementById("x-mobile-search-screen")?.remove();

    // Get any text already typed
    const inp = rightInput || rightContainer?.querySelector("input[type='text']");
    const q = inp ? inp.value.trim() : "";
    if (inp) {
      inp.value = "";
      inp.blur();
    }

    const mainContainer = document.querySelector(".main");
    if (mainContainer) {
      mainContainer.style.maxWidth = "";
      renderExploreScreen(mainContainer, q);
      // Highlight Explore pill in navigation
      document.querySelectorAll(".left ul li, nav[class*='fixed'] [data-label]").forEach(i => {
        i.classList.remove("bg-[#1d1d1d]", "font-bold", "text-[#1d9bf0]");
        const label = i.dataset.label || i.querySelector("span")?.textContent?.trim() || "";
        if (label === "Explore") {
          i.classList.add("font-bold");
          if (i.closest("nav[class*='fixed']")) i.classList.add("text-[#1d9bf0]");
        }
      });
    }
  };

  document.body.addEventListener("focusin", (e) => {
    if (e.target.closest(".right input[type='text'], #desktop-right-search-input")) {
      redirectRightSearchToExplore(e);
    }
  });
  document.body.addEventListener("click", (e) => {
    if (e.target.closest(".right input[type='text'], #desktop-right-search-input, .right-search-container")) {
      redirectRightSearchToExplore(e);
    }
  });
  document.body.addEventListener("input", (e) => {
    if (e.target.closest(".right input[type='text'], #desktop-right-search-input")) {
      redirectRightSearchToExplore(e);
    }
  });
}

/**
 * Initializes Center Header Tabs ("For you", "Following", category tabs)
 */
export function initHeaderTabs() {
  const postsContainer = document.querySelector(".posts");
  const tabs = document.querySelectorAll(".top .tab");
  if (!postsContainer || !tabs.length) return;

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
        postsContainer.innerHTML = `<div class="p-12 text-center text-[#71767b] text-sm animate-pulse">Loading following feed...</div>`;
        const followingHandles = getPersistedUserFollowing();
        let postsToRender = [];
        try {
          if (getToken()) {
            const res = await fetch(`${API_BASE_URL}/api/posts/feed/following`, {
              headers: { "Authorization": `Bearer ${getToken()}` }
            });
            if (res.ok) {
              const backendFollowing = await res.json();
              if (Array.isArray(backendFollowing) && backendFollowing.length > 0) {
                postsToRender = backendFollowing;
              }
            }
          }
        } catch (err) {
          console.warn("Backend following feed offline, using local filter");
        }

        if (postsToRender.length === 0) {
          let allPosts = [...initialPosts];
          try {
            const resAll = await fetch(`${API_BASE_URL}/api/posts`);
            if (resAll.ok) {
              const backendPosts = await resAll.json();
              if (Array.isArray(backendPosts)) {
                const ids = new Set(backendPosts.map(p => (p._id || p.id)?.toString()));
                allPosts = [...backendPosts, ...initialPosts.filter(p => !ids.has(p.id?.toString()))];
              }
            }
          } catch (e) {}

          postsToRender = allPosts.filter(post => {
            const h = (post.handle || "").toLowerCase();
            return followingHandles.some(fh => {
              const fLow = fh.toLowerCase();
              if (fLow === h) return true;
              if (fLow === "@akshay" && h === "@akshaykumar") return true;
              if (fLow === "@akshaykumar" && h === "@akshay") return true;
              return false;
            });
          });
        }

        postsContainer.innerHTML = "";

        // Show who we have followed summary
        const followedSummary = document.createElement("div");
        followedSummary.className = "p-4 border-b border-[#313233ad] bg-[#0c0d0f]";
        if (followingHandles.length === 0) {
          followedSummary.innerHTML = `
            <div class="text-center py-6">
              <h3 class="text-lg font-bold text-white mb-1">Welcome to your Following feed!</h3>
              <p class="text-sm text-[#71767b] max-w-sm mx-auto leading-relaxed">You aren't following anyone yet. Follow accounts right from their posts or from 'Who to follow' to see their live updates and manage them right here.</p>
            </div>
          `;
          postsContainer.appendChild(followedSummary);
        } else {
          let summaryHtml = `
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>People You Follow</span>
                <span class="bg-[#1d9bf0]/20 text-[#1d9bf0] text-xs px-2 py-0.5 rounded-full font-extrabold">${followingHandles.length}</span>
              </h3>
            </div>
            <div class="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          `;
          followingHandles.forEach(h => {
            summaryHtml += `
              <div class="flex flex-col items-center shrink-0 bg-black border border-[#313233ad] rounded-2xl p-2.5 min-w-[110px] max-w-[130px]">
                <img class="size-10 rounded-full object-cover border border-[#313233ad] mb-1.5" src="/assets/user/headShot.jpg" onerror="this.src='/assets/user/headShot.jpg'" alt="${h}" />
                <span class="text-xs font-bold text-white truncate w-full text-center">${h}</span>
                <button class="mt-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#536471] text-white transition-colors cursor-pointer inline-follow-toggle-btn" data-handle="${h}" data-following="true">
                  Following
                </button>
              </div>
            `;
          });
          summaryHtml += `</div>`;
          followedSummary.innerHTML = summaryHtml;
          postsContainer.appendChild(followedSummary);
        }

        if (!postsToRender || postsToRender.length === 0) {
          const noPostsEl = document.createElement("div");
          noPostsEl.className = "p-12 text-center text-[#71767b] text-sm";
          noPostsEl.textContent = "No recent posts from accounts you follow.";
          postsContainer.appendChild(noPostsEl);
        } else {
          postsToRender.forEach(post => {
            const card = renderPostCard({ ...post, id: post._id || post.id });
            postsContainer.appendChild(card);
          });
        }
        initXVideoPlayers();
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
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=400&auto=format&fit=crop&q=80"
  ];

  const defaultBanners = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80"
  ];

  let currentAvatar = currentUser.avatar || "/assets/user/headShot.jpg";
  if (currentAvatar.toLowerCase().includes("ronaldo") || currentAvatar.toLowerCase().includes("cristiano")) {
    currentAvatar = "/assets/user/headShot.jpg";
  }
  let currentBanner = currentUser.banner || "";
  const modal = document.createElement("div");
  modal.className = "x-edit-profile-modal fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-[fadeInPop_0.2s_ease-out]";

  modal.innerHTML = `
    <div class="bg-[#000000] border border-[#333639] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto transition-all">
      <!-- Top Sticky Header -->
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-[#333639] bg-[#000000]/95 sticky top-0 z-50 backdrop-blur-md">
        <div class="flex items-center gap-5">
          <button class="close-edit p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer transition-colors" title="Close">
            <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>
          </button>
          <h2 class="text-xl font-bold text-white tracking-tight">Edit profile</h2>
        </div>
        <button id="save-profile-btn" class="bg-white hover:bg-[#eff3f4] text-black font-bold px-6 py-2 rounded-full text-sm transition-all cursor-pointer shadow-sm hover:shadow-md">
          Save
        </button>
      </div>

      <!-- Header Banner Section -->
      <div id="edit-banner-container" class="h-44 bg-gradient-to-r from-[#1d9bf0] via-[#0972b8] to-[#16181c] relative overflow-hidden group flex items-center justify-center">
        ${currentBanner ? `<img id="edit-banner-preview" src="${currentBanner}" onerror="this.remove();" class="absolute inset-0 w-full h-full object-cover" />` : `<img id="edit-banner-preview" src="" class="absolute inset-0 w-full h-full object-cover hidden" />`}
        <div class="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center gap-4 z-10">
          <label for="edit-upload-banner-input" class="p-3 bg-black/70 hover:bg-black/90 rounded-full text-white cursor-pointer transition-all border border-white/20 shadow-lg flex items-center gap-2 text-xs font-bold" title="Upload custom header image from your PC">
            <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></svg>
            <span>Change banner</span>
          </label>
          <input type="file" id="edit-upload-banner-input" accept="image/*" class="hidden" />
          <button type="button" id="remove-banner-btn" class="p-3 bg-black/70 hover:bg-black/90 rounded-full text-white cursor-pointer transition-all border border-white/20 shadow-lg ${currentBanner ? '' : 'hidden'}" title="Remove banner">
            <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></svg>
          </button>
        </div>
      </div>

      <!-- Banner Themes Presets Bar (Spacious, separate block directly under banner) -->
      <div class="px-6 py-3 bg-[#0d0e10] border-b border-[#333639] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#71767b]">
        <span class="font-bold text-white shrink-0">Banner Themes:</span>
        <div class="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
          ${defaultBanners.map((url, idx) => `
            <div data-banner-url="${url}" class="edit-banner-preset h-9 w-20 rounded-lg overflow-hidden border border-[#333639] hover:border-[#1d9bf0] cursor-pointer shrink-0 transition-all shadow-sm group relative" title="Theme ${idx + 1}">
              <img src="${url}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Profile Avatar & Presets Selection Box (Clean, zero overlap, proper padding) -->
      <div class="px-6 py-5 bg-[#000000] border-b border-[#333639] flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div class="flex flex-col items-center shrink-0">
          <div class="relative group">
            <img id="edit-avatar-preview" src="${currentAvatar}" onerror="this.onerror=null;this.src='/assets/user/headShot.jpg';" class="size-24 rounded-full object-cover border-4 border-[#202327] bg-black shadow-xl" />
          </div>
          <span class="text-[11px] text-[#71767b] font-medium mt-2">Current Avatar</span>
        </div>

        <div class="flex-1 space-y-3 w-full">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="text-xs font-bold text-white uppercase tracking-wider">Profile Photo Presets</span>
            <!-- Upload button -->
            <label for="edit-upload-file-input" class="text-xs font-bold bg-[#1d9bf0]/10 hover:bg-[#1d9bf0]/20 text-[#1d9bf0] px-3.5 py-1.5 rounded-full border border-[#1d9bf0]/30 cursor-pointer transition-all flex items-center gap-1.5 shadow-sm" title="Upload custom avatar image from PC">
              <svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></svg>
              <span>Upload from PC</span>
            </label>
            <input type="file" id="edit-upload-file-input" accept="image/*" class="hidden" />
          </div>
          <div class="flex gap-3 flex-wrap items-center py-1">
            ${defaultAvatars.map((url, idx) => `
              <img src="${url}" onerror="this.onerror=null;this.src='/assets/user/headShot.jpg';" data-url="${url}" alt="Preset ${idx+1}" class="edit-avatar-preset size-11 rounded-full object-cover border-2 ${currentAvatar === url ? 'border-[#1d9bf0] scale-110 shadow-md' : 'border-[#333639] opacity-75'} hover:opacity-100 hover:scale-105 cursor-pointer transition-all" title="Universal Avatar ${idx + 1}" />
            `).join('')}
          </div>
          <input id="edit-avatar-url" type="text" value="${currentAvatar}" placeholder="Or paste custom image URL..." class="w-full bg-[#16181c] border border-[#333639] focus:border-[#1d9bf0] text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors" />
          <div id="edit-upload-status" class="text-xs text-[#00ba7c] font-bold hidden">Uploading photo to server...</div>
        </div>
      </div>

      <!-- Form Fields with spacious, clean boxes -->
      <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-[#71767b] uppercase tracking-wider mb-1.5">Name</label>
            <input id="edit-username" type="text" value="${currentUser.username || ''}" class="w-full bg-[#000000] border border-[#333639] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors shadow-inner" placeholder="Your display name" />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#71767b] uppercase tracking-wider mb-1.5">Bio</label>
            <textarea id="edit-bio" rows="3" placeholder="Write a short bio about yourself..." class="w-full bg-[#000000] border border-[#333639] focus:border-[#1d9bf0] text-white px-4 py-3 rounded-xl text-sm focus:outline-none resize-none transition-colors shadow-inner leading-relaxed">${currentUser.bio || ''}</textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-bold text-[#71767b] uppercase tracking-wider mb-1.5">Location</label>
              <input id="edit-location" type="text" value="${currentUser.location || ''}" placeholder="New Delhi, India" class="w-full bg-[#000000] border border-[#333639] focus:border-[#1d9bf0] text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#71767b] uppercase tracking-wider mb-1.5">Website</label>
              <input id="edit-website" type="text" value="${currentUser.website || ''}" placeholder="https://..." class="w-full bg-[#000000] border border-[#333639] focus:border-[#1d9bf0] text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#71767b] uppercase tracking-wider mb-1.5">Birth date</label>
              <input id="edit-dob" type="text" value="${currentUser.dob || ''}" placeholder="June 15, 1998" class="w-full bg-[#000000] border border-[#333639] focus:border-[#1d9bf0] text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const close = () => modal.remove();
  modal.querySelector(".close-edit")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  // Avatar presets click
  modal.querySelectorAll(".edit-avatar-preset").forEach(img => {
    img.addEventListener("click", () => {
      currentAvatar = img.getAttribute("data-url");
      modal.querySelector("#edit-avatar-preview").src = currentAvatar;
      modal.querySelectorAll(".edit-avatar-preset").forEach(i => i.classList.remove("border-[#1d9bf0]", "scale-110"));
      img.classList.add("border-[#1d9bf0]", "scale-110");
      modal.querySelector("#edit-avatar-url").value = currentAvatar;
    });
  });

  // Banner presets click
  modal.querySelectorAll(".edit-banner-preset").forEach(div => {
    div.addEventListener("click", () => {
      currentBanner = div.getAttribute("data-banner-url");
      const preview = modal.querySelector("#edit-banner-preview");
      if (preview) {
        preview.src = currentBanner;
        preview.classList.remove("hidden");
      }
      const rmBtn = modal.querySelector("#remove-banner-btn");
      if (rmBtn) rmBtn.classList.remove("hidden");
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

      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        currentAvatar = dataUrl;
        const preview = modal.querySelector("#edit-avatar-preview");
        if (preview) preview.src = dataUrl;
      };
      reader.readAsDataURL(file);

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
        if (statusBox) {
          statusBox.textContent = "✅ Photo ready!";
          setTimeout(() => statusBox.classList.add("hidden"), 2000);
        }
      }
    });
  }

  const bannerFileInput = modal.querySelector("#edit-upload-banner-input");
  if (bannerFileInput) {
    bannerFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        currentBanner = dataUrl;
        const preview = modal.querySelector("#edit-banner-preview");
        if (preview) {
          preview.src = dataUrl;
          preview.classList.remove("hidden");
        }
        const rmBtn = modal.querySelector("#remove-banner-btn");
        if (rmBtn) rmBtn.classList.remove("hidden");
      };
      reader.readAsDataURL(file);

      const uploadData = new FormData();
      uploadData.append("file", file);
      try {
        const res = await fetch(`${API_BASE_URL}/api/upload`, { method: "POST", body: uploadData });
        const result = await res.json();
        if (res.ok && result.url) {
          currentBanner = result.url;
          const preview = modal.querySelector("#edit-banner-preview");
          if (preview) preview.src = result.url;
        }
      } catch (err) {}
    });
  }

  modal.querySelector("#remove-banner-btn")?.addEventListener("click", () => {
    currentBanner = "";
    const preview = modal.querySelector("#edit-banner-preview");
    if (preview) {
      preview.src = "";
      preview.classList.add("hidden");
    }
    const rmBtn = modal.querySelector("#remove-banner-btn");
    if (rmBtn) rmBtn.classList.add("hidden");
  });

  modal.querySelector("#save-profile-btn")?.addEventListener("click", async () => {
    const saveBtn = modal.querySelector("#save-profile-btn");
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    const payload = {
      handle: currentUser.handle || "@veerpratapsaw",
      email: currentUser.email || "vps@xclone.com",
      username: modal.querySelector("#edit-username").value.trim() || currentUser.username,
      bio: modal.querySelector("#edit-bio").value.trim(),
      avatar: currentAvatar,
      banner: currentBanner,
      location: modal.querySelector("#edit-location").value.trim(),
      website: modal.querySelector("#edit-website").value.trim(),
      dob: modal.querySelector("#edit-dob").value.trim()
    };

    let updatedUser = { ...currentUser, ...payload };

    try {
      const tokenToUse = getToken() || "demo_token_seed";
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenToUse}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const dbUser = await res.json();
        updatedUser = { ...updatedUser, ...dbUser };
      }
    } catch (err) {
      console.warn("Save profile backend offline/error, using local persistence:", err.message);
    }

    const { setAuthData, updateUserProfilePill } = await import("./auth.js");
    setAuthData(getToken(), updatedUser);
    updateUserProfilePill();

    document.querySelectorAll(".posts .tweetCard").forEach(card => {
      const authorSpan = card.querySelector(".font-bold.text-white");
      const handleSpan = card.querySelector(".text-\\[13px\\].text-\\[\\#71767b\\]");
      const avatarImg = card.querySelector(".photo img");
      if (handleSpan && (handleSpan.textContent.trim().toLowerCase() === (updatedUser.handle || "").toLowerCase())) {
        if (authorSpan && updatedUser.username) authorSpan.textContent = updatedUser.username;
        if (avatarImg && updatedUser.avatar) avatarImg.src = updatedUser.avatar;
      }
    });

    close();
    if (onSaveCallback) onSaveCallback();
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
      <div class="flex items-center gap-6 px-4 py-3 border-b border-[#313233ad]/60 bg-[#000000]/90 sticky top-0 z-40 backdrop-blur-sm">
        <button class="close-profile p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer transition-colors">
          <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>
        </button>
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-1">${username} <img class="w-4" src="/assets/svg/lock.svg" alt="Verified" /></h2>
          <div class="text-xs text-[#71767b] profile-posts-count">Loading posts...</div>
        </div>
      </div>

      <!-- Banner Header -->
      <div class="h-36 sm:h-48 bg-gradient-to-r from-[#1d9bf0] via-[#0972b8] to-[#16181c] relative overflow-hidden">
        ${currentUser.banner ? `<img src="${currentUser.banner}" class="absolute inset-0 w-full h-full object-cover" />` : ''}
      </div>

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
          <span class="cursor-pointer hover:underline"><span class="font-bold text-white profile-following-num">${getPersistedUserFollowing().length}</span> <span class="text-[#71767b]">Following</span></span>
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

export function toggleRightSidebarSections(show = true) {
  const rightSidebar = document.querySelector(".right");
  if (!rightSidebar) return;
  const whatsHappening = rightSidebar.querySelector(".WhatsHappening");
  const whoToFollow = rightSidebar.querySelector(".Whotofollow");
  if (whatsHappening) whatsHappening.classList.toggle("!hidden", !show);
  if (whoToFollow) whoToFollow.classList.toggle("!hidden", !show);
}

export function renderExploreScreen(mainContainer, initialQuery = "") {
  if (!mainContainer) return;
  toggleRightSidebarSections(false);

  const trendingTopics = [
    { category: "Technology · Trending", topic: "#Gemini2Live", posts: "142,500 posts", filter: "AI" },
    { category: "Space · Trending", topic: "SpaceX Starship V3", posts: "89,200 posts", filter: "News" },
    { category: "Artificial Intelligence · Live", topic: "Agentic AI & X Corp", posts: "210,400 posts", filter: "AI" },
    { category: "Sports · Trending", topic: "#CricketWorldCup", posts: "95,800 posts", filter: "Sports" },
    { category: "Entertainment · Trending", topic: "New Blockbuster Trailer", posts: "44,100 posts", filter: "Entertainment" },
    { category: "Business · Trending", topic: "Tech Stocks Rally", posts: "67,300 posts", filter: "News" }
  ];

  const suggestedCreators = [
    { name: "Cristiano Ronaldo", handle: "@cristiano", avatar: "/assets/user/headShot.jpg", bio: "Football legend · CR7" },
    { name: "Akshay Kumar", handle: "@akshaykumar", avatar: "/assets/user/headShot.jpg", bio: "Actor · Producer" },
    { name: "Grok AI", handle: "@grok", avatar: "/assets/user/headShot.jpg", bio: "Real-time AI assistant by xAI" },
    { name: "Anushka Sharma", handle: "@anushkasharma", avatar: "/assets/user/headShot.jpg", bio: "Artist & Entrepreneur" },
    { name: "Veer Pratap Saw", handle: "@vps", avatar: "/assets/user/headShot.jpg", bio: "Full Stack Creator & Engineer" }
  ];

  mainContainer.innerHTML = `
    <!-- Sticky Explore Header & Search Bar -->
    <div class="sticky top-0 z-40 w-full bg-[#000000dd] backdrop-blur-md border-b border-[#313233ad] px-4 py-3">
      <div class="relative flex items-center bg-[#202327] rounded-full border border-transparent focus-within:border-[#1d9bf0] focus-within:bg-black transition-all">
        <div class="pl-4 pr-3 text-[#71767b]">
          <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"></path></svg>
        </div>
        <input id="explore-main-search" type="text" placeholder="Search X across posts, people, and topics..." class="w-full bg-transparent py-2.5 text-sm text-white placeholder-[#71767b] focus:outline-none pr-4" />
      </div>

      <!-- Explore Sub-Tabs -->
      <div class="flex items-center gap-6 mt-3 overflow-x-auto no-scrollbar text-sm font-bold border-t border-[#313233ad]/40 pt-2.5">
        <button class="explore-subtab text-white border-b-2 border-[#1d9bf0] pb-2 shrink-0 cursor-pointer" data-filter="All">Trending</button>
        <button class="explore-subtab text-[#71767b] hover:text-white pb-2 shrink-0 cursor-pointer transition-colors" data-filter="AI">AI & Tech</button>
        <button class="explore-subtab text-[#71767b] hover:text-white pb-2 shrink-0 cursor-pointer transition-colors" data-filter="News">News</button>
        <button class="explore-subtab text-[#71767b] hover:text-white pb-2 shrink-0 cursor-pointer transition-colors" data-filter="Sports">Sports</button>
        <button class="explore-subtab text-[#71767b] hover:text-white pb-2 shrink-0 cursor-pointer transition-colors" data-filter="Entertainment">Entertainment</button>
      </div>
    </div>

    <!-- Explore Scrollable Body -->
    <div class="explore-body divide-y divide-[#313233ad]/40 pb-24">
      <!-- Section 1: Trending Topics (Desktop Right Sidebar Feature brought to Mobile & Explore) -->
      <div class="p-4 bg-gradient-to-b from-[#0e1013] to-black">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-extrabold text-white flex items-center gap-2">
            <span>Trending & What’s happening</span>
            <span class="bg-[#1d9bf0]/20 text-[#1d9bf0] text-xs px-2 py-0.5 rounded-full font-bold">Live</span>
          </h2>
        </div>
        <div id="explore-trending-grid" class="grid grid-cols-1 md:grid-cols-2 gap-2.5"></div>
      </div>

      <!-- Section 2: Who to Follow (Desktop Right Sidebar Feature brought to Mobile & Explore) -->
      <div class="p-4 bg-[#0a0b0d]">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-extrabold text-white flex items-center gap-2">
            <span>Who to follow & Suggested Creators</span>
            <span class="text-xs font-normal text-[#71767b]">Curated accounts</span>
          </h2>
        </div>
        <div class="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          ${suggestedCreators.map(c => `
            <div class="shrink-0 bg-black border border-[#313233ad] rounded-2xl p-3.5 flex flex-col items-center min-w-[150px] max-w-[170px] hover:border-[#1d9bf0]/50 transition-colors">
              <img class="size-14 rounded-full object-cover border border-[#313233ad] mb-2" src="${c.avatar}" onerror="this.src='/assets/user/headShot.jpg'" alt="${c.name}" />
              <div class="font-bold text-white text-sm truncate w-full text-center">${c.name}</div>
              <div class="text-xs text-[#71767b] truncate w-full text-center">${c.handle}</div>
              <div class="text-[11px] text-[#8b9299] text-center mt-1 line-clamp-2 h-8">${c.bio}</div>
              <button class="mt-3 btn shrink-0 border-0 text-black bg-white font-bold rounded-full h-8 px-5 flex items-center justify-center text-xs hover:bg-[#eff3f4] transition-colors cursor-pointer inline-follow-toggle-btn" data-handle="${c.handle}">
                Follow
              </button>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Section 3: Live Explore Results Feed -->
      <div class="bg-black">
        <div class="p-4 border-b border-[#313233ad]/40">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <span>Explore Feed</span>
            <span class="text-xs font-normal text-[#71767b]">Top posts across topics</span>
          </h3>
        </div>
        <div id="explore-results-container" class="divide-y divide-[#313233ad]/40"></div>
      </div>
    </div>
  `;

  const followingHandles = getPersistedUserFollowing();
  mainContainer.querySelectorAll(".inline-follow-toggle-btn").forEach(btn => {
    const handle = (btn.dataset.handle || "").toLowerCase();
    if (followingHandles.includes(handle) || (handle === "@akshay" && followingHandles.includes("@akshaykumar")) || (handle === "@akshaykumar" && followingHandles.includes("@akshay"))) {
      btn.textContent = "Following";
      btn.className = "mt-3 btn shrink-0 border border-[#536471] text-white bg-transparent font-bold rounded-full h-8 px-5 flex items-center justify-center text-xs transition-all duration-200 cursor-pointer inline-follow-toggle-btn";
      btn.dataset.following = "true";
    }
  });

  const trendingGrid = mainContainer.querySelector("#explore-trending-grid");
  const renderTrendingTopics = (filter = "All") => {
    if (!trendingGrid) return;
    const items = filter === "All" ? trendingTopics : trendingTopics.filter(t => t.filter === filter || t.category.toLowerCase().includes(filter.toLowerCase()));
    if (items.length === 0) {
      trendingGrid.innerHTML = `<div class="col-span-2 p-4 text-center text-[#71767b] text-sm">No specific trending topics right now for ${filter}.</div>`;
      return;
    }
    trendingGrid.innerHTML = items.map(t => `
      <div class="p-3 bg-[#121418] hover:bg-[#181b20] border border-[#313233ad]/60 rounded-2xl cursor-pointer transition-all explore-trending-card" data-topic="${t.topic}">
        <div class="flex justify-between items-start text-xs text-[#71767b]">
          <span>${t.category}</span>
          <span class="text-[#1d9bf0] font-bold">Explore →</span>
        </div>
        <div class="font-extrabold text-white text-base mt-1 truncate">${t.topic}</div>
        <div class="text-xs text-[#71767b] mt-0.5">${t.posts}</div>
      </div>
    `).join("");

    trendingGrid.querySelectorAll(".explore-trending-card").forEach(card => {
      card.addEventListener("click", () => {
        const topic = card.dataset.topic || "";
        const searchInput = mainContainer.querySelector("#explore-main-search");
        if (searchInput) {
          searchInput.value = topic;
          renderExplorePosts(topic, "All");
          searchInput.focus();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  };

  const resultsContainer = mainContainer.querySelector("#explore-results-container");
  const renderExplorePosts = async (query = "", categoryFilter = "All") => {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = `<div class="p-8 text-center text-[#71767b] text-sm animate-pulse">Searching posts...</div>`;

    let filtered = [];
    try {
      let url = `${API_BASE_URL}/api/posts`;
      if (query) {
        url = `${API_BASE_URL}/api/posts/search?q=${encodeURIComponent(query)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          filtered = data;
        }
      }
    } catch (err) {
      console.warn("Explore search backend offline, using local filter");
      filtered = [...initialPosts];
    }

    if (query && filtered.length === 0) {
      const qLow = query.toLowerCase();
      filtered = initialPosts.filter(p => 
        (p.text && p.text.toLowerCase().includes(qLow)) ||
        (p.author && p.author.toLowerCase().includes(qLow)) ||
        (p.handle && p.handle.toLowerCase().includes(qLow))
      );
    } else if (categoryFilter !== "All") {
      const cLow = categoryFilter.toLowerCase();
      filtered = filtered.filter(p => {
        const txt = (p.text || "").toLowerCase();
        const auth = (p.author || "").toLowerCase();
        if (cLow === "ai") return txt.includes("ai") || txt.includes("grok") || txt.includes("tech") || txt.includes("coding") || txt.includes("fullstack");
        if (cLow === "news") return txt.includes("news") || txt.includes("space") || txt.includes("starship") || txt.includes("trading") || txt.includes("business");
        if (cLow === "sports") return txt.includes("sports") || txt.includes("cr7") || txt.includes("football") || txt.includes("cricket") || auth.includes("ronaldo");
        if (cLow === "entertainment") return txt.includes("actor") || txt.includes("film") || txt.includes("trailer") || txt.includes("nature") || txt.includes("travel") || auth.includes("akshay") || auth.includes("anushka") || auth.includes("dipika");
        return true;
      });
    }

    if (!resultsContainer) return;
    resultsContainer.innerHTML = "";

    if (filtered.length === 0) {
      resultsContainer.innerHTML = `<div class="p-8 text-center text-[#71767b] text-sm">No posts found matching your search. Here are some trending posts:</div>`;
      initialPosts.slice(0, 4).forEach(post => {
        const card = renderPostCard({ ...post, id: post._id || post.id });
        resultsContainer.appendChild(card);
      });
      initXVideoPlayers();
      return;
    }

    filtered.forEach(post => {
      const card = renderPostCard({ ...post, id: post._id || post.id });
      resultsContainer.appendChild(card);
    });
    initXVideoPlayers();
  };

  renderTrendingTopics("All");

  const searchInput = mainContainer.querySelector("#explore-main-search");
  if (searchInput) {
    if (initialQuery) {
      searchInput.value = initialQuery;
      renderExplorePosts(initialQuery, "All");
      setTimeout(() => { searchInput.focus(); }, 100);
    } else {
      renderExplorePosts("", "All");
    }
    searchInput.addEventListener("input", (e) => {
      renderExplorePosts(e.target.value.trim(), "All");
    });
  } else {
    renderExplorePosts("", "All");
  }

  mainContainer.querySelectorAll(".explore-subtab").forEach(tab => {
    tab.addEventListener("click", () => {
      mainContainer.querySelectorAll(".explore-subtab").forEach(t => {
        t.className = "explore-subtab text-[#71767b] hover:text-white pb-2 shrink-0 cursor-pointer transition-colors";
      });
      tab.className = "explore-subtab text-white border-b-2 border-[#1d9bf0] pb-2 shrink-0 cursor-pointer";
      const filter = tab.dataset.filter || "All";
      if (searchInput) searchInput.value = "";
      renderTrendingTopics(filter);
      renderExplorePosts("", filter);
    });
  });
}


/**
 * Initializes Left Navigation Sidebar Items (Home, Explore, Notifications, Bookmarks, Profile, etc.)
 */
export function initSidebarNav() {
  if (document.body.dataset.sidebarNavWired === "true") return;
  document.body.dataset.sidebarNavWired = "true";

  document.body.addEventListener("click", async (e) => {
    const item = e.target.closest(".left ul li, nav[class*='fixed'] [data-label], .mobile-profile-avatar, [data-label]");
    if (!item) return;

    // Ignore if clicking on Subscribe or post button which are handled separately
    if (item.classList.contains("postbtn") || item.closest(".subscribe") || item.closest(".postbtn")) return;

    const label = item.dataset.label || item.querySelector("span")?.textContent?.trim() || item.textContent?.trim() || "";
    if (!label) return;

    // Highlight clicked sidebar item
    document.querySelectorAll(".left ul li, nav[class*='fixed'] [data-label]").forEach(i => i.classList.remove("bg-[#1d1d1d]", "font-bold", "text-[#1d9bf0]"));
    item.classList.add("font-bold");
    if (item.closest("nav[class*='fixed']")) item.classList.add("text-[#1d9bf0]");

    const mainContainer = document.querySelector(".main");
    if (!mainContainer) return;

    if (label === "Explore" || label === "Bookmarks") {
      toggleRightSidebarSections(false);
    } else {
      toggleRightSidebarSections(true);
    }

    if (label === "Home") {
      restoreHomeFeed();
    } else if (label === "Explore") {
      mainContainer.style.maxWidth = "";
      renderExploreScreen(mainContainer);
    } else if (label === "Notifications") {
      mainContainer.style.maxWidth = "";
      renderNotificationsScreen(mainContainer);
    } else if (label === "Follow") {
      mainContainer.style.maxWidth = "";
      renderFollowDiscoverScreen(mainContainer);
    } else if (label === "Grok") {
      // Grok handled by initGrokUI / showGrokScreen
    } else if (label === "Bookmarks") {
      mainContainer.style.maxWidth = "";
      renderBookmarksScreen(mainContainer);
    } else if (label === "Premium") {
      showPremiumModal();
    } else if (label === "Profile") {
      mainContainer.style.maxWidth = "";
      showUserProfileScreen();
    } else if (label === "More") {
      showMoreMenuPopover(item);
    }
  });
}

/**
 * Restores authentic Home Feed layout and re-initializes live timeline
 */
export function restoreHomeFeed() {
  const mainContainer = document.querySelector(".main");
  if (!mainContainer) return;
  mainContainer.style.maxWidth = "";
  toggleRightSidebarSections(true);

  // Rebuild Top Tabs + Post Creation Box + Posts Container if replaced
  mainContainer.innerHTML = `
    <!-- Top Sticky Header Container -->
    <div class="top sticky top-0 z-40 w-full bg-[#000000dd] backdrop-blur-md flex flex-col border-b border-[#313233ad]">
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
      <div class="w-full flex items-center px-2 overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div class="tab flex-1 min-w-fit px-4 flex justify-center items-center py-4 relative hover:bg-[#181818] cursor-pointer transition-colors text-sm font-bold text-white">
          <span>For you</span>
          <div class="absolute bottom-0 h-1 w-14 rounded-full bg-[#1d9bf0]"></div>
        </div>
        <div class="tab flex-1 min-w-fit px-4 flex justify-center items-center py-4 relative hover:bg-[#181818] cursor-pointer transition-colors text-sm font-bold text-[#71767b] hover:text-white">
          <span>Following</span>
        </div>
        <div class="tab flex-1 min-w-fit px-4 flex justify-center items-center py-4 relative hover:bg-[#181818] cursor-pointer transition-colors text-sm font-bold text-[#71767b] hover:text-white">
          <span>Tech</span>
        </div>
        <div class="tab flex-1 min-w-fit px-4 flex justify-center items-center py-4 relative hover:bg-[#181818] cursor-pointer transition-colors text-sm font-bold text-[#71767b] hover:text-white">
          <span>Gaming</span>
        </div>
        <div class="tab flex-1 min-w-fit px-4 flex justify-center items-center py-4 relative hover:bg-[#181818] cursor-pointer transition-colors text-sm font-bold text-[#71767b] hover:text-white">
          <span>Travel</span>
        </div>
        <div class="tab flex-1 min-w-fit px-4 flex justify-center items-center py-4 relative hover:bg-[#181818] cursor-pointer transition-colors text-sm font-bold text-[#71767b] hover:text-white">
          <span>Stocks</span>
        </div>
        <div class="tab flex-1 min-w-fit px-4 flex justify-center items-center py-4 relative hover:bg-[#181818] cursor-pointer transition-colors text-sm font-bold text-[#71767b] hover:text-white">
          <span>Science</span>
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
          <div class="flex items-center gap-1 sm:gap-3 text-[#71767b] hover:text-white">
            <label for="post-media-input" class="p-2 hover:bg-[#181818] rounded-full cursor-pointer transition-colors" title="Media">
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
  initSubscribeButtons();
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
    <div class="sticky top-0 z-40 w-full bg-[#000000dd] backdrop-blur-md px-4 py-3 border-b border-[#313233ad]">
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
    header.className = "sticky top-0 z-40 w-full bg-[#000000dd] backdrop-blur-md px-4 py-3 border-b border-[#313233ad] flex items-center justify-between";
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
    <div class="sticky top-0 z-40 w-full bg-[#000000dd] backdrop-blur-md px-4 py-3 border-b border-[#313233ad]">
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
 * Initialize Subscribe & Premium Buttons global delegation
 */
export function initSubscribeButtons() {
  if (document.body.dataset.subscribeButtonsWired === "true") return;
  document.body.dataset.subscribeButtonsWired = "true";

  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    const li = e.target.closest("li, .tab");

    // Check if clicked Subscribe button in right sidebar or top mobile bar
    if (btn && (btn.textContent.trim() === "Subscribe" || btn.closest(".subscribe") || btn.dataset?.label === "Subscribe")) {
      e.preventDefault();
      e.stopPropagation();
      showPremiumModal();
      return;
    }

    // Check if clicked Premium or Subscribe in left sidebar or nav pills
    if (li && (li.dataset?.label === "Premium" || li.dataset?.label === "Subscribe" || li.textContent?.trim() === "Premium")) {
      e.preventDefault();
      e.stopPropagation();
      showPremiumModal();
      return;
    }
  });
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
  initSubscribeButtons();
}
