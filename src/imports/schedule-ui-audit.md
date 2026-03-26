Perform a full UI consistency and structural audit of the Schedule system.

Goal:
Ensure visual, structural and behavioral consistency across Week and Day views.

1. Employee Row Pattern Consistency
- The employee identity block (avatar, name, role, FTE, worked/norm, progress bar, remaining hours) must appear consistently in both Week and Day views.
- Restore missing employee summary components in Day view.
- Ensure identical structure and spacing across views.
- No summary info should disappear when switching views.

2. Layout Structure Integrity
- Ensure row heights are consistent.
- Shift cards must be vertically centered inside rows.
- No card may overflow row boundaries.
- Department headers must align perfectly with grid.
- Grid must not visually break row containers.

3. Weekly vs Daily Logic Separation
- Weekly summary must not interfere with daily logic.
- Remove duplicate weekly data if shown in multiple places.
- Ensure department-level summary is consistent.

4. Visual Hierarchy
- Resources row must be lighter than employee rows.
- Shift cards must be visually dominant over grid.
- Reduce background noise and heavy tints.
- Maintain enterprise-grade clean layout.

5. Cross-View Parity
- Switching Week ↔ Day must not:
  - Remove employee data blocks
  - Change identity layout
  - Break spacing
  - Shift horizontal alignment

6. Component Integrity
- Ensure:
  - Avatar alignment consistent
  - Progress bar size identical everywhere
  - Typography hierarchy consistent
  - Color tokens consistent
  - Badge styling consistent

7. Remove UI Drift
- Identify and correct inconsistencies introduced during recent modifications.
- Restore structural harmony across entire schedule system.

Do not add new features.
Do not redesign.
Only fix inconsistencies and structural layout issues.