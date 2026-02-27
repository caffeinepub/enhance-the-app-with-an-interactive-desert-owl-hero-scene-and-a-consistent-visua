# Specification

## Summary
**Goal:** Restore all bird data records and admin control buttons in `BirdDataTable.tsx` and `BirdGallery.tsx` that disappeared after the v598 regression.

**Planned changes:**
- In `BirdDataTable.tsx`: restore all five admin-only action buttons (إضافة, تعديل, حفظ, حذف, تحرير) using a `useState + useEffect` pattern for the `isAdmin` check so buttons render once admin identity resolves
- In `BirdDataTable.tsx`: fix data-fetching logic so all bird records load correctly on first render
- In `BirdGallery.tsx`: restore all five admin-only action buttons (إضافة, حفظ, حذف, تحرير, إضافة الصوت) using a `useState + useEffect` pattern for the `isAdmin` check
- No other files, components, pages, routes, or backend files are modified

**User-visible outcome:** Authenticated admin users see all action buttons and all bird data records in both the data table and the gallery, exactly as they appeared before the v598 regression.
