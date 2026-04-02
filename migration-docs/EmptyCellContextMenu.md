# EmptyCellContextMenu

Right-click context menu for empty schedule cells (cells with no shift assigned). Provides actions to create a new shift, paste from clipboard, or copy the entire week.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| x | `number` | Yes | Horizontal position (px from left) |
| y | `number` | Yes | Vertical position (px from top) |
| onAction | `(actionId: string) => void` | Yes | Callback with the selected action ID |
| onClose | `() => void` | Yes | Close the menu |
| hasClipboard | `boolean` | No | Whether paste action is enabled (default: false) |
| hasShiftsInWeek | `boolean` | No | Whether "Copy week" action is enabled (default: false) |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Button | `@fzwp/ui-kit/button` | Menu item buttons with icon, label, and shortcut |
| Divider | `@fzwp/ui-kit/divider` | Section divider before "Copy week" action |
| Icons (AddPlus, Clipboard, Copy) | `@fzwp/ui-kit/icons` | Create, paste, and copy action icons |

## Key Features

- Three actions:
  - **Create shift** (AddPlus icon) -- always enabled
  - **Paste** (Clipboard icon, Ctrl+V) -- disabled when clipboard is empty
  - **Copy week** (Copy icon) -- disabled when no shifts exist in the week, separated by divider
- Click-outside dismissal
- Escape key dismissal
- Viewport overflow adjustment (repositions if menu would clip)
- Fixed positioning

## Usage

```tsx
<EmptyCellContextMenu
  x={event.clientX}
  y={event.clientY}
  hasClipboard={!!clipboardShift}
  hasShiftsInWeek={employeeHasShifts}
  onAction={handleEmptyAction}
  onClose={() => setEmptyMenu(null)}
/>
```

## Dependencies

None (self-contained component).
