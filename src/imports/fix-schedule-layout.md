Fix layout and overlay issues introduced after recent UI changes.

1. Restore equal width for all day columns.

The weekly schedule must use a fixed grid layout where all day columns have the same width.

Columns must not resize based on card content.

Structure should be:

employee column | Mon | Tue | Wed | Thu | Fri | Sat | Sun

Use CSS grid or fixed flex layout so all day columns stay equal width.

2. Prevent shift cards from affecting column width.

Shift cards must not stretch the layout.

Long unit names must be truncated with ellipsis instead of expanding the column.

Unit name rules:
- single line
- truncate with ellipsis if overflow
- full name visible in tooltip

3. Restore tooltip functionality for shift cards.

Tooltips disappeared likely due to overflow clipping.

Ensure tooltips render correctly by:

- rendering tooltip through a portal (outside of overflow containers)
- using position: absolute or fixed
- applying proper z-index

Tooltips must display:
- full unit name
- detailed timeline segments

4. Fix drawer positioning.

The right-side drawer currently renders partially outside the screen.

Drawer must:

- be positioned relative to the viewport
- use position: fixed
- open fully inside the screen
- support vertical scrolling

5. Prevent overflow clipping of overlays.

Avoid using overflow: hidden on parent containers that wrap shift cards if it breaks overlays like tooltips or popovers.

If overflow is required for text truncation, apply it only to the text element, not the card container.

6. Preserve existing UI behavior.

Do not change:
- shift card structure
- resource indicators
- timeline visualization
- coverage indicators (16/16 etc.)