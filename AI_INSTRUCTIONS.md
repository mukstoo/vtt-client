# Frontend AI Instructions Document

## 1. Document Purpose & Usage

This document is intended for an AI assistant to understand the frontend portion of our browser-based VTT (Virtual Tabletop) project. It contains:

- **Context**: What has already been completed in the vtt-client repository.
- **Task Management**: A living list of tasks, including those already done and those still pending. The AI should mark tasks as completed when they are finished, add or reprioritize tasks as requirements evolve, and always choose the next logical step.
- **Guidelines for AI**: General best practices—naming conventions, file/folder structures, version checks, documentation links, testing, and code style.

Whenever changes are made or new tasks are added, update the "Completed Tasks" and "Pending Tasks" sections accordingly. The AI should always re-synchronize this document based on progress and communicate any blockers or decisions needed.

## 2. Context: Completed Setup

### Repository Initialization

Created vtt-client folder via Vite:
```bash
npm create vite@latest vtt-client -- --template react-ts
cd vtt-client
git init
gh repo create vtt-client --public --description "Browser-based VTT client (Vite + React + TypeScript)" --source . --remote origin --push
```

### Dependencies Installed

**Runtime dependencies:**
```bash
npm install react-konva socket.io-client peerjs @dice-roller/rpg-dice-roller react-router-dom axios
```

**Dev dependencies:**
```bash
npm install -D eslint prettier eslint-config-prettier eslint-plugin-react @types/react @types/react-dom @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Linting & Formatting

- Ran `npx eslint --init`, configured for TypeScript + React.
- Created a minimal `.prettierrc.json` for Prettier.
- Updated ESLint config for React 17+ JSX transform.

### Initial Commit

- Committed scaffold and base packages under main branch, pushed to GitHub.

## 3. General AI Guidelines

### Best Practices

- Always follow React and TypeScript official style guidelines.
- Favor functional components, hooks, and composition over class-based code.
- Keep components small and single-purpose.
- Use `useCallback`, `useMemo`, and other optimizations only when necessary.

### Naming Conventions

- **Files/Folders**: Use kebab-case for filenames (e.g., `map-canvas.tsx`, `dice-roller.tsx`). Use PascalCase for React components.
- **Variables & Functions**: Use camelCase.
- **Types/Interfaces**: Use PascalCase and prefix interfaces with `I` only if it improves clarity, but prefer descriptive names (e.g., `User`, `MapData`, `SocketEvents`).

### Folder Structure Guidelines

```
vtt-client/
├── public/                 # static assets (favicon, logo)
├── src/
│   ├── assets/             # images, SVGs, fonts
│   │   ├── components/         # reusable UI components
│   │   │   ├── MapCanvas/
│   │   │   │   ├── MapCanvas.tsx
│   │   │   │   └── mapCanvas.styles.ts
│   │   │   ├── DiceRoller/
│   │   │   └── ChatWindow/
│   │   ├── contexts/           # React Context providers (e.g., AuthContext, SocketContext)
│   │   ├── hooks/              # custom hooks (e.g., useSocket, useAuth)
│   │   ├── pages/              # top-level views (if using React Router; otherwise, use App.tsx + routes)
│   │   ├── services/           # API wrappers, WebSocket abstractions
│   │   ├── types/              # TypeScript type definitions, shared interfaces
│   │   ├── utils/              # small reusable utilities (formatting, dice parsing wrappers)
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── vite-env.d.ts
│   ├── .eslintrc.json
│   ├── .prettierrc.json
│   ├── tsconfig.json
│   ├── package.json
│   └── vite.config.ts
```

### Version Checks & Documentation

- Before using any package, check its version in `package.json` and consult official docs.
- For React-Konva: verify compatibility with current React/React-DOM versions.
- For socket.io-client and peerjs: confirm latest minor/patch stable versions.
- For rpg-dice-roller: ensure correct syntax for dice formulas and TypeScript types.

### Code Style & Linting

- Follow ESLint rules; fix all lint errors before pushing.
- Use Prettier to auto-format code.
- Run `npm run lint` and `npm run format` (or direct CLI commands) before every commit.

### Testing

- Aim for unit tests on pure functions (e.g., dice-rolling logic, coordinate transformations).
- Use React Testing Library for component rendering and user interaction tests.
- When introducing new functionality, write at least one test covering main use cases.

### Incremental Workflows

- Always add one feature or component at a time.
- Create a new branch off main for each feature (e.g., `feature/map-canvas`, `feature/auth-context`).
- Only merge to main after code review and passing CI checks.

## 4. Completed Tasks

These tasks have been implemented and should be marked ✔︎.

### Project Scaffold

- [✔︎] Initialized Vite + React + TypeScript project.
- [✔︎] Set up git and pushed initial commit to GitHub.

### Dependency Installation

- [✔︎] Installed react-konva, socket.io-client, peerjs, and rpg-dice-roller.
- [✔︎] Installed react-router-dom and axios for routing and API calls.
- [✔︎] Installed ESLint, Prettier, TypeScript type definitions, and related plugins.

### Linting & Formatting Setup

- [✔︎] Configured ESLint with `plugin:react/recommended` and `plugin:@typescript-eslint/recommended`.
- [✔︎] Updated ESLint config for React 17+ JSX transform (disabled react-in-jsx-scope rule).
- [✔︎] Created basic `.prettierrc.json`.
- [✔︎] Fixed all TypeScript and linting errors.

### Folder Structure Created

- [✔︎] Created `components/`, `hooks/`, `services/`, `types/`, `pages/`, `contexts/` directories.

### Core Architecture & Routing

- [✔︎] **Set up React Router (v6) with complete routing strategy.**
  - Created full routing in `App.tsx`.
  - Defined routes: `/login`, `/register`, `/rooms`, `/room/:roomId`.
  - Implemented route-based protection with `PrivateRoute` component.

- [✔︎] **Created `src/contexts/AuthContext.tsx`**
  - Provides `user`, `token`, `signIn`, `signUp`, `signOut` functions.
  - Uses `useReducer` for auth state management.
  - Persists token in `localStorage` with user data.
  - Exposes `useAuth()` hook.

- [✔︎] **Created `src/services/api.ts`**
  - Uses axios for HTTP requests to backend endpoints.
  - Auto-attaches `Authorization: Bearer <token>` to requests.
  - Handles 401 errors with token cleanup.
  - Implements login, register, rooms CRUD operations.

### Authentication & Protected Routes

- [✔︎] **Built `<LoginPage />` in `src/pages/LoginPage.tsx`**
  - Form validation and error handling.
  - JWT authentication with redirect logic.
  - Modern glassmorphism UI design.

- [✔︎] **Built `<RegisterPage />` in `src/pages/RegisterPage.tsx`**
  - Role selection (PLAYER/GM), password confirmation.
  - Automatic login after successful registration.

- [✔︎] **Built `<RoomSelectionPage />` in `src/pages/RoomSelectionPage.tsx`**
  - Room grid display, creation modal.
  - Keyboard shortcuts (Escape key).
  - Real room data integration with backend.

- [✔︎] **Built `<RoomPage />` in `src/pages/RoomPage.tsx`**
  - Layout sections for map canvas, chat, dice roller, voice chat.
  - Socket.IO connection management.
  - Real room data loading and error handling.

- [✔︎] **Implemented route protection**
  - `<PrivateRoute>` component checks auth state.
  - Redirects unauthenticated users to `/login`.

### Layout & Styling

- [✔︎] **Created comprehensive responsive design in `App.css`**
  - Dark theme with glassmorphism effects.
  - Full-screen desktop layout (100vh/100vw).
  - Responsive grid layouts with desktop-first approach.
  - Mobile and tablet responsive breakpoints.

### WebSocket (Socket.IO) Integration

- [✔︎] **Created `src/services/socket.ts`**
  - Socket.IO client with connection management.
  - Room-based connection with JWT authentication.
  - Disconnect handling and cleanup.

### Types System

- [✔︎] **Created comprehensive TypeScript interfaces in `src/types/index.ts`**
  - User, Room, Map, Unit, Character, DiceRoll interfaces.
  - Authentication types (LoginCredentials, RegisterCredentials, AuthState).
  - API response types with proper error handling.
  - Room membership types (CreateRoomData, JoinRoomData) with password support.
  - Unit system types (FrontendUnit, MoveUnitPayload, CreateUnitPayload).
  - Socket event interfaces (UnitMovedEvent, UnitCreatedEvent, RoomUnitsEvent, UnitErrorEvent).
  - Chat and dice rolling socket event types for complete type safety.

### 5.3. Dice Rolling System [✔︎ COMPLETED]

- [✔︎] **Built comprehensive `<DiceRoller />` component in `src/components/DiceRoller/DiceRoller.tsx`**
  - Input field for dice formula validation (e.g., "1d20+2", "2d6+3")
  - Client-side input validation with regex patterns and length limits
  - Socket.IO integration: emit "roll_dice", listen for "dice_result" and "dice_error"
  - Real-time dice roll history display (last 20 rolls)
  - Animated dice rolling with visual feedback and loading states
  - Username color coding with consistent hash-based colors
  - Example buttons for common dice formulas (1d20, 2d6+3, 1d100)
  - Responsive design with mobile-first approach
  - Error handling with user-friendly messages
  - Refresh functionality for dice history

- [✔︎] **Integrated DiceRoller into RoomPage**
  - Replaced dice placeholder with functional DiceRoller component
  - Proper roomId prop passing for room-specific dice rolling
  - Seamless integration with existing socket connection management

- [✔︎] **Added comprehensive CSS styling in `App.css`**
  - Modern glassmorphism design matching app aesthetic
  - Smooth animations for dice rolling and result display
  - Responsive design with mobile breakpoints
  - Custom scrollbar styling for roll history
  - Hover effects and interactive feedback
  - CSS variables for consistent theming

- [✔︎] **Created useSocket hook pattern**
  - Provides access to socket instance for components
  - Handles private socket access through service layer
  - Maintains existing socketService architecture

### 5.4. Layout & Space Optimization [✔︎ COMPLETED]

- [✔︎] **Optimized room page layout for better space utilization**
  - Reduced font sizes by 10-20% across all components (headers, body text, small text)
  - Decreased padding and margins by 20-30% throughout the interface
  - Made buttons and inputs more compact while maintaining usability
  - Reduced room page header height and spacing

- [✔︎] **Redistributed sidebar space allocation**
  - Increased chat section from `flex: 2` to `flex: 2.5` for more chat history
  - Increased dice section from `flex: 1.5` to `flex: 2` for better dice roll display
  - Kept voice section minimal at `flex: 0.5` but reduced min-height to reserve space

- [✔︎] **Optimized component-specific styling**
  - **ChatWindow**: Reduced message padding, smaller input areas, tighter spacing
  - **DiceRoller**: More compact inputs, smaller buttons, tighter history display
  - **Scrollbars**: Reduced width from 8px to 6px for more content space
  - **Mobile responsiveness**: Even more aggressive space saving on smaller screens

- [✔︎] **Maintained design consistency**
  - Preserved glassmorphism aesthetic and color scheme
  - Maintained accessibility and contrast ratios
  - Kept all interactive elements properly sized for touch/click
  - Ensured readability at reduced font sizes

### 5.5. Unit & Movement System [✔︎ COMPLETED]

- [✔︎] **Extended TypeScript types in `src/types/index.ts`**
  - Added `FrontendUnit` interface for client-side unit representation
  - Created unit-related socket event interfaces: `MoveUnitPayload`, `CreateUnitPayload`
  - Added unit event response types: `UnitMovedEvent`, `UnitCreatedEvent`, `RoomUnitsEvent`, `UnitErrorEvent`
  - Enhanced socket service to support unit operations with proper type safety

- [✔︎] **Built comprehensive `<MapCanvas />` component in `src/components/MapCanvas/MapCanvas.tsx`**
  - HTML5 Canvas implementation with 40px grid system and 30px units
  - Real-time unit visualization with color-coded types (PC=Green, NPC=Red, Object=Gray)
  - Interactive unit selection with visual feedback (white border, blue highlight)
  - Drag & drop unit movement with grid snapping and bounds checking
  - GM-only unit creation via double-click or "Add Unit" button with modal form
  - Socket.IO integration: "move_unit", "create_unit", "get_room_units" events
  - Reliable unit loading with connection checking, retry logic, and timeout handling
  - Error handling with user-friendly messages and manual retry option

- [✔︎] **Enhanced socket service (`src/services/socket.ts`)**
  - Added `getSocket()` method for direct socket access by components
  - Maintains existing service architecture while allowing advanced operations
  - Complete integration with existing chat and dice systems

- [✔︎] **Integrated MapCanvas into RoomPage**
  - Replaced map placeholder with functional MapCanvas component
  - Proper GM role detection via `room.gmId === state.user?.id`
  - Seamless integration with existing socket connection management

- [✔︎] **Added comprehensive CSS styling in `src/components/MapCanvas/MapCanvas.css`**
  - Modern map canvas design with dark theme integration
  - Grid visualization with crosshair cursor for interaction
  - Unit creation modal with form styling and responsive design
  - Loading indicators, error states, and retry button styling
  - Mobile-responsive design with touch-friendly interactions
  - Hover effects and visual feedback for all interactive elements

### 5.6. Backend Character System Integration [✔︎ COMPLETED]

- [✔︎] **Backend Character APIs now available:**
  - `POST /characters` - Create character with D&D-style defaults
  - `GET /characters` - List user's characters with units and relations
  - `GET /characters/:id` - Get specific character (ownership required)
  - `PUT /characters/:id` - Update character (ownership required)
  - `DELETE /characters/:id` - Delete character (ownership required)
  - `GET /rooms/:roomId/characters` - Room-specific character list (GM sees all, users see own)

- [✔︎] **Character data structure:**
  - Name (required, 50 char limit, unique per user)
  - Stats: level, hitPoints, armorClass, attributes (STR/DEX/CON/INT/WIS/CHA), skills, saves
  - Inventory: items array, currency (gold/silver/copper), equipment slots
  - Relations: linked units in rooms, user ownership, creation/update timestamps

- [✔︎] **Authorization and validation:**
  - JWT authentication required for all endpoints
  - Users can only CRUD their own characters
  - GMs can see all characters in their rooms for unit linking
  - Proper error handling with HTTP status codes and messages

### 5.7. Enhanced Unit-Character Integration [✔︎ COMPLETED]

- [✔︎] **Updated MapCanvas unit creation with character linking**
  - Added character selection dropdown in unit creation modal
  - Integrated with character API to show available characters for the room
  - Auto-populate unit names and set type to PC when character is selected
  - Units inherit character names and properties via characterId linking

- [✔︎] **Implemented character-based unit management**
  - Added character info panel that appears when character-linked units are selected
  - Display character owner information, unit type, and grid position
  - Show movement permission indicators (✓ can move / ✗ cannot move)
  - Character ownership-based movement permissions (players can only move their own character units)

- [✔︎] **Enhanced user experience and permissions**
  - Real-time character fetching when unit creation modal opens
  - Loading states for character data retrieval
  - Character info panel with slide-in animation and modern glassmorphism design
  - GM can move any unit, players can only move their own character units
  - Visual feedback for movement permissions and character ownership

- [✔︎] **Comprehensive CSS styling and responsive design**
  - Character info panel with backdrop blur and smooth animations
  - Enhanced form styling for character selection dropdown
  - Mobile-responsive design for character info panel
  - Movement permission indicators with color-coded feedback
  - Updated map instructions to reflect new character integration features

### 5.8. Voice Chat System [✔︎ COMPLETED]

- [✔︎] **Built comprehensive VoiceControls component in `src/components/VoiceControls/VoiceControls.tsx`**
  - PeerJS integration for peer-to-peer voice chat with WebRTC
  - Audio permissions checking and stream management with echo cancellation and noise suppression
  - Mute/unmute controls with visual feedback and real-time status updates
  - Connection indicators showing connected/disconnected/connecting states
  - Error handling for microphone access, permission denial, and connection failures

- [✔︎] **Implemented Socket.IO integration for peer discovery and management**
  - Real-time peer joining/leaving notifications with participant list
  - Mute status broadcasting to all room participants
  - Voice room management with automatic cleanup on disconnect
  - Authentication-based access control for voice rooms

- [✔︎] **Created comprehensive backend voice handlers in `vtt-server/src/socket/voice.handlers.ts`**
  - Voice peer management with in-memory storage and room-based organization
  - JWT authentication for voice room access with user validation
  - Real-time peer status updates (join, leave, mute/unmute) via Socket.IO
  - Automatic cleanup of disconnected peers and inactive sessions

- [✔︎] **Enhanced user experience with modern UI design**
  - Participants list showing all connected users with status indicators
  - Glassmorphism design matching app aesthetic with smooth animations
  - Responsive design for mobile and desktop with touch-friendly controls
  - Visual feedback for speaking/muted states and connection status

- [✔︎] **Integrated VoiceControls into RoomPage layout**
  - Replaced voice placeholder with functional VoiceControls component
  - Proper roomId prop passing for room-specific voice chat
  - Seamless integration with existing socket connection management

## 5. Pending Tasks

These tasks are next in priority. The AI should pick the top‐priority item, complete it fully (including code, tests, and documentation), then mark it ✔︎ and update this list.

### 5.1. Advanced Features [PRIORITY]

- [ ] **Socket Context Provider**
  - Create `src/contexts/SocketContext.tsx` for centralized socket management.
  - Provide helper functions: `moveUnit`, `rollDice`, `sendChatMessage`, `joinVoice`.
  - Auto-connect when user and roomId are available.

### 5.2. Testing & Quality Assurance

- [ ] **Set up unit tests for utility functions**
  - Dice validation and parsing logic.
  - Socket event handling mocks.
  - Component rendering tests with React Testing Library.

- [ ] **Configure CI with GitHub Actions**
  - Lint, type-check, and test on every push/PR.

### 5.3. Deployment & Environment Config

- [ ] **Environment variable configuration**
  - Proper `vite.config.ts` setup for environment variables.
  - Production build optimization.
  - Vercel deployment configuration. 