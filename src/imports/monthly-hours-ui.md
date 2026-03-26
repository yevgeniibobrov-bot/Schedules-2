Goal:
Make the monthly hours balance easier to understand and visually consistent with the employee row.

Fix the progress bar logic

The progress bar must represent USED HOURS relative to the monthly norm.

Used hours = Actual + Planned + Absences.

Example:

Used: 40h
Norm: 176h

Progress bar label:

40 / 176h

Do not display "У графіку" as the main value.
Replace it with "Використано".

Improve the Monthly Balance section

Rename the section to:

"Баланс годин (місяць)"

Structure:

Норма
176h

Використано
40h

Breakdown:

Факт
24h

Заплановано
16h

Відсутності
0h

Add a new row:

Залишок
136h

Improve visual hierarchy

Use three levels of hierarchy:

Level 1 (section title)
Баланс годин (місяць)

Level 2 (primary metrics)
Норма
Використано
Залишок

Level 3 (breakdown with indentation)
Факт
Заплановано
Відсутності

Add small left indentation for breakdown rows.

Clarify total workload meaning

Rename section:

"Загальне навантаження"

Add explanation:

"(з урахуванням біржі змін)"

Example value:

40 / 250h

This indicates the employee's total workload limit including shift exchange.

Improve weekly summary section

Section title:

"Цей тиждень"

Metrics:

Зміни
5

Заплановані години
40h

Maintain visual consistency

Use the same progress bar style as in the employee row.
Numbers should remain right aligned.
Avoid adding unnecessary UI elements or extra blocks.