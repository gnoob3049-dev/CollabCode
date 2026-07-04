---
Task IDs: 5, 6, 7, 11, 12
Agent: full-stack-developer
Task: Create Zustand store, update global CSS for dark theme, update layout, and build Landing/Login/Register/Dashboard pages

Work Log:
- Updated `/src/app/globals.css` with full dark theme CSS variables:
  - Background: #0d1117, Card: #161b22, Border: #30363d
  - Text: #e6edf3 primary, #8b949e secondary
  - Accent green: #238636 (buttons), Blue: #58a6ff (links, ring)
  - Destructive: #f85149, Chart colors: vibrant palette
  - Custom scrollbar styles for dark theme
  - Monaco editor background customization
  - Removed light theme and `.dark` class variants (app is always dark)

- Updated `/src/app/layout.tsx`:
  - Metadata: "CollabCode — Real-time Collaborative Code Editor"
  - Dark class on `<html>`, inline style on `<body>` for background/color
  - Replaced shadcn Toaster with Sonner Toaster (dark theme, styled to match)

- Created `/src/store/useStore.ts` - Zustand store with slices:
  - Navigation: currentPage (landing/login/register/dashboard/editor)
  - Auth: user, setUser (auto-updates isAuthenticated)
  - Room: currentRoom, currentRoomId, setCurrentRoom (syncs both)
  - Editor: currentFileName, language
  - Presence: onlineUsers
  - Output: output, isRunning
  - Panels: rightPanelOpen, rightPanelTab, outputPanelOpen

- Created `/src/components/collab/LandingPage.tsx`:
  - Full viewport hero with animated typing effect (ref-based, no state sync issues)
  - 6 code snippets cycling with realistic typing/deleting speeds
  - Terminal-style code display with traffic light dots
  - CollabCode logo with Code2 icon
  - Two CTA buttons: "Get Started" → register/dashboard, "Create a Room" → login/dashboard
  - Features grid (6 cards) with framer-motion scroll-triggered animations
  - IntersectionObserver for reveal-on-scroll
  - Responsive design, dark theme throughout

- Created `/src/components/collab/LoginPage.tsx`:
  - Centered card form with email/password
  - Green submit button, styled inputs with dark theme
  - POST to /api/auth/login with credentials: 'include'
  - Sonner toast for errors, auto-navigate to dashboard on success
  - Link to register page

- Created `/src/components/collab/RegisterPage.tsx`:
  - Centered card form with name/email/password
  - Password validation (min 6 chars)
  - POST to /api/auth/register with credentials: 'include'
  - Sonner toast for errors, auto-navigate to dashboard on success
  - Link to login page

- Created `/src/components/collab/DashboardPage.tsx`:
  - Top bar: CollabCode logo, user avatar (colored circle with initial), logout button
  - "Create New Room" button (green) and "Join Room" button
  - Create Room dialog: name input + language select (10 languages)
  - Join Room dialog: invite code input
  - Room grid: cards showing name, language badge, invite code (clickable to copy), collaborator count, last active time
  - Empty state with icon and CTAs
  - Loading spinner during fetch
  - Auto-fetches /api/rooms and checks /api/auth/me on mount
  - On room creation: creates room, sets store state, navigates to editor
  - On room click: sets store state (room, language, filename), navigates to editor

- Updated `/src/app/page.tsx` as client-side router:
  - Checks /api/auth/me on mount, auto-redirects to dashboard if authenticated
  - Switch statement rendering correct page component based on currentPage
  - Placeholder for editor page (handled by separate task)

Lint Results:
- All new files pass ESLint with zero errors/warnings
- Pre-existing lint errors in EditorTopBar.tsx and EditorPage.tsx (from separate editor task) remain

Stage Summary:
- 7 files created/updated: globals.css, layout.tsx, page.tsx, useStore.ts, LandingPage.tsx, LoginPage.tsx, RegisterPage.tsx, DashboardPage.tsx
- Full dark theme applied with GitHub-dark-inspired color palette
- Client-side routing via Zustand store working
- Auth flow complete: register → login → dashboard
- Room management: create, join, list, copy invite code
- All pages responsive and accessible
- Dev server compiles successfully, all routes return 200