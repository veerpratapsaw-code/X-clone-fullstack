// Dynamic Tweet Engagement Engine: Like, Repost, Bookmark, and Reply interactions

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

  // Number parser & formatter (e.g. "320K" -> 320000 -> "320.1K")
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

  // Reply Modal Helper
  const showReplyModal = (postElement, handle) => {
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 animate-[fadeInPop_0.2s_ease-out]";
    modal.innerHTML = `
      <div class="bg-[#000000] border border-[#313233ad] rounded-2xl w-full max-w-lg p-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-[#313233ad]/50 pb-3 mb-3">
          <button class="close-reply p-1.5 hover:bg-[#181818] rounded-full text-white cursor-pointer transition-colors">
            <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>
          </button>
          <span class="font-bold text-sm text-[#71767b]">Replying to <span class="text-[#1d9bf0]">${handle}</span></span>
          <div class="w-5"></div>
        </div>
        <div class="flex gap-3">
          <img class="size-10 rounded-full object-cover shrink-0" src="/src/assets/user/headShot.jpg" alt="You" />
          <div class="flex-1">
            <textarea rows="3" placeholder="Post your reply" class="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none text-base"></textarea>
            <div class="flex justify-end mt-3 pt-2 border-t border-[#313233ad]/30">
              <button class="submit-reply bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-4 py-1.5 rounded-full text-sm cursor-pointer transition-colors">Reply</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const close = () => modal.remove();
    modal.querySelector(".close-reply").addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

    modal.querySelector(".submit-reply").addEventListener("click", () => {
      const replyText = modal.querySelector("textarea").value.trim();
      if (!replyText) return;
      const span = postElement.querySelector(".actions > div:first-child span");
      if (span) span.textContent = formatNum(parseNum(span.textContent) + 1);
      showToast("Your reply was posted");

      // Sync reply with MongoDB Backend
      if (postElement.id) {
        fetch(`${API_BASE_URL}/api/posts/${postElement.id}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replyText, author: "Veer Pratap Saw", handle: "@Veerpratapsaw" })
        }).catch(err => console.warn("Backend sync error:", err));
      }

      close();
    });

    document.body.appendChild(modal);
    modal.querySelector("textarea").focus();
  };

  // Event Delegation for all post actions & More menu
  postsContainer.addEventListener("click", (e) => {
    // Check if clicked the More (...) button
    const moreBtn = e.target.closest(".more");
    if (moreBtn) {
      e.stopPropagation();
      const post = moreBtn.closest(".post");
      if (!post) return;

      // Remove any existing dropdowns
      document.querySelectorAll(".x-more-dropdown").remove?.();
      document.querySelectorAll(".x-more-dropdown").forEach(el => el.remove());

      const dropdown = document.createElement("div");
      dropdown.className = "x-more-dropdown absolute right-4 mt-8 w-48 bg-[#000000] border border-[#313233ad] rounded-xl shadow-2xl z-50 overflow-hidden animate-[fadeInPop_0.15s_ease-out]";
      dropdown.innerHTML = `
        <button class="delete-post-btn w-full text-left px-4 py-3 text-sm text-[#f91880] hover:bg-[#181818] font-bold flex items-center gap-2.5 transition-colors cursor-pointer">
          <svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M16 6V4.5C16 3.67 15.33 3 14.5 3h-5C8.67 3 8 3.67 8 4.5V6H3v2h1.06l1.24 12.38C5.41 21.31 6.2 22 7.12 22h9.76c.92 0 1.71-.69 1.82-1.62L19.94 8H21V6h-5zm-6-1.5h4V6h-4V4.5zm6.8 15.28c-.04.38-.36.67-.74.67H7.12c-.38 0-.7-.29-.74-.67L5.18 8h13.64l-1.22 12.78zM9.5 10.5v8h2v-8h-2zm3 0v8h2v-8h-2z"/></svg>
          Delete post
        </button>
      `;

      // Position dropdown relative to more button container
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
            console.log("🗑️ Deleted post from MongoDB:", post.id);
          } catch (err) {
            console.warn("Backend delete sync error:", err);
          }
        }
        showToast("Post deleted");
      });

      // Close dropdown when clicking anywhere else
      const closeDropdown = () => {
        dropdown.remove();
        window.removeEventListener("click", closeDropdown);
      };
      setTimeout(() => window.addEventListener("click", closeDropdown), 10);
      return;
    }

    const actionItem = e.target.closest(".actions > div, .actions .hover\\:bg-\\[\\#1d9cf01e\\], img[alt='Bookmark'], img[src*='bookmarks.svg']");
    if (!actionItem) return;

    e.stopPropagation();
    const post = actionItem.closest(".post");
    if (!post) return;

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
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isLiked: true })
          }).catch(err => console.warn("Backend sync error:", err));
        }
      } else {
        post.dataset.liked = "false";
        likeBtn.classList.remove("text-[#f91880]");
        if (svgPath) svgPath.setAttribute("d", "M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z");
        if (span) span.textContent = formatNum(Math.max(0, parseNum(span.textContent) - 1));
        if (post.id) {
          fetch(`${API_BASE_URL}/api/posts/${post.id}/like`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isLiked: false })
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
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isReposted: true })
          }).catch(err => console.warn("Backend sync error:", err));
        }
      } else {
        post.dataset.reposted = "false";
        repostBtn.classList.remove("text-[#00ba7c]");
        if (span) span.textContent = formatNum(Math.max(0, parseNum(span.textContent) - 1));
        showToast("Removed repost");
        if (post.id) {
          fetch(`${API_BASE_URL}/api/posts/${post.id}/repost`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isReposted: false })
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
      } else {
        post.dataset.bookmarked = "false";
        icon.classList.remove("filter", "brightness-200", "scale-110");
        showToast("Removed from your Bookmarks");
      }
      return;
    }

    // 4. REPLY ACTION
    if (actionItem === post.querySelector(".actions > div:first-child") || actionItem.closest(".actions > div:first-child")) {
      const handle = post.querySelector(".authorRow span.text-\\[\\#71767b\\]")?.textContent?.split("·")[0]?.trim() || "@user";
      showReplyModal(post, handle);
      return;
    }
  });
}
