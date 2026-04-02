# DayViewCards — UI Kit Migration

## Status
**Already Compliant**

## UI Kit Components Used
- None directly from `@fzwp/ui-kit/button` (see below).

## Migration Changes
None required.

## Kept As-Is (with reason)

| Element | Reason |
|---------|--------|
| Semantic `<button>` elements for shift timeline cards | These are interactive card surfaces rendered on a timeline grid, not standard action buttons. They use `<button>` for keyboard accessibility and click handling but have fully custom visual styling (colored blocks with absolute positioning, variable width/height). Replacing with `<Button>` would require overriding nearly all of its default styling, which defeats the purpose of using a design-system component. |
| `Thermometer` icon from `lucide-react` | No equivalent icon exists in `@fzwp/ui-kit/icons`. |

## Notes
- The semantic `<button>` usage here is intentional and correct from an accessibility standpoint: shift cards are interactive elements that benefit from native keyboard focus and activation behavior.
