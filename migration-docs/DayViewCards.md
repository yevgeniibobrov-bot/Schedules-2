# DayViewCards

Shift card components optimized for the day timeline view. Renders shifts as proportional colored segments within a fixed-height row, with sub-unit color coding, break gaps, and status overlays.

## Exported Components

### DayShiftCard

Plan mode shift card for the timeline. Shows multi-segment visualization where each sub-unit is rendered as a proportional colored block, with break gaps between segments.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| shift | `ShiftData` | Yes | Shift data to render |
| isSelected | `boolean` | Yes | Whether this card has selection highlight |
| onClick | `() => void` | Yes | Click handler |
| onContextMenu | `(e: React.MouseEvent) => void` | No | Right-click handler |

### DayFactShiftCard

Fact mode shift card showing actual time with deviation indicators. Renders actual sub-units, shows status badges (overtime, missing, no-show), delta hours, and a red underline bar when actual time differs from planned.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| shift | `ShiftData` | Yes | Shift data with actual time information |
| isSelected | `boolean` | Yes | Whether this card has selection highlight |
| onClick | `() => void` | Yes | Click handler |
| onContextMenu | `(e: React.MouseEvent) => void` | No | Right-click handler |

### DayOpenShiftCard

Open shift card for the timeline. Shows a green-bordered card with a plus icon and sub-unit labels. Supports marketplace/exchange visual indicators.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| shift | `ShiftData` | Yes | Open shift data |
| openShiftId | `string` | Yes | Open shift identifier |
| deptId | `string` | Yes | Department ID |
| dayIndex | `number` | Yes | Day index |
| isSelected | `boolean` | Yes | Whether this card has selection highlight |
| onClick | `() => void` | Yes | Click handler |
| onContextMenu | `(e: React.MouseEvent) => void` | No | Right-click handler |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Icons (Leaf, Building02, ShieldCheck, Coffee, Layers, ArrowLeftRight, PaperPlane, AddPlus, Clock, TriangleWarning) | `@fzwp/ui-kit/icons` | Absence type icons, break indicators, sub-unit badges, exchange indicators |

## Key Features

- Multi-segment timeline rendering: sub-units displayed as proportional colored blocks
- Break gap visualization with coffee icon between segments
- Smart segment merging: consecutive segments of the same sub-unit are merged to reduce noise
- Smart label dedup: sub-unit label shown only on the first segment when split around a break
- Absence card variants: leave (blue), sick (red), temp-assignment (orange), reserved (purple)
- Marketplace indicator overlay (dashed border + exchange icon) for exchange shifts
- Proposal status indicator (paper plane icon for pending proposals)
- Fact mode deviations: red bottom bar when actual differs from planned, delta hours badge
- Fact status badges: overtime, missing, no-show with color-coded labels
- Sub-unit colors from the shared `subUnitColors` module

## Usage

```tsx
<DayShiftCard
  shift={shiftData}
  isSelected={selectedId === shiftData.id}
  onClick={() => onShiftClick(shiftData)}
/>
```

## Dependencies

- `./ShiftCard` -- `ShiftData` type
- `./subUnitColors` -- `getSubUnitColor`, `getSubUnitAlphaColor` utilities
- `lucide-react` -- `Thermometer` icon (sick leave)
