## 2025-01-26 - Navigation Link Patterns
**Learning:** Text-only links with arrows (e.g., "Open Case ->") are confusing and hard to read for screen readers. Replacing them with explicit text and an icon (`ArrowRight` from `lucide-react`) within a `flex items-center gap-2` container improves clarity and alignment.
**Action:** For all navigation links to items, replace text arrows with `ArrowRight` icon and ensure `aria-label` is descriptive.
