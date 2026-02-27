# Specification

## Summary
**Goal:** Restore the interactive map and admin control buttons in three frontend components that were previously working but are now broken or missing.

**Planned changes:**
- Restore `AllLocationsMap.tsx` to a fully interactive Leaflet/OpenStreetMap map that fetches bird location markers from the backend, supports filtering by bird name via a dropdown (with an "All" option), auto-centers/zooms to fit visible markers, includes a show/hide toggle, and a "Return to Home" button
- Restore the five admin-only action buttons in `BirdDataTable.tsx` (إضافة, تعديل, حفظ, حذف, تحرير) using a `useState + useEffect` pattern for the admin identity check, while preserving all columns, RTL layout, and data-fetching logic
- Restore the four admin-only action buttons in `BirdGallery.tsx` (إضافة, حفظ, حذف, تحرير) using a `useState + useEffect` pattern for the admin identity check, while preserving gallery search, card layout, image display, and existing functionality

**User-visible outcome:** Admin users can see and use all action buttons in the data table and gallery, and the interactive map at /map displays synchronized bird location markers with filtering, all consistent with the previous working state.
