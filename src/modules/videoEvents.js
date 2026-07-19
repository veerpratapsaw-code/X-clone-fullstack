import { formatTime, getPlayPauseIcon, getSpeakerIcon } from "./videoIcons.js";

// Shared Global Sound Synchronization State
export let xGlobalSound = {
  muted: true,
  volume: 1
};

export function syncGlobalVideoSound(triggerVideo) {
  document.querySelectorAll(".x-video-container video").forEach((v) => {
    v.muted = xGlobalSound.muted;
    v.volume = xGlobalSound.muted ? 0 : xGlobalSound.volume;
    if (v.__updateVolumeUI) v.__updateVolumeUI();
  });
}

// Binds core playback, scrubber, and global sound handlers to a video instance
export function bindVideoEvents(video, container, overlay, centerBadge) {
  const playPauseBtn = overlay.querySelector(".play-pause-btn");
  const progressTrack = overlay.querySelector(".video-progress-track");
  const progressFill = overlay.querySelector(".video-progress-fill");
  const progressDot = overlay.querySelector(".video-progress-dot");
  const timeDisplay = overlay.querySelector(".video-time");
  const muteBtn = overlay.querySelector(".mute-btn");
  const volumeSlider = overlay.querySelector(".x-volume-slider");
  const volumePopup = overlay.querySelector(".x-volume-popup");

  // Play / Pause & Mobile Touch Controls Toggle Logic
  const togglePlay = () => {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 672) {
      container.classList.toggle("show-controls");
    }
  };

  playPauseBtn.addEventListener("click", togglePlay);
  video.addEventListener("click", togglePlay);

  video.addEventListener("play", () => {
    container.classList.remove("paused");
    centerBadge.style.opacity = "0";
    playPauseBtn.innerHTML = getPlayPauseIcon(false);
  });

  video.addEventListener("pause", () => {
    container.classList.add("paused");
    centerBadge.style.opacity = "1";
    playPauseBtn.innerHTML = getPlayPauseIcon(true);
  });

  // Time update & Progress scrubber synchronization
  const updateProgress = () => {
    if (isNaN(video.duration) || video.duration <= 0) return;
    const pct = (video.currentTime / video.duration) * 100;
    progressFill.style.width = `${pct}%`;
    progressDot.style.left = `${pct}%`;
    timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  };

  video.addEventListener("timeupdate", updateProgress);
  video.addEventListener("loadedmetadata", updateProgress);

  // Scrubber click/seek
  progressTrack.addEventListener("click", (e) => {
    const rect = progressTrack.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (!isNaN(video.duration)) {
      video.currentTime = pos * video.duration;
    }
  });

  // Volume & Mute toggle with global synchronization
  const updateVolumeUI = () => {
    muteBtn.innerHTML = getSpeakerIcon(video.muted, video.volume);
    volumeSlider.value = video.muted ? 0 : video.volume;
  };
  video.__updateVolumeUI = updateVolumeUI;

  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (video.muted) {
      xGlobalSound.muted = false;
      if (xGlobalSound.volume === 0) {
        xGlobalSound.volume = 1;
      }
    } else {
      xGlobalSound.muted = true;
    }
    syncGlobalVideoSound(video);
  });

  if (volumePopup) {
    volumePopup.addEventListener("click", (e) => e.stopPropagation());
    volumePopup.addEventListener("pointerdown", (e) => e.stopPropagation());
  }

  volumeSlider.addEventListener("click", (e) => e.stopPropagation());
  volumeSlider.addEventListener("pointerdown", (e) => e.stopPropagation());
  volumeSlider.addEventListener("input", (e) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    xGlobalSound.volume = val;
    xGlobalSound.muted = (val === 0);
    syncGlobalVideoSound(video);
  });
}
