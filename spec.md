# Specification

## Summary
**Goal:** Fix the `BirdDataTable.tsx` component so that Add, Edit, Save, and Delete action buttons are visible and fully functional for authenticated admin users, without changing any other file.

**Planned changes:**
- Add an "إضافة" (Add) button in the table toolbar/header area, visible only to authenticated admin users, that inserts a new empty editable row.
- Add a "تعديل" (Edit) button on each data row that switches the row into inline edit mode.
- Replace the "تعديل" button with a "حفظ" (Save) button when a row is in edit mode; clicking Save commits changes to the backend.
- Add a "حذف" (Delete) button on each data row that removes the record from the backend.
- Restrict all four buttons to authenticated admin users using the existing role-check logic in `BirdDataTable.tsx`.
- Style all buttons using the existing desert/amber RTL Arabic theme already in the file.
- Changes are isolated exclusively to `frontend/src/components/BirdDataTable.tsx`.

**User-visible outcome:** Authenticated admin users can add new bird records, edit existing rows inline, save changes, and delete records directly from the bird data table.
