# 🌐 1. The Big Picture: Architecture Overview

This project is a **Full-Stack X (Twitter) Clone**. It is divided into two main architectural halves running within the same workspace:

```
[ Frontend: Vite + Vanilla JS + Tailwind CSS ] <=== REST API via fetch() ===> [ Backend: Express + MongoDB + Cloudinary ]
             (Runs on Port 5173)                                                          (Runs on Port 5000)
```

1. **Frontend (`src/` & Root)**: Built with **Vite**, **Vanilla JavaScript (ESM Modules)**, and **Tailwind CSS v4**. It handles the UI, dynamic feeds, custom video player controls, interactive modals, and user authentication screens.
2. **Backend (`backend/`)**: Built with **Node.js**, **Express**, and **MongoDB (Mongoose)**. It provides REST API endpoints (`/api/posts`, `/api/auth`, `/api/upload`), handles user authentication via **JWT (JSON Web Tokens)**, connects to MongoDB, and uploads media files (images/videos) to **Cloudinary** or local disk.

---

# ❓ 2. Why Are There Many Copies of the Same Files?

You might notice files that look like duplicates (such as multiple `index.html` files, multiple `assets/` folders, and two `package.json` files). Here is why each of them exists:

### 1. `dist/` vs. Root (`index.html` & `assets/`)
* **Root (`index.html`, `src/`)**: This is your **source code** where you write and edit code during development (`npm run dev`).
* **`dist/` Folder**: This stands for **Distribution** (Production Build). Whenever you run `npm run build` (`vite build`), Vite bundles, minifies, and optimizes your HTML, CSS, and JS files into the `dist/` directory.
  * *Why are there copies here?* `dist/index.html` and `dist/assets/` (like `index-BP-wjv0q.js` and `index-BY1jy02D.css`) are the automatically generated production files designed for deployment to hosting platforms (like Vercel or Netlify). **You never need to edit files in `dist/` manually.**

### 2. `src/assets/` vs. `public/assets/` vs. `dist/assets/`
* **`src/assets/`**: Contains raw media files (icons, SVGs, user avatars) that are directly imported inside JavaScript modules (`import icon from '../assets/icon.svg'`).
* **`public/assets/`**: Contains static files that Vite serves directly as `/assets/...` without processing or hashing them. They are used when code references absolute URLs directly in the DOM.
* **`dist/assets/`**: The compiled destination where Vite combines and outputs optimized versions of both `src/assets` and `public/assets` after a build.

### 3. Root `package.json` vs. `backend/package.json`
* Why two `package.json` and `package-lock.json` files?
  * **Root `package.json`**: Manages frontend tools and dependencies (`vite`, `@tailwindcss/vite`, `tailwindcss`) and root automation scripts (`npm run dev`, `npm run build`).
  * **`backend/package.json`**: Manages backend server libraries (`express`, `mongoose`, `cloudinary`, `bcryptjs`, `jsonwebtoken`, `cors`, `multer`, `dotenv`).
  * Keeping them separate keeps the frontend lightweight for web browsers while keeping backend Node.js libraries isolated on the server.

---

# 📂 3. Complete Directory & File Breakdown

Here is what every file inside your project does:

## ⚙️ Root Configuration Files
| File | Purpose |
| :--- | :--- |
| [package.json](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/package.json) | Root package file. Defines commands like `npm run dev` (starts Vite frontend server) and `npm run build`. |
| [vite.config.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/vite.config.js) | Vite configuration file that registers the `@tailwindcss/vite` plugin for Tailwind CSS v4. |
| [vercel.json](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/vercel.json) | Deployment rules for **Vercel**. Ensures all frontend URL routing redirects cleanly to `index.html` (Single-Page Application rewrite rules). |
| [index.html](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/index.html) | The main HTML skeleton of the entire app. Contains the navigation sidebar, feed container, right-hand sidebar, and modals. |

---

## 🎨 Frontend Source Code (`src/`)
| File / Directory | Purpose |
| :--- | :--- |
| [main.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/main.js) | **Main Frontend Entrypoint**. Runs when the webpage loads (`DOMContentLoaded`) and initializes authentication, layouts, feeds, video players, post creation, and tweet actions. |
| [style.css](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/style.css) | Imports Tailwind CSS v4 styling rules and defines custom utility classes, animations, and scrollbars. |
| [config.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/config.js) | Exports `API_BASE_URL`. Automatically connects to your live cloud backend on Render (`https://x-clone-fullstack.onrender.com`) or allows local overriding via environment variables. |

### 🛠️ Frontend Modules (`src/modules/`)
Each file in `src/modules/` handles one specific feature of the user interface:

| Module File | Purpose |
| :--- | :--- |
| [auth.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/auth.js) | Handles user Login, Signup, and Logout. Communicates with `/api/auth/login` and `/api/auth/register`, stores the JWT token in `localStorage`, and updates UI profile avatars. |
| [feedData.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/feedData.js) | Fetches posts (`/api/posts`), stores the active posts state, and contains fallback sample tweets when offline or loading. |
| [feedRenderer.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/feedRenderer.js) | Takes the post data from `feedData.js` and dynamically renders HTML tweet cards into the feed container (`#feed-posts`). |
| [createPost.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/createPost.js) | Controls the "What is happening?!" input box and modal. Handles file attachments (images/videos), uploads media via `/api/upload`, and creates new posts via `/api/posts`. |
| [tweetActions.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/tweetActions.js) | Manages interactive tweet buttons: Like (Heart), Repost (Retweet), Bookmark, Share, and Delete post. Sends instant updates to `/api/posts/:id/like` or `/api/posts/:id`. |
| [layout.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/layout.js) | Handles responsive layout behaviors, mobile menu toggles, and UI interactions on the navigation bars. |
| [videoPlayer.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/videoPlayer.js) | Core initializer for the **Custom X Video Player**. Scans the DOM for video elements and attaches X-styled UI wrappers. |
| [videoTemplate.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/videoTemplate.js) | Generates the HTML structure of the custom X video player (Play/Pause button, timeline scrubber, volume slider, fullscreen icon, settings gear). |
| [videoEvents.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/videoEvents.js) | Attaches click/drag event listeners to the custom video player controls (scrubbing, playback progress, mute/unmute). |
| [videoIcons.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/videoIcons.js) | Returns SVG icon strings used inside the custom video player (Play, Pause, Volume High/Mute, Fullscreen). |
| [videoSettings.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/videoSettings.js) | Controls playback speed (0.5x, 1x, 1.5x, 2x) and video quality/settings popup menus. |

---

## 🖥️ Backend Source Code (`backend/`)
The `backend/` folder is a self-contained Node.js & Express REST API:

| File / Directory | Purpose |
| :--- | :--- |
| [server.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/server.js) | **Main Backend Entrypoint**. Initializes Express, connects to MongoDB, sets up CORS/JSON body parsers, registers API routes (`/api/auth`, `/api/posts`, `/api/upload`), and starts listening on port `5000`. |
| [config/db.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/config/db.js) | Connects to your MongoDB database using `mongoose.connect()` using the connection string from `.env`. |
| [config/cloudinary.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/config/cloudinary.js) | Configures **Cloudinary** credentials (Cloud Name, API Key, API Secret) and exports helper functions (`uploadToCloudinary`, `deleteFromCloudinary`) for cloud media storage. |
| [models/User.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/models/User.js) | Mongoose Schema for User accounts (`name`, `handle`, `email`, `password` hash, `avatar`). |
| [models/Post.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/models/Post.js) | Mongoose Schema for Tweets/Posts (`user`, `content`, `mediaUrl`, `mediaType` [image/video], `likes`, `reposts`, `bookmarks`). |
| [routes/authRoutes.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/routes/authRoutes.js) | Handles user authentication endpoints: POST `/register` (hashes password with `bcryptjs` and issues JWT) and POST `/login`. |
| [routes/postRoutes.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/routes/postRoutes.js) | Handles post CRUD endpoints: GET `/` (fetch all posts), POST `/` (create post), PUT `/:id/like` (toggle like), DELETE `/:id`. |
| [routes/uploadRoutes.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/routes/uploadRoutes.js) | Handles POST `/api/upload`. Uses `multer` to accept file attachments, uploads them directly to Cloudinary (or local `uploads/` folder as fallback), and returns the media URL. |
| [middleware/authMiddleware.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/middleware/authMiddleware.js) | Protects private API routes. Verifies the `Authorization: Bearer <token>` header, decodes the JWT using `jsonwebtoken`, and attaches the user data to `req.user`. |
| [restartServer.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/restartServer.js) | Utility/helper script designed to gracefully stop and restart the backend Express server during development or debugging. |

---

# 🔗 4. How Everything Connects (The Flow of Data)

Here is exactly how the pieces communicate from the moment you open the browser:

```
[User opens index.html in Browser]
       │
       ▼
[src/main.js executes] ──► Calls initLayout(), initAuth(), initFeed(), initXVideoPlayers()
       │
       ├─► [src/modules/auth.js] Checks localStorage for JWT token to see if user is logged in.
       │
       ▼
[src/modules/feedData.js] Makes GET request using fetch() to API_BASE_URL + "/api/posts"
       │
       ▼
[backend/server.js (Express Port 5000 / Render Cloud)] Receives GET "/api/posts"
       │
       ├─► [backend/routes/postRoutes.js] Queries MongoDB using [models/Post.js]
       ├─► Returns JSON array of tweets sorted from newest to oldest
       │
       ▼
[src/modules/feedRenderer.js] Takes JSON array, builds HTML elements, and appends into #feed-posts
       │
       ▼
[src/modules/videoPlayer.js] Scans rendered posts for <video> tags and wraps them in custom X player controls
```

### 🎯 When You Create a New Post with a Photo/Video:
1. You type text into the input box and pick an image/video file.
2. [createPost.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/createPost.js) sends a `FormData` POST request to `/api/upload`.
3. [uploadRoutes.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/routes/uploadRoutes.js) processes the file with `multer` and uploads it to **Cloudinary** using [cloudinary.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/config/cloudinary.js).
4. Cloudinary returns a secure URL (`https://res.cloudinary.com/...`).
5. [createPost.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/createPost.js) then sends a POST request with the text content and Cloudinary URL to `/api/posts` along with your JWT auth token (`req.headers.Authorization`).
6. [postRoutes.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/backend/routes/postRoutes.js) saves the new post to MongoDB and returns the created tweet.
7. [feedRenderer.js](file:///c:/Users/sanjay/Desktop/Folders/Programs/Websites/X/src/modules/feedRenderer.js) instantly adds the new tweet to the top of your screen!
