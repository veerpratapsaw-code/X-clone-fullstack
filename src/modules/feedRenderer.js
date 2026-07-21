import { initialPosts } from "./feedData.js";
import { API_BASE_URL } from "../config.js";
import { initXVideoPlayers } from "./videoPlayer.js";
import { getCurrentUser } from "./auth.js";
import { getPersistedUserFollowing } from "./interactiveFeatures.js";

export function renderPostCard(post) {
  const sanitizeUrl = (url) => {
    if (!url) return url;
    if (url.startsWith("/src/assets/")) return url.replace("/src/assets/", "/assets/");
    if (url.includes("localhost:5000/uploads")) return url.replace("http://localhost:5000", API_BASE_URL);
    if (url.startsWith("/uploads")) return `${API_BASE_URL}${url}`;
    return url;
  };

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id || currentUser?._id;

  const isLiked = Boolean(currentUserId && post.likedBy && post.likedBy.some(id => id.toString() === currentUserId.toString()));
  const isReposted = Boolean(currentUserId && post.repostedBy && post.repostedBy.some(id => id.toString() === currentUserId.toString()));
  const isBookmarked = Boolean(currentUserId && post.bookmarkedBy && post.bookmarkedBy.some(id => id.toString() === currentUserId.toString()));

  let timeDisplay = post.time;
  if (!timeDisplay || timeDisplay === "undefined") {
    if (post.createdAt) {
      const diffSec = Math.floor((new Date() - new Date(post.createdAt)) / 1000);
      if (diffSec < 60) timeDisplay = "Just now";
      else if (diffSec < 3600) timeDisplay = `${Math.floor(diffSec / 60)}m`;
      else if (diffSec < 86400) timeDisplay = `${Math.floor(diffSec / 3600)}h`;
      else {
        const d = new Date(post.createdAt);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        timeDisplay = `${months[d.getMonth()]} ${d.getDate()}`;
      }
    } else {
      timeDisplay = "Just now";
    }
  }

  const avatarUrl = sanitizeUrl(post.avatar || "/assets/user/headShot.jpg");

  const postId = post.id || post._id || "";
  const postCard = document.createElement("div");
  postCard.className = "post p-4 border-b border-[#313233ad] hover:bg-[#080808] transition-colors flex gap-3 cursor-pointer";
  if (postId) {
    postCard.id = postId;
    postCard.dataset.id = postId;
  }
  if (isLiked) postCard.dataset.liked = "true";
  if (isReposted) postCard.dataset.reposted = "true";
  if (isBookmarked) postCard.dataset.bookmarked = "true";

  let repostTopHtml = "";
  let repostLabelHtml = "";
  if (post.repostLabel) {
    repostTopHtml = `
      <div class="text-[#71767b] mb-1 mr-1">
        <svg viewBox="0 0 24 24" aria-hidden="true" class="size-3.5 fill-current">
          <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path>
        </svg>
      </div>
    `;
    repostLabelHtml = `<div class="text-xs text-[#71767b] font-bold mb-1">${post.repostLabel}</div>`;
  }

  let mediaHtml = "";
  if (post.media) {
    const mediaUrl = sanitizeUrl(post.media.url);
    if (post.media.type === "article") {
      mediaHtml = `
        <div class="tweetMedia mt-3 rounded-2xl border border-[#313233ad] overflow-hidden bg-[#16181c]">
          <div class="p-4 font-mono text-xs text-gray-300 border-b border-[#313233ad]/60 bg-[#0d0e10]">
            <div class="text-center font-bold text-white mb-2">${post.media.title}</div>
            <div class="text-center text-gray-400 mb-4">${post.media.subtitle}</div>
            <div class="text-[11px] text-gray-400 leading-relaxed">${post.media.abstract}</div>
          </div>
        </div>
      `;
    } else if (post.media.type === "video") {
      mediaHtml = `
        <div class="tweetMedia mt-3 rounded-2xl border border-[#313233ad] overflow-hidden bg-[#16181c] flex items-center justify-center max-h-[600px] w-fit max-w-full">
          <video controls class="max-w-full max-h-[600px] w-auto h-auto object-contain mx-auto block">
            <source src="${mediaUrl}" type="video/mp4" />
          </video>
        </div>
      `;
    } else if (post.media.type === "image") {
      mediaHtml = `
        <div class="tweetMedia mt-3 rounded-2xl border border-[#313233ad] overflow-hidden bg-[#16181c] min-h-[260px] flex items-center justify-center max-h-[600px] w-fit max-w-full relative group">
          <div class="lazy-placeholder absolute inset-0 bg-[#1e2024] animate-pulse rounded-2xl flex items-center justify-center">
            <svg class="size-6 text-[#71767b] animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </div>
          <img data-src="${mediaUrl}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" alt="${post.media.alt || ''}" class="lazy-image opacity-0 transition-opacity duration-300 max-w-full max-h-[600px] w-auto h-auto object-contain mx-auto block relative z-[1]" />
        </div>
      `;
    }
  }

  const likeSvgPath = isLiked
    ? "M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"
    : "M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z";

  const postHandleLow = (post.handle || "").toLowerCase();
  const myHandleLow = (currentUser?.handle || "@veerpratapsaw").toLowerCase();
  const isMyPost = postHandleLow === myHandleLow || postHandleLow === "@vps" || !postHandleLow;

  let inlineFollowHtml = "";
  if (!isMyPost && post.handle) {
    const followingList = getPersistedUserFollowing();
    const isFollowingAuthor = followingList.some(fh => {
      const fLow = fh.toLowerCase();
      if (fLow === postHandleLow) return true;
      if (fLow === "@akshay" && postHandleLow === "@akshaykumar") return true;
      if (fLow === "@akshaykumar" && postHandleLow === "@akshay") return true;
      return false;
    });
    if (isFollowingAuthor) {
      inlineFollowHtml = `<button class="post-inline-follow-btn border border-[#536471] text-white bg-transparent font-bold rounded-full text-[11px] px-2.5 py-0.5 transition-colors shrink-0 ml-2" data-handle="${post.handle}" data-following="true">Following</button>`;
    } else {
      inlineFollowHtml = `<button class="post-inline-follow-btn border-0 text-black bg-white font-bold rounded-full text-[11px] px-2.5 py-0.5 transition-colors shrink-0 ml-2 hover:bg-[#eff3f4]" data-handle="${post.handle}" data-following="false">Follow</button>`;
    }
  }

  postCard.innerHTML = `
    <div class="leftCol shrink-0 flex flex-col items-end">
      ${repostTopHtml}
      <img class="size-10 rounded-full object-cover border border-[#313233ad]" src="${avatarUrl}" alt="${post.author}" />
    </div>
    <div class="rightCol flex-1 min-w-0">
      ${repostLabelHtml}
      <div class="authorRow flex items-center justify-between text-sm">
        <div class="flex items-center gap-1 min-w-0 overflow-hidden">
          <span class="font-bold text-white hover:underline truncate">${post.author}</span>
          ${post.verified ? `<img class="w-4 shrink-0" src="/assets/svg/lock.svg" alt="Verified" />` : ''}
          <span class="text-[#71767b] truncate min-w-0">${post.handle} · ${timeDisplay}</span>
          ${inlineFollowHtml}
        </div>
        <div class="more text-[#71767b] hover:text-[#1d9bf0] p-1.5 hover:bg-[#1d9cf01e] rounded-full transition-colors">
          <img class="w-4 invert opacity-60" src="/assets/svg/morefilled.svg" alt="More" />
        </div>
      </div>
      <div class="tweetText text-sm text-[#e7e9ea] mt-1 leading-normal">${post.text}</div>
      ${mediaHtml}
      <div class="actions flex justify-between items-center text-[#71767b] text-xs mt-3 max-w-md pr-4">
        <div class="flex items-center gap-1.5 hover:text-[#1d9bf0] group cursor-pointer transition-colors replyAction" data-id="${postId}" title="Comment">
          <div class="p-2 group-hover:bg-[#1d9cf01e] rounded-full"><svg viewBox="0 0 24 24" aria-hidden="true" class="size-4 fill-current"><path d="M20.7 11.7c0-4.48-3.844-8.2-8.699-8.2-4.854 0-8.698 3.72-8.698 8.2v.015l-.001.014c-.02.667.09 1.225.25 1.767.083.28.176.545.276.839.098.285.202.595.288.918.177.663.284 1.401.156 2.271-.086.582-.274 1.191-.582 1.855 1.264.375 2.55.053 4.013-.599l.455-.203.437.242c1.07.594 1.917 1.08 3.406 1.08 4.855 0 8.7-3.72 8.7-8.199zm2 0c0 5.683-4.84 10.2-10.699 10.2-1.784 0-2.96-.555-3.95-1.095-1.876.768-4.02 1.2-6.245-.075l-.885-.505.524-.875c.54-.904.77-1.581.848-2.118.078-.526.02-.98-.11-1.463-.066-.25-.15-.502-.247-.788-.095-.277-.204-.59-.301-.92-.199-.674-.36-1.449-.332-2.39C1.322 6.002 6.154 1.5 12.002 1.5c5.859 0 10.7 4.518 10.7 10.2z"></path></svg></div>
          <span class="reply-count-span">${post.stats?.replies || "0"}</span>
        </div>
        <div class="flex items-center gap-1.5 ${isReposted ? 'text-[#00ba7c]' : ''} hover:text-[#00ba7c] group cursor-pointer transition-colors repostAction" data-id="${postId}" title="Repost">
          <div class="p-2 group-hover:bg-[#00ba7c1e] rounded-full"><svg viewBox="0 0 24 24" aria-hidden="true" class="size-4 fill-current"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></svg></div>
          <span class="repost-count-span">${post.stats?.reposts || "0"}</span>
        </div>
        <div class="flex items-center gap-1.5 ${isLiked ? 'text-[#f91880]' : ''} hover:text-[#f91880] group cursor-pointer transition-colors likeAction" data-id="${postId}" title="Like">
          <div class="p-2 group-hover:bg-[#f918801e] rounded-full"><svg viewBox="0 0 24 24" aria-hidden="true" class="size-4 fill-current"><path d="${likeSvgPath}"></path></svg></div>
          <span class="like-count-span">${post.stats?.likes || "0"}</span>
        </div>
        <div class="flex items-center gap-1.5 hover:text-[#1d9bf0] group cursor-pointer transition-colors viewsAction" data-id="${postId}" title="Views / Impressions">
          <div class="p-2 group-hover:bg-[#1d9cf01e] rounded-full"><svg viewBox="0 0 24 24" aria-hidden="true" class="size-4 fill-current"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></svg></div>
          <span class="view-count-span">${post.stats?.views || "1"}</span>
        </div>
        <div class="flex items-center gap-1.5 ${isBookmarked ? 'text-[#1d9bf0]' : ''} hover:text-[#1d9bf0] group cursor-pointer transition-colors bookmarkAction" data-id="${postId}" title="Bookmark">
          <div class="p-2 group-hover:bg-[#1d9cf01e] rounded-full"><svg viewBox="0 0 24 24" aria-hidden="true" class="size-4 fill-current"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"></path></svg></div>
          <span class="bookmark-count-span">${post.stats?.bookmarks || "0"}</span>
        </div>
      </div>

      <!-- Inline YouTube-style Comment Infrastructure -->
      <div class="yt-comments-section border-t border-[#313233ad]/40 pt-3 mt-3 hidden w-full" id="comments-section-${postId}">
        <div class="flex items-center gap-2.5 mb-3">
          <img class="size-7 rounded-full object-cover shrink-0 border border-[#313233ad]" src="${currentUser?.avatar || '/assets/user/headShot.jpg'}" alt="Your avatar" />
          <input type="text" placeholder="Add a comment..." class="flex-1 bg-[#16181c] border border-[#313233ad] rounded-full px-4 py-2 text-xs text-white placeholder-gray-500 focus:border-[#1d9bf0] focus:outline-none yt-comment-input" data-post-id="${postId}" />
          <button class="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-4 py-1.5 rounded-full text-xs transition-colors yt-comment-submit cursor-pointer shrink-0" data-post-id="${postId}">Comment</button>
        </div>
        <div class="yt-comments-list space-y-3 max-h-96 overflow-y-auto pr-1 divide-y divide-[#313233ad]/30">
          <div class="text-center py-2 text-xs text-[#71767b]">Loading comments...</div>
        </div>
      </div>
    </div>
  `;

  return postCard;
}

export async function initFeed() {
  const container = document.querySelector(".posts");
  if (!container) return;

  container.innerHTML = "";

  try {
    // 1. Fetch live posts from our Node.js + Express + MongoDB backend
    const res = await fetch(`${API_BASE_URL}/api/posts`);
    if (!res.ok) throw new Error("Backend responded with error status");
    const posts = await res.json();

    posts.forEach((post) => {
      // MongoDB uses `_id` by default, but our frontend can handle both `_id` and `id`
      const normalizedPost = { ...post, id: post._id || post.id };
      const card = renderPostCard(normalizedPost);
      container.appendChild(card);
    });
    console.log(`✅ Loaded ${posts.length} live posts directly from MongoDB!`);
    initXVideoPlayers();
    observeLazyImages();
  } catch (err) {
    console.warn("⚠️ Backend API offline/error. Using local fallback feedData:", err.message);
    // 2. Fall back cleanly to local JS feed data if backend isn't running
    initialPosts.forEach((post) => {
      const card = renderPostCard(post);
      container.appendChild(card);
    });
    initXVideoPlayers();
    observeLazyImages();
  }
}

/**
 * Preemptive Lazy Loading using IntersectionObserver
 * Triggers ~2 cards / images ahead (900px rootMargin) for ultra-fast pre-downloading before scrolling into viewport.
 */
const preemptiveObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      const actualSrc = img.getAttribute("data-src");
      if (actualSrc) {
        const tempImg = new Image();
        tempImg.onload = () => {
          img.src = actualSrc;
          img.classList.remove("opacity-0");
          img.classList.add("opacity-100");
          const placeholder = img.parentElement?.querySelector(".lazy-placeholder");
          if (placeholder) placeholder.remove();
        };
        tempImg.onerror = () => {
          img.src = actualSrc;
          img.classList.remove("opacity-0");
          img.classList.add("opacity-100");
          const placeholder = img.parentElement?.querySelector(".lazy-placeholder");
          if (placeholder) placeholder.remove();
        };
        tempImg.src = actualSrc;
        img.removeAttribute("data-src");
      }
      observer.unobserve(img);
    }
  });
}, {
  root: null,
  rootMargin: "900px 0px 900px 0px", // 900px before reaching viewport (~2 cards above/below)
  threshold: 0.01
});

export function observeLazyImages() {
  document.querySelectorAll(".lazy-image[data-src]").forEach(img => {
    preemptiveObserver.observe(img);
  });
}
