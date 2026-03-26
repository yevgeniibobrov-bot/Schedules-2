Improve the schedule dashboard summary and department coverage row to reduce duplication and simplify the interface.

1. Rename "Resources" to "Покриття".

In the department header row, rename the label "Resources" to "Покриття".

Example:

Before:
Resources 80г / 70г -10г

After:
Покриття 80г / 70г

This terminology is clearer for store managers and matches the language used in the schedule summary.

---

2. Remove the shortage delta from the department weekly forecast.

Currently the department header shows a delta value such as:

80г / 70г  -10г

Remove the delta (-10г).

Shortage is already visible through:
• daily coverage indicators (16/16, 8/16 etc.)
• the global shortage indicator

Keeping the delta adds visual noise without providing new information.

Final format:

Покриття 80г / 70г

---

3. Change top summary behavior depending on the department filter.

When "Всі відділи" is selected:

Display the full store-level summary:

Нестача  
Покриття  
Біржа

Example:

Нестача 95г  
Покриття 970г / 875г  
Біржа 2

This summary represents the entire store schedule.

---

4. When a specific department is selected.

Completely hide the top summary block.

The department coverage information should remain only inside the department header row.

Example:

Випічка  
Покриття 80г / 70г

This avoids duplicated information and simplifies the layout.

---

5. Keep the department header structure unchanged.

Department rows should remain visually identical regardless of whether the view shows all departments or a single department.

Department header structure:

Department name  
Покриття 80г / 70г

---

6. Goal of these changes

• remove duplicated metrics  
• simplify scanning of coverage problems  
• keep the department row as the single source of department-level information  
• reduce visual noise in the schedule interface  
• keep implementation simple with minimal layout changes