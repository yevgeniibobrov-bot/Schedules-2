Simplify the schedule lifecycle workflow that was previously implemented.

Replace the current 3-state workflow (Draft → Pending approval → Approved) with a simpler 2-state model.

New lifecycle:

Draft
Published

Status indicator

Update the status indicator:

Draft
icon: edit
label: "Чернетка"
description: "Графік редагується"

Published
icon: check
label: "Опубліковано"
description: "Графік доступний працівникам"

Remove the Pending approval state and all UI related to it.

Header actions

Use the existing "Опублікувати" button in the header.

Behavior:

If status = Draft
clicking Опублікувати runs schedule validation.

If validation passes → schedule status changes to Published.

If validation finds issues → open the validation modal.

If status = Published

replace header action with:

"Повернути до редагування"

This switches the schedule back to Draft.

Interaction rules

When status = Published:

schedule grid becomes read-only.

Disable:

shift creation
drag and drop
shift editing
shift deletion

Managers can still view:

coverage indicators
problem indicators
employee hours.

Validation modal

Keep the existing validation modal.

Logic:

If errors exist → publishing is blocked.

If only warnings exist → allow confirmation.

Buttons:

"Повернутись до редагування"
"Опублікувати все одно"

Cleanup

Remove UI elements related to the previous approval workflow:

Pending approval status
"Повернути" action
"Затвердити" action
approval state logic.