Improve shift card layout, readability, and add color coding for units (дільниці).

1. Shorten long unit names in shift cards.

Unit names may be too long for the card width.

Rules:
- Maximum 1 line for unit name.
- If the text is longer than the available space, truncate with ellipsis.
- Example:
"Фахівець з приймання та обліку товарів"
→ "Приймання та облік товарів…"
- The full name must remain visible in tooltip on hover.

2. Prioritize role names over long department descriptions.

If the name contains role + additional context:
Example:
"Кулінар - Виробництво (Кафе)"

Display in card as:
"Кулінар"

The full description should remain in tooltip.

3. Keep shift card structure compact.

Final element order inside the card:

1. Shift time
2. Unit / role name
3. Break indicator (☕ 30 хв)
4. Timeline progress bar

4. Timeline progress bar

The bar represents the shift timeline.

Requirements:
- The bar must show work segments and break segments.
- Break should appear as a separated segment.
- The progress bar must remain compact and not stretch to the full card width.
- Recommended timeline width: ~80px.

Example structure:
work → break → work

5. Add color coding for units (дільниці).

Each unit must have its own consistent color.

The color should appear in:
- the left border of the shift card
- the timeline work segments
- the dot indicator inside tooltip

Example:
Ресепшн → blue
Склад → green
Бариста → purple
Кулінарія → orange

Break segments should remain neutral gray.

6. Improve spacing.

Ensure consistent vertical spacing between:
- shift time
- unit name
- break indicator
- timeline bar

Cards should remain visually compact and easy to scan in the weekly grid.

7. Preserve existing functionality.

Do not change:
- shift generation logic
- break calculation
- tooltip structure