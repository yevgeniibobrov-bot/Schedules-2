# PlanningDrawer

Side drawer panel for creating and editing shifts. Supports multiple modes: editing an existing shift, viewing employee details, creating a new assigned shift, or creating an open shift. Includes time block management, break configuration, sub-unit assignment, absence type selection, and marketplace/exchange options.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| mode | `DrawerMode` | Yes | Drawer operation mode: `"shift"` (edit), `"employee"` (view), `"create"` (new shift), `"create-open"` (new open shift) |
| employee | `Employee` | Yes | Target employee for the shift |
| department | `Department` | Yes | Department context |
| shift | `ShiftData` | No | Existing shift data (for edit mode) |
| dayIndex | `number` | No | Day index for the shift (0=Mon, 6=Sun) |
| onClose | `() => void` | Yes | Close the drawer |
| allDepartments | `Department[]` | No | All departments for department selector in create mode |
| allEmployees | `Employee[]` | No | All employees for employee selector |
| isOpenShift | `boolean` | No | Whether the shift being edited is an open/exchange shift |
| onCreateShift | `(params) => void` | No | Callback when a new shift is created |
| onSaveShift | `(params) => void` | No | Callback when an existing shift is saved |
| onDeleteShift | `(params) => void` | No | Callback when a shift is deleted |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Button | `@fzwp/ui-kit/button` | Action buttons, time controls, toggles, save/delete/close |
| Icons (CloseMD, Clock, User01, AddPlus, TrashFull, CalendarDays, Leaf, ArrowLeftRight, PaperPlane, Star, etc.) | `@fzwp/ui-kit/icons` | Close button, time/user/shift type icons, absence indicators, marketplace icons |

## Key Features

- Slide-in drawer from the right side of the screen
- Type mode switch between shift and absence creation
- Time block editor: add/remove time blocks with start/end/unit selectors
- Break configuration with duration and start time
- Sub-unit assignment per time block
- Employee selector with search and department context
- Department selector for cross-department shift creation
- Shift type selection: standard, exchange (marketplace), proposal
- Absence type selection: vacation, sick leave, other
- Duration calculation displayed in real-time
- Employee hours summary (monthly norm, worked, remaining)
- Minor employee restrictions display
- Blocking shift detection (prevents creation when employee has leave/sick)
- Validation warnings for overlapping shifts and hour limits
- Delete confirmation for existing shifts
- Portal-based rendering for overlay positioning

## Usage

```tsx
<PlanningDrawer
  mode="create"
  employee={selectedEmployee}
  department={currentDept}
  dayIndex={2}
  onClose={() => setDrawerOpen(false)}
  allDepartments={departments}
  onCreateShift={handleCreateShift}
/>
```

## Dependencies

- `./ShiftCard` -- `ShiftData` type, `hasBlockingShift` utility
- `./WeeklyTable` -- `Employee`, `Department` types
