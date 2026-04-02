# DayViewResourceRow

Resource coverage chart row for the day timeline view. Displays a half-hour resolution bar chart comparing forecast demand vs scheduled staff, with interactive hover/click popovers showing detailed metrics per time slot.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| dept | `Department` | Yes | Department with employees and resource data |
| rc | `ResourceControl` | Yes | Resource control data (daily forecast/scheduled) |
| dayIndex | `number` | Yes | Day index (0-6) |
| isFact | `boolean` | Yes | Whether showing fact mode |
| focusedSubUnit | `string \| null` | No | Sub-unit filter for coverage calculation |
| range | `TimeRange` | Yes | Current visible time range |

## UI Kit Components

This component does not use any `@fzwp/ui-kit` components directly. It uses raw HTML/CSS for the bar chart rendering and React portals for the popover.

## Key Features

- Half-hour resolution bar chart across the visible time range
- Forecast distribution using weighted curve (peaks at 10:00-14:00, drops at night)
- Scheduled staff computed from actual employee shifts per 30-minute slot
- Layered bar visualization: forecast outline, scheduled fill, deficit/surplus coloring
- Deficit detection: red bars when scheduled < forecast, green when covered
- Over-coverage visualization: translucent green bars extending above forecast
- Interactive slots: hover to preview, click to pin a coverage popover
- Coverage popover showing time slot, forecast, scheduled, difference, and sub-unit breakdown
- Sub-unit breakdown in popover lists how many employees per sub-unit in each slot
- Outside-click dismissal for pinned popovers
- Memoized calculations for forecast weights, distribution, and scheduled counts

## Usage

```tsx
<DayResourceRow
  dept={department}
  rc={department.resourceControl}
  dayIndex={3}
  isFact={false}
  focusedSubUnit={null}
  range={{ start: 6, end: 15 }}
/>
```

## Dependencies

- `./WeeklyTable` -- `Department`, `ResourceControl`, `Employee` types
- `./ShiftCard` -- `ShiftData` type
- `./DayViewComponents` -- `RESOURCE_ROW_H`, `gridWidthPx`, `TimeRange` type
- `react-dom` -- `createPortal` for popover rendering
