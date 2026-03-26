Refactor Create / Edit drawer:

Remove default pre-assigned employee in Create mode.

Employee field must be empty by default.

Add top-level Type switch:

Shift

Absence

SHIFT MODE:

Creation:

Employee is optional.

If empty → shift becomes Open Shift.

“Send to Exchange” toggle visible only if Employee is empty.

CTA:

Exchange OFF → “Create Shift”

Exchange ON → “Create & Send to Exchange”

Edit existing assigned shift:

Employee field must be editable dropdown.

Allow changing assigned employee.

On change:

Update FTE, Norm, Worked, Remaining info.

Recalculate monthly progress bar dynamically.

ABSENCE MODE:

Hide Time Blocks.

Hide Exchange controls.

Show Absence Type dropdown:

Vacation

Sick Leave

Other

Default = All Day.

Allow multi-day range.

CTA = “Create Absence” or “Save Absence”.

Keep employee monthly summary card visible when employee selected.
Hide it if employee not selected.

Do not break existing layout structure.