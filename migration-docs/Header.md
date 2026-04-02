# Header — UI Kit Migration

## Status
**Migrated (Partial)**

## UI Kit Components Used
- `Modal` from `@fzwp/ui-kit/modal`
- `ModalContent` from `@fzwp/ui-kit/modal`
- `ModalHeader` from `@fzwp/ui-kit/modal`
- `ModalBody` from `@fzwp/ui-kit/modal`
- `ModalFooter` from `@fzwp/ui-kit/modal`

## Migration Changes

### Publish Modal
- **Before**: Custom div-based modal with manual backdrop, positioning, and focus management.
- **After**: Replaced with `<Modal>` composition from `@fzwp/ui-kit/modal` using `ModalContent`, `ModalHeader`, `ModalBody`, and `ModalFooter` sub-components.
- This gives the modal consistent styling, animation, focus trapping, and accessibility (ESC to close, aria attributes) from the UI Kit.

### Import Added
```tsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@fzwp/ui-kit/modal";
```

## Kept As-Is (with reason)

| Element | Reason |
|---------|--------|
| `Target` icon from `lucide-react` | No equivalent icon exists in `@fzwp/ui-kit/icons`. |
| Custom snackbar/toast notifications | Migrating to `Toast` from UI Kit requires wrapping the application root in a `<ToastContextProvider>`. This is an app-level architectural change outside the scope of per-component migration. Documented as future work. |
| Custom dropdown menus (dept, sub-unit, view mode) | These already use `<Button>` from `@fzwp/ui-kit` internally. The dropdown logic itself is custom but the trigger elements are compliant. No further migration needed. |

## Notes
- The snackbar-to-Toast migration should be tracked as a separate task. It requires adding `<ToastContextProvider>` in the app shell (likely `CrmShell.tsx` or the root layout), after which all components can use `useToast()` instead of custom snackbar state.
- The dropdown menus in Header were already partially migrated in a previous pass; their `<Button>` triggers are UI Kit components.
