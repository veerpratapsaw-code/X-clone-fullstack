// Settings gear menu, submenus (speed, quality), download, PiP, and Fullscreen handlers

export function bindVideoSettings(video, container, overlay) {
  const settingsBtn = overlay.querySelector(".settings-btn");
  const settingsMenu = overlay.querySelector(".x-settings-menu");
  const pipBtn = overlay.querySelector(".pip-btn");
  const fullscreenBtn = overlay.querySelector(".fullscreen-btn");

  const viewMain = overlay.querySelector(".settings-view-main");
  const viewSpeed = overlay.querySelector(".settings-view-speed");
  const viewQuality = overlay.querySelector(".settings-view-quality");
  const speedValLabel = overlay.querySelector(".speed-val");
  const qualityValLabel = overlay.querySelector(".quality-val");

  // Settings Menu Toggle
  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    // Close other open menus
    document.querySelectorAll(".x-settings-menu").forEach((menu) => {
      if (menu !== settingsMenu) menu.classList.add("hidden");
    });

    settingsMenu.classList.toggle("hidden");
    if (!settingsMenu.classList.contains("hidden")) {
      viewMain.classList.remove("hidden");
      viewSpeed.classList.add("hidden");
      viewQuality.classList.add("hidden");
    }
  });

  // Close settings menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
      settingsMenu.classList.add("hidden");
    }
  });

  // Submenus Navigation
  overlay.querySelector(".settings-item-speed").addEventListener("click", (e) => {
    e.stopPropagation();
    viewMain.classList.add("hidden");
    viewSpeed.classList.remove("hidden");
  });

  overlay.querySelector(".settings-item-quality").addEventListener("click", (e) => {
    e.stopPropagation();
    viewMain.classList.add("hidden");
    viewQuality.classList.remove("hidden");
  });

  overlay.querySelectorAll(".settings-back").forEach((backBtn) => {
    backBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      viewSpeed.classList.add("hidden");
      viewQuality.classList.add("hidden");
      viewMain.classList.remove("hidden");
    });
  });

  // Speed Selection
  overlay.querySelectorAll(".speed-option").forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const speed = parseFloat(opt.dataset.speed);
      video.playbackRate = speed;
      speedValLabel.textContent = `${speed}x`;

      // Update checkmarks
      overlay.querySelectorAll(".speed-option").forEach((o) => {
        const check = o.querySelector(".check-icon");
        if (parseFloat(o.dataset.speed) === speed) {
          check.outerHTML = `<svg class="size-4 fill-[#1d9bf0] check-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
        } else {
          check.outerHTML = `<span class="check-icon"></span>`;
        }
      });

      settingsMenu.classList.add("hidden");
    });
  });

  // Quality Selection
  overlay.querySelectorAll(".quality-option").forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const qual = opt.dataset.quality;
      qualityValLabel.textContent = qual;

      // Update checkmarks
      overlay.querySelectorAll(".quality-option").forEach((o) => {
        const check = o.querySelector(".check-icon");
        if (o.dataset.quality === qual) {
          check.outerHTML = `<svg class="size-4 fill-[#1d9bf0] check-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
        } else {
          check.outerHTML = `<span class="check-icon"></span>`;
        }
      });

      settingsMenu.classList.add("hidden");
    });
  });

  // Download Video
  overlay.querySelector(".settings-item-download").addEventListener("click", (e) => {
    e.stopPropagation();
    const videoSrc = video.querySelector("source")?.src || video.src;
    if (videoSrc) {
      const a = document.createElement("a");
      a.href = videoSrc;
      a.download = videoSrc.split("/").pop() || "x-video.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    settingsMenu.classList.add("hidden");
  });

  // Picture-in-Picture
  pipBtn.addEventListener("click", async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP error:", err);
    }
  });

  // Fullscreen & Double Click Handler
  const toggleFullscreen = (e) => {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch((err) => console.error("Fullscreen error:", err));
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  fullscreenBtn.addEventListener("click", toggleFullscreen);
  video.addEventListener("dblclick", toggleFullscreen);
  container.addEventListener("dblclick", (e) => {
    if (e.target.closest(".x-video-controls") || e.target.closest(".x-settings-menu")) return;
    toggleFullscreen(e);
  });
}
