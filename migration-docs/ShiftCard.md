# ShiftCard

Weekly view shift card components with drag-and-drop support. Provides visual representations for assigned shifts, open shifts, and fact-mode shifts, including absence states, marketplace indicators, and validation badges.

## Exported Components

### ShiftCard

Standard shift card for the weekly grid. Displays time range, sub-unit color indicators, break info, and status-specific styling. Supports drag-and-drop via react-dnd.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| shift | `ShiftData` | Yes | Shift data to render |
| onClick | `() => void` | Yes | Click handler |
| onContextMenu | `(e: React.MouseEvent) => void` | No | Right-click handler |
| isSelected | `boolean` | No | Whether this card has selection ring |
| employeeId | `string` | No | Source employee ID (for drag item) |
| dayIndex | `number` | No | Source day index (for drag item) |
| draggable | `boolean` | No | Enable drag-and-drop (default: false) |
| validationLevel | `"error" \| "warning" \| null` | No | Validation badge severity |
| validationMessage | `string` | No | Validation tooltip text |

### OpenShiftCard

Card for unassigned open shifts in the weekly grid. Green accent with plus icon and sub-unit labels.

### FactShiftCard

Fact mode card showing actual vs planned time, status badges (overtime, missing, no-show), delta hours, and deviation indicators.

### DragGhostPreview

Custom drag ghost shown during drag-and-drop operations. Renders a floating preview of the shift being dragged.

### ShiftTooltip

Hover tooltip for shift cards showing detailed shift information (time range, sub-units, break, marketplace status). Used by both weekly and day view components.

## Exported Types & Constants

| Export | Description |
|--------|-------------|
| `ShiftData` | Core shift data interface with timeRange, subUnits, status, exchange, fact fields |
| `ShiftStatus` | Union type: `"normal" \| "open" \| "leave" \| "sick" \| "temp-assignment" \| "reserved"` |
| `ExchangeStatus` | `"on-exchange"` |
| `DragItem` | Drag-and-drop item payload with shift, source info |
| `SHIFT_DND_TYPE` | DnD type constant: `"SHIFT_CARD"` |
| `OPEN_SHIFT_DND_TYPE` | DnD type constant: `"OPEN_SHIFT_CARD"` |
| `sessionCreatedShiftIds` | Set tracking recently created shift IDs for visual indicator |
| `isBlockingStatus()` | Check if a status blocks shift creation (leave, sick, etc.) |
| `hasBlockingShift()` | Check if any shift in array has blocking status |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Icons (Leaf, Building02, ShieldCheck, Coffee, ArrowLeftRight, PaperPlane, TriangleWarning) | `@fzwp/ui-kit/icons` | Absence type icons, break indicator, exchange/proposal icons, overwork warning |

## Key Features

- Status-specific card styling: normal, open (green), leave (blue), sick (red), temp-assignment (orange), reserved (purple)
- Multi-line layout: time range, sub-unit color dots with labels, break text
- Sub-unit color indicators using consistent color palette from `subUnitColors`
- Marketplace/exchange visual: dashed border + exchange icon for shifts on the marketplace
- Proposal status: paper plane icon for pending proposals, exchange icon for accepted
- Drag-and-drop via react-dnd with custom empty image preview
- Validation badges: error (red) or warning (orange) indicator with tooltip
- Recently created shift indicator (subtle green dot)
- Fact mode: actual vs planned time display, status badges, delta hours
- Shift tooltip via portal with full shift details on hover

## Usage

```tsx
<ShiftCard
  shift={shiftData}
  onClick={() => onShiftClick(shiftData)}
  isSelected={selectedId === shiftData.id}
  employeeId={emp.id}
  dayIndex={2}
  draggable={!readOnly}
/>
```

## Dependencies

- `./subUnitColors` -- `getSubUnitColor` for consistent sub-unit coloring
- `react-dnd` / `react-dnd-html5-backend` -- Drag-and-drop framework
- `lucide-react` -- `Thermometer` icon (sick leave)
- `react-dom` -- `createPortal` for tooltips
