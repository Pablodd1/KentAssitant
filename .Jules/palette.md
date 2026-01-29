# Palette's Journal

## 2024-05-23 - Link Context for Screen Readers
**Learning:** List items with generic link text like "Open Case" rely heavily on visual context (being in the same card as the case ID). Screen readers need explicit context.
**Action:** Always add unique `aria-label` to repeated action links in lists, referencing the specific item identifier (e.g., `aria-label={'Open case ' + c.caseCode}`).
