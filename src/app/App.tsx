import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Header } from "./components/Header";
import type { ScheduleStatus, ValidationProblem } from "./components/Header";
import {
  WeeklyTable,
  type Department,
  type Employee,
} from "./components/WeeklyTable";
import { DayView } from "./components/DayView";
import { PlanningDrawer, type DrawerMode } from "./components/PlanningDrawer";
import { ShiftContextMenu } from "./components/ContextMenu";
import { EmptyCellContextMenu } from "./components/EmptyCellContextMenu";
import { EfficiencyTable } from "./components/EfficiencyTable";
import { JUMP_RANGES, DEFAULT_JUMP_INDEX } from "./components/DayViewComponents";
import type { ShiftData, DragItem } from "./components/ShiftCard";
import { hasBlockingShift, sessionCreatedShiftIds } from "./components/ShiftCard";
import type { OpenShift } from "./components/WeeklyTable";

import { MOCK_DEPARTMENTS, MOCK_FACT_DEPARTMENTS, DEPT_UNITS_MAP, buildEmptyWeekDepartments } from "./mockData";
import { CrmShell } from "./components/CrmShell";
import { registerUnits } from "./components/subUnitColors";

// Pre-register all unit names so each gets a unique color
(() => {
  const allUnits = new Set<string>();
  for (const dept of [...MOCK_DEPARTMENTS, ...MOCK_FACT_DEPARTMENTS]) {
    for (const emp of dept.employees) {
      for (const shifts of Object.values(emp.shifts)) {
        for (const s of shifts) {
          for (const su of s.subUnits) allUnits.add(su.unit);
        }
      }
    }
    if (dept.openShifts) {
      for (const os of dept.openShifts) {
        for (const su of os.shift.subUnits) allUnits.add(su.unit);
      }
    }
  }
  registerUnits(Array.from(allUnits));
})();

// ── Constants ─────────────────────────────────────────────────────────

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const TODAY_INDEX = 0;

// ── Week definitions for navigation ─────────────────────────────────────
const WEEK_DEFS: { label: string; dates: string[] }[] = [
  { label: "24 лют – 2 бер 2026", dates: ["24 лют", "25 лют", "26 лют", "27 лют", "28 лют", "1 бер", "2 бер"] },
  { label: "3 бер – 9 бер 2026",  dates: ["3 бер", "4 бер", "5 бер", "6 бер", "7 бер", "8 бер", "9 бер"] },
  { label: "10 бер – 16 бер 2026", dates: ["10 бер", "11 бер", "12 бер", "13 бер", "14 бер", "15 бер", "16 бер"] },
];
const CURRENT_WEEK_INDEX = 1; // index into WEEK_DEFS — the populated week

export default function App() {
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [planFact, setPlanFact] = useState<"plan" | "fact">("plan");
  const [weekIndex, setWeekIndex] = useState(CURRENT_WEEK_INDEX);
  const [focusedSubUnit, setFocusedSubUnit] = useState<string | null>(null);
  const [focusedDeptId, setFocusedDeptId] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(TODAY_INDEX);
  const [dayRangeIndex, setDayRangeIndex] = useState(DEFAULT_JUMP_INDEX);

  // ── Schedule lifecycle status ──────────────────────────────────────────
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>("draft");
  const isReadOnly = scheduleStatus !== "draft";

  // ── Focus mode ──────────────────────────────────────────────────────
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Escape exits focus mode
  useEffect(() => {
    function handleFocusModeKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
      }
    }
    document.addEventListener("keydown", handleFocusModeKey);
    return () => document.removeEventListener("keydown", handleFocusModeKey);
  }, [isFocusMode]);

  const isCurrentWeek = weekIndex === CURRENT_WEEK_INDEX;
  const activeWeek = WEEK_DEFS[weekIndex] ?? WEEK_DEFS[CURRENT_WEEK_INDEX];
  const weekLabel = activeWeek.label;
  const activeDayDates = activeWeek.dates;

  // Day-level navigation helpers
  const FULL_DAY_LABELS = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"];
  const currentDayLabel = `${FULL_DAY_LABELS[selectedDayIndex]}, ${activeDayDates[selectedDayIndex]} 2026`;

  const handleViewModeChange = (mode: "week" | "day") => {
    setViewMode(mode);
    if (mode === "day") setSelectedDayIndex(TODAY_INDEX);
  };

  // ── Per-week mutable department data with cache ──────────────────────
  // Cache stores snapshots of each visited week so edits persist across nav
  type WeekSnapshot = { plan: Department[]; fact: Department[] };
  const weekCacheRef = useRef<Record<number, WeekSnapshot>>({
    [CURRENT_WEEK_INDEX]: { plan: MOCK_DEPARTMENTS, fact: MOCK_FACT_DEPARTMENTS },
  });

  const [planDepts, setPlanDepts] = useState(() => MOCK_DEPARTMENTS);
  const [factDepts, setFactDepts] = useState(() => MOCK_FACT_DEPARTMENTS);

  const activeDepts = planFact === "plan" ? planDepts : factDepts;
  const setActiveDepts = planFact === "plan" ? setPlanDepts : setFactDepts;
  const displayedDepts = focusedDeptId
    ? activeDepts.filter((d) => d.id === focusedDeptId)
    : activeDepts;

  // All employees flattened (for create drawer)
  const allEmployees = activeDepts.flatMap((d) => d.employees);

  // Unit filter: show only when a specific dept is selected
  const filteredSubUnitNames = useMemo(() => {
    if (!focusedDeptId) return []; // hidden when "Всі відділи"
    return DEPT_UNITS_MAP[focusedDeptId] ?? [];
  }, [focusedDeptId]);

  // Reset focused sub-unit when department changes
  const handleFocusedDeptChange = useCallback((deptId: string | null) => {
    setFocusedDeptId(deptId);
    setFocusedSubUnit(null); // always reset unit filter on dept change
  }, []);

  // ── Issues filter state & detection ──────────────────────────────────
  const [issuesFilterActive, setIssuesFilterActive] = useState(false);

  const { issueEmployeeIds, issueDeptIds, totalIssueCount } = useMemo(() => {
    const empIds = new Set<string>();
    const deptIds = new Set<string>();
    let count = 0;

    const isFact = planFact === "fact";

    for (const dept of activeDepts) {
      let deptHasIssue = false;

      // Check employees
      for (const emp of dept.employees) {
        let empHasIssue = false;

        // 1. Overwork: worked > monthly norm
        if (emp.workedHours > emp.monthlyNorm) {
          empHasIssue = true;
        }

        // 2. Fact-mode issues: overtime, missing, no-show shifts
        if (isFact) {
          const allShifts = Object.values(emp.shifts).flat();
          const factIssues = allShifts.filter(
            (sh) => sh.factStatus === "overtime" || sh.factStatus === "missing" || sh.factStatus === "no-show"
          );
          if (factIssues.length > 0) {
            empHasIssue = true;
          }
        }

        // 3. Overlapping shifts within same day
        if (!isFact) {
          for (const dayKey of Object.keys(emp.shifts)) {
            const dayShifts = emp.shifts[dayKey];
            if (dayShifts.length > 1) {
              for (let i = 0; i < dayShifts.length; i++) {
                for (let j = i + 1; j < dayShifts.length; j++) {
                  const a = dayShifts[i];
                  const b = dayShifts[j];
                  if (a.status !== "normal" || b.status !== "normal") continue;
                  const parseT = (t: string) => {
                    const [h, m] = t.split(":").map(Number);
                    return h + (m || 0) / 60;
                  };
                  const [aStart, aEnd] = a.timeRange.split("\u2013").map((t) => parseT(t.trim()));
                  const [bStart, bEnd] = b.timeRange.split("\u2013").map((t) => parseT(t.trim()));
                  const aEndN = aEnd <= aStart ? aEnd + 24 : aEnd;
                  const bEndN = bEnd <= bStart ? bEnd + 24 : bEnd;
                  if (aStart < bEndN && bStart < aEndN) {
                    empHasIssue = true;
                  }
                }
              }
            }
          }
        }

        if (empHasIssue) {
          empIds.add(emp.id);
          deptHasIssue = true;
          count++;
        }
      }

      // Check resource deficits (scheduled < forecast on any day)
      if (dept.resourceControl) {
        const rc = dept.resourceControl;
        for (const d of rc.daily) {
          const compareVal = isFact ? (d.actual ?? d.scheduled) : d.scheduled;
          if (compareVal < d.forecast && d.forecast > 0) {
            deptHasIssue = true;
            break;
          }
        }
      }

      // Open shifts are inherently issues (unstaffed)
      if (dept.openShifts.length > 0 && !isFact) {
        deptHasIssue = true;
        count += dept.openShifts.length;
      }

      if (deptHasIssue) {
        deptIds.add(dept.id);
      }
    }

    return { issueEmployeeIds: empIds, issueDeptIds: deptIds, totalIssueCount: count };
  }, [activeDepts, planFact]);

  const handleIssuesFilterToggle = useCallback(() => {
    if (totalIssueCount > 0) {
      setIssuesFilterActive((prev) => !prev);
    }
  }, [totalIssueCount]);

  // ── Validation problems for lifecycle modal ────────────────────────────
  const DAY_LABELS_FULL = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
  const validationProblems = useMemo<ValidationProblem[]>(() => {
    const problems: ValidationProblem[] = [];
    let idCounter = 0;

    for (const dept of activeDepts) {
      for (const emp of dept.employees) {
        // Overwork
        if (emp.workedHours > emp.monthlyNorm) {
          problems.push({
            id: `vp-${idCounter++}`,
            severity: "warning",
            employeeName: emp.name,
            employeeId: emp.id,
            day: "Весь тиждень",
            description: `Перевищення місячної норми: ${emp.workedHours.toFixed(1)}г із ${emp.monthlyNorm}г.`,
            deptId: dept.id,
          });
        }

        // Overlapping shifts within same day
        for (const dayKey of Object.keys(emp.shifts)) {
          const dayShifts = emp.shifts[dayKey];
          if (dayShifts.length > 1) {
            for (let i = 0; i < dayShifts.length; i++) {
              for (let j = i + 1; j < dayShifts.length; j++) {
                const a = dayShifts[i];
                const b = dayShifts[j];
                if (a.status !== "normal" && a.status !== undefined) continue;
                if (b.status !== "normal" && b.status !== undefined) continue;
                const parseT = (t: string) => {
                  const [h, m] = t.split(":").map(Number);
                  return h + (m || 0) / 60;
                };
                const [aStart, aEnd] = a.timeRange.split("\u2013").map((t) => parseT(t.trim()));
                const [bStart, bEnd] = b.timeRange.split("\u2013").map((t) => parseT(t.trim()));
                const aEndN = aEnd <= aStart ? aEnd + 24 : aEnd;
                const bEndN = bEnd <= bStart ? bEnd + 24 : bEnd;
                if (aStart < bEndN && bStart < aEndN) {
                  problems.push({
                    id: `vp-${idCounter++}`,
                    severity: "error",
                    employeeName: emp.name,
                    employeeId: emp.id,
                    day: DAY_LABELS_FULL[Number(dayKey)] ?? dayKey,
                    description: `Перекриття змін: ${a.timeRange} та ${b.timeRange}.`,
                    deptId: dept.id,
                  });
                }
              }
            }
          }
        }

        // Insufficient rest between consecutive days
        const sortedDays = Object.keys(emp.shifts).map(Number).sort((a, b) => a - b);
        for (let di = 0; di < sortedDays.length - 1; di++) {
          const day1 = sortedDays[di];
          const day2 = sortedDays[di + 1];
          if (day2 - day1 !== 1) continue;
          const shifts1 = emp.shifts[String(day1)].filter(s => !s.status || s.status === "normal");
          const shifts2 = emp.shifts[String(day2)].filter(s => !s.status || s.status === "normal");
          if (shifts1.length === 0 || shifts2.length === 0) continue;
          const parseT = (t: string) => { const [h, m] = t.split(":").map(Number); return h + (m || 0) / 60; };
          const latestEnd1 = Math.max(...shifts1.map(s => { const e = parseT(s.timeRange.split("\u2013")[1]?.trim() || "0"); return e; }));
          const earliestStart2 = Math.min(...shifts2.map(s => parseT(s.timeRange.split("\u2013")[0]?.trim() || "24")));
          const restHours = 24 - latestEnd1 + earliestStart2;
          if (restHours < 11) {
            problems.push({
              id: `vp-${idCounter++}`,
              severity: "error",
              employeeName: emp.name,
              employeeId: emp.id,
              day: `${DAY_LABELS_FULL[day1]}–${DAY_LABELS_FULL[day2]}`,
              description: `Міжзмінний відпочинок ${restHours.toFixed(1)}г — менше 11 годин.`,
              deptId: dept.id,
            });
          }
        }
      }

      // Open shifts = warnings (unstaffed)
      for (const os of dept.openShifts) {
        problems.push({
          id: `vp-${idCounter++}`,
          severity: "warning",
          employeeName: "Відкриті зміни",
          employeeId: "__open__",
          day: DAY_LABELS_FULL[os.dayIndex] ?? String(os.dayIndex),
          description: `Незакрита відкрита зміна ${os.shift.timeRange}.`,
          deptId: dept.id,
        });
      }

      // Coverage gaps
      if (dept.resourceControl) {
        for (let di = 0; di < dept.resourceControl.daily.length; di++) {
          const d = dept.resourceControl.daily[di];
          if (d.scheduled < d.forecast && d.forecast > 0) {
            problems.push({
              id: `vp-${idCounter++}`,
              severity: "warning",
              employeeName: dept.name,
              employeeId: `__dept-${dept.id}__`,
              day: DAY_LABELS_FULL[di] ?? String(di),
              description: `Покриття нижче прогнозу: ${d.scheduled} із ${d.forecast} год`,
              deptId: dept.id,
            });
          }
        }
      }
    }
    return problems;
  }, [activeDepts]);

  // Unified drawer state
  const [drawerState, setDrawerState] = useState<{
    mode: DrawerMode;
    employee: Employee;
    department: Department;
    shift?: ShiftData;
    dayIndex?: number;
    isOpenShift?: boolean;
  } | null>(null);

  // ── Week navigation ──────────────────────────────────────────────────
  const switchToWeek = useCallback((targetIdx: number) => {
    setWeekIndex((currentIdx) => {
      if (currentIdx === targetIdx) return currentIdx;
      // Save current live state into cache
      weekCacheRef.current[currentIdx] = {
        plan: planDepts,
        fact: factDepts,
      };
      // Load target week from cache, or generate empty
      const cached = weekCacheRef.current[targetIdx];
      if (cached) {
        setPlanDepts(cached.plan);
        setFactDepts(cached.fact);
      } else {
        const emptyPlan = buildEmptyWeekDepartments(MOCK_DEPARTMENTS);
        const emptyFact = buildEmptyWeekDepartments(MOCK_FACT_DEPARTMENTS);
        setPlanDepts(emptyPlan);
        setFactDepts(emptyFact);
        weekCacheRef.current[targetIdx] = { plan: emptyPlan, fact: emptyFact };
      }
      return targetIdx;
    });
    setDrawerState(null);
    setIssuesFilterActive(false);
  }, [planDepts, factDepts]);

  const handlePrevNav = useCallback(() => {
    if (viewMode === "day") {
      setSelectedDayIndex((prev) => Math.max(0, prev - 1));
    } else {
      switchToWeek(Math.max(0, weekIndex - 1));
    }
  }, [viewMode, weekIndex, switchToWeek]);

  const handleNextNav = useCallback(() => {
    if (viewMode === "day") {
      setSelectedDayIndex((prev) => Math.min(DAYS.length - 1, prev + 1));
    } else {
      switchToWeek(Math.min(WEEK_DEFS.length - 1, weekIndex + 1));
    }
  }, [viewMode, weekIndex, switchToWeek]);

  const handleToday = useCallback(() => {
    if (viewMode === "day") {
      setSelectedDayIndex(TODAY_INDEX);
    } else {
      switchToWeek(CURRENT_WEEK_INDEX);
    }
  }, [viewMode, switchToWeek]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    shift: ShiftData;
    employee: Employee;
    department: Department;
    variant?: "employee" | "open-shift" | "on-exchange";
    openShift?: OpenShift;
  } | null>(null);

  // ── Clipboard for copy/paste ───────────────────────────────────────────
  const clipboardRef = useRef<{ shift: ShiftData; employeeId: string; dayIndex: number; deptId: string; isOpenShift: boolean; openShiftId?: string } | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);

  // ── Empty cell context menu state ─────────────────────────────────────
  const [emptyCellMenu, setEmptyCellMenu] = useState<{
    x: number;
    y: number;
    employee: Employee;
    dayIndex: number;
    department: Department;
  } | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleShiftClick = useCallback(
    (shift: ShiftData, employee: Employee, department: Department) => {
      const dayEntry = Object.entries(employee.shifts).find(([_, shifts]) =>
        shifts.some((s) => s.id === shift.id)
      );
      setDrawerState({
        mode: "shift",
        employee,
        department,
        shift,
        dayIndex: dayEntry ? Number(dayEntry[0]) : undefined,
      });
      setContextMenu(null);
    },
    []
  );

  const handleEmployeeClick = useCallback(
    (employee: Employee) => {
      const depts = planFact === "plan" ? planDepts : factDepts;
      const dept = depts.find((d) => d.employees.some((e) => e.id === employee.id));
      setDrawerState({
        mode: "employee",
        employee,
        department: dept || depts[0],
      });
      setContextMenu(null);
    },
    [planFact, planDepts, factDepts]
  );

  // 1) Click on empty cell → open Create Shift drawer (blocked by leave/sick/temp)
  const handleEmptyCellClick = useCallback(
    (employee: Employee, dayIndex: number, department: Department) => {
      const dayShifts = employee.shifts[String(dayIndex)] || [];
      if (hasBlockingShift(dayShifts)) return; // blocked
      setDrawerState({
        mode: "create",
        employee,
        department,
        dayIndex,
      });
      setContextMenu(null);
    },
    []
  );

  // Open shift click → open Edit drawer
  const handleOpenShiftClick = useCallback(
    (openShift: OpenShift, department: Department) => {
      const dummyEmp = department.employees[0];
      setDrawerState({
        mode: "shift",
        employee: dummyEmp,
        department,
        shift: openShift.shift,
        dayIndex: openShift.dayIndex,
        isOpenShift: true,
      });
      setContextMenu(null);
    },
    []
  );

  // Click on empty cell in open shift row → create-open drawer
  const handleOpenShiftEmptyCellClick = useCallback(
    (dayIndex: number, department: Department) => {
      const dummyEmp = department.employees[0];
      setDrawerState({
        mode: "create-open",
        employee: dummyEmp,
        department,
        dayIndex,
        isOpenShift: true,
      });
      setContextMenu(null);
    },
    []
  );

  // Open shift context menu handler
  const handleOpenShiftContextMenu = useCallback(
    (
      e: React.MouseEvent,
      openShift: OpenShift,
      department: Department
    ) => {
      const dummyEmp = department.employees[0];
      const isOnExchange = openShift.shift.exchangeStatus === "on-exchange";
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        shift: openShift.shift,
        employee: dummyEmp,
        department,
        variant: isOnExchange ? "on-exchange" : "open-shift",
        openShift,
      });
    },
    []
  );

  // 2) Right-click on shift card → show context menu
  const handleShiftContextMenu = useCallback(
    (e: React.MouseEvent, shift: ShiftData, employee: Employee, department: Department) => {
      setContextMenu({ x: e.clientX, y: e.clientY, shift, employee, department });
    },
    []
  );

  // Context menu action handler
  const handleContextAction = useCallback(
    (actionId: string) => {
      if (!contextMenu) return;
      const { shift, employee, department } = contextMenu;

      // Handle open-shift and on-exchange specific actions
      if ((contextMenu.variant === "open-shift" || contextMenu.variant === "on-exchange") && contextMenu.openShift) {
        const os = contextMenu.openShift;
        switch (actionId) {
          case "edit":
            handleOpenShiftClick(os, department);
            break;
          case "copy": {
            clipboardRef.current = {
              shift: { ...os.shift },
              employeeId: "",
              dayIndex: os.dayIndex,
              deptId: department.id,
              isOpenShift: true,
              openShiftId: os.id,
            };
            setHasClipboard(true);
            break;
          }
          case "paste": {
            if (clipboardRef.current) {
              const cb = clipboardRef.current;
              const newShift: ShiftData = { ...cb.shift, id: `paste-${Date.now()}`, status: "open" as const };
              setActiveDepts((prev) =>
                prev.map((d) =>
                  d.id === department.id
                    ? {
                        ...d,
                        openShifts: [
                          ...d.openShifts,
                          { id: `os-paste-${Date.now()}`, dayIndex: os.dayIndex, shift: newShift },
                        ],
                      }
                    : d
                )
              );
            }
            break;
          }
          case "duplicate": {
            const newShift: ShiftData = {
              ...os.shift,
              id: `os-dup-${Date.now()}`,
            };
            setActiveDepts((prev) =>
              prev.map((d) =>
                d.id === department.id
                  ? {
                      ...d,
                      openShifts: [
                        ...d.openShifts,
                        {
                          id: `os-${Date.now()}`,
                          dayIndex: os.dayIndex,
                          shift: newShift,
                        },
                      ],
                    }
                  : d
              )
            );
            break;
          }
          case "delete": {
            setActiveDepts((prev) =>
              prev.map((d) =>
                d.id === department.id
                  ? {
                      ...d,
                      openShifts: d.openShifts.filter(
                        (o) => o.id !== os.id
                      ),
                    }
                  : d
              )
            );
            break;
          }
          case "exchange": {
            setActiveDepts((prev) =>
              prev.map((d) =>
                d.id === department.id
                  ? {
                      ...d,
                      openShifts: d.openShifts.map((o) =>
                        o.id === os.id
                          ? {
                              ...o,
                              shift: {
                                ...o.shift,
                                exchangeStatus: "on-exchange" as const,
                              },
                            }
                          : o
                      ),
                    }
                  : d
              )
            );
            break;
          }
          case "remove-exchange": {
            setActiveDepts((prev) =>
              prev.map((d) =>
                d.id === department.id
                  ? {
                      ...d,
                      openShifts: d.openShifts.map((o) =>
                        o.id === os.id
                          ? {
                              ...o,
                              shift: {
                                ...o.shift,
                                exchangeStatus: undefined,
                              },
                            }
                          : o
                      ),
                    }
                  : d
              )
            );
            break;
          }
          case "convert-to-assigned": {
            const targetEmp = department.employees[0];
            if (targetEmp) {
              const assignedShift: ShiftData = {
                ...os.shift,
                status: "normal",
                exchangeStatus: undefined,
              };
              setActiveDepts((prev) =>
                prev.map((d) =>
                  d.id === department.id
                    ? {
                        ...d,
                        openShifts: d.openShifts.filter(
                          (o) => o.id !== os.id
                        ),
                        employees: d.employees.map((e) =>
                          e.id === targetEmp.id
                            ? {
                                ...e,
                                shifts: {
                                  ...e.shifts,
                                  [String(os.dayIndex)]: [
                                    ...(e.shifts[String(os.dayIndex)] ||
                                      []),
                                    assignedShift,
                                  ],
                                },
                              }
                            : e
                        ),
                      }
                    : d
                )
              );
            }
            break;
          }
        }
        setContextMenu(null);
        return;
      }

      switch (actionId) {
        case "edit":
          handleShiftClick(shift, employee, department);
          break;

        case "copy": {
          const dayEntry = Object.entries(employee.shifts).find(([_, shifts]) =>
            shifts.some((s) => s.id === shift.id)
          );
          clipboardRef.current = {
            shift: { ...shift },
            employeeId: employee.id,
            dayIndex: dayEntry ? Number(dayEntry[0]) : 0,
            deptId: department.id,
            isOpenShift: false,
          };
          setHasClipboard(true);
          break;
        }

        case "paste": {
          if (clipboardRef.current) {
            const cb = clipboardRef.current;
            const dayEntry = Object.entries(employee.shifts).find(([_, shifts]) =>
              shifts.some((s) => s.id === shift.id)
            );
            const targetDay = dayEntry ? dayEntry[0] : "0";
            const newShift: ShiftData = { ...cb.shift, id: `paste-${Date.now()}`, status: "normal" as const };
            setActiveDepts((prev) =>
              prev.map((d) =>
                d.id === department.id
                  ? {
                      ...d,
                      employees: d.employees.map((e) =>
                        e.id === employee.id
                          ? {
                              ...e,
                              shifts: {
                                ...e.shifts,
                                [targetDay]: [...(e.shifts[targetDay] || []), newShift],
                              },
                            }
                          : e
                      ),
                    }
                  : d
              )
            );
          }
          break;
        }

        case "duplicate": {
          const dayEntry = Object.entries(employee.shifts).find(([_, shifts]) =>
            shifts.some((s) => s.id === shift.id)
          );
          if (dayEntry) {
            const di = dayEntry[0];
            const newShift: ShiftData = { ...shift, id: `dup-${Date.now()}` };
            setActiveDepts((prev) =>
              prev.map((d) =>
                d.id === department.id
                  ? {
                      ...d,
                      employees: d.employees.map((e) =>
                        e.id === employee.id
                          ? {
                              ...e,
                              shifts: {
                                ...e.shifts,
                                [di]: [...(e.shifts[di] || []), newShift],
                              },
                            }
                          : e
                      ),
                    }
                  : d
              )
            );
          }
          break;
        }

        case "delete": {
          setActiveDepts((prev) =>
            prev.map((d) =>
              d.id === department.id
                ? {
                    ...d,
                    employees: d.employees.map((e) =>
                      e.id === employee.id
                        ? {
                            ...e,
                            shifts: Object.fromEntries(
                              Object.entries(e.shifts).map(([di, shifts]) => [
                                di,
                                shifts.filter((s) => s.id !== shift.id),
                              ])
                            ),
                          }
                        : e
                    ),
                  }
                : d
            )
          );
          if (drawerState?.shift?.id === shift.id) setDrawerState(null);
          break;
        }

        case "exchange": {
          const dayEntry2 = Object.entries(employee.shifts).find(([_, shifts]) =>
            shifts.some((s) => s.id === shift.id)
          );
          if (dayEntry2) {
            const dayIdx2 = Number(dayEntry2[0]);
            const openShift: ShiftData = {
              ...shift,
              status: "open",
              exchangeStatus: "on-exchange",
            };
            setActiveDepts((prev) =>
              prev.map((d) =>
                d.id === department.id
                  ? {
                      ...d,
                      openShifts: [
                        ...d.openShifts,
                        { id: `os-exch-${Date.now()}`, dayIndex: dayIdx2, shift: openShift },
                      ],
                      employees: d.employees.map((e) =>
                        e.id === employee.id
                          ? {
                              ...e,
                              shifts: Object.fromEntries(
                                Object.entries(e.shifts).map(([di, shifts]) => [
                                  di,
                                  shifts.filter((s) => s.id !== shift.id),
                                ])
                              ),
                            }
                          : e
                      ),
                    }
                  : d
              )
            );
          }
          break;
        }

        case "open-shift": {
          const dayEntry = Object.entries(employee.shifts).find(([_, shifts]) =>
            shifts.some((s) => s.id === shift.id)
          );
          if (dayEntry) {
            const dayIdx = Number(dayEntry[0]);
            const openShift = { ...shift, status: "open" as const };
            setActiveDepts((prev) =>
              prev.map((d) =>
                d.id === department.id
                  ? {
                      ...d,
                      openShifts: [
                        ...d.openShifts,
                        { id: `os-${Date.now()}`, dayIndex: dayIdx, shift: openShift },
                      ],
                      employees: d.employees.map((e) =>
                        e.id === employee.id
                          ? {
                              ...e,
                              shifts: Object.fromEntries(
                                Object.entries(e.shifts).map(([di, shifts]) => [
                                  di,
                                  shifts.filter((s) => s.id !== shift.id),
                                ])
                              ),
                            }
                          : e
                      ),
                    }
                  : d
              )
            );
          }
          break;
        }
      }
      setContextMenu(null);
    },
    [contextMenu, drawerState, handleShiftClick, handleOpenShiftClick, setActiveDepts]
  );

  // 3) Drag & Drop handler (supports both employee-to-employee and open-shift-to-employee)
  const handleShiftDrop = useCallback(
    (item: DragItem, targetEmployeeId: string, targetDayIndex: number) => {
      setActiveDepts((prev) => {
        // Check if target cell has blocking shifts (leave/sick/temp)
        const targetDept = prev.find((d) =>
          d.employees.some((e) => e.id === targetEmployeeId)
        );
        if (targetDept) {
          const targetEmp = targetDept.employees.find(
            (e) => e.id === targetEmployeeId
          );
          if (targetEmp) {
            const targetShifts =
              targetEmp.shifts[String(targetDayIndex)] || [];
            if (hasBlockingShift(targetShifts)) return prev; // blocked
          }
        }

        if (item.sourceType === "open-shift") {
          let movedShift: ShiftData | null = null;
          const after = prev.map((d) => {
            if (d.id === item.sourceDeptId) {
              const os = d.openShifts.find(
                (o) => o.id === item.sourceOpenShiftId
              );
              if (os) {
                movedShift = {
                  ...os.shift,
                  status: "normal",
                  exchangeStatus: undefined,
                };
              }
              return {
                ...d,
                openShifts: d.openShifts.filter(
                  (o) => o.id !== item.sourceOpenShiftId
                ),
              };
            }
            return d;
          });

          if (!movedShift) return prev;

          return after.map((d) => ({
            ...d,
            employees: d.employees.map((e) => {
              if (e.id === targetEmployeeId) {
                const targetKey = String(targetDayIndex);
                return {
                  ...e,
                  shifts: {
                    ...e.shifts,
                    [targetKey]: [
                      ...(e.shifts[targetKey] || []),
                      movedShift!,
                    ],
                  },
                };
              }
              return e;
            }),
          }));
        }

        // Employee-to-employee drag
        let movedShift: ShiftData | null = null;
        const after = prev.map((d) => ({
          ...d,
          employees: d.employees.map((e) => {
            if (e.id === item.sourceEmployeeId) {
              const dayKey = String(item.sourceDayIndex);
              const dayShifts = e.shifts[dayKey] || [];
              const found = dayShifts.find((s) => s.id === item.shiftId);
              if (found) movedShift = found;
              return {
                ...e,
                shifts: {
                  ...e.shifts,
                  [dayKey]: dayShifts.filter((s) => s.id !== item.shiftId),
                },
              };
            }
            return e;
          }),
        }));

        if (!movedShift) return prev;

        return after.map((d) => ({
          ...d,
          employees: d.employees.map((e) => {
            if (e.id === targetEmployeeId) {
              const targetKey = String(targetDayIndex);
              return {
                ...e,
                shifts: {
                  ...e.shifts,
                  [targetKey]: [...(e.shifts[targetKey] || []), movedShift!],
                },
              };
            }
            return e;
          }),
        }));
      });

      if (drawerState?.shift?.id === item.shiftId) setDrawerState(null);
    },
    [setActiveDepts, drawerState]
  );

  // 4) Drop employee shift → open shift (unassign)
  const handleDropToOpenShift = useCallback(
    (item: DragItem, targetDayIndex: number, deptId: string) => {
      if (item.sourceType !== "employee") return;
      setActiveDepts((prev) => {
        let movedShift: ShiftData | null = null;
        // Remove from source employee
        const after = prev.map((d) => ({
          ...d,
          employees: d.employees.map((e) => {
            if (e.id === item.sourceEmployeeId) {
              const dayKey = String(item.sourceDayIndex);
              const dayShifts = e.shifts[dayKey] || [];
              const found = dayShifts.find((s) => s.id === item.shiftId);
              if (found) movedShift = found;
              return {
                ...e,
                shifts: {
                  ...e.shifts,
                  [dayKey]: dayShifts.filter((s) => s.id !== item.shiftId),
                },
              };
            }
            return e;
          }),
        }));
        if (!movedShift) return prev;
        // Add as open shift in target dept on target day
        const openShift: ShiftData = { ...movedShift!, status: "open", exchangeStatus: undefined };
        return after.map((d) =>
          d.id === deptId
            ? {
                ...d,
                openShifts: [
                  ...d.openShifts,
                  { id: `os-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, dayIndex: targetDayIndex, shift: openShift },
                ],
              }
            : d
        );
      });
      if (drawerState?.shift?.id === item.shiftId) setDrawerState(null);
    },
    [setActiveDepts, drawerState]
  );

  const handleCloseDrawer = useCallback(() => setDrawerState(null), []);

  // ── Empty cell context menu handler ───────────────────────────────
  const handleEmptyCellContextMenu = useCallback(
    (e: React.MouseEvent, employee: Employee, dayIndex: number, department: Department) => {
      e.preventDefault();
      setContextMenu(null);
      setEmptyCellMenu({ x: e.clientX, y: e.clientY, employee, dayIndex, department });
    },
    []
  );

  const handleEmptyCellMenuAction = useCallback(
    (actionId: string) => {
      if (!emptyCellMenu) return;
      const { employee, dayIndex, department } = emptyCellMenu;

      switch (actionId) {
        case "create":
          handleEmptyCellClick(employee, dayIndex, department);
          break;
        case "paste": {
          if (clipboardRef.current) {
            const cb = clipboardRef.current;
            const newShift: ShiftData = { ...cb.shift, id: `paste-${Date.now()}`, status: "normal" as const };
            setActiveDepts((prev) =>
              prev.map((d) =>
                d.id === department.id
                  ? {
                      ...d,
                      employees: d.employees.map((e) =>
                        e.id === employee.id
                          ? {
                              ...e,
                              shifts: {
                                ...e.shifts,
                                [String(dayIndex)]: [...(e.shifts[String(dayIndex)] || []), newShift],
                              },
                            }
                          : e
                      ),
                    }
                  : d
              )
            );
          }
          break;
        }
        case "copy-week": {
          // Copy all shifts of this employee for the whole week into clipboard
          const allShifts = Object.values(employee.shifts).flat();
          if (allShifts.length > 0) {
            clipboardRef.current = {
              shift: allShifts[0],
              employeeId: employee.id,
              dayIndex: 0,
              deptId: department.id,
              isOpenShift: false,
            };
            setHasClipboard(true);
          }
          break;
        }
      }
      setEmptyCellMenu(null);
    },
    [emptyCellMenu, handleEmptyCellClick, setActiveDepts]
  );

  // ── Ctrl+C / Ctrl+V keyboard handler ──────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isReadOnly) return;
      const isMeta = e.ctrlKey || e.metaKey;
      if (!isMeta) return;
      // Don't intercept when user is in an input/select/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "c" || e.key === "C") {
        // Copy the shift currently open in drawer
        if (drawerState?.shift && drawerState.mode === "shift") {
          clipboardRef.current = {
            shift: { ...drawerState.shift },
            employeeId: drawerState.employee.id,
            dayIndex: drawerState.dayIndex ?? 0,
            deptId: drawerState.department.id,
            isOpenShift: drawerState.isOpenShift ?? false,
          };
          setHasClipboard(true);
          e.preventDefault();
        }
      }

      if (e.key === "v" || e.key === "V") {
        // Paste into the same employee/day as the drawer context
        if (clipboardRef.current && drawerState) {
          const cb = clipboardRef.current;
          const targetDeptId = drawerState.department.id;
          const targetEmpId = drawerState.employee.id;
          const targetDay = drawerState.dayIndex ?? 0;
          const newShift: ShiftData = { ...cb.shift, id: `paste-${Date.now()}`, status: "normal" as const };
          setActiveDepts((prev) =>
            prev.map((d) =>
              d.id === targetDeptId
                ? {
                    ...d,
                    employees: d.employees.map((emp) =>
                      emp.id === targetEmpId
                        ? {
                            ...emp,
                            shifts: {
                              ...emp.shifts,
                              [String(targetDay)]: [...(emp.shifts[String(targetDay)] || []), newShift],
                            },
                          }
                        : emp
                    ),
                  }
                : d
            )
          );
          e.preventDefault();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isReadOnly, drawerState, setActiveDepts]);

  // ── Create shift handler from drawer ──────────────────────────────
  const handleCreateShift = useCallback(
    (params: {
      deptId: string;
      employeeId: string;
      dayIndex: number;
      shift: ShiftData;
      shiftType: "standard" | "exchange" | "proposal";
    }) => {
      const { deptId, employeeId, dayIndex: di, shift: newShift, shiftType } = params;
      // Track for "recently created" visual indicator
      sessionCreatedShiftIds.add(newShift.id);
      setActiveDepts((prev) =>
        prev.map((dept) => {
          if (dept.id !== deptId) return dept;

          // Exchange or proposal without employee → open shift
          if (shiftType === "exchange" || (shiftType === "proposal" && !employeeId)) {
            return {
              ...dept,
              openShifts: [
                ...dept.openShifts,
                { id: `os-${Date.now()}`, dayIndex: di, shift: newShift },
              ],
            };
          }

          // Standard without employee → also open shift
          if (shiftType === "standard" && !employeeId) {
            return {
              ...dept,
              openShifts: [
                ...dept.openShifts,
                { id: `os-${Date.now()}`, dayIndex: di, shift: { ...newShift, status: "open" as const } },
              ],
            };
          }

          // Proposal with employee → stays on employee with proposalStatus: 'pending'
          if (shiftType === "proposal" && employeeId) {
            return {
              ...dept,
              employees: dept.employees.map((emp) =>
                emp.id === employeeId
                  ? {
                      ...emp,
                      shifts: {
                        ...emp.shifts,
                        [String(di)]: [
                          ...(emp.shifts[String(di)] || []),
                          { ...newShift, status: "normal" as const, proposalStatus: "pending" as const, exchangeStatus: "on-exchange" as const },
                        ],
                      },
                    }
                  : emp
              ),
            };
          }

          // Standard → assign to employee
          return {
            ...dept,
            employees: dept.employees.map((emp) =>
              emp.id === employeeId
                ? {
                    ...emp,
                    shifts: {
                      ...emp.shifts,
                      [String(di)]: [...(emp.shifts[String(di)] || []), { ...newShift, status: "normal" as const, exchangeStatus: undefined }],
                    },
                  }
                : emp
            ),
          };
        })
      );
      setDrawerState(null);
    },
    [setActiveDepts]
  );

  // ── Save (edit) shift handler from drawer ─────────────────────────
  const handleSaveShift = useCallback(
    (params: {
      deptId: string;
      employeeId: string;
      dayIndex: number;
      shift: ShiftData;
      originalShiftId: string;
      isOpenShift: boolean;
      isMarketplace: boolean;
      isProposal: boolean;
    }) => {
      const { deptId, employeeId, dayIndex: di, shift: updatedShift, originalShiftId, isOpenShift: wasOpen, isMarketplace: marketplace, isProposal: proposal } = params;
      setActiveDepts((prev) =>
        prev.map((dept) => {
          if (dept.id !== deptId) return dept;

          // Remove original from wherever it lived
          let cleaned = {
            ...dept,
            openShifts: dept.openShifts.filter((o) => o.shift.id !== originalShiftId),
            employees: dept.employees.map((emp) => ({
              ...emp,
              shifts: Object.fromEntries(
                Object.entries(emp.shifts).map(([dk, shifts]) => [
                  dk,
                  shifts.filter((s) => s.id !== originalShiftId),
                ])
              ),
            })),
          };

          // Now place the updated shift
          const isNowOpen = !employeeId || updatedShift.status === "open";
          if (isNowOpen && !proposal) {
            // Goes to open shifts (but NOT proposals — they stay on employee)
            cleaned = {
              ...cleaned,
              openShifts: [
                ...cleaned.openShifts,
                {
                  id: `os-${Date.now()}`,
                  dayIndex: di,
                  shift: {
                    ...updatedShift,
                    status: "open" as const,
                    exchangeStatus: marketplace ? ("on-exchange" as const) : undefined,
                  },
                },
              ],
            };
          } else if (proposal && employeeId) {
            // Proposal → stays on employee with proposalStatus: 'pending'
            cleaned = {
              ...cleaned,
              employees: cleaned.employees.map((emp) =>
                emp.id === employeeId
                  ? {
                      ...emp,
                      shifts: {
                        ...emp.shifts,
                        [String(di)]: [
                          ...(emp.shifts[String(di)] || []),
                          {
                            ...updatedShift,
                            status: "normal" as const,
                            proposalStatus: "pending" as const,
                            exchangeStatus: "on-exchange" as const,
                          },
                        ],
                      },
                    }
                  : emp
              ),
            };
          } else {
            // Assign to employee
            cleaned = {
              ...cleaned,
              employees: cleaned.employees.map((emp) =>
                emp.id === employeeId
                  ? {
                      ...emp,
                      shifts: {
                        ...emp.shifts,
                        [String(di)]: [
                          ...(emp.shifts[String(di)] || []),
                          {
                            ...updatedShift,
                            status: "normal" as const,
                            exchangeStatus: marketplace ? ("on-exchange" as const) : undefined,
                          },
                        ],
                      },
                    }
                  : emp
              ),
            };
          }

          return cleaned;
        })
      );
      setDrawerState(null);
    },
    [setActiveDepts]
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <CrmShell isFocusMode={isFocusMode}>
        <div
          className="flex flex-col h-full w-full bg-[var(--background)]"
          style={{ minWidth: 0 }}
          onContextMenu={(e) => { e.preventDefault(); }}
          onClick={() => { if (contextMenu) setContextMenu(null); if (emptyCellMenu) setEmptyCellMenu(null); }}
        >
          <Header
            department="Всі відділи"
            weekLabel={viewMode === "day" ? currentDayLabel : weekLabel}
            viewMode={viewMode}
            planFact={planFact}
            errorCount={totalIssueCount}
            subUnitNames={filteredSubUnitNames}
            focusedSubUnit={focusedSubUnit}
            issuesFilterActive={issuesFilterActive}
            departments={activeDepts}
            focusedDeptId={focusedDeptId}
            isCurrentWeek={isCurrentWeek}
            canGoPrev={viewMode === "day" ? selectedDayIndex > 0 : weekIndex > 0}
            canGoNext={viewMode === "day" ? selectedDayIndex < DAYS.length - 1 : weekIndex < WEEK_DEFS.length - 1}
            onViewModeChange={handleViewModeChange}
            onPlanFactChange={setPlanFact}
            onPrevWeek={handlePrevNav}
            onNextWeek={handleNextNav}
            onToday={handleToday}
            onFocusedSubUnitChange={setFocusedSubUnit}
            onIssuesFilterToggle={handleIssuesFilterToggle}
            onFocusedDeptChange={handleFocusedDeptChange}
            scheduleStatus={scheduleStatus}
            onScheduleStatusChange={setScheduleStatus}
            validationProblems={validationProblems}
            isFocusMode={isFocusMode}
            onFocusModeToggle={() => setIsFocusMode(f => !f)}
            isFact={planFact === "fact"}
          />

          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0 min-w-0">
            {/* Main schedule area — Week or Day */}
            {viewMode === "week" ? (
              <WeeklyTable
                departments={displayedDepts}
                days={DAYS}
                dayDates={activeDayDates}
                todayIndex={isCurrentWeek ? TODAY_INDEX : -1}
                onShiftClick={handleShiftClick}
                onEmployeeClick={handleEmployeeClick}
                onEmptyCellClick={isReadOnly ? undefined : handleEmptyCellClick}
                onShiftContextMenu={isReadOnly ? undefined : handleShiftContextMenu}
                onShiftDrop={isReadOnly ? undefined : handleShiftDrop}
                onDropToOpenShift={isReadOnly ? undefined : handleDropToOpenShift}
                onOpenShiftContextMenu={isReadOnly ? undefined : handleOpenShiftContextMenu}
                onOpenShiftClick={handleOpenShiftClick}
                onOpenShiftEmptyCellClick={isReadOnly ? undefined : handleOpenShiftEmptyCellClick}
                onEmptyCellContextMenu={isReadOnly ? undefined : handleEmptyCellContextMenu}
                selectedShiftId={drawerState?.shift?.id}
                planFact={planFact}
                focusedSubUnit={focusedSubUnit}
                issuesFilterActive={issuesFilterActive}
                issueEmployeeIds={issueEmployeeIds}
                issueDeptIds={issueDeptIds}
                readOnly={isReadOnly}
                isPastWeek={weekIndex < CURRENT_WEEK_INDEX}
              />
            ) : (
              <DayView
                departments={displayedDepts}
                dayIndex={selectedDayIndex}
                dayLabel={currentDayLabel}
                isToday={isCurrentWeek && selectedDayIndex === TODAY_INDEX}
                isFact={planFact === "fact"}
                selectedShiftId={drawerState?.shift?.id}
                focusedSubUnit={focusedSubUnit}
                activeRangeIndex={dayRangeIndex}
                onActiveRangeChange={setDayRangeIndex}
                onShiftClick={handleShiftClick}
                onEmployeeClick={handleEmployeeClick}
                onEmptyCellClick={isReadOnly ? undefined : handleEmptyCellClick}
                onShiftContextMenu={isReadOnly ? undefined : handleShiftContextMenu}
                onOpenShiftContextMenu={isReadOnly ? undefined : handleOpenShiftContextMenu}
                onOpenShiftClick={handleOpenShiftClick}
                onOpenShiftEmptyCellClick={isReadOnly ? undefined : handleOpenShiftEmptyCellClick}
                issuesFilterActive={issuesFilterActive}
                issueEmployeeIds={issueEmployeeIds}
                issueDeptIds={issueDeptIds}
                readOnly={isReadOnly}
              />
            )}

            {/* Efficiency analytics block */}
            <EfficiencyTable
              planDepts={planDepts}
              factDepts={factDepts}
              focusedDeptId={focusedDeptId}
              focusedSubUnit={focusedSubUnit}
              viewMode={viewMode}
              selectedDayIndex={selectedDayIndex}
              dayRangeIndex={dayRangeIndex}
            />
            </div>

            {/* Unified Planning Drawer */}
            {drawerState && (
              <PlanningDrawer
                key={`${drawerState.mode}-${drawerState.employee.id}-${drawerState.shift?.id ?? drawerState.dayIndex ?? "overview"}`}
                mode={drawerState.mode}
                employee={drawerState.employee}
                department={drawerState.department}
                shift={drawerState.shift}
                dayIndex={drawerState.dayIndex}
                onClose={handleCloseDrawer}
                allDepartments={activeDepts}
                allEmployees={allEmployees}
                isOpenShift={drawerState.isOpenShift}
                onCreateShift={handleCreateShift}
                onSaveShift={handleSaveShift}
                onDeleteShift={({ deptId, employeeId, dayIndex, shiftId }) => {
                  setActiveDepts((prev) =>
                    prev.map((d) =>
                      d.id === deptId
                        ? {
                            ...d,
                            employees: d.employees.map((e) =>
                              e.id === employeeId
                                ? {
                                    ...e,
                                    shifts: Object.fromEntries(
                                      Object.entries(e.shifts).map(([di, shifts]) => [
                                        di,
                                        shifts.filter((s) => s.id !== shiftId),
                                      ])
                                    ),
                                  }
                                : e
                            ),
                          }
                        : d
                    )
                  );
                  setDrawerState(null);
                }}
              />
            )}
          </div>

          {/* Context Menu */}
          {contextMenu && (
            <ShiftContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onAction={handleContextAction}
              onClose={() => setContextMenu(null)}
              variant={contextMenu.variant || "employee"}
              hasClipboard={hasClipboard}
            />
          )}

          {/* Empty Cell Context Menu */}
          {emptyCellMenu && (
            <EmptyCellContextMenu
              x={emptyCellMenu.x}
              y={emptyCellMenu.y}
              onAction={handleEmptyCellMenuAction}
              onClose={() => setEmptyCellMenu(null)}
              hasClipboard={hasClipboard}
              hasShiftsInWeek={Object.values(emptyCellMenu.employee.shifts).flat().length > 0}
            />
          )}
        </div>
      </CrmShell>
    </DndProvider>
  );
}
