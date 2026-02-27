# Specification

## Summary
**Goal:** Replace the display value 'Tropical' with '40' in the Zone (المنطقة) column of BirdDataTable.

**Planned changes:**
- In `frontend/src/components/BirdDataTable.tsx`, update the Zone column so that any cell displaying 'Tropical' renders '40' instead, in both read-only display mode and inline-edit mode.

**User-visible outcome:** The Zone column in the bird data table will show '40' wherever 'Tropical' previously appeared, in both view and edit modes, with no other changes to the table.
