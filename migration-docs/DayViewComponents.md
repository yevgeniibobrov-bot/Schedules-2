# DayViewComponents

Foundational building blocks for the day timeline view: time grid, time header, current time indicator, employee cells, employee timelines, and open shift timelines. Also exports layout constants and time range configuration.

## Exported Components

### TimeGridLines

Renders vertical grid lines at 30-minute intervals across the timeline.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| range | `TimeRange` | Yes | The visible time range `{ start, end }` |

### TimeHeader

Renders time labels (full hours primary, half hours secondary) with tick marks along the top of the timeline.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| range | `TimeRange` | Yes | The visible time range |

### CurrentTimeIndicator

Red triangle marker and vertical line showing the current time position on the timeline.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| isToday | `boolean` | Yes | Only renders when true |
| range | `TimeRange` | Yes | Current visible time range |

### DayEmployeeCell

Left-panel employee cell showing name, position, FTE, monthly hours progress bar, and optional minor badge and overwork warning. Includes an hours tooltip on hover.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| emp | `Employee` | Yes | Employee data |
| onEmployeeClick | `(employee) => void` | Yes | Click handler |

### DayEmployeeTimeline

Right-panel timeline row for an employee, positioning shift cards based on their time range within the grid.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| emp | `Employee` | Yes | Employee data |
| dept | `Department` | Yes | Department context |
| dayIndex | `number` | Yes | Day index |
| isFact | `boolean` | Yes | Plan or fact mode |
| readOnly | `boolean` | Yes | Disable interactions |
| selectedShiftId | `string` | No | Selected shift for highlight |
| focusedSubUnit | `string \| null` | No | Sub-unit filter |
| isToday | `boolean` | Yes | Whether this is today |
| range | `TimeRange` | Yes | Current visible time range |
| onShiftClick | `(shift, employee, department) => void` | Yes | Shift click handler |
| onShiftContextMenu | `(e, shift, employee, department) => void` | No | Right-click handler |
| onEmptyCellClick | `(employee, dayIndex, department) => void` | No | Empty area click |

### DayOpenShiftTimeline

Right-panel timeline row for open shifts within a department.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| dept | `Department` | Yes | Department with open shifts |
| dayIndex | `number` | Yes | Day index |
| readOnly | `boolean` | Yes | Disable interactions |
| selectedShiftId | `string` | No | Selected shift for highlight |
| focusedSubUnit | `string \| null` | No | Sub-unit filter |
| isToday | `boolean` | Yes | Whether this is today |
| range | `TimeRange` | Yes | Current visible time range |
| onOpenShiftClick | `(openShift, department) => void` | No | Open shift click handler |
| onOpenShiftContextMenu | `(e, openShift, department) => void` | No | Right-click handler |
| onOpenShiftEmptyCellClick | `(dayIndex, department) => void` | No | Empty area click |

## Exported Constants & Types

| Export | Type | Value | Description |
|--------|------|-------|-------------|
| `TimeRange` | interface | `{ start: number; end: number }` | Time range definition in decimal hours |
| `FULL_RANGE` | `TimeRange` | `{ start: 0, end: 24 }` | Full 24-hour range |
| `JUMP_RANGES` | `TimeRange[]` | 3 ranges | Predefined zoom ranges: 0-9, 6-15, 15-24 |
| `DEFAULT_JUMP_INDEX` | `number` | `1` | Default active range (06:00-15:00) |
| `RESOURCE_ROW_H` | `number` | `64` | Resource row height in pixels |
| `OPEN_SHIFT_ROW_H` | `number` | `60` | Open shift row height |
| `EMPLOYEE_ROW_H` | `number` | `72` | Employee row height |
| `gridWidthPx` | function | -- | Calculates pixel width for a time range |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Icons (User01, TriangleWarning) | `@fzwp/ui-kit/icons` | Employee avatar placeholder, overwork warning |

## Key Features

- Grid line rendering at 30-minute intervals with full-hour emphasis
- Time header with full-hour (bold) and half-hour (subtle) labels plus tick marks
- Current time indicator with triangle marker and subtle vertical line
- Employee cell with monthly hours progress bar, overwork detection, minor badge
- Employee hours tooltip via portal showing monthly norm, planned, actual, marketplace, remaining/exceeded
- Minor badge with portal tooltip showing age restrictions (night shifts, max days, max hours)
- Shift positioning via `clampShift` that clips shift cards to the visible time range
- Sub-unit filtering in timeline rows
- Shift tooltips via `ShiftTooltip` from ShiftCard module

## Usage

```tsx
<TimeHeader range={{ start: 6, end: 15 }} />
<TimeGridLines range={{ start: 6, end: 15 }} />
<DayEmployeeTimeline
  emp={employee}
  dept={department}
  dayIndex={0}
  isFact={false}
  readOnly={false}
  isToday={true}
  range={{ start: 6, end: 15 }}
  onShiftClick={handleShiftClick}
/>
```

## Dependencies

- `./WeeklyTable` -- `Employee`, `Department`, `OpenShift` types
- `./ShiftCard` -- `ShiftData` type, `ShiftTooltip` component
- `./DayViewCards` -- `DayShiftCard`, `DayFactShiftCard`, `DayOpenShiftCard`
- `react-dom` -- `createPortal` for tooltip/badge rendering
