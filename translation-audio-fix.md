# Plan: Translation and Audio Fixes (Orchestrated)

## Overview
Fix three critical regression bugs in the NativeTalk translation and audio systems. Coordinate specialized agents to ensure robust proxying, clean backend-only translation, and stable audio storage.

## Success Criteria
- [ ] Text translation works via `/api/translate` proxy (Argos VPS).
- [ ] 0 calls to `insforge.functions.invoke('translate')` remain in the codebase.
- [ ] Audio messages upload successfully to `audio-messages` bucket and return a valid public URL.
- [ ] Backend STT proxy `/api/stt` functions correctly for transcribed/translated audio.

## Proposed Strategy (Debugger Analysis)

### Bug 1: VPS 500 Error
- [x] **Symptom:** VPS returns 500.
- [x] **Root Cause:** Incorrect payload or direct VPS access from frontend.
- [x] **Fix:** Implement robust backend proxy in `server.js` that normalizes payload to `{ text, from, to }`.

### Bug 2: Redundant Insforge Calls
- [ ] **Symptom:** CORS errors to Insforge functions.
- [ ] **Root Cause:** Lingering fallback logic.
- [ ] **Fix:** Global search and replace/removal of all Insforge function calls for translation.

### Bug 3: Audio Upload Failure
- [ ] **Symptom:** `undefined` access on `publicUrl`.
- [ ] **Root Cause:** Response object structure from Insforge storage was not correctly parsed.
- [ ] **Fix:** Update `uploadAudio` to use `data.path` and explicit `getPublicUrl` call.

## Tech Stack
- **Backend:** Express (Node.js) acting as proxy.
- **Frontend:** React + Vite.
- **Storage:** Insforge Storage.
- **Translation/STT:** Argos/Whisper VPS.

## Task Breakdown

### Phase 1: Implementation (Foundation & Backend)
| Task ID | Name | Agent | Skills | Priority | DEPENDS ON | INPUT → OUTPUT → VERIFY |
|---------|------|-------|--------|----------|------------|--------------------------|
| 1.1 | Verify Bucket | `devops-engineer` | storage | P0 | - | Check `audio-messages` existence → Bucket confirmed → `list-buckets` check |
| 1.2 | Backend Proxies | `backend-specialist` | clean-code | P0 | - | implement `/api/translate` & `/api/stt` in `server.js` |

### Phase 2: Implementation (Frontend Cleanup)
| Task ID | Name | Agent | Skills | Priority | DEPENDS ON | INPUT → OUTPUT → VERIFY |
|---------|------|-------|--------|----------|------------|--------------------------|
| 2.1 | API.js Refactor | `frontend-specialist` | clean-code | P1 | 1.2 | Remove Insforge calls, update `uploadAudio` logic in `api.js` |
| 2.2 | Chat Flow Sync | `frontend-specialist` | clean-code | P1 | 2.1 | Update `StitchChat.jsx` to use backend `/api/stt` proxy |

### Phase 3: Verification (Test Engineer)
| Task ID | Name | Agent | Skills | Priority | DEPENDS ON | INPUT → OUTPUT → VERIFY |
|---------|------|-------|--------|----------|------------|--------------------------|
| 3.1 | STT/Translation PT | `test-engineer` | testing-patterns | P2 | 2.2 | Verify audio flow end-to-end |
| 3.2 | Security/Lint Check | `security-auditor` | vulnerability-scanner | P2 | 2.2 | Run `security_scan.py` and `lint_runner.py` |

## Phase X: Final Verification Checklist
- [ ] No purple hex codes in UI components
- [ ] No standard template layouts in chat bubbles
- [ ] `security_scan.py` pass
- [ ] `lint_runner.py` pass
- [ ] Audio upload confirmed via console logs
- [ ] Translation quality confirmed (Original vs Translated)
