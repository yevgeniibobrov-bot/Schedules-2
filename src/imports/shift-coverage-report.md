GOAL
The block should help managers quickly understand whether enough shifts are scheduled compared to the forecasted labor demand across departments and areas.

Rename the section
Current title:
"Ефективність по дільницях (Факт / План в годинах)"

Replace with:
"Покриття змін (Прогноз / Заплановано)"

Add a short helper description under the title (small secondary text):
"Показує чи достатньо призначено змін для покриття прогнозної потреби в годинах."

Typography:
title — semibold
description — 12px, neutral-500

Update data meaning
All values should represent:

Заплановано / Прогноз

Example:
24 / 32
16 / 16

Remove any references to “Факт”.

Improve visual readability of cells

Remove heavy progress bars or strong visual noise.

Each cell should contain only the value:

"Заплановано / Прогноз"

Add very light semantic background states:

• Perfect coverage (equal values)
background: green-50
text: green-700

• Slight shortage (planned < forecast but close)
background: orange-50
text: orange-700

• Critical shortage (large gap)
background: red-50
text: red-700

• No demand (0 / 0)
background: neutral-50
text: neutral-500

Cells should remain clean numeric indicators optimized for quick scanning.

Weekly column emphasis

In the "Тиждень" column:

make numbers bold (font-weight 600)
because it represents the aggregated result for the whole week.

Fix the collapse / expand interaction

Replace the incorrect arrow icon.

Collapsed state:
chevron-right

Expanded state:
chevron-down

Use a standard collapsible section pattern.

The icon must rotate when expanding.

Keep the table structure

Columns:
Дільниця | Пн | Вт | Ср | Чт | Пт | Сб | Нд | Тиждень

Hierarchy:
Department → Areas (indented rows)

Department rows should have slightly stronger background (neutral-100) to visually group areas.

Improve scanability

• Use subtle row striping or very light hover state
• Maintain consistent column alignment
• Numbers should be center aligned

Do NOT introduce decorative elements

Avoid:
• tab / tongue shaped headers
• floating widgets
• additional graphs

Keep the block clean, analytical, and aligned with modern workforce planning dashboards.