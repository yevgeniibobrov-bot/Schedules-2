# PlanningDrawer — UI Kit Migration

## Status
**Migrated**

## UI Kit Components Used
- `Button` from `@fzwp/ui-kit/button`

## Migration Changes

### Buttons (12 native `<button>` replaced with `<Button>`)

- **ActionCard component** — now uses `<Button>` with `fullWidth`, `whitespace-normal`, `min-w-0!` classes to preserve layout behavior of the original block-level buttons.
- **TypeSwitch** — uses `<Button variant="light">` for toggle-style controls.
- **Footer actions**:
  - "Скасувати" — `<Button variant="bordered" color="default" size="md">`
  - "Зберегти" — `<Button variant="solid" color="primary" size="md">`
  - "Видалити зміну" — `<Button variant="bordered" color="danger" fullWidth size="md">`
- **Add-block / add-break buttons** — `<Button variant="bordered" color="primary">` with inline `borderStyle: "dashed"` to replicate the original dashed-border add affordance.

### Selects (7 native `<select>` replaced with Button+dropdown pattern)

The following selects were converted to a `<Button>` trigger paired with a dropdown menu pattern:

- Department selector
- Employee selector
- Unit selector
- Absence type selector
- Day selectors
- Break duration selector

This approach was chosen because `@fzwp/ui-kit` does not provide a direct `<Select>` component; the Button+dropdown combination is the established UI Kit pattern for controlled selection.

### Import Added
```tsx
import { Button } from "@fzwp/ui-kit/button";
```

## Kept As-Is (with reason)

| Element | Reason |
|---------|--------|
| `Thermometer` icon from `lucide-react` | No equivalent icon exists in `@fzwp/ui-kit/icons`. |
| `TimeInput` component | Complex custom combobox with portal rendering, keyboard navigation, and time parsing logic. No UI Kit equivalent provides this level of specialized behavior. Migrating would require a full rewrite with no clear benefit. |

## Notes
- This was the largest migration target in the Schedules module (12 buttons + 7 selects).
- The `min-w-0!` important utility on ActionCard buttons prevents flex overflow issues that surfaced after switching from plain `<button>` to `<Button>`.
- The dashed border on add-block/add-break buttons uses inline `style` because Tailwind's `border-dashed` alone does not match the original design when combined with `variant="bordered"`.
