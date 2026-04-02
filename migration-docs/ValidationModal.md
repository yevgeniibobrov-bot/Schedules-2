# ValidationModal

Modal dialog displaying schedule validation errors and warnings. Has two visual states: one for critical errors that block publishing, and a calmer one for warnings only that allows publishing anyway.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| problems | `ValidationProblem[]` | Yes | Array of all validation problems (errors and warnings) |
| onClose | `() => void` | Yes | Close the modal |
| onPublishAnyway | `() => void` | Yes | Publish despite warnings (only shown in warnings-only state) |
| onShowOnSchedule | `() => void` | Yes | Activate issues filter on the schedule grid |
| onProblemClick | `(problem: ValidationProblem) => void` | Yes | Navigate to a specific problem on the schedule |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Button | `@fzwp/ui-kit/button` | Close, publish, show-on-schedule, expand/collapse buttons |
| Modal, ModalContent, ModalHeader, ModalBody, ModalFooter | `@fzwp/ui-kit/modal` | Dialog container and layout sections |
| Icons (CloseMD, CircleWarning, TriangleWarning, Filter, PaperPlane, ChevronDown, ChevronRight, User01, Layers) | `@fzwp/ui-kit/icons` | Close button, error/warning severity icons, action icons, employee/coverage icons |

## Key Features

- **State A (Critical Errors)**: Red-accented modal with destructive border
  - Summary bar showing error and warning counts
  - Errors grouped by employee with expandable detail rows
  - Each error row is clickable to navigate to the problem on the schedule
  - Warnings section collapsed by default, expandable
  - Footer: "Закрити" and "Показати проблеми на графіку" buttons
  - Publish button NOT shown (blocked by errors)

- **State B (Warnings Only)**: Calmer orange-accented modal
  - Summary bar showing warning count
  - Warnings grouped by type (coverage, open shifts, overwork, other)
  - Expandable warning groups with individual items
  - Each warning row is clickable to navigate to the problem
  - Footer: "Закрити", "Показати на графіку", and "Відправити все одно" buttons

- Warning classification by description keywords (coverage, open shift, overwork)
- Ukrainian plural forms for count labels
- Expandable/collapsible sections with chevron indicators

## Usage

```tsx
<ValidationModal
  problems={validationProblems}
  onClose={() => setShowModal(false)}
  onPublishAnyway={handlePublishAnyway}
  onShowOnSchedule={handleShowOnSchedule}
  onProblemClick={handleProblemClick}
/>
```

## Dependencies

- `./Header` -- `ValidationProblem` type
