## 2025-05-23 - Accessibility in Voice Control
**Learning:** Adding `aria-live` to status text regions is critical for async operations like voice recording. Without it, screen reader users have no way of knowing if the recording actually started or stopped without manually exploring the DOM.
**Action:** Always wrap status messages (loading, recording, processing) in an `aria-live="polite"` region.

## 2025-05-23 - Icon-Only Button Labels
**Learning:** "X" buttons for file removal are a common pattern but often lack labels. Adding `aria-label="Remove [filename]"` provides necessary context that a simple "Remove" label misses when there are multiple files.
**Action:** Always include the item name in the `aria-label` for list item actions.
