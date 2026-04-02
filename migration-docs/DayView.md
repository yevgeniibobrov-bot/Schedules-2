# DayView

Day timeline view showing a single day's schedule across all departments. Uses a two-panel layout with a fixed left column for employee names and a scrollable right panel with a time grid. Supports three predefined time ranges for zooming into different parts of the day.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| departments | `Department[]` | Yes | Departments with employees and shift data |
| dayIndex | `number` | Yes | Index of the displayed day (0-6) |
| dayLabel | `string` | Yes | Formatted day label |
| isToday | `boolean` | Yes | Whether this day is today (shows current time indicator) |
| isFact | `boolean` | Yes | Whether to show fact mode (actual vs planned) |
| selectedShiftId | `string` | No | Currently selected shift for highlight |
| focusedSubUnit | `string \| null` | No | Sub-unit filter |
| activeRangeIndex | `number` | No | Externally controlled active time range index |
| onActiveRangeChange | `(idx: number) => void` | No | Callback when user changes the time range |
| onShiftClick | `(shift, employee, department) => void` | Yes | Shift card click handler |
| onEmployeeClick | `(employee) => void` | Yes | Employee name click handler |
| onEmptyCellClick | `(employee, dayIndex, department) => void` | No | Empty timeline area click handler |
| onShiftContextMenu | `(e, shift, employee, department) => void` | No | Right-click on shift card |
| onOpenShiftContextMenu | `(e, openShift, department) => void` | No | Right-click on open shift |
| onOpenShiftClick | `(openShift, department) => void` | No | Open shift click handler |
| onOpenShiftEmptyCellClick | `(dayIndex, department) => void` | No | Empty open shift area click handler |
| issuesFilterActive | `boolean` | No | Only show employees with issues |
| issueEmployeeIds | `Set<string>` | No | Employee IDs with validation issues |
| issueDeptIds | `Set<string>` | No | Department IDs with issues |
| readOnly | `boolean` | No | Disable editing interactions |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Button | `@fzwp/ui-kit/button` | Time range selector buttons, collapse/expand all toggle |
| Icons (ChevronDown, ChevronRight, ChartBarVertical, Layers, TriangleWarning, ArrowLeftRight, UnfoldMore) | `@fzwp/ui-kit/icons` | Department expand/collapse, resource indicators, issue/exchange badges |

## Key Features

- Two-panel synchronized layout: fixed employee column (240px) + scrollable timeline
- Three predefined time ranges: 00:00-09:00, 06:00-15:00, 15:00-24:00
- Range selector buttons in the sticky header area
- Time header with full-hour and half-hour labels
- Vertical grid lines at 30-minute intervals
- Current time indicator (red triangle + line) for today
- Collapsible department sections with department accent colors
- Department headers showing employee count, issue count, and exchange count badges
- Resource coverage row with bar chart (via DayResourceRow)
- Open shifts row (hidden in fact mode)
- Employee rows with shift cards positioned by time on the timeline
- Fact mode banner, sub-unit focus banner, and issues filter banner
- Vertical scroll sync between left and right panels
- Wheel event forwarding from left panel to right panel

## Usage

```tsx
<DayView
  departments={departments}
  dayIndex={3}
  dayLabel="Четвер, 13 Березня"
  isToday={true}
  isFact={false}
  onShiftClick={handleShiftClick}
  onEmployeeClick={handleEmployeeClick}
/>
```

## Dependencies

- `./DayViewComponents` -- `TimeHeader`, `TimeGridLines`, `CurrentTimeIndicator`, `DayEmployeeCell`, `DayEmployeeTimeline`, `DayOpenShiftTimeline`, layout constants, `JUMP_RANGES`
- `./DayViewResourceRow` -- `DayResourceRow`
- `./ShiftCard` -- `ShiftData` type
- `./WeeklyTable` -- `Employee`, `Department`, `OpenShift` types
