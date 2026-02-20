# Specification

## Summary
**Goal:** Fix the current build/pipeline failure with minimal changes so the project builds successfully end-to-end (frontend + canister) and the app loads to Home without runtime crashes.

**Planned changes:**
- Identify and correct the root cause(s) of the build failure (TypeScript and/or Motoko), applying minimal code/config updates to restore a clean build.
- Add lightweight developer-facing build-time safeguards that fail fast with clear errors for common causes (e.g., missing imports/exports, missing referenced static assets, invalid lazy imports), without impacting initial page load performance.

**User-visible outcome:** The app builds successfully with no TypeScript or Motoko compile errors and loads the Home page normally (hero and existing sections render as before) without a blank screen or runtime crash.
