# Specification

## Summary
**Goal:** Restore the missing admin-only action buttons in BirdDataTable and BirdGallery components that disappeared after the v565 deployment.

**Planned changes:**
- In `BirdDataTable.tsx`: Restore five admin-only buttons — إضافة (Add) in the toolbar, and تعديل (Edit), حفظ (Save), حذف (Delete), تحرير (Update) on each row — using a `useState` + `useEffect` pattern for the `isAdmin` check so buttons render after the actor/identity resolves.
- In `BirdGallery.tsx`: Restore four admin-only buttons — إضافة (Add) in the toolbar, and حفظ (Save), حذف (Delete), تحرير (Update) on each gallery card — using the same `useState` + `useEffect` pattern for `isAdmin`.
- No other files, components, pages, routes, or backend files are modified.

**User-visible outcome:** Authenticated admin users once again see and can use all admin action buttons in the bird data table and gallery to add, edit, save, delete, and update bird records.
