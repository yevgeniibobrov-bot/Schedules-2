Add a collapsible analytics block under the schedule table.

Block title:
Ефективність по дільницях (Факт / План в годинах)

The block must be collapsed by default.

Structure:
The collapsible block is placed directly below the weekly schedule grid.

Layout:
[Schedule table]

[Collapsible block]
Ефективність по дільницях (Факт / План в годинах)
▼ Розгорнути

When expanded the analytics table becomes visible.

---

TABLE STRUCTURE

Columns:
Дільниця
ПН
ВТ
СР
ЧТ
ПТ
СБ
НД
Тиждень

First column "Дільниця" must be sticky when scrolling horizontally.

If the schedule is viewed in single-day focus mode, the corresponding day column should have a subtle highlighted background.

---

DATA GROUPING

Rows must be grouped by department sections.

Example hierarchy:

ВИПІЧКА
  Пекарня - Виробництво
  Пекарня
  Старший пекар

КАСА
  Касир ЦК
  Асистент КСО
  Додаткова каса
  Каса

КУЛІНАРІЯ
  Кулінарія - Виробництво
  Піца
  Помічник кухаря
  Кулінарія
  Старший кухар

СВІЖІ ПРОДУКТИ
  Гастрономія
  Кондитерка
  Лавка традицій

КАФЕ
  Бариста
  Кулінарія - Виробництво (Кафе)
  Працівник закладу ресторан. господарства (Кафе)

ЛОГІСТИКА
  Склад
  Фахівець з приймання та обліку товарів

ТОРГОВИЙ ЗАЛ
  Мерчендайзер
  Молоко / Хліб
  Овочі і фрукти
  Стелажна торгівля
  Флорист

МʼЯСО
  Мʼясо - Виробництво
  Мʼясо

РИБА
  Риба - Виробництво
  Риба
  Кухар з приготування суші

ВНУТРІШНЯ БЕЗПЕКА
  Охоронець

Each department row is a summary row that aggregates all roles under it.

Role rows appear below the department row with a colored dot marker.

---

CELL FORMAT

Each cell displays values in the format:

[Факт] / [План]

Example:
9 / 13

All values must be rounded to integers.

---

COLOR LOGIC

For department summary rows:

If (Факт − План) < -4 hours
→ cell text is red

If (Факт − План) > 8 hours
→ cell text is orange

If within normal range
→ cell text is green

---

For role rows:

If (Факт − План) < -2 hours
→ red background and red text

If (Факт − План) > 5 hours
OR if Факт > 0 and План = 0
→ orange background and orange text

If within normal range
→ green background and green text

If План = 0 and Факт = 0
→ neutral gray text

---

WEEK TOTAL

The column "Тиждень" must sum all values across the week.

At the bottom of the table there must be a sticky footer row:

ВСЬОГО ПО ВІДДІЛУ

This row aggregates all фактичні and планові години across all units.

Footer row should have a darker background for emphasis.

---

BEHAVIOR WITH FILTERS

If a department is selected in the schedule filter:

The table should display only data for that department.

If "Всі відділи" is selected:

The table shows all departments.

---

COLLAPSIBLE BEHAVIOR

Collapsed state:
Only title row visible

Expanded state:
Full analytics table visible

Chevron icon rotates on expand/collapse.