Refactor the shift creation modal to simplify actions and remove duplicated controls.

Remove:
- the toggle "Відправити на біржу"
- the button "Створити і на біржу"
- the field "Нетто (перерва)"
- start/end break time inputs
- the "Оплачувана" break toggle

Update shift time section:

Replace:
"Загальна тривалість" and "Нетто"

With a single section:

"Час зміни"
Start time — End time
Example:
09:00 — 18:00

Breaks:

Replace detailed break editor with a simplified control:

"Перерва"
+30 хв

Break is always unpaid and fixed length.

Rename section:

"Валідація"

to

"Перевірка"

Add shift type selector:

"Тип зміни"

Options:
• Звичайна зміна
• Біржа змін
• Запропонувати працівнику

Behavior:

Standard shift:
assigned directly to employee

Exchange shift:
visible on shift marketplace for all employees

Proposed shift:
sent as a personalized proposal to a selected employee via marketplace

If "Запропонувати працівнику" is selected,
require employee selection.

Keep only two footer buttons:

[ Скасувати ]
[ Створити ]