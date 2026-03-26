Refactor the department layout to integrate the resource model directly into the department header instead of using a separate "Resources" row.

Current structure:
Department header
Open shifts
Resources row
Employee rows

Target structure:

Department header (expanded informational header)
Open shifts
Employee rows

Requirements:

1. The department header must contain:
- Department name
- Employee count
- Open shifts count
- Aggregated weekly metrics

Example header layout:

Left side:
Department name (e.g. "Front Office")
Employee count badge (e.g. "3 employees")
Open shifts badge (e.g. "2 open")

Right side:
Weekly resource summary:
Forecast hours
Scheduled hours
Difference (positive or negative)

Example:
Forecast 144h | Scheduled 102h | -42h

2. The daily resource indicators must align with the calendar columns and remain visible directly under the header, but not as a separate row labeled "Resources".

Each day cell should show:
Required / Scheduled hours
Coverage difference badge

Example:
22/24h
-2h

3. Visual hierarchy must be:

Department Header (resource summary)
Open shifts row
Daily resource indicators aligned with calendar columns
Employee rows with shift cards

4. The header should visually act as a container for the resource model, separating departments while also showing demand vs coverage context.

5. Remove the standalone "Resources" row entirely and redistribute its information into:
- department header (weekly summary)
- day cells (daily coverage indicators)

6. Ensure alignment between:
- daily resource indicators
- employee shift grid
- calendar columns

7. Maintain compact density suitable for schedule planning interfaces.