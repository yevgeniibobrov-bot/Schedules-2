Improve shift card layout and weekly coverage indicators for better readability and consistency.

1. Fix unit / role name length in shift cards.

Unit names can be very long and currently break the card layout.

Rules:
- Unit/role name must always stay on a single line.
- Apply automatic truncation with ellipsis if text exceeds card width.
- Do not manually shorten names.
- Example:
"Фахівець з приймання та обліку товарів"
→ "Фахівець з приймання…"
- The full name must remain visible in tooltip on hover.

2. Remove the colored dot before unit names.

Currently a colored dot appears before the unit/role name.  
This duplicates color information and adds visual noise.

Remove the colored dot and keep the unit name as plain text.

3. Use consistent color coding for units (дільниці).

Each unit must have a consistent color across the interface.

Color should appear in:
- the left border of the shift card
- the work segments of the timeline
- tooltip timeline indicators

Break segments must remain neutral gray.

4. Improve the shift timeline bar.

The timeline should represent:
work → break → work

Rules:
- Keep the bar compact (do not stretch across the entire card width).
- Recommended width: about 80px.
- Break must be displayed as a separate segment.
- Maintain the current tooltip timeline logic.

5. Keep a clean card layout.

Final element order inside the card:

1. shift time
2. unit / role name
3. break indicator (☕ 30 хв)
4. timeline bar

Ensure consistent vertical spacing between elements.

6. Improve visual balance of cards.

Cards currently appear wide with empty space.

Do not add extra data fields (like total hours).  
Instead rely on a slightly wider timeline and consistent text truncation.

7. Improve weekly coverage indicators (row with values like 16/16, 8/16).

Enhance readability of staffing coverage per day:

- Keep the format: assigned / required
- Use color coding:
  green = fully covered
  red = shortage
  neutral = balanced

Add an optional subtle visual bar or indicator behind the numbers to show coverage ratio.

Example:
16/16 → full green
8/16 → red shortage

The goal is to allow managers to quickly scan the week and identify shortages without reading every number.

8. Preserve existing functionality.

Do not change:
- shift generation logic
- break calculation
- tooltip content
- employee hour counters