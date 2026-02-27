# Specification

## Summary
**Goal:** Restore missing columns in BirdDataTable and fix upload functionality in BirdGallery so that data syncs correctly with the interactive map and photo gallery.

**Planned changes:**
- In `BirdDataTable.tsx`: Restore the "Northern Hemisphere" (النصف الشمالي), "Latitude (°)" (خط العرض °), and "Zone" (المنطقة) column headers and their data cells in the correct positions; include these fields as editable inputs in both the Add new row form and inline Edit mode.
- In `BirdGallery.tsx`: Fix the Add (إضافة) form to correctly upload main images and sub-images as blobs, store blob IDs in the bird record's images array, and immediately refresh the gallery with the new card; fix the Edit (تحرير) action to persist replacement images to the bird record; fix the Add Audio (إضافة الصوت) button to upload audio as a blob, associate the blob ID with the bird record, and make it immediately playable from the gallery card.

**User-visible outcome:** The bird data table displays and allows editing of the three previously missing columns, and images/audio uploaded through gallery admin controls appear immediately on gallery cards without requiring additional navigation.
