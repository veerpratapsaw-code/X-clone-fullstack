import { createOverlayMarkup } from "./videoTemplate.js";
import { bindVideoEvents, xGlobalSound } from "./videoEvents.js";
import { bindVideoSettings } from "./videoSettings.js";

// Main Video Player Initialization & Autoplay IntersectionObserver
export function initXVideoPlayers() {
  const videos = document.querySelectorAll(".tweetMedia video, .post video");

  videos.forEach((video) => {
    if (video.dataset.xInit === "true") return;
    video.dataset.xInit = "true";

    // Remove native browser controls & configure initial state
    video.removeAttribute("controls");
    video.loop = true;
    video.playsInline = true;
    video.muted = xGlobalSound.muted;
    video.volume = xGlobalSound.muted ? 0 : xGlobalSound.volume;

    // Wrap video in a custom player container
    const container = document.createElement("div");
    container.className =
      "x-video-container relative group/player overflow-hidden rounded-2xl border border-[#313233ad] bg-[#16181c] flex items-center justify-center max-h-[600px] w-fit max-w-full mx-auto select-none paused";

    // Replace video element in DOM with container, then append video
    video.parentNode.insertBefore(container, video);
    container.appendChild(video);

    // Center Big Play Badge (Visible when paused)
    const centerBadge = document.createElement("div");
    centerBadge.className =
      "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-14 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white pointer-events-none opacity-100 transition-opacity duration-200 z-10 center-badge";
    centerBadge.innerHTML = `<svg class="size-7 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    container.appendChild(centerBadge);

    // Bottom Controls Overlay
    const overlay = document.createElement("div");
    overlay.className =
      "x-video-controls absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-10 pb-2.5 px-3.5 opacity-0 group-hover/player:opacity-100 group-[.paused]/player:opacity-100 group-[.show-controls]/player:opacity-100 max-sm:opacity-100 transition-opacity duration-200 flex flex-col gap-2 z-20";

    overlay.innerHTML = createOverlayMarkup(video);
    container.appendChild(overlay);

    // Bind event controllers from modularized helpers
    bindVideoEvents(video, container, overlay, centerBadge);
    bindVideoSettings(video, container, overlay);
  });

  // Autoplay with Mute when Scrolling into View (IntersectionObserver)
  if ("IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const container = video.closest(".x-video-container");
          if (!container) return;

          if (entry.isIntersecting) {
            if (video.paused) {
              video.muted = xGlobalSound.muted;
              video.volume = xGlobalSound.muted ? 0 : xGlobalSound.volume;
              if (video.__updateVolumeUI) video.__updateVolumeUI();

              video.play().catch(() => {
                video.muted = true;
                video.volume = 0;
                if (video.__updateVolumeUI) video.__updateVolumeUI();
                video.play().catch(() => {});
              });
            }
          } else {
            if (!video.paused) {
              video.pause();
            }
            try {
              video.currentTime = 0;
            } catch (err) {}
          }
        });
      },
      { threshold: 0.6 }
    );

    videos.forEach((video) => videoObserver.observe(video));
  }
}
