Refactor the weekly scheduling view to implement planning-first layout with analytics on demand.

1. Remove from canvas

Remove permanent sub-unit rows (Reception A, Reception B, etc.).

Remove separate “Deficits” row.

Remove sub-units × days matrix under department.

2. Keep in main canvas

Employee rows with assigned shifts.

Single “Resources” summary row per department showing:

Forecast

Scheduled

Delta
(displayed per day in week view)

3. Resource Breakdown (Drill-down)

On click of any Resources cell (specific day), open a popover:
Title: “Resource Breakdown – [Selected Day]”

Inside popover:

List all sub-units.

For each sub-unit display:
Forecast → Scheduled → Delta

Add actions:
“+ Create Open Shift”
“Assign”

Add Day / Week toggle inside popover.

Popover must not modify main canvas layout.

4. Sub-unit Focus Mode

“Sub-units” button in header opens dropdown with all sub-units.

When a sub-unit is selected:

Resources row displays metrics only for selected sub-unit.

Shifts belonging to selected sub-unit are highlighted.

Other shifts reduced opacity (~70%).

Add “Clear selection” option.

Focus mode must not change structural layout.

5. Default behavior

If no sub-unit selected → show department-level summary.

Keep layout stable in all states.