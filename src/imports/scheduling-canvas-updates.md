Modify the current weekly scheduling canvas.
Do NOT create documentation.
Do NOT create new pages.
Update existing UI and interactions only.

1) Open Shifts improvements:

- When a shift is sent to Exchange:
  • Add visible badge on shift card: “On Exchange” (purple).
  • Show status states:
      - On Exchange
      - Claimed
      - Expired
  • Show small exchange icon in top-right corner of card.

- Open Shifts must support:
  • Right-click context menu (Edit / Delete / Duplicate / Convert to Assigned)
  • Drag & Drop to employee rows.
  • Drag preview ghost.
  • Validation on drop.

2) Exchange status visibility:

- Assigned shifts that are on exchange must display:
  • Purple border or small badge.
  • Tooltip on hover: “Sent to Exchange”.

3) Add new shift types (new card entities):

A) Leave (Vacation)
B) Sick Leave
C) Temporary Assignment (Booked to another store)

Visual rules:
- Leave = light blue background.
- Sick Leave = light red background.
- Assignment to other store = light purple background.
- These cards block scheduling (cannot assign shift over them).
- Show icon on card (plane / medical / building).

4) Blocking logic:

- If employee has Leave/Sick/Assignment on a day:
  • Show cell as blocked.
  • On attempt to create shift → show hard error.
  • Drag & drop into blocked area → show conflict state.

5) Right-click support everywhere:

Enable context menu for:
- Assigned shifts
- Open shifts
- Leave/Sick cards

Menu items:
  • Edit
  • Delete
  • Duplicate
  • Send to Exchange (if applicable)
  • Convert to Open Shift

6) Keep visual style consistent.
Do not redesign grid.
Use same component system.
Keep enterprise minimal UI.