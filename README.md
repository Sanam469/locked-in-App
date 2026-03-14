<div align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzluaGN1Y2UxbGtzYnkxZnkzZmNyN240aGFpYW4xeGkwdzhpNmE4aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVy0/giphy.gif" width="200" alt="Lock Icon" />
  <h1>🔒 LOCKED-IN APP</h1>
  <h3>The Ultimate "No-Escape" Study Warden for DSA & GATE Aspirants</h3>
  <p><strong>You either study, or you face the Containment Veil. No distractions. No excuses.</strong></p>
</div>

---

## 🚀 What is this?

**LOCKED-IN** is not just a productivity app; it's a digital warden. Designed specifically for **Engineering students studying DSA**, **GATE Aspirants**, and anyone tackling brutal competitive exams. 

If you take online classes, solve Codeforces problems, or write timed mock tests on online study platforms, you know the urge to open a new tab and watch YouTube. **This app destroys that urge.**

### 🔥 How it works:
When you engage a "Warden Session", the app goes into a surgical Kiosk mode.
- It constantly tracks your active windows.
- If it detects you switching away from your test, lecture, or coding platform, it triggers a **massive red/black Containment Veil** across your screen demanding you to return.
- Perfect for platforms to conduct anti-cheat tests, or for students who lack self-control.

---

## 🏗️ Technical Stack

- **Frontend:** Next.js (App Router), React, TailwindCSS
- **Desktop Engine:** Electron (Native Window Management, Global Shortcuts)
- **Database:** SQLite3 (Local, offline-first data storage)
- **Security:** bcryptjs (Local password hashing)

---

## 📁 Crazy Detailed Project Structure

We've documented *every single file and folder* so you know exactly how the Warden operates.

### 📜 Root Level
* `package.json` — The blueprint. Contains all dependencies (`next`, `electron`, `sqlite3`, `active-win`) and scripts. Run `npm run warden` to awaken the beast.
* `next.config.ts` / `tsconfig.json` — Configuration for the Next.js and TypeScript environment.
* `eslint.config.mjs` / `postcss.config.mjs` — Linting and styling pipeline configurations.

### 🖥️ `electron/` (The Desktop Warden Engine)
This is where the magic (and the terror) happens. It controls your operating system.
* `main.js` — **The Core Warden Engine**. Creates the main Next.js window and the terrifying invisible `veilWindow`. It uses `active-win` to ruthlessly monitor if you alt-tab out of your study session. It literally forces you back to work.
* `database.js` — **Offline Storage Node**. Establishes the connection to `warden.db` (SQLite). Creates the relational tables: `users`, `sessions` (your study history), and `user_settings`.
* `auth.js` — **Local Gatekeeper**. Handles localized `bcrypt` password hashing, sign-ups, and login validation directly against the SQLite database.
* `preload.js` — **The Bridge**. Uses Electron's `contextBridge` to securely expose native functions (like `engage-warden` and `getPerformancePulse`) to the Next.js frontend without breaking security boundaries.
* `warden.db` — The actual SQLite database file containing all your streaks, session logs, and focus scores.

### ⚛️ `src/` (The Next.js React Frontend)
The beautiful face that hides the ruthless Warden engine.
* `middleware.ts` — The Next.js bouncer. Intercepts every route and checks for `warden_session_token`. Unauthenticated users get kicked instantly to `/auth`.

#### `src/app/` (App Router Pages)
* `dashboard/` — The main control center. Where you start your study sessions, set goals, and view your immediate status.
* `performance/` — The analytics hub. Calculates your daily minutes, dynamic streaks, and renders the "Performance Pulse" graph.
* `auth/` — The login and registration portal.
* `premium/` — Unlock advanced Warden features and strict-mode configurations.
* `settings/` — Configure your grace periods (how many seconds you get before the Containment Veil attacks) and app themes.
* `layout.tsx` & `globals.css` — Global layout wrapper bringing in Tailwind CSS and the global application styles.

#### `src/component/` (Reusable UI Atoms)
* `Navbar.tsx` & `Header.tsx` & `Footer.tsx` — Standard application navigation and shell structure.
* `BackgroundShell.tsx` — The sleek, modern background wrapper that gives the app its premium look.
* `ThemeContext.tsx` — React Context provider managing Dark/Light modes seamlessly.

---

## ⚙️ Getting Started

Want to lock yourself in? It's simple.

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Next.js Frontend**
   ```bash
   npm run build
   ```

3. **Awaken the Warden (Electron + Next.js)**
   ```bash
   npm run dev      # To run the Next.js server
   npm run warden   # To launch the Electron Desktop App
   ```
*(Note: You need both running in dev mode, or use concurrently setups as defined in package.json)*

---

### 🛑 WARNING
**Do not engage a Warden Session if you aren't ready to study.** The global shortcut to kill a rogue session is `Ctrl/Cmd + Shift + X`. Use it wisely.

*"May your streaks be long, and your code bug-free."*
