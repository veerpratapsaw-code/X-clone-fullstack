// Dynamic Tweet Engagement Engine: Like, Repost, Bookmark, and Reply interactions
import { getToken, getCurrentUser, showAuthModal } from "./auth.js";
import { API_BASE_URL } from "../config.js";

/**
 * Shows the authentic X Post Detail / Threaded Replies Modal
 */
export function showPostDetailModal(postId, postElement) {
  document.querySelectorAll(".x-detail-modal").forEach(el => el.remove());

  const author = postElement.querySelector(".authorRow span.font-bold")?.textContent || "User";
  const handle = postElement.querySelector(".authorRow span.text-\\[\\#71767b\\]")?.textContent?.split("·")[0]?.trim() || "@user";
  const avatarUrl = postElement.querySelector(".leftCol img")?.src || "/assets/user/headShot.jpg";
  const tweetText = postElement.querySelector(".tweetText")?.innerHTML || "";
  const mediaHtml = postElement.querySelector(".tweetMedia")?.outerHTML || "";
  const verifiedHtml = postElement.querySelector(".authorRow img[alt='Verified']")?.outerHTML || "";

  const modal = document.createElement("div");
  modal.className = "x-detail-modal fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto animate-[fadeInPop_0.2s_ease-out]";

  modal.innerHTML = `
    <div class="bg-[#000000] border border-[#313233ad] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-[#313233ad]/60 bg-[#000000]/90 sticky top-0 z-10 backdrop-blur-sm">
        <div class="flex items-center gap-6">
          <button class="close-detail p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer transition-colors">
            <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>
          </button>
          <h2 class="text-lg font-bold text-white">Post</h2>
        </div>
      </div>

      <!-- Main Post Content -->
      <div class="p-4 border-b border-[#313233ad]/60">
        <div class="flex items-center gap-3 mb-3">
          <img class="size-11 rounded-full object-cover border border-[#313233ad]" src="${avatarUrl}" alt="${author}" />
          <div>
            <div class="flex items-center gap-1 font-bold text-white text-base leading-tight">
              <span>${author}</span>
              ${verifiedHtml}
            </div>
            <div class="text-sm text-[#71767b]">${handle}</div>
          </div>
        </div>
        
        <div class="text-lg text-[#e7e9ea] leading-normal mb-3 font-normal">${tweetText}</div>
        ${mediaHtml}
      </div>

      <!-- Reply Box -->
      <div class="flex gap-3 p-4 border-b border-[#313233ad]/60 bg-[#080808]">
        <img class="size-10 rounded-full object-cover shrink-0 border border-[#313233ad]" src="${getCurrentUser()?.avatar || '/assets/user/headShot.jpg'}" alt="You" />
        <div class="flex-1">
          <textarea rows="2" placeholder="Post your reply" class="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none text-base"></textarea>
          <div class="flex justify-end mt-2 pt-2 border-t border-[#313233ad]/30">
            <button class="detail-submit-reply bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-5 py-1.5 rounded-full text-sm cursor-pointer transition-colors shadow-md">Reply</button>
          </div>
        </div>
      </div>

      <!-- Threaded Replies List -->
      <div class="detail-replies-list divide-y divide-[#313233ad]/40 max-h-[450px] overflow-y-auto">
        <div class="p-8 text-center text-gray-500 text-sm animate-pulse">Loading replies...</div>
      </div>
    </div>
  `;

  const close = () => modal.remove();
  modal.querySelector(".close-detail")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  const repliesList = modal.querySelector(".detail-replies-list");

  const renderReplyCard = (reply) => {
    const card = document.createElement("div");
    card.className = "p-4 flex gap-3 hover:bg-[#080808] transition-colors animate-[fadeInPop_0.2s_ease-out]";
    card.innerHTML = `
      <img class="size-10 rounded-full object-cover shrink-0 border border-[#313233ad]" src="${reply.avatar || '/assets/user/headShot.jpg'}" alt="${reply.author}" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-1 min-w-0 truncate">
            <span class="font-bold text-white hover:underline truncate">${reply.author}</span>
            ${reply.verified ? `<img class="w-4 shrink-0" src="/assets/svg/lock.svg" alt="Verified" />` : ''}
            <span class="text-[#71767b] truncate">${reply.handle}</span>
          </div>
        </div>
        <div class="text-sm text-[#e7e9ea] mt-1 leading-normal">${reply.text}</div>
      </div>
    `;
    return card;
  };

  // Fetch live replies from MongoDB
  if (postId && postId !== "undefined") {
    fetch(`${API_BASE_URL}/api/posts/${postId}/replies`)
      .then(res => res.json())
      .then(replies => {
        repliesList.innerHTML = "";
        if (!replies || replies.length === 0) {
          repliesList.innerHTML = `<div class="p-8 text-center text-gray-500 text-sm">No replies yet. Be the first to reply!</div>`;
          return;
        }
        replies.forEach(reply => repliesList.appendChild(renderReplyCard(reply)));
      })
      .catch(err => {
        console.warn("Error loading replies:", err);
        repliesList.innerHTML = `<div class="p-8 text-center text-red-400 text-sm">Failed to load replies</div>`;
      });
  } else {
    repliesList.innerHTML = `<div class="p-8 text-center text-gray-500 text-sm">No replies yet. Be the first to reply!</div>`;
  }

  // Handle posting a new reply
  modal.querySelector(".detail-submit-reply")?.addEventListener("click", async () => {
    const textarea = modal.querySelector("textarea");
    const replyText = textarea?.value.trim();
    if (!replyText) return;

    if (!getToken()) {
      showAuthModal("login", true);
      return;
    }

    // Immediately show reply in UI
    const currentUser = getCurrentUser() || { username: "You", handle: "@user", avatar: "/assets/user/headShot.jpg", verified: true };
    const tempReply = {
      author: currentUser.username,
      handle: currentUser.handle,
      avatar: currentUser.avatar,
      verified: currentUser.verified,
      text: replyText
    };

    if (repliesList.querySelector("div.text-center")) {
      repliesList.innerHTML = "";
    }
    repliesList.insertBefore(renderReplyCard(tempReply), repliesList.firstChild);
    textarea.value = "";

    // Update counter on feed card
    const span = postElement.querySelector(".actions > div:first-child span");
    if (span) {
      const current = parseInt(span.textContent.replace(/[^0-9]/g, ""), 10) || 0;
      span.textContent = String(current + 1);
    }

    // Persist to MongoDB backend
    if (postId && postId !== "undefined") {
      try {
        await fetch(`${API_BASE_URL}/api/posts/${postId}/replies`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
          },
          body: JSON.stringify({ text: replyText })
        });
      } catch (err) {
        console.warn("Backend reply sync error:", err);
      }
    }
  });

  document.body.appendChild(modal);
}

export function initTweetActions() {
  const postsContainer = document.querySelector(".posts");
  if (!postsContainer) return;

  // Toast notification helper
  const showToast = (message) => {
    const existing = document.querySelector(".x-toast-pill");
    existing?.remove();

    const toast = document.createElement("div");
    toast.className = "x-toast-pill fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1d9bf0] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-2xl animate-[fadeInPop_0.2s_ease-out] pointer-events-none";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
  };

  // Number parser & formatter
  const parseNum = (str) => {
    if (!str || str === "0") return 0;
    str = str.trim().toUpperCase();
    if (str.endsWith("K")) return parseFloat(str) * 1000;
    if (str.endsWith("M")) return parseFloat(str) * 1000000;
    return parseInt(str.replace(/,/g, ""), 10) || 0;
  };

  const formatNum = (num) => {
    if (num <= 0) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 10000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Event Delegation for all post actions & More menu & detail click
  postsContainer.addEventListener("click", (e) => {
    // Check if clicked the More (...) button
    const moreBtn = e.target.closest(".more");
    if (moreBtn) {
      e.stopPropagation();
      const post = moreBtn.closest(".post");
      if (!post) return;

      document.querySelectorAll(".x-more-dropdown").forEach(el => el.remove());

      const dropdown = document.createElement("div");
      dropdown.className = "x-more-dropdown absolute right-4 mt-8 w-48 bg-[#000000] border border-[#313233ad] rounded-xl shadow-2xl z-50 overflow-hidden animate-[fadeInPop_0.15s_ease-out]";
      dropdown.innerHTML = `
        <button class="delete-post-btn w-full text-left px-4 py-3 text-sm text-[#f91880] hover:bg-[#181818] font-bold flex items-center gap-2.5 transition-colors cursor-pointer">
          <svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M16 6V4.5C16 3.67 15.33 3 14.5 3h-5C8.67 3 8 3.67 8 4.5V6H3v2h1.06l1.24 12.38C5.41 21.31 6.2 22 7.12 22h9.76c.92 0 1.71-.69 1.82-1.62L19.94 8H21V6h-5zm-6-1.5h4V6h-4V4.5zm6.8 15.28c-.04.38-.36.67-.74.67H7.12c-.38 0-.7-.29-.74-.67L5.18 8h13.64l-1.22 12.78zM9.5 10.5v8h2v-8h-2zm3 0v8h2v-8h-2z"/></svg>
          Delete post
        </button>
      `;

      moreBtn.style.position = "relative";
      moreBtn.appendChild(dropdown);

      dropdown.querySelector(".delete-post-btn").addEventListener("click", async (ev) => {
        ev.stopPropagation();
        dropdown.remove();
        post.style.transition = "opacity 0.25s, transform 0.25s";
        post.style.opacity = "0";
        post.style.transform = "scale(0.95)";
        setTimeout(() => post.remove(), 250);

        if (post.id) {
          try {
            await fetch(`${API_BASE_URL}/api/posts/${post.id}`, { method: "DELETE" });
          } catch (err) {
            console.warn("Backend delete sync error:", err);
          }
        }
        showToast("Post deleted");
      });

      const closeDropdown = () => {
        dropdown.remove();
        window.removeEventListener("click", closeDropdown);
      };
      setTimeout(() => window.addEventListener("click", closeDropdown), 10);
      return;
    }

    const actionItem = e.target.closest(".actions > div, .actions .hover\\:bg-\\[\\#1d9cf01e\\], img[alt='Bookmark'], img[src*='bookmarks.svg']");
    const post = e.target.closest(".post");
    if (!post) return;

    // Check auth requirement for actions
    if (actionItem && !getToken()) {
      e.stopPropagation();
      showAuthModal("login", true);
      return;
    }

    if (!actionItem) {
      // If clicking inside the tweet body (not on an action icon or media or link), open Post Detail Modal
      if (!e.target.closest("video, img, button, a")) {
        showPostDetailModal(post.id, post);
      }
      return;
    }

    e.stopPropagation();

    // 1. LIKE / HEART ACTION
    if (actionItem.classList.contains("hover:text-[#f91880]") || actionItem.closest(".hover\\:text-\\[\\#f91880\\]")) {
      const likeBtn = actionItem.closest(".hover\\:text-\\[\\#f91880\\]");
      const span = likeBtn.querySelector("span");
      const svgPath = likeBtn.querySelector("svg path");
      const isLiked = post.dataset.liked === "true";

      if (!isLiked) {
        post.dataset.liked = "true";
        likeBtn.classList.add("text-[#f91880]");
        likeBtn.querySelector("svg, img")?.classList.add("animate-[heartPop_0.35s_ease-out]");
        if (svgPath) svgPath.setAttribute("d", "M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z");
        if (span) span.textContent = formatNum(parseNum(span.textContent) + 1);
        if (post.id) {
          fetch(`${API_BASE_URL}/api/posts/${post.id}/like`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${getToken()}` }
          }).catch(err => console.warn("Backend sync error:", err));
        }
      } else {
        post.dataset.liked = "false";
        likeBtn.classList.remove("text-[#f91880]");
        if (svgPath) svgPath.setAttribute("d", "M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z");
        if (span) span.textContent = formatNum(Math.max(0, parseNum(span.textContent) - 1));
        if (post.id) {
          fetch(`${API_BASE_URL}/api/posts/${post.id}/like`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${getToken()}` }
          }).catch(err => console.warn("Backend sync error:", err));
        }
      }
      return;
    }

    // 2. REPOST / QUOTE ACTION
    if (actionItem.classList.contains("hover:text-[#00ba7c]") || actionItem.closest(".hover\\:text-\\[\\#00ba7c\\]")) {
      const repostBtn = actionItem.closest(".hover\\:text-\\[\\#00ba7c\\]");
      const span = repostBtn.querySelector("span");
      const isReposted = post.dataset.reposted === "true";

      if (!isReposted) {
        post.dataset.reposted = "true";
        repostBtn.classList.add("text-[#00ba7c]");
        if (span) span.textContent = formatNum(parseNum(span.textContent) + 1);
        showToast("You reposted");
        if (post.id) {
          fetch(`${API_BASE_URL}/api/posts/${post.id}/repost`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${getToken()}` }
          }).catch(err => console.warn("Backend sync error:", err));
        }
      } else {
        post.dataset.reposted = "false";
        repostBtn.classList.remove("text-[#00ba7c]");
        if (span) span.textContent = formatNum(Math.max(0, parseNum(span.textContent) - 1));
        showToast("Removed repost");
        if (post.id) {
          fetch(`${API_BASE_URL}/api/posts/${post.id}/repost`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${getToken()}` }
          }).catch(err => console.warn("Backend sync error:", err));
        }
      }
      return;
    }

    // 3. BOOKMARK ACTION
    if (actionItem.matches("img[alt='Bookmark'], img[src*='bookmarks.svg'], .hover\\:bg-\\[\\#1d9cf01e\\]") || actionItem.closest(".actions > div:last-child")) {
      const isBookmarked = post.dataset.bookmarked === "true";
      const icon = actionItem.querySelector("img, svg") || actionItem;

      if (!isBookmarked) {
        post.dataset.bookmarked = "true";
        icon.classList.add("filter", "brightness-200", "scale-110");
        showToast("Added to your Bookmarks");
        if (post.id) {
          fetch(`${API_BASE_URL}/api/posts/${post.id}/bookmark`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${getToken()}` }
          }).catch(err => console.warn("Backend sync error:", err));
        }
      } else {
        post.dataset.bookmarked = "false";
        icon.classList.remove("filter", "brightness-200", "scale-110");
        showToast("Removed from your Bookmarks");
        if (post.id) {
          fetch(`${API_BASE_URL}/api/posts/${post.id}/bookmark`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${getToken()}` }
          }).catch(err => console.warn("Backend sync error:", err));
        }
      }
      return;
    }

    // 4. REPLY ACTION
    if (actionItem === post.querySelector(".actions > div:first-child") || actionItem.closest(".actions > div:first-child")) {
      showPostDetailModal(post.id, post);
      return;
    }
  });
}
