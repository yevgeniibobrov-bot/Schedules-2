1. Use the same interaction model in both Create and Edit.

Do not use old toggles in Create.
Do not use conflicting actions in Edit.
Do not allow “Розмістити на біржі” and “Запропонувати працівнику” at the same time.

These two options must be mutually exclusive.

2. Context-based default behavior

If the drawer is opened from an employee cell:
- preselect the employee
- lock the day
- hide the department field
- default state = regular assigned shift

If the drawer is opened from the "Відкриті зміни" row:
- employee is empty by default
- lock the day
- hide the department field if opened from a department context
- default state = open shift

3. Employee field logic

Keep the first employee option as:
"Немає (Відкрита зміна)"

Helper text under the employee field must change by state:

If employee selected and no extra option:
"Зміна буде призначена працівнику"

If no employee selected:
"Зміна буде створена як відкрита"

If “Розмістити на біржі” is selected:
"Зміна буде створена як відкрита на біржі"

If “Запропонувати працівнику” is selected:
"Зміна буде надіслана як персональна пропозиція цьому працівнику"

4. Replace current exchange/proposal controls with contextual action cards inside the drawer body

Do not use toggles.

Use compact selectable cards with icon + title + description.

Card 1:
"Розмістити на біржі"
Description:
"Зміна буде доступна будь-якому працівнику на біржі"

Card 2:
"Запропонувати працівнику"
Description:
"Персональна пропозиція тільки цьому працівнику через біржу"

Rules:
- only one card can be selected
- if employee is not selected, hide the proposal card
- if proposal card is selected, it must stay visible and selected
- if exchange card is selected for an assigned shift, the shift will no longer stay assigned to that employee after save; it becomes an open marketplace shift in the "Відкриті зміни" row
- remove any copy that says the shift is both assigned to an employee and on the exchange at the same time

5. Edit behavior

Use the same card pattern in Edit as in Create.

Do not place exchange actions in the drawer header.
Do not use two independent toggles.

Editing an assigned shift:
- default = regular assigned shift
- available cards:
  "Розмістити на біржі"
  "Запропонувати працівнику"

Editing an open shift:
- default = open shift
- available card:
  "Розмістити на біржі"

Editing an open marketplace shift:
- show a single action card:
  "Зняти з біржі"

6. Rename shift parts section

"Сегменти зміни" → "Частини зміни"
"+ Додати сегмент" → "+ Додати частину"

7. Replace the current time picker

Do not allow minute-by-minute selection.

Use a cleaner picker with only 30-minute intervals:
06:00, 06:30, 07:00, 07:30, etc.

Apply this to:
- shift start
- shift end
- break start

8. Improve break section

Keep support for:
- no breaks
- one break
- multiple breaks

Default state:
"Без перерв"

Quick add buttons:
icon plus + text labels without duplicated plus sign in text

Use:
"30 хв"
"60 хв"

Each break row should be:
[ 30 хв ▼ ] [ 13:00 ▼ ] [ delete ]

Remove duplicated plus sign in button text if the icon already contains plus.

9. Fix section order

Move the break section directly below "Частини зміни".

The timeline must appear below both:
- shift parts
- breaks

The timeline is a visual preview, not the main input.

10. Fix create/save behavior

Clicking "Створити" must actually create the shift in the correct place:

- regular assigned shift → employee row
- open shift → "Відкриті зміни" row
- marketplace shift → "Відкриті зміни" row with marketplace status
- proposal shift → targeted proposal for selected employee

Clicking "Зберегти" in Edit must persist changes to state, not just close the drawer.

11. Keep validation section, but do not let it conflict with creation logic

Validation should still show warnings/errors,
but create/edit state logic must work correctly first.