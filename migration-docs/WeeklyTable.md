# WeeklyTable

The main weekly schedule grid displaying departments, employees, and their shifts across 7 days. Supports drag-and-drop shift reassignment, resource coverage rows, open shifts, collapsible department sections, and both plan and fact view modes.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| departments | `Department[]` | Yes | Array of departments with employees and shifts |
| days | `string[]` | Yes | Day labels array, e.g. `["Пн", "Вт", ...]` |
| dayDates | `string[]` | Yes | Formatted date strings for each day |
| todayIndex | `number` | Yes | Index of today in the week (0-6), -1 if outside range |
| onShiftClick | `(shift, employee, department) => void` | Yes | Callback when a shift card is clicked |
| onEmployeeClick | `(employee) => void` | Yes | Callback when an employee name is clicked |
| onEmptyCellClick | `(employee, dayIndex, department) => void` | No | Callback when an empty cell is clicked |
| onShiftContextMenu | `(e, shift, employee, department) => void` | No | Right-click on a shift card |
| onShiftDrop | `(item, targetEmployeeId, targetDayIndex) => void` | No | Callback when a shift is dropped onto a cell |
| onDropToOpenShift | `(item, targetDayIndex, deptId) => void` | No | Callback when a shift is dropped onto the open shifts row |
| onOpenShiftContextMenu | `(e, openShift, department) => void` | No | Right-click on an open shift card |
| onOpenShiftClick | `(openShift, department) => void` | No | Callback when an open shift is clicked |
| onOpenShiftEmptyCellClick | `(dayIndex, department) => void` | No | Callback for empty cell click in open shifts row |
| onEmptyCellContextMenu | `(e, employee, dayIndex, department) => void` | No | Right-click on an empty cell |
| selectedShiftId | `string` | No | ID of the currently selected shift (for highlight) |
| planFact | `"plan" \| "fact"` | No | Plan or fact display mode |
| focusedSubUnit | `string \| null` | No | Sub-unit filter -- dims shifts not belonging to this sub-unit |
| issuesFilterActive | `boolean` | No | When true, only shows employees with validation issues |
| issueEmployeeIds | `Set<string>` | No | Employee IDs with validation issues |
| issueDeptIds | `Set<string>` | No | Department IDs with resource/open-shift issues |
| readOnly | `boolean` | No | Disables editing interactions |

## Exported Types

| Type | Description |
|------|-------------|
| `Employee` | Employee with id, name, position, fte, monthlyNorm, workedHours, shifts map, isMinor, origin, marketplaceHours |
| `OpenShift` | Open shift with id, dayIndex, and ShiftData |
| `SubUnitResource` | Sub-unit resource data with name and daily forecast/scheduled/actual |
| `ResourceControl` | Department resource data with daily totals and sub-unit breakdown |
| `Department` | Department with id, name, employees, openShifts, and optional resourceControl |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Button | `@fzwp/ui-kit/button` | Collapse/expand toggles, add shift buttons, popover triggers |
| Icons (ChevronDown, ChevronRight, AddPlus, User01, ChartBarVertical, Layers, TriangleWarning, ArrowLeftRight, UnfoldMore, UnfoldLess, etc.) | `@fzwp/ui-kit/icons` | Department expand/collapse, employee avatars, resource indicators, issue badges |

## Key Features

- HTML table layout with sticky header row (day columns) and sticky employee name column
- Collapsible department sections with expand/collapse all toggle
- Department accent color bar (left border) for visual grouping
- Employee rows: name, position, FTE, monthly hours progress bar with overwork warning
- Resource coverage row per department with forecast/scheduled comparison and sub-unit breakdown
- Open shifts row per department (hidden in fact mode)
- Shift cards rendered via `ShiftCard`, `OpenShiftCard`, or `FactShiftCard` depending on mode
- Drag-and-drop support via react-dnd for shift reassignment between employees/days
- Custom drag ghost preview (`DragGhostPreview`)
- Drop target highlighting with visual feedback
- Resource popover on hover showing detailed coverage metrics
- Minor employee badge with restriction tooltip
- Employee hours tooltip with monthly breakdown
- Sub-unit focus dimming for non-matching shifts
- Issues filter that hides employees without validation problems
- Today column highlighted with accent background
- Dot indicator for resource coverage status in column headers

## Usage

```tsx
<WeeklyTable
  departments={departments}
  days={["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]}
  dayDates={["10.03", "11.03", ...]}
  todayIndex={2}
  onShiftClick={handleShiftClick}
  onEmployeeClick={handleEmployeeClick}
  onShiftDrop={handleDrop}
  planFact="plan"
/>
```

## Dependencies

- `./ShiftCard` -- `ShiftCard`, `OpenShiftCard`, `FactShiftCard`, `DragGhostPreview`, `ShiftData`, `DragItem`, drag type constants
- `react-dnd` / `react-dnd-html5-backend` -- Drag-and-drop framework
