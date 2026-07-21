import "./style.css";
import { initLayout } from "./modules/layout.js";
import { initFeed } from "./modules/feedRenderer.js";
import { initXVideoPlayers } from "./modules/videoPlayer.js";
import { initCreatePost } from "./modules/createPost.js";
import { initTweetActions } from "./modules/tweetActions.js";
import { initAuth } from "./modules/auth.js";
import { initInteractiveFeatures } from "./modules/interactiveFeatures.js";
import { initGrokUI } from "./modules/grokUI.js";

// Foolproof Splash Screen Removal Helper
const hideSplash = () => {
  const splash = document.getElementById("x-loading-splash");
  if (splash && !splash.dataset.hidden) {
    splash.dataset.hidden = "true";
    splash.classList.add("opacity-0");
    setTimeout(() => splash.remove(), 500);
  }
};

// Global safety fallback: guarantee splash screen is hidden after 700ms even if network or scripts delay
setTimeout(hideSplash, 700);
window.addEventListener("load", hideSplash);

// Main Entry Point: Initialize Auth, Layout, Dynamic Feed, Custom X Video Players, Post Creation, Tweet Actions, and Interactive Navigation features when DOM is ready
const startApp = () => {
  if (window.__xAppStarted) return;
  window.__xAppStarted = true;

  try { initAuth(); } catch (err) { console.error("Init error (Auth):", err); }
  try { initLayout(); } catch (err) { console.error("Init error (Layout):", err); }
  try { initFeed(); } catch (err) { console.error("Init error (Feed):", err); }
  try { initXVideoPlayers(); } catch (err) { console.error("Init error (Video):", err); }
  try { initCreatePost(); } catch (err) { console.error("Init error (CreatePost):", err); }
  try { initTweetActions(); } catch (err) { console.error("Init error (TweetActions):", err); }
  try { initInteractiveFeatures(); } catch (err) { console.error("Init error (InteractiveFeatures):", err); }
  try { initGrokUI(); } catch (err) { console.error("Init error (GrokUI):", err); }

  // Trigger splash fadeout cleanly right as initial rendering completes
  setTimeout(hideSplash, 350);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}