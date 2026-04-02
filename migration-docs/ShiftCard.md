# ShiftCard — UI Kit Migration

## Status
**Already Compliant**

## UI Kit Components Used
- None directly from `@fzwp/ui-kit/button` (see below).

## Migration Changes
None required.

## Kept As-Is (with reason)

| Element | Reason |
|---------|--------|
| Semantic `<button>` for shift cards with drag-and-drop | ShiftCard uses `<button>` as the root interactive element to support both click selection and drag-and-drop reordering. The drag-and-drop integration relies on attaching drag event handlers and data attributes directly to the DOM element. `<Button>` from UI Kit does not support drag-and-drop natively, and wrapping it would add unnecessary complexity. The custom styling (position, dimensions, colors) is entirely domain-specific. |
| `Thermometer` icon from `lucide-react` | No equivalent icon exists in `@fzwp/ui-kit/icons`. |

## Notes
- If the `Thermometer` icon is added to `@fzwp/ui-kit/icons` in the future, it should be swapped in both `ShiftCard` and `DayViewCards`.
