import { getPlayPauseIcon, getSpeakerIcon } from "./videoIcons.js";

// Generates the complete HTML markup for the X / Twitter Custom Video Overlay
export function createOverlayMarkup(video) {
  return `
    <!-- Progress Track / Scrubber -->
    <div class="video-progress-track w-full h-1 bg-white/30 hover:bg-white/40 rounded-full cursor-pointer relative group/scrubber transition-all duration-150 py-1.5 -my-1.5 flex items-center">
      <div class="w-full h-1 group-hover/scrubber:h-1.5 bg-white/30 rounded-full relative overflow-visible transition-all duration-150">
        <div class="video-progress-fill absolute left-0 top-0 bottom-0 bg-white rounded-full w-0"></div>
        <div class="video-progress-dot absolute top-1/2 -translate-y-1/2 size-3.5 bg-white rounded-full shadow-md opacity-0 group-hover/scrubber:opacity-100 transition-opacity duration-150" style="left: 0%;"></div>
      </div>
    </div>

    <!-- Controls Row -->
    <div class="flex items-center justify-between text-white text-xs font-medium">
      <!-- Left Controls (Hidden on mobile phones as tap-to-play handles it) -->
      <div class="flex items-center gap-3 max-sm:hidden">
        <button class="play-pause-btn p-1 hover:text-[#1d9bf0] transition-colors focus:outline-none">
          ${getPlayPauseIcon(true)}
        </button>
      </div>

      <!-- Right Controls -->
      <div class="flex items-center gap-3.5 max-sm:w-full max-sm:justify-between">
        <!-- Time Display -->
        <span class="video-time text-[#e7e9ea] font-mono text-[11px]">0:00 / 0:00</span>

        <!-- Volume & Mute with Vertical Range Slider -->
        <div class="relative group/vol flex items-center z-40">
          <button class="mute-btn p-1.5 hover:text-[#1d9bf0] transition-colors focus:outline-none relative z-40 cursor-pointer" title="Mute/Unmute">
            ${getSpeakerIcon(video.muted, video.volume)}
          </button>
          <div class="x-volume-popup absolute bottom-full left-1/2 -translate-x-1/2 pb-2.5 w-10 opacity-0 pointer-events-none group-hover/vol:opacity-100 group-hover/vol:pointer-events-auto transition-all duration-200 ease-out z-50">
            <div class="w-9 h-28 bg-[#16181c]/95 backdrop-blur-md border border-[#313233ad] rounded-xl py-3 flex flex-col items-center justify-center shadow-2xl">
              <div class="relative w-6 h-20 flex items-center justify-center">
                <input type="range" min="0" max="1" step="0.05" value="0" class="x-volume-slider -rotate-90 origin-center w-20 h-1.5 cursor-pointer accent-[#1d9bf0]" />
              </div>
            </div>
          </div>
        </div>

        <!-- Settings (Gear) Button & Menu -->
        <div class="relative group/settings flex items-center">
          <button class="settings-btn p-1 hover:text-[#1d9bf0] transition-colors focus:outline-none">
            <svg class="size-4 fill-current transition-transform duration-300" viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l-.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </button>
          
          <!-- Settings Popup Menu -->
          <div class="x-settings-menu absolute bottom-full right-0 mb-2.5 w-56 bg-[#16181c]/95 backdrop-blur-md border border-[#313233ad] rounded-2xl py-2 shadow-2xl text-white text-xs z-50 hidden">
            <!-- Main Settings View -->
            <div class="settings-view-main">
              <div class="settings-item-speed flex items-center justify-between px-4 py-2.5 hover:bg-white/10 cursor-pointer transition-colors">
                <span class="flex items-center gap-2.5">
                  <svg class="size-4 fill-current opacity-80" viewBox="0 0 24 24"><path d="M10 8v8l6-4-6-4zm2-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                  Playback speed
                </span>
                <span class="text-[#71767b] font-medium speed-val">1x</span>
              </div>
              <div class="settings-item-quality flex items-center justify-between px-4 py-2.5 hover:bg-white/10 cursor-pointer transition-colors">
                <span class="flex items-center gap-2.5">
                  <svg class="size-4 fill-current opacity-80" viewBox="0 0 24 24"><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.89-2-2-2zm0 14H5V6h14v12z"/></svg>
                  Video quality
                </span>
                <span class="text-[#71767b] font-medium quality-val">Auto (1080p)</span>
              </div>
              <div class="settings-item-download flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/10 cursor-pointer transition-colors">
                <svg class="size-4 fill-current opacity-80" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                <span>Download video</span>
              </div>
            </div>

            <!-- Speed Submenu View -->
            <div class="settings-view-speed hidden">
              <div class="settings-back flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer text-[#71767b] font-bold border-b border-[#313233ad] mb-1">
                <svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                <span>Playback speed</span>
              </div>
              ${[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => `
                <div class="speed-option flex items-center justify-between px-4 py-2 hover:bg-white/10 cursor-pointer" data-speed="${s}">
                  <span>${s}x</span>
                  ${s === 1 ? `<svg class="size-4 fill-[#1d9bf0] check-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>` : `<span class="check-icon"></span>`}
                </div>
              `).join('')}
            </div>

            <!-- Quality Submenu View -->
            <div class="settings-view-quality hidden">
              <div class="settings-back flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer text-[#71767b] font-bold border-b border-[#313233ad] mb-1">
                <svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                <span>Video quality</span>
              </div>
              ${['Auto (1080p)', '1080p', '720p', '480p'].map((q, idx) => `
                <div class="quality-option flex items-center justify-between px-4 py-2 hover:bg-white/10 cursor-pointer" data-quality="${q}">
                  <span>${q}</span>
                  ${idx === 0 ? `<svg class="size-4 fill-[#1d9bf0] check-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>` : `<span class="check-icon"></span>`}
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Picture-in-Picture (PiP) (Hidden on phones) -->
        <button class="pip-btn max-sm:hidden p-1 hover:text-[#1d9bf0] transition-colors focus:outline-none" title="Picture-in-Picture">
          <svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>
        </button>

        <!-- Fullscreen (Hidden on phones as double-click handles it) -->
        <button class="fullscreen-btn max-sm:hidden p-1 hover:text-[#1d9bf0] transition-colors focus:outline-none" title="Fullscreen">
          <svg class="size-4 fill-current" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
        </button>
      </div>
    </div>
  `;
}
