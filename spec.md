# Specification

## Summary
**Goal:** Remove the static map background image from the AllLocationsMap component so the user can upload their own correct map image.

**Planned changes:**
- In `frontend/src/components/AllLocationsMap.tsx`, remove the static map image element (base map background) from the bird locations map page.
- Leave all other functionality untouched: bird filtering, show/hide toggle, pin rendering, return-to-home button, RTL orientation, and all styling.

**User-visible outcome:** The bird locations map page no longer shows the incorrect static map image; the map area displays a neutral background while all controls and bird pins remain fully functional.
