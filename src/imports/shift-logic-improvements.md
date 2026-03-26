Improve shift creation and editing logic.

1. Creation context behavior

When the shift creation drawer is opened from an employee cell:

- The employee is preselected.
- The day is locked.
- The shift is created as an assigned shift by default.

Available options:

☐ Розмістити на біржі  
☐ Запропонувати працівнику

"Запропонувати працівнику" should create a proposal shift for that employee.

Both options are independent and may be enabled separately.

---

When the shift creation drawer is opened from the "Відкриті зміни" row:

- No employee is selected by default.
- The shift is created as an open shift.

Available options:

☐ Розмістити на біржі

Do not show "Запропонувати працівнику" unless an employee is selected.

If an employee is selected later in the form,
the option "Запропонувати працівнику" becomes visible.

---

2. Editing shifts

Remove conflicting toggles inside the form.

Do not place exchange actions in the drawer header.

Instead show contextual actions inside the drawer body.

Rules:

If the shift is not on the exchange:
show action → "Розмістити на біржі"

If the shift is already on the exchange:
show action → "Зняти з біржі"

If the shift is assigned to an employee:
show action → "Запропонувати працівнику"

These actions should appear as clear action rows or buttons,
not as multiple toggles that can conflict.

---

3. Open shifts logic

Open shift = shift without an employee.

An open shift may optionally be placed on the exchange.

Do not treat "open shift + exchange" as a separate shift type.

Exchange is only a status.

---

4. Naming improvements

Rename:

"Сегменти зміни" → "Частини зміни"

"+ Додати сегмент" → "+ Додати частину"

---

5. Time picker

Replace the current time picker.

Allow only 30 minute increments:

:00  
:30

Use a simpler picker or dropdown instead of the current minute-based selector.

---

6. Timeline

Move the timeline directly below the "Частини зміни" section
so it helps when creating multiple shift parts.

If it cannot help during creation, remove it entirely.