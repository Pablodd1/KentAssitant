## 2024-05-23 - Dynamic ARIA Labels for Repetitive Links
**Learning:** In list views where multiple items have identical link text (e.g., "Open Case" or "View"), screen reader users lose context when navigating by links.
**Action:** Always append dynamic content (like case code or title) to the `aria-label` attribute (e.g., `aria-label="Open case AWM-2025-0001"`) to provide necessary context without changing the visual design.
