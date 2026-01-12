## 2024-05-23 - Micro-UX: The Power of Empty States
**Learning:** In initial app experiences, an empty list (like "0 Cases") is often treated as a null state, leaving users with a blank screen. Transforming this into an actionable "Empty State" with a clear CTA ("Create First Case") and friendly iconography significantly reduces friction for first-time users.
**Action:** Always check for `length === 0` on list pages and provide a dedicated, actionable component instead of just showing nothing.
