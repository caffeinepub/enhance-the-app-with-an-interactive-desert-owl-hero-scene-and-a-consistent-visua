# Specification

## Summary
**Goal:** Fix the BirdGallery component so that newly added birds appear immediately, the edit button is visible and functional on each card, and the edit dialog supports image and audio file uploads.

**Planned changes:**
- Invalidate or refetch the gallery list React Query cache after a new bird is successfully added, so the new card appears immediately without a page reload.
- Ensure the edit button/icon is correctly rendered on each bird card for admin users, and that clicking it opens the edit dialog pre-populated with the bird's current data.
- Add a file input for image (jpg, png, webp) and a file input for audio (mp3, wav, ogg) inside the BirdGallery edit dialog.
- On edit form submission, upload any newly selected files as blobs to the backend and update the bird record with the new media references; preserve existing media if no new file is selected.
- After a successful edit save, reflect the updated image on the gallery card.
- Scope all changes exclusively to BirdGallery and the backend blob/bird update functions required to support media uploads in the edit flow.

**User-visible outcome:** Admins can add a bird and see it appear in the gallery instantly, click the edit button on any card, and replace the bird's image or audio file directly from the edit dialog.
