import "./style.css";
import { initLayout } from "./modules/layout.js";
import { initFeed } from "./modules/feedRenderer.js";
import { initXVideoPlayers } from "./modules/videoPlayer.js";
import { initCreatePost } from "./modules/createPost.js";
import { initTweetActions } from "./modules/tweetActions.js";
import { initAuth } from "./modules/auth.js";
import { initInteractiveFeatures } from "./modules/interactiveFeatures.js";
import { initGrokUI } from "./modules/grokUI.js";

// Main Entry Point: Initialize Auth, Layout, Dynamic Feed, Custom X Video Players, Post Creation, Tweet Actions, and Interactive Navigation features when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initLayout();
  initFeed();
  initXVideoPlayers();
  initCreatePost();
  initTweetActions();
  initInteractiveFeatures();
  initGrokUI();
});