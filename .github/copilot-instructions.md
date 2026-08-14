# Copilot Instructions — Cancer-site-V2

## Mobile Impact
Before implementing any UI change, ask:
- Does this component exist on mobile? (Sidebar is hidden by default; settings desktop nav is `hidden sm:block`)
- Does the change use fixed pixel positioning? If so, does it clamp to `window.innerWidth`/`window.innerHeight` and account for mobile browser chrome?
- Does anything rely on `data-tutorial`, `getBoundingClientRect`, or viewport math? Those break when the target element is off-screen or inside a `hidden sm:block` container.
- Does the layout use `grid-cols-2` or multi-column? Check it on 360px width.
- Does any new modal/overlay have a z-index? Confirm it doesn't conflict with sidebar (`z-50`), settings (`z-50`), or tutorial (`z-[200]`).

### Mobile anti-patterns to catch on every new component
- **`opacity-0 group-hover:opacity-100`** on action buttons → invisible on touch devices. Use `sm:opacity-0 sm:group-hover:opacity-100` so buttons are always visible on mobile.
- **Fixed-column grids** (`grid-cols-[1fr_auto_auto_auto_auto]` or similar with 4+ columns) → crush to unreadable widths at 360px. Use a 2-line card layout (name + meta row) instead of a table grid, or hide non-essential columns below `sm:`.
- **Fixed widths without breakpoint prefix** (`w-48`, `w-64`) inside flex/grid containers → can overflow narrow screens. Always use `w-full sm:w-48`.
- **`whitespace-nowrap` on date/badge spans** combined with long text in adjacent `flex-1` element → verify the total row still fits at 320px.

## Cross-System Impact
Before implementing any change, ask:
- **App.jsx state flags** — does this change affect `showQ`, `showSettings`, `showTutorial`, `tutorialSettingsTab`, or `isFirstVisit`? Check all render guards and every place those flags are set/read.
- **Tutorial targeting** — does this change add, remove, or rename a `data-tutorial` attribute? Every `data-tutorial` value is hardcoded in `TutorialOverlay.jsx` STEPS array.
- **SettingsModal `forcedTab`** — if the settings tab structure changes, `TutorialOverlay` steps 2–5 target `settings-tab-{id}` which must match the TABS array in SettingsModal.
- **Server/client contract** — if a field is added to the profile object, update `buildPatientContext` in `server/index.js`. If a new API route is added, check the Railway `start` script and rate-limit config.
- **Profile auto-save** — `ChatWindow` can call `onUpdateProfile` mid-chat. If the profile schema changes, verify the merged object written back to the server is still valid.
- **Auth flow** — `authFetch` wraps every API call. Any new server endpoint must accept the `Authorization: Bearer` header and be tested for the case where the token is expired.
