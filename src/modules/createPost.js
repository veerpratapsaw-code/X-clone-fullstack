import { initXVideoPlayers } from "./videoPlayer.js";
import { renderPostCard, observeLazyImages } from "./feedRenderer.js";
import { initTweetActions } from "./tweetActions.js";
import { getToken, getCurrentUser } from "./auth.js";
import { API_BASE_URL } from "../config.js";

const MAX_CHARS = 280;

export function initCreatePost() {
  // Wire left sidebar and mobile Post buttons to open the standalone floating Create Post Modal
  const leftPostBtn = document.querySelector(".left .postbtn button");
  if (leftPostBtn) {
    leftPostBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openCreatePostModal();
    });
  }
  document.querySelectorAll(".mobile-post-btn, button[aria-label='Post']").forEach(btn => {
    if (btn !== leftPostBtn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openCreatePostModal();
      });
    }
  });

  const createBox = document.querySelector(".createPost");
  if (!createBox) return;

  const textarea = createBox.querySelector("textarea");
  const mediaBtn = createBox.querySelector(".media-icon-btn");
  const fileInput = createBox.querySelector(".media-file-input");
  const previewBox = createBox.querySelector(".media-preview-container");
  const postBtn = createBox.querySelector(".postBtn button");
  const charCounter = createBox.querySelector(".char-counter");
  const charRing = createBox.querySelector(".char-counter-ring");
  const charText = createBox.querySelector(".char-counter-text");
  const postsContainer = document.querySelector(".posts");

  let selectedFiles = [];

  // Render Media Previews
  const renderPreviews = () => {
    previewBox.innerHTML = "";
    selectedFiles.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "relative rounded-xl overflow-hidden border border-[#313233ad] bg-[#16181c] max-h-48 w-fit shadow-md group/prev";
      
      if (item.type.startsWith("video/")) {
        card.innerHTML = `<video src="${item.url}" class="max-h-48 w-auto object-cover"></video>`;
      } else {
        card.innerHTML = `<img src="${item.url}" class="max-h-48 w-auto object-cover" />`;
      }

      const removeBtn = document.createElement("button");
      removeBtn.className = "absolute top-1.5 right-1.5 bg-black/80 hover:bg-black text-white rounded-full p-1 transition-colors z-10 cursor-pointer";
      removeBtn.innerHTML = `<svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg>`;
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        URL.revokeObjectURL(item.url);
        selectedFiles.splice(index, 1);
        renderPreviews();
        updatePostState();
      });

      card.appendChild(removeBtn);
      previewBox.appendChild(card);
    });
  };

  // Update Character Counter and Post Button state (Throttled via requestAnimationFrame for zero-lag performance)
  let isInputTicking = false;
  const updatePostState = () => {
    // Cap auto-resize to max 350px to prevent DOM height thrashing and lag when pasting large text
    textarea.style.height = "auto";
    const scrollH = textarea.scrollHeight;
    const newHeight = Math.min(350, scrollH);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = scrollH > 350 ? "auto" : "hidden";

    const textLen = textarea.value.trim().length;
    const hasMedia = selectedFiles.length > 0;
    const isValid = (textLen > 0 || hasMedia) && textLen <= MAX_CHARS;

    const charSvg = charCounter.querySelector(".char-counter-svg");

    if (textLen > 0 || hasMedia) {
      charCounter.classList.remove("hidden");
      charCounter.classList.add("flex");
      const pct = Math.min(100, Math.max(0, (textLen / MAX_CHARS) * 100));
      charRing.setAttribute("stroke-dasharray", `${pct}, 100`);

      if (textLen > MAX_CHARS) {
        // Over limit (e.g. -1444 or -17619560): Hide circle ring and show clean red text counter
        charSvg?.classList.add("hidden");
        charText.classList.remove("absolute", "text-[10px]", "text-[#71767b]", "text-[#ffad1f]");
        charText.classList.add("relative", "text-sm", "font-normal", "text-[#f91880]");
        charText.textContent = MAX_CHARS - textLen;
        charText.classList.remove("hidden");
      } else if (textLen >= MAX_CHARS - 20) {
        // Near limit (260 - 280): Show orange ring with countdown inside circle
        charSvg?.classList.remove("hidden");
        charRing.classList.replace("text-[#1d9bf0]", "text-[#ffad1f]");
        charText.classList.remove("relative", "text-sm", "font-normal", "text-[#f91880]", "text-[#71767b]");
        charText.classList.add("absolute", "text-[10px]", "font-bold", "text-[#ffad1f]");
        charText.textContent = MAX_CHARS - textLen;
        charText.classList.remove("hidden");
      } else {
        // Normal typing (< 260 chars): Show blue ring only
        charSvg?.classList.remove("hidden");
        charRing.classList.add("text-[#1d9bf0]");
        charRing.classList.remove("text-[#ffad1f]", "text-[#f91880]");
        charText.classList.add("hidden");
      }
    } else {
      charCounter.classList.add("hidden");
      charCounter.classList.remove("flex");
    }

    if (isValid) {
      postBtn.disabled = false;
      postBtn.classList.replace("opacity-50", "opacity-100");
    } else {
      postBtn.disabled = true;
      postBtn.classList.replace("opacity-100", "opacity-50");
    }

    isInputTicking = false;
  };

  textarea.addEventListener("input", () => {
    if (!isInputTicking) {
      requestAnimationFrame(updatePostState);
      isInputTicking = true;
    }
  });
  mediaBtn?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      selectedFiles.push({ file, url: URL.createObjectURL(file), type: file.type });
    });
    fileInput.value = "";
    renderPreviews();
    updatePostState();
  });

  // Handle Publishing New Tweet to Feed
  postBtn?.addEventListener("click", async () => {
    const text = textarea.value.trim();
    if (!text && selectedFiles.length === 0) return;

    // Show loading state while uploading to Cloudinary / CDN
    const originalBtnText = postBtn.textContent;
    postBtn.disabled = true;
    postBtn.classList.add("opacity-60", "cursor-wait");

    // Prepare media object if files were selected
    let mediaObj = undefined;
    if (selectedFiles.length > 0) {
      const first = selectedFiles[0];
      postBtn.textContent = "Uploading to Cloud...";

      try {
        const formData = new FormData();
        formData.append("file", first.file);

        const headers = {};
        const token = getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          headers,
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          mediaObj = {
            type: uploadData.type || (first.type.startsWith("video/") ? "video" : "image"),
            url: uploadData.url,
            alt: "User uploaded cloud media",
          };
          console.log(`☁️ Media successfully stored at (${uploadData.storage}):`, uploadData.url);
        } else {
          console.warn("Upload endpoint returned error, using local object URL fallback");
          mediaObj = {
            type: first.type.startsWith("video/") ? "video" : "image",
            url: first.url,
            alt: "User uploaded media",
          };
        }
      } catch (uploadErr) {
        console.warn("⚠️ Upload failed (is backend running?):", uploadErr.message);
        mediaObj = {
          type: first.type.startsWith("video/") ? "video" : "image",
          url: first.url,
          alt: "User uploaded media",
        };
      }
    }

    postBtn.textContent = "Posting...";

    const user = getCurrentUser();
    const postPayload = {
      author: user?.username || "Veer Pratap Saw",
      handle: user?.handle || "@Veerpratapsaw",
      avatar: user?.avatar || "/assets/user/headShot.jpg",
      verified: user?.verified ?? true,
      text: text,
      media: mediaObj,
    };

    let postToRender = postPayload;

    try {
      // 1. Send POST request to save new tweet permanently in MongoDB via our Express server
      const headers = { "Content-Type": "application/json" };
      const token = getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: "POST",
        headers,
        body: JSON.stringify(postPayload),
      });
      if (res.ok) {
        const savedPost = await res.json();
        postToRender = { ...savedPost, id: savedPost._id || savedPost.id };
        console.log("✅ Successfully saved new post to MongoDB:", postToRender.id);
      }
    } catch (err) {
      console.warn("⚠️ Backend API offline/error while saving. Rendering locally:", err.message);
    }

    // 2. Render exact unified card using renderPostCard
    const postCard = renderPostCard(postToRender);
    postCard.classList.add("animate-[fadeInPop_0.25s_ease-out]");
    postsContainer?.prepend(postCard);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // 3. Initialize custom video player if video uploaded, and attach tweet action listeners
    if (mediaObj?.type === "video") {
      initXVideoPlayers();
    }
    observeLazyImages();
    initTweetActions();

    // Reset Form & Button
    textarea.value = "";
    textarea.style.height = "auto";
    selectedFiles = [];
    renderPreviews();
    postBtn.textContent = originalBtnText;
    postBtn.classList.remove("cursor-wait");
    updatePostState();
  });
}

/**
 * Opens floating mobile/desktop Post creation modal right in the center of the viewport
 */
export function openCreatePostModal() {
  document.querySelectorAll(".x-create-post-modal").forEach(el => el.remove());
  const user = getCurrentUser() || { username: "Veer Pratap Saw", handle: "@vps", avatar: "/assets/user/headShot.jpg" };

  const modal = document.createElement("div");
  modal.className = "x-create-post-modal fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 p-4 overflow-y-auto animate-[fadeInPop_0.2s_ease-out]";
  modal.innerHTML = `
    <div class="bg-[#000000] border border-[#313233ad] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto relative">
      <div class="flex items-center justify-between px-4 py-3 border-b border-[#313233ad]/60 bg-[#000000]/90 sticky top-0 z-40 backdrop-blur-sm">
        <button class="close-create-modal p-2 hover:bg-[#181818] rounded-full text-white cursor-pointer transition-colors">
          <svg class="size-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>
        </button>
        <span class="text-sm font-bold text-[#1d9bf0]">Drafts</span>
      </div>
      <div class="p-4 flex gap-3">
        <img class="size-10 rounded-full object-cover shrink-0 border border-[#313233ad]" src="${user.avatar || '/assets/user/headShot.jpg'}" alt="${user.username}" />
        <div class="flex-1 min-w-0">
          <textarea rows="4" placeholder="What’s happening?" class="w-full bg-transparent text-white placeholder-gray-500 text-lg focus:outline-none resize-none break-words modal-textarea"></textarea>
          <div class="modal-preview-container flex flex-wrap gap-3 mt-2 empty:hidden"></div>
          <input type="file" accept="image/*,video/*" class="hidden modal-file-input" multiple />
          
          <div class="flex items-center justify-between mt-4 pt-3 border-t border-[#313233ad]/40">
            <div class="flex items-center gap-1 text-[#1d9bf0]">
              <button class="p-2 hover:bg-[#1d9bf0]/10 rounded-full cursor-pointer transition-colors modal-media-btn" title="Media">
                <svg viewBox="0 0 24 24" aria-hidden="true" class="size-5 fill-current"><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></svg>
              </button>
            </div>
            <button class="modal-post-submit bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-5 py-2 rounded-full text-sm transition-colors cursor-pointer shadow-md opacity-50 cursor-not-allowed" disabled>Post</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector(".close-create-modal");
  const textarea = modal.querySelector(".modal-textarea");
  const mediaBtn = modal.querySelector(".modal-media-btn");
  const fileInput = modal.querySelector(".modal-file-input");
  const previewBox = modal.querySelector(".modal-preview-container");
  const submitBtn = modal.querySelector(".modal-post-submit");
  const postsContainer = document.querySelector(".posts");

  let selectedFiles = [];

  closeBtn.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

  mediaBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    Array.from(e.target.files).forEach(file => {
      selectedFiles.push({ file, url: URL.createObjectURL(file), type: file.type });
    });
    renderModalPreviews();
    checkValid();
  });

  const renderModalPreviews = () => {
    previewBox.innerHTML = "";
    selectedFiles.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "relative rounded-xl overflow-hidden border border-[#313233ad] bg-[#16181c] max-h-40 w-fit";
      if (item.type.startsWith("video/")) {
        card.innerHTML = `<video src="${item.url}" class="max-h-40 w-auto object-cover"></video>`;
      } else {
        card.innerHTML = `<img src="${item.url}" class="max-h-40 w-auto object-cover" />`;
      }
      const rm = document.createElement("button");
      rm.className = "absolute top-1 right-1 bg-black/80 hover:bg-black text-white rounded-full p-1 text-xs cursor-pointer";
      rm.innerHTML = "✕";
      rm.addEventListener("click", () => { selectedFiles.splice(idx, 1); renderModalPreviews(); checkValid(); });
      card.appendChild(rm);
      previewBox.appendChild(card);
    });
  };

  const checkValid = () => {
    const len = textarea.value.trim().length;
    if (len > 0 || selectedFiles.length > 0) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
  };

  textarea.addEventListener("input", checkValid);
  setTimeout(() => textarea.focus(), 50);

  submitBtn.addEventListener("click", async () => {
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "Posting...";

    let mediaPayload = null;
    if (selectedFiles.length > 0) {
      const first = selectedFiles[0];
      const type = first.type.startsWith("video/") ? "video" : "image";
      let base64Url = first.url;
      try {
        base64Url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(first.file);
        });
      } catch (e) {}
      mediaPayload = { type, url: base64Url };
    }

    const payload = {
      author: user.username || "Veer Pratap Saw",
      handle: user.handle || "@vps",
      avatar: user.avatar || "/assets/user/headShot.jpg",
      verified: user.verified || false,
      text: textarea.value.trim(),
      media: mediaPayload,
      stats: { replies: "0", reposts: "0", likes: "0", views: "1" }
    };

    let postToRender = payload;
    try {
      const headers = { "Content-Type": "application/json" };
      const token = getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/api/posts`, { method: "POST", headers, body: JSON.stringify(payload) });
      if (res.ok) {
        const saved = await res.json();
        postToRender = { ...saved, id: saved._id || saved.id };
      }
    } catch (e) {}

    const postCard = renderPostCard(postToRender);
    postCard.classList.add("animate-[fadeInPop_0.25s_ease-out]");
    postsContainer?.prepend(postCard);
    window.scrollTo({ top: 0, behavior: "smooth" });
    observeLazyImages();
    initTweetActions();
    modal.remove();
  });
}
