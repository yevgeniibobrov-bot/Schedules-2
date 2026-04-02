# EfficiencyTable

Collapsible bottom panel showing coverage efficiency analytics. Compares planned vs actual staffing coverage across departments and sub-units, with both weekly summary and per-day half-hour detail views.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| planDepts | `Department[]` | Yes | Departments with planned shift data |
| factDepts | `Department[]` | Yes | Departments with actual (fact) shift data |
| focusedDeptId | `string \| null` | Yes | Currently focused department (null for all) |
| focusedSubUnit | `string \| null` | No | Sub-unit filter |
| viewMode | `"week" \| "day"` | Yes | Current view mode (syncs the active tab) |
| selectedDayIndex | `number` | Yes | Currently selected day index for day view |
| dayRangeIndex | `number` | No | Time range index for day view detail (default: 1) |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Button | `@fzwp/ui-kit/button` | Expand/collapse toggle, tab buttons, department expand toggles |
| Icons (ChevronRight, ChevronDown) | `@fzwp/ui-kit/icons` | Expand/collapse indicators for departments |

## Key Features

- Collapsible panel with expand/collapse button at the top
- Two tabs: "Тиждень" (weekly) and "День" (daily)
- **Weekly tab**: Table with columns for Mon-Sun showing scheduled/forecast per sub-unit
  - Coverage status color coding: ok (green), shortage warning (yellow), shortage critical (red), overplan (gray)
  - Department-level summary row with totals
  - Expandable per-department sub-unit breakdown
  - Total row across all departments
- **Day tab**: Half-hour resolution table showing staffing levels across the selected time range
  - Columns for each 30-minute slot within the active time range
  - Forecast distribution using weighted curve (peaks mid-day)
  - Scheduled staff computed from actual employee shifts
  - Status color coding per slot
  - Department and sub-unit breakdown rows
- Custom event listener for `"open-efficiency-panel"` to programmatically open and focus
- Auto-syncs active tab with the parent `viewMode` prop
- Auto-expands focused department when panel is open

## Usage

```tsx
<EfficiencyTable
  planDepts={planDepartments}
  factDepts={factDepartments}
  focusedDeptId={focusedDeptId}
  focusedSubUnit={focusedSubUnit}
  viewMode="week"
  selectedDayIndex={3}
/>
```

## Dependencies

- `./WeeklyTable` -- `Department` type
- `./DayViewComponents` -- `JUMP_RANGES` for time range configuration
