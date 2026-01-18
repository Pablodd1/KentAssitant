## 2024-05-22 - Improved Loading States and Accessibility
**Learning:** Users perceive applications as "broken" or "slow" when empty text like "Loading..." is used without visual indicators. Adding a standard spinner (`Loader2`) significantly improves perceived performance. Also, ensuring interactive elements have `aria-busy` and explicit `aria-label`s makes the app robust for screen readers.
**Action:** Always pair loading text with a visual spinner and use `aria-live="polite"` for dynamic content updates. Ensure all icon-only or repetitive links have unique `aria-label`s.
