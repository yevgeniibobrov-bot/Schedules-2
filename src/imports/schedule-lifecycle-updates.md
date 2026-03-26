1. Add schedule lifecycle indicator

Add a schedule status indicator above the schedule grid or near the header controls.

This indicator should clearly display the current lifecycle state of the schedule.

Statuses:

Draft
Pending approval
Approved

Visual style:

Draft
icon: edit
label: "Чернетка"
description: "Графік редагується"

Pending approval
icon: clock
label: "На затвердженні"
description: "Очікує підтвердження"

Approved
icon: check
label: "Затверджено"
description: "Графік фіналізовано"

The indicator should always be visible and reflect the current state of the schedule.

2. Integrate lifecycle with existing header actions

Use the existing "Опублікувати" button in the header as the lifecycle trigger.

Behavior:

If status = Draft

Clicking Опублікувати triggers schedule validation.

If validation passes without issues → schedule moves to Pending approval (or directly to Approved depending on permissions).

If validation finds issues → open the validation modal.

If status = Pending approval

Replace the header action with:

"Повернути"
"Затвердити"

If status = Approved

Replace the header action with:

"Зняти затвердження"
or
"Розблокувати редагування"

3. Interaction rules

When schedule status is:

Pending approval
or
Approved

the schedule grid becomes read-only.

Disable the following interactions:

shift creation
drag and drop
shift editing
shift deletion

Managers should still be able to view:

coverage indicators
problem indicators
employee workload information.

4. Improve validation modal

When the user clicks Опублікувати, run schedule validation.

If validation finds issues → open a validation modal.

Add a summary section at the top.

Example:

"Знайдено 2 критичні помилки і 3 попередження"

5. Problem list structure

Group problems by employee.

Each problem entry should contain:

employee name
day or date
problem description

Example:

Марія Шевченко
Вт — міжзмінний відпочинок менше 11 годин

6. Severity levels

Problems should be visually separated by severity.

Error (red)
Warning (yellow)

Error examples:

shift overlap
insufficient rest between shifts
daily hour limit exceeded

Warning examples:

insufficient weekly hours
coverage gaps in forecast.

7. Footer buttons logic

If errors exist

Disable the publish action.

Footer buttons:

"Повернутись до редагування"

If only warnings exist

Allow confirmation with warning.

Footer buttons:

"Повернутись до редагування"
"Опублікувати все одно"

8. Optional UX improvement

Clicking a problem inside the validation modal should:

automatically scroll the schedule grid
highlight the related shift cell.

9. Preserve existing problem indicator in header

The existing problem indicator near the Publish button (e.g. red badge with number of issues) should remain visible.

Clicking this indicator may also open the validation modal, allowing users to review issues before publishing.