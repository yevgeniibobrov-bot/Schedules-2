# ContextMenu

Right-click context menu for shift cards. Provides different action sets depending on the shift type: employee-assigned shifts, open shifts, or exchange shifts.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| x | `number` | Yes | Horizontal position (px from left) |
| y | `number` | Yes | Vertical position (px from top) |
| onAction | `(actionId: string) => void` | Yes | Callback with the selected action ID |
| onClose | `() => void` | Yes | Close the menu |
| variant | `"employee" \| "open-shift" \| "on-exchange"` | No | Menu variant determining available actions (default: `"employee"`) |
| hasClipboard | `boolean` | No | Whether paste action is enabled (shift in clipboard) |

## Exported Types

| Type | Description |
|------|-------------|
| `ContextMenuAction` | Action definition: `{ id, label, icon, danger?, dividerBefore?, disabled?, shortcut? }` |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Button | `@fzwp/ui-kit/button` | Menu item buttons with icon, label, and shortcut |
| Divider | `@fzwp/ui-kit/divider` | Section dividers between action groups |
| Icons (EditPencil01, Copy, Clipboard, TrashFull, ArrowLeftRight, UserAdd, UserCheck, Undo) | `@fzwp/ui-kit/icons` | Action icons for each menu item |

## Key Features

- Three variant-specific action sets:
  - **Employee**: Edit, Copy (Ctrl+C), Paste (Ctrl+V), Exchange, Convert to open shift, Delete
  - **Open Shift**: Edit, Copy, Paste, Exchange, Assign to employee, Delete
  - **On Exchange**: Edit, Copy, Paste, Remove from exchange, Assign to employee, Delete
- Dividers separating logical action groups
- Danger styling for destructive actions (Delete)
- Keyboard shortcut labels (Ctrl+C, Ctrl+V)
- Disabled state for paste when clipboard is empty
- Click-outside dismissal
- Escape key dismissal
- Viewport overflow adjustment (repositions if menu would clip)
- Fixed positioning via portal

## Usage

```tsx
<ShiftContextMenu
  x={event.clientX}
  y={event.clientY}
  variant="employee"
  hasClipboard={!!clipboardShift}
  onAction={handleContextAction}
  onClose={() => setContextMenu(null)}
/>
```

## Dependencies

None (self-contained component).
