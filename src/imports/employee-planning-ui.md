GOAL
Optimize the employee row for fast shift planning.
The UI should follow a clear hierarchy:

Employee row → quick scan
Tooltip → quick check
Drawer → detailed information

Do not redesign the whole layout. Improve the existing components.

EMPLOYEE ROW (CARD)

Purpose: allow managers to quickly scan employees and understand their workload capacity.

Structure:

[Avatar]

Employee Name
Role · Employment %

Monthly hours progress bar

Planned / Monthly norm
Example: 152 / 176h

Keep the row visually compact and readable.

Include:

• employee name and surname
• role / position
• employment percentage (e.g. 100%, 50%)
• monthly hours progress bar
• planned hours vs monthly norm

Add optional status indicators:

• minor employee indicator (badge "<18" or small icon)
• overtime state (progress bar becomes warning or danger color)

Do NOT display:

• list of departments / roles
• long metadata

Those belong to the drawer.

HOVER TOOLTIP (EMPLOYEE MONTHLY SUMMARY)

Trigger: hover over employee hours or progress bar.

Purpose: allow quick workload check without opening the drawer.

Tooltip content:

Current month (Month name)

Monthly norm
Example: 176h

Planned hours (schedule)
Example: 152h

Actual hours (timesheet if available)

Remaining hours
Example: Norm − Planned

Example layout:

Current month (March)

Norm: 176h
Planned: 152h
Actual: 120h

Remaining: 24h

OVERTIME WARNING TOOLTIP

If planned hours exceed the employee limit:

Show a warning state.

Example:

⚠ Overtime warning

Planned: 182h
Norm: 176h
Exceeded by: +6h

Use a red accent or warning icon.

MULTI-MONTH TOOLTIP

If the visible week spans two months:

Display both month summaries.

Example:

February
Planned: 92 / 160h

March
Planned: 16 / 176h

EMPLOYEE DRAWER (DETAIL VIEW)

Simplify the current drawer and structure the information.

Remove unnecessary sections like daily shift list or notes.

Drawer sections:

A) Employee profile

Avatar
Name
Role · Department
Employment %

B) Monthly hours balance

Section title: "Баланс годин (місяць)"

Fields:

Норма
Example: 176h

У графіку
Example: 24h

Факт
Example: 16h

Заплановано
Example: 8h

Відсутності
Example: 0h

C) Total workload

Section title: "Загальне навантаження"

Example:

24 / 250h

Explain that it represents the employee workload limit.

D) Current week summary

Section title: "Цей тиждень"

Shifts count
Example: 3

Planned hours
Example: 24h

REMOVE FROM DRAWER

Remove:

• daily shift breakdown
• notes section
• redundant schedule details already visible in the grid

The drawer should provide context, not duplicate the schedule grid.

VISUAL BEHAVIOR

Progress bar states:

Green → normal workload
Orange → close to limit
Red → overtime

Keep typography consistent with the rest of the scheduling UI.