# NativeTalk Orchestration Plan: App Structure & Auth Redesign

## Goal
Restructure the application's foundational layout and meticulously recreate the `nativetalk_splash_refined`, `nativetalk_login_refined`, and `nativetalk_onboarding_refined` designs. The current implementation deviates significantly from the provided design philosophy, utilizing two-column desktop layouts and Lucide icons instead of the intended centered, organic mobile-first approach with Material Symbols.

## Workflow Status
**Phase 1: Planning (project-planner)**
This document serves as the required `docs/PLAN.md` for the Orchestrate workflow. User approval is required to proceed to Phase 2 (Implementation).

## Architecture & Structure Audit
1. **Routing (`App.jsx`)**: The routing works, but the initial visual flow is unpolished. The app currently dumps unauthenticated users into `LandingPage` or `LoginPage` without a proper Splash Screen transition as per `nativetalk_splash_refined`.
2. **Icons**: The codebase is mixed. `HomePage`, `BottomNav`, and `ChatPage` use Material Symbols. `LoginPage` and `SignUpPage` still use `lucide-react`. We must standardize 100% on Material Symbols to mimic native Android/iOS guidelines as designed.
3. **Responsive Container**: Auth pages are currently wide (max-w-6xl). They must be constrained to a single column (`max-w-md mx-auto`) to ensure they look like a native application on desktop browsers (simulating a mobile view), matching the `nativetalk_login_refined` HTML.

## Proposed Changes (Phase 2 Roadmap)

### Group 1: Core/Frontend Specialist Tasks
**1. Rebuild `LoginPage.jsx` & `SignUpPage.jsx`**
- Remove Lucide icons and replace with `material-symbols-outlined`.
- Remove the 2-column layout. Implement the centered `max-w-md` container.
- Add background decorative elements (floating emojis: 🇧🇷, 🇺🇸, 🇯🇵).
- Implement the "glass-input" CSS class and specific styling for inputs.
- Ensure the "Continuar com o Google" button is present and styled correctly.

**2. Rebuild `LandingPage.jsx` based on `nativetalk_splash_refined`**
- The current landing page (if any) or initial load should use the Splash design.
- Implement the deep space gradient background (`#0D2137` to `#0A1A1F`).
- Add the pulsing teal logo container with the `public` Material Symbol.
- Implement the "Adicionar à tela inicial" button exactly as designed.

**3. Rebuild `OnboardingPage.jsx` based on `nativetalk_onboarding_refined`**
- Create the complex visual showing two "phones" (PT-BR and JA-JP) angled with a glowing connection line and globe between them.
- Add the pagination dots and CTA button.

### Group 2: Polish/Testing & Ops Tasks
**4. Global Structure Adjustments (`App.jsx` & `index.css`)**
- Verify the `min-h-screen` adjustments work flawlessly on auth pages.
- Ensure the font family `Inter` is universally applied to the newly structured pages.

## Pre-requisites & Risks
- **Asset Replacement:** The design requires specific background blur gradients and SVGs. We will use CSS approximations (e.g., `blur-[120px]`) as defined in the HTML files.
- **Routing Logic:** If a user opens the app, they should see the Splash screen briefly, then standard Auth logic routes them to Login or Dashboard. We'll simulate this in `LandingPage.jsx`.

---
## User Action Required
Please review this plan. If you approve, say "Yes" or "Proceed", and the Orchestrator will spawn the `frontend-specialist` and `test-engineer` agents in parallel to execute these changes.
