## 2024-05-23 - Duplicate Link Text in List Views
**Learning:** Screen reader users struggle with list views where every item has a generic "Open Case" button. The context is visually implied by the row layout but lost in non-visual navigation.
**Action:** Use `aria-label` to inject unique context into repetitive actions (e.g., `aria-label="Open case AWM-2025-0001"`). This makes the "Link List" tool in screen readers actually usable.
