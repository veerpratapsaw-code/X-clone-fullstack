import { initXVideoPlayers } from "./videoPlayer.js";
import { renderPostCard } from "./feedRenderer.js";
import { initTweetActions } from "./tweetActions.js";
import { getToken, getCurrentUser } from "./auth.js";
import { API_BASE_URL } from "../config.js";

const MAX_CHARS = 280;

export function initCreatePost() {
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
      avatar: user?.avatar || "/src/assets/user/headShot.jpg",
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

    // 3. Initialize custom video player if video uploaded, and attach tweet action listeners
    if (mediaObj?.type === "video") {
      initXVideoPlayers();
    }
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
