## 2025-05-22 - List Navigation Pattern
**Learning:** List views with repetitive actions (like 'Open Case') benefit significantly from dynamic `aria-label` attributes incorporating unique identifiers (e.g., `aria-label={'Open case ' + c.caseCode}`).
**Action:** Standardize navigation links to use `ArrowRight` icon from `lucide-react` with `group-hover:translate-x-1` animation for visual feedback and unique `aria-label`s for accessibility.
