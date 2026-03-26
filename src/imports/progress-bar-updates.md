1. Make the top progress bar use the same metric as the employee row.

The employee row currently shows:
Planned / Monthly norm

The top progress bar in the drawer must show the same metric.

Example:
152 / 176h

Do not use "Використано" as the top progress bar value if the employee row uses "Заплановано".

2. Update the monthly balance section.

Replace the current structure with:

Баланс годин (місяць)

Норма
176h

Заплановано
152h

Факт
32h

Відсутності
0h

Залишок до норми
24h

This should clearly explain the monthly balance without conflicting with the main progress bar.

3. Clarify total workload.

Rename the section to:

Загальне навантаження
з урахуванням біржі змін

Keep the value format:
40 / 250h

4. Improve the weekly summary.

In the section "Цей тиждень", add factual hours in addition to shifts count and planned hours.

Final structure:

Цей тиждень

Зміни
5

Заплановані години
40h

Фактичні години
32h

5. Keep metric logic consistent across row, tooltip, and drawer.

Employee row + top drawer progress bar = Заплановано / Норма
Detailed monthly section = breakdown of planned, actual, absences, remaining