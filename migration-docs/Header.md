# Header

Schedule toolbar with week navigation, department/sub-unit filters, view mode switching, plan/fact toggle, lifecycle actions (publish/return to draft), summary metrics, and validation error access.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| department | `string` | Yes | Current department name (display only) |
| weekLabel | `string` | Yes | Formatted week range label, e.g. "10–16 Березня" |
| viewMode | `"week" \| "day"` | Yes | Current schedule view mode |
| planFact | `"plan" \| "fact"` | Yes | Plan or fact display mode |
| errorCount | `number` | Yes | Number of validation errors to show in badge |
| subUnitNames | `string[]` | No | Available sub-unit names for the focus dropdown |
| focusedSubUnit | `string \| null` | No | Currently focused sub-unit name |
| issuesFilterActive | `boolean` | No | Whether the issues-only filter is active |
| departments | `Department[]` | No | All departments for the department filter dropdown |
| focusedDeptId | `string \| null` | No | Currently focused department id |
| onViewModeChange | `(mode: "week" \| "day") => void` | Yes | Callback when view mode is toggled |
| onPlanFactChange | `(mode: "plan" \| "fact") => void` | Yes | Callback when plan/fact is toggled |
| onPrevWeek | `() => void` | Yes | Navigate to previous week |
| onNextWeek | `() => void` | Yes | Navigate to next week |
| onToday | `() => void` | Yes | Navigate to current week |
| onFocusedSubUnitChange | `(subUnit: string \| null) => void` | No | Callback when sub-unit focus changes |
| onIssuesFilterToggle | `() => void` | No | Toggle the issues-only filter |
| isCurrentWeek | `boolean` | No | Whether viewing the current week (highlights "Сьогодні" button) |
| canGoPrev | `boolean` | No | Whether previous week navigation is available |
| canGoNext | `boolean` | No | Whether next week navigation is available |
| onFocusedDeptChange | `(deptId: string \| null) => void` | No | Callback when department focus changes |
| scheduleStatus | `ScheduleStatus` | No | Current lifecycle status: `"draft"` or `"published"` |
| onScheduleStatusChange | `(status: ScheduleStatus) => void` | No | Callback to change lifecycle status |
| validationProblems | `ValidationProblem[]` | No | Validation problems for the schedule |
| onProblemClick | `(problem: ValidationProblem) => void` | No | Callback when a problem is clicked in validation modal |
| isFocusMode | `boolean` | No | Whether focus mode (hidden navigation) is active |
| onFocusModeToggle | `() => void` | No | Toggle focus mode |
| isFact | `boolean` | No | Whether showing fact mode (affects summary metrics) |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Button | `@fzwp/ui-kit/button` | Navigation buttons, dropdowns, action triggers, publish/return buttons |
| Modal, ModalContent, ModalHeader, ModalBody, ModalFooter | `@fzwp/ui-kit/modal` | Publish confirmation dialog |
| Icons (ChevronLeft, ChevronRight, ChevronDown, PaperPlane, CircleWarning, etc.) | `@fzwp/ui-kit/icons` | Navigation arrows, action icons, status indicators |

## Key Features

- Two-row header layout: Row 1 for scope/navigation/actions, Row 2 for metrics/tools
- Department dropdown filter with active state highlighting
- Sub-unit focus dropdown with clear selection option
- Week navigation with prev/next buttons and "Сьогодні" quick-jump
- View mode dropdown (Тиждень / День)
- Plan/Fact segmented toggle
- Schedule lifecycle status indicator (Чернетка / Опубліковано)
- Publish button with validation gate (opens ValidationModal when issues exist)
- Return to draft action for published schedules
- Summary metrics bar showing forecast, scheduled hours, coverage percentage, and exchange count
- Validation error badge that opens the ValidationModal
- Issues filter toggle integrated into error badge
- Focus mode toggle (expand/shrink icons)
- Snackbar notifications for publish/return actions with auto-dismiss
- Click-outside handling for all dropdowns

## Usage

```tsx
<Header
  department="Каси"
  weekLabel="10–16 Березня"
  viewMode="week"
  planFact="plan"
  errorCount={3}
  departments={departments}
  onViewModeChange={setViewMode}
  onPlanFactChange={setPlanFact}
  onPrevWeek={handlePrev}
  onNextWeek={handleNext}
  onToday={handleToday}
  scheduleStatus="draft"
  onScheduleStatusChange={handleStatusChange}
  validationProblems={problems}
/>
```

## Dependencies

- `./WeeklyTable` -- `Department` type
- `./ValidationModal` -- `ValidationModal` component
