# Manual End-to-End QA Checklist

> **How to use this document in Google Docs**
> Copy all text below this line and paste it into a new Google Doc. Google Docs will preserve the heading hierarchy and bullet structure. For full Markdown rendering (checkboxes, code spans, etc.) you can also use **File → Import** and upload this `.md` file directly, or paste it into a Markdown-aware Google Docs add-on such as *Docs to Markdown* or *Markdown Viewer*.

---

## Legend

| Severity | Meaning |
|---|---|
| 🔴 Blocker | App unusable / data loss / auth broken — do not ship |
| 🟠 High | Major feature broken, significant user impact |
| 🟡 Medium | Feature degraded, workaround exists |
| 🟢 Low | Cosmetic or edge-case issue |

---

## Section 1 — Smoke Tests (run on every push)

These are the minimum set of checks required before any code reaches production.

---

### S-01 · App loads cleanly

| Field | Detail |
|---|---|
| **Preconditions** | Deployed build is live; no active incidents |
| **Severity if fails** | 🔴 Blocker |

**Steps**

1. Open the deployed URL in a fresh private/incognito window.
2. Check the browser console for errors (F12 → Console).
3. Resize the viewport to 360 px wide (mobile) and confirm the layout is usable.

**Expected result:** Page renders without a blank screen, JavaScript crash, or broken layout on both desktop and 360 px mobile.

---

### S-02 · Logged-out entry flows

| Field | Detail |
|---|---|
| **Preconditions** | Not logged in |
| **Severity if fails** | 🔴 Blocker |

**Steps**

1. From the home page click **Log in**.
2. Confirm the login modal opens.
3. Click **Start chat** (or equivalent CTA).
4. Confirm the login modal also opens for that action.
5. Close/cancel the modal.

**Expected result:** Both CTAs open the login modal; closing the modal leaves the home page in its original state with no residual overlay.

---

### S-03 · Register a new account

| Field | Detail |
|---|---|
| **Preconditions** | Use a unique test email (e.g. `qa+<timestamp>@example.com`) |
| **Severity if fails** | 🔴 Blocker |

**Steps**

1. Open the Register form.
2. Enter a valid email and password (≥ 8 chars).
3. Submit.
4. Confirm the app transitions to the authenticated state.
5. Hard-refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`) the page.

**Expected result:** After registration the user is logged in. After refresh the session is restored from the stored token without requiring re-login.

---

### S-04 · Login with existing account

| Field | Detail |
|---|---|
| **Preconditions** | An existing account with at least one saved chat |
| **Severity if fails** | 🔴 Blocker |

**Steps**

1. Log out if currently logged in.
2. Log back in with valid credentials.
3. Confirm chats and profile reload in the sidebar.

**Expected result:** Sidebar shows the user's existing chats; profile data is present.

---

### S-05 · Send and receive a chat message

| Field | Detail |
|---|---|
| **Preconditions** | Logged in, at least one active chat |
| **Severity if fails** | 🔴 Blocker |

**Steps**

1. Select or create a chat.
2. Type a short message and press **Send** (or Enter).
3. Wait for the AI response.

**Expected result:** The user message appears immediately; an AI response arrives within a reasonable time (< 30 s). No console errors.

---

### S-06 · Create, rename, and delete a chat

| Field | Detail |
|---|---|
| **Preconditions** | Logged in |
| **Severity if fails** | 🟠 High |

**Steps**

1. Click **New Chat** — confirm it appears in the sidebar and is selected.
2. Rename the chat — confirm the new name persists after page refresh.
3. Delete the chat — confirm it is removed from the sidebar and cannot be reopened.

**Expected result:** All three operations complete without error and survive a page refresh.

---

### S-07 · API health endpoints

| Field | Detail |
|---|---|
| **Preconditions** | Access to the deployed server URL |
| **Severity if fails** | 🔴 Blocker |

**Steps**

1. Open `<deployed-url>/health` in a browser or run `curl <deployed-url>/health`.
2. Open `<deployed-url>/api/health`.

**Expected result:** Both endpoints return `200 OK` with a valid JSON body (e.g. `{ "status": "ok" }`).

---

### S-08 · SPA deep-link refresh

| Field | Detail |
|---|---|
| **Preconditions** | Deployed production build |
| **Severity if fails** | 🟠 High |

**Steps**

1. Navigate directly to `/reset-password?token=test` and hard-refresh.
2. Navigate directly to `/shared/test-token` and hard-refresh.

**Expected result:** The SPA loads and handles the route (shows an appropriate message); a 404 page or blank screen is a failure.

---

## Section 2 — Weekly / Periodic Regression Tests

Run at least once per week or after any change touching auth, onboarding, settings, or files.

---

### W-01 · First-visit questionnaire & onboarding

| Field | Detail |
|---|---|
| **Preconditions** | Brand-new account (never completed questionnaire) |
| **Severity if fails** | 🟠 High |

**Steps**

1. Register a new account.
2. Confirm the questionnaire modal opens automatically without user action.
3. Fill in all required fields and save.
4. Confirm the modal closes and the app transitions to the chat screen.
5. Confirm a new (empty) chat is created if none existed.

**Expected result:** Questionnaire auto-opens for new users; saving it stores the profile and transitions the user cleanly into the app.

---

### W-02 · Tutorial flow

| Field | Detail |
|---|---|
| **Preconditions** | Brand-new account that has just completed the questionnaire (W-01) |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. After the questionnaire save confirm the tutorial overlay appears.
2. Step through all tutorial steps using the **Next** button.
3. Confirm each step targets the correct UI element (sidebar, settings, etc.).
4. Complete the tutorial and confirm the overlay is dismissed.

**Expected result:** Tutorial completes without freezing or targeting an off-screen element; all `data-tutorial` targets are visible at each step.

---

### W-03 · Returning-user "update profile" banner

| Field | Detail |
|---|---|
| **Preconditions** | Existing account with a saved profile |
| **Severity if fails** | 🟢 Low |

**Steps**

1. Log in.
2. Confirm the "consider updating your profile" banner appears once.
3. Dismiss the banner.
4. Refresh the page — confirm the banner does not reappear in the same session.

**Expected result:** Banner appears once per session and does not spam on every route change or refresh.

---

### W-04 · Settings modal — all tabs

| Field | Detail |
|---|---|
| **Preconditions** | Logged in |
| **Severity if fails** | 🟠 High |

**Steps**

1. Open **Settings** from the sidebar.
2. Click through every tab.
3. Confirm each tab renders its content without a blank or broken panel.
4. Close the modal and confirm it disappears cleanly.

**Expected result:** Every tab loads; modal closes and does not leave a background overlay.

---

### W-05 · Save and persist settings

| Field | Detail |
|---|---|
| **Preconditions** | Logged in |
| **Severity if fails** | 🟠 High |

**Steps**

1. Open Settings and change the AI style / custom instructions / any persisted setting.
2. Save.
3. Refresh the page and reopen Settings.
4. Confirm the changed values are still present.

**Expected result:** All settings survive a full page refresh.

---

### W-06 · Open questionnaire from settings

| Field | Detail |
|---|---|
| **Preconditions** | Logged in, Settings modal open |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. Inside Settings find the link/button to re-open the questionnaire.
2. Click it and confirm only the questionnaire modal is open (Settings modal is closed).
3. Close the questionnaire and confirm the app is in a clean state.

**Expected result:** Both modals are never open simultaneously; transitions are clean.

---

### W-07 · Upload a PDF document

| Field | Detail |
|---|---|
| **Preconditions** | Logged in; have a small valid PDF (< 1 MB) ready |
| **Severity if fails** | 🟠 High |

**Steps**

1. Open the Files / Documents panel.
2. Upload a small PDF.
3. Wait for processing to complete.
4. Open the document — confirm the extracted text renders.

**Expected result:** PDF uploads successfully, extraction succeeds, and the document appears in the list with a summary.

---

### W-08 · Upload an image (OCR)

| Field | Detail |
|---|---|
| **Preconditions** | Logged in; have a JPG, PNG, or WebP image ready |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. Upload a JPG/PNG/WebP image via the Files panel.
2. Confirm OCR extraction runs and a summary is generated.
3. Open the document detail view.

**Expected result:** Image is listed with extracted text / summary; no error state.

---

### W-09 · File validation — wrong type and oversized

| Field | Detail |
|---|---|
| **Preconditions** | Logged in; have a `.exe` / `.zip` file and a file > 20 MB ready |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. Try uploading a disallowed file type (e.g. `.exe`).
2. Confirm the UI shows a validation error and does not upload.
3. Try uploading a file larger than 20 MB.
4. Confirm a size-limit error is shown.

**Expected result:** Both invalid uploads are rejected with clear error messages; no server-side error surfaces.

---

### W-10 · Delete a document

| Field | Detail |
|---|---|
| **Preconditions** | Logged in; at least one uploaded document |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. Open the Files panel.
2. Delete a document.
3. Confirm it is removed from the list.
4. Confirm refreshing the page does not bring it back.

**Expected result:** Document is permanently removed.

---

### W-11 · Forgot-password flow (full round-trip)

| Field | Detail |
|---|---|
| **Preconditions** | Access to a test email inbox |
| **Severity if fails** | 🟠 High |

**Steps**

1. Click **Forgot password** and submit the form with the test email.
2. Confirm the success message appears (even for unknown emails — verify no email enumeration).
3. Open the reset link from the email.
4. Set a new password.
5. Log in with the new password.
6. Confirm the old password no longer works.

**Expected result:** Full reset round-trip works; old password is invalidated.

---

### W-12 · Invalid / expired reset token

| Field | Detail |
|---|---|
| **Preconditions** | None |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. Navigate to `/reset-password?token=invalidtoken123`.
2. Attempt to set a new password.

**Expected result:** App shows a clear "link invalid or expired" message; no crash or data modification.

---

### W-13 · Change password while logged in

| Field | Detail |
|---|---|
| **Preconditions** | Logged in; Settings → Account tab |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. Open Settings → Account (or equivalent).
2. Enter the wrong current password — confirm it is rejected.
3. Enter the correct current password and a new password.
4. Save.
5. Log out, then log back in with the new password.

**Expected result:** Current-password validation works; old password is invalidated after the change.

---

### W-14 · Delete account

| Field | Detail |
|---|---|
| **Preconditions** | A disposable test account |
| **Severity if fails** | 🟠 High |

**Steps**

1. Log in with the disposable account.
2. Navigate to Settings → Account → Delete account.
3. Confirm any confirmation dialog and proceed.
4. Confirm the session is ended and the user is logged out.
5. Attempt to log in with the deleted account's credentials.

**Expected result:** Account is fully deleted; login attempt after deletion fails with a clear error.

---

### W-15 · Shareable message link

| Field | Detail |
|---|---|
| **Preconditions** | Logged in; at least one chat with messages |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. In a chat, use the share action on a message to generate a shared link.
2. Copy the link.
3. Open the link in a private/incognito window (unauthenticated).
4. Confirm the shared message view loads without requiring login.
5. Try an invalid shared link: `/shared/nonexistent-token`.

**Expected result:** Valid link loads the shared view without auth; invalid link shows a sensible error (not a blank screen or crash).

---

### W-16 · Mid-chat profile update suggestion

| Field | Detail |
|---|---|
| **Preconditions** | Logged in; profile partially filled |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. Send a message that causes the assistant to suggest profile field updates.
2. Accept the suggested update.
3. Confirm the profile is merged (existing fields are retained; new fields are added).
4. Open Settings → Questionnaire and verify the updated values appear.

**Expected result:** Profile is merged correctly; no existing fields are lost.

---

### W-17 · Delete all chats

| Field | Detail |
|---|---|
| **Preconditions** | Logged in; at least two chats exist |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. Open Settings and use the **Delete all chats** action.
2. Confirm the chat list in the sidebar clears.
3. Confirm the app shows the empty-state screen.
4. Click **New Chat** and confirm it creates a new chat successfully.

**Expected result:** All chats are removed; the app is in a clean empty state; new chat creation still works.

---

### W-18 · Long conversation guard

| Field | Detail |
|---|---|
| **Preconditions** | Logged in |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. Send messages until the conversation approaches or exceeds the context limit.
2. Attempt to send another message.

**Expected result:** The app blocks the message and prompts the user to start a new chat; no crash or silent data truncation.

---

### W-19 · Mobile — sidebar open/close

| Field | Detail |
|---|---|
| **Preconditions** | Mobile device or DevTools emulation at 360 px |
| **Severity if fails** | 🟠 High |

**Steps**

1. Open the app at 360 px viewport width.
2. Open the hamburger/sidebar menu.
3. Select a chat from the sidebar.
4. Confirm the sidebar closes and the selected chat is shown.
5. Reopen the sidebar and close it by tapping the backdrop.

**Expected result:** Sidebar opens and closes reliably; selecting a chat closes the sidebar on mobile.

---

### W-20 · Mobile — chat layout

| Field | Detail |
|---|---|
| **Preconditions** | Mobile viewport (360 px) |
| **Severity if fails** | 🟠 High |

**Steps**

1. Send a message with a long string (200+ characters).
2. Confirm the bubble does not overflow or clip horizontally.
3. Verify action buttons (copy, share, etc.) are visible without requiring hover (no `opacity-0 group-hover:opacity-100` trap on touch).

**Expected result:** All message content and actions are usable on a touch device.

---

## Section 3 — Release-Candidate / Pre-Deploy Tests

Run before every production release. These are more thorough and cover edge cases.

---

### RC-01 · Full new-user journey end-to-end

| Field | Detail |
|---|---|
| **Preconditions** | Fresh test email; clean browser profile |
| **Severity if fails** | 🔴 Blocker |

**Steps**

1. Register with a new account.
2. Complete the questionnaire.
3. Step through the tutorial.
4. Send a message and receive a response.
5. Upload a document.
6. Share a message.
7. Log out.
8. Log back in and confirm all data is intact.

**Expected result:** Complete onboarding-to-data-persistence flow works without manual intervention.

---

### RC-02 · Expired / invalid JWT handling

| Field | Detail |
|---|---|
| **Preconditions** | DevTools to manipulate `localStorage` |
| **Severity if fails** | 🔴 Blocker |

**Steps**

1. Log in normally.
2. Open DevTools → Application → Local Storage.
3. Replace the stored token with an expired or invalid string.
4. Reload the page.

**Expected result:** App detects the invalid token and redirects/prompts for re-login with a clear message; no crash or infinite loop.

---

### RC-03 · Rate-limit graceful degradation

| Field | Detail |
|---|---|
| **Preconditions** | Logged in |
| **Severity if fails** | 🟠 High |

**Steps**

1. Send chat messages in rapid succession (or repeatedly upload files).
2. Continue until a rate-limit response is triggered.

**Expected result:** The app shows a friendly "too many requests" message; it does not crash, freeze, or display a raw error object.

---

### RC-04 · Authorization failure recovery (401 on any API path)

| Field | Detail |
|---|---|
| **Preconditions** | DevTools → Network tab to intercept |
| **Severity if fails** | 🟠 High |

**Steps**

1. While logged in, use a network interception tool or DevTools to simulate a `401` response from any API endpoint.
2. Observe the app behavior.

**Expected result:** App recovers by prompting re-login; it does not freeze, show a raw 401, or silently fail.

---

### RC-05 · AI service failure handling

| Field | Detail |
|---|---|
| **Preconditions** | Ability to trigger an Anthropic API error (e.g. via server env var override in staging) |
| **Severity if fails** | 🟠 High |

**Steps**

1. Disable or break the AI API key in a staging environment.
2. Send a chat message.
3. Upload a document.

**Expected result:** Both flows show a friendly error message; no unhandled promise rejection or crash.

---

### RC-06 · Profile schema compatibility (all fields)

| Field | Detail |
|---|---|
| **Preconditions** | Logged in |
| **Severity if fails** | 🟠 High |

**Steps**

1. Open the questionnaire and fill in every available field.
2. Save.
3. Hard-refresh the page.
4. Open the questionnaire again.

**Expected result:** All fields are present with the saved values; no field is dropped or reset to a default.

---

### RC-07 · Existing-user data migration compatibility

| Field | Detail |
|---|---|
| **Preconditions** | Access to an older test account (created before the latest schema change) |
| **Severity if fails** | 🟠 High |

**Steps**

1. Log in with the older account.
2. Confirm chats, documents, and profile load without errors.
3. Confirm the app does not crash on missing new fields.

**Expected result:** Older accounts work correctly after a schema migration; new optional fields default gracefully.

---

### RC-08 · Database persistence after restart

| Field | Detail |
|---|---|
| **Preconditions** | Access to staging server (Railway or equivalent) |
| **Severity if fails** | 🔴 Blocker |

**Steps**

1. Create a new chat, send messages, and upload a document.
2. Restart the server process (or redeploy).
3. Log back in and confirm all data is intact.

**Expected result:** Chats, messages, documents, and profiles survive a full server restart.

---

### RC-09 · CORS and Authorization header behavior

| Field | Detail |
|---|---|
| **Preconditions** | Deployed frontend making requests to deployed backend |
| **Severity if fails** | 🔴 Blocker |

**Steps**

1. Open the deployed app and log in.
2. Open DevTools → Network.
3. Perform all major actions (chat, upload, settings save).
4. Confirm every API request includes `Authorization: ****** and receives `2xx` responses.
5. Confirm no CORS errors appear in the console.

**Expected result:** All cross-origin API calls succeed; no CORS preflight failures.

---

### RC-10 · Cross-browser sanity

| Field | Detail |
|---|---|
| **Preconditions** | Chrome, Safari (or Firefox), iOS Safari / Android Chrome |
| **Severity if fails** | 🟠 High |

**Steps**

1. Repeat smoke tests S-01 through S-07 on each browser.
2. Pay special attention to fixed-position overlays (settings modal, tutorial) and z-index conflicts.

**Expected result:** All smoke tests pass on all tested browsers; no layout or functional regressions.

---

### RC-11 · Mobile — questionnaire and settings overlays

| Field | Detail |
|---|---|
| **Preconditions** | Real mobile device or DevTools at 360 px |
| **Severity if fails** | 🟠 High |

**Steps**

1. Run the first-visit questionnaire on mobile.
2. Confirm all fields are reachable and the modal does not overflow the viewport.
3. Open Settings and step through all tabs.
4. Open the tutorial overlay.
5. Verify z-index stacking does not cause modals to appear behind the sidebar (`z-50`) or each other.

**Expected result:** All overlays are usable on a 360 px screen; nothing is hidden behind another layer.

---

### RC-12 · Files panel on mobile

| Field | Detail |
|---|---|
| **Preconditions** | Mobile viewport; at least one uploaded document |
| **Severity if fails** | 🟡 Medium |

**Steps**

1. Open the document list on a 360 px viewport.
2. Confirm there is no horizontal overflow or clipped content.
3. Open a document detail view.
4. Confirm the extracted text is scrollable and readable.

**Expected result:** No horizontal scroll, no clipped buttons, text is legible.

---

*Last updated: 2026-08-18 — maintainer: QA team*
