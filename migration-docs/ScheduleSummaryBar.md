# ScheduleSummaryBar

Horizontal metrics bar displaying aggregate schedule statistics: coverage status (deficit/surplus/balanced), total forecast vs scheduled hours, and shift exchange count. Hidden when a specific department is focused (department-level metrics are shown in the department header instead).

**Note**: This component's functionality has been merged into the Header component (Row 2 metrics). It remains as a standalone component for backward compatibility or alternative layouts.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| departments | `Department[]` | Yes | All departments to aggregate metrics from |
| isFact | `boolean` | Yes | Whether showing fact mode (uses actual hours instead of scheduled) |
| focusedSubUnit | `string \| null` | No | Sub-unit filter for metric calculation |
| focusedDeptId | `string \| null` | No | When set, component renders nothing (returns null) |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Icons (TriangleWarning, CircleCheck, Clock, ArrowLeftRight) | `@fzwp/ui-kit/icons` | Status indicator (deficit/ok), coverage icon, exchange icon |

## Key Features

- Aggregates forecast and scheduled hours across all departments
- Sub-unit aware: when focusedSubUnit is set, metrics are scoped to that sub-unit
- Coverage status display:
  - Deficit (red warning icon + "Нестача Xг")
  - Balanced (green check icon + "Збалансовано")
  - Surplus (green check icon + "Надлишок +Xг")
- Coverage metric: "Покриття Xг / Yг" showing forecast vs scheduled
- Exchange metric: count of shifts on the marketplace (hidden in fact mode)
- Auto-hides when a specific department is focused

## Usage

```tsx
<ScheduleSummaryBar
  departments={departments}
  isFact={false}
  focusedSubUnit={null}
  focusedDeptId={null}
/>
```

## Dependencies

- `./WeeklyTable` -- `Department` type
