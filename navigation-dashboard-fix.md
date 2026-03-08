# Plan: Navigation & Dashboard Fixes

Address broken navigation, missing social features, and interaction bugs in the NativeTalk redesign.

## Overview
The user reports several critical UX issues:
1. Channel selection in the dashboard doesn't trigger the chat view.
2. Logout button doesn't redirect.
3. Groups, Calls, and Notifications pages are missing (404).
4. Social dashboard for friend requests is missing.

## Success Criteria
- [ ] Clicking a channel opens the chat window correctly.
- [ ] Logout button successfully logs out and redirects to `/login`.
- [ ] Placeholder or functional pages created for Groups, Calls, Notifications, and Settings.
- [ ] New "Connect" page implemented for discovering users and sending friend requests.
- [ ] Sidebar navigation updated to include all features.

## Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, Framer Motion, Stream Chat React SDK.
- **Backend**: Existing Node.js/Express API.

## File Structure
- `src/app/groups/page.js` [NEW]
- `src/app/calls/page.js` [NEW]
- `src/app/notifications/page.js` [NEW]
- `src/app/settings/page.js` [NEW]
- `src/app/connect/page.js` [NEW]
- `src/components/UserDiscovery.js` [NEW]

## Task Breakdown

### Phase 1: Navigation & Routing [P0]
1. [x] **[frontend-specialist]** Create placeholder pages for missing routes (`groups`, `calls`, `notifications`, `settings`) to avoid 404s.
   - *Input*: Navigation items in `AppLayout.js`.
   - *Output*: Functional shell pages.
   - *Verify*: Clicking sidebar icons doesn't result in 404.
2. [x] **[frontend-specialist]** Fix Logout redirection.
   - *Input*: `AuthContext.js` and `AppLayout.js`.
   - *Output*: Use `router.push('/login')` after logout state update.
   - *Verify*: Clicking logout clears storage and redirects.

### Phase 2: Channel Selection Debug [P0]
3. [x] **[frontend-specialist]** Debug and fix `SidebarChannels` selection logic.
   - *Input*: `SidebarChannels.js` and `dashboard/page.js`.
   - *Output*: Ensure `setActiveChannel` correctly updates parent state and re-renders `ChatWindow`.
   - *Verify*: Clicking a channel preview opens the chat.

### Phase 3: Social & Friend Requests [P1]
4. [x] **[backend-specialist]** Verify friend request endpoints and ensure they return proper data for the frontend.
   - *Input*: `auth.route.js` and `user.route.js`.
   - *Verify*: Endpoints like `/api/users/recommended` work correctly.
5. [x] **[frontend-specialist]** Implement `Connect` page and `UserDiscovery` component.
   - *Input*: `userApi` from `api.js`.
   - *Output*: A page to view recommended users and send friend requests.
   - *Verify*: Users can list other people and click "Add Friend".

### Phase 4: Polish & Refinement [P2]
6. [x] **[frontend-specialist]** Add "Connect" to sidebar navigation.
7. [ ] **[orchestrator]** Final verification of all flows.

## Phase X: Final Verification
- [ ] `security_scan.py` passes.
- [ ] `ux_audit.py` passes for the new dashboard.
- [ ] Manual test of the full chat lifecycle.
