import React, { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  User,
  BarChart3,
  Layers,
  Clock,
  AlertTriangle,
  CircleAlert,
  TrendingDown,
  X,
  ArrowRightLeft,
  ChevronsUpDown,
  ChevronsDownUp,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useDrop, useDragLayer } from "react-dnd";
import {
  ShiftCard,
  OpenShiftCard,
  FactShiftCard,
  DragGhostPreview,
  SHIFT_DND_TYPE,
  OPEN_SHIFT_DND_TYPE,
  hasBlockingShift,
  isBlockingStatus,
  type ShiftData,
  type DragItem,
} from "./ShiftCard";

export interface Employee {
  id: string;
  name: string;
  position: string;
  fte: number;
  monthlyNorm: number;
  workedHours: number;
  shifts: Record<string, ShiftData[]>;
  /** Whether this employee is a minor (under 18) */
  isMinor?: boolean;
  /** Origin info for non-штатні employees */
  origin?: {
    type: "another-department" | "another-store" | "marketplace";
    label: string;
  };
  /** Hours worked via marketplace (біржа змін) */
  marketplaceHours?: number;
}

export interface OpenShift {
  id: string;
  dayIndex: number;
  shift: ShiftData;
}

export interface SubUnitResource {
  name: string;
  daily: { forecast: number; scheduled: number; actual?: number }[];
}

export interface ResourceControl {
  daily: { forecast: number; scheduled: number; actual?: number }[];
  subUnits: SubUnitResource[];
}

export interface Department {
  id: string;
  name: string;
  employees: Employee[];
  openShifts: OpenShift[];
  resourceControl?: ResourceControl;
}

// ── Minor badge with hover tooltip ─────────────────────────────────────

function MinorBadge() {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const handleEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
    setShow(true);
  };

  const restrictions = [
    { label: "Нічні зміни", value: "заборонено (22:00–06:00)", warn: true },
    { label: "Робочих днів/тижд.", value: "макс. 5" },
    { label: "Годин/тижд.", value: "макс. 36" },
  ];

  return (
    <span className="inline-flex items-center flex-shrink-0">
      <span
        ref={triggerRef}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] cursor-help select-none"
        style={{
          height: 18,
          paddingLeft: 5, paddingRight: 5,
          fontSize: "var(--text-2xs)",
          fontWeight: "var(--font-weight-semibold)" as any,
          color: "var(--chart-3)",
          backgroundColor: "var(--warning-alpha-10)",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        &lt;18
      </span>
      {show && pos && createPortal(
        <div
          className="fixed pointer-events-none"
          style={{ zIndex: 9999, top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}
        >
          <div
            className="rounded-[var(--radius)] overflow-hidden pointer-events-auto"
            style={{
              borderStyle: "solid", borderWidth: 1,
              borderColor: "var(--border)",
              backgroundColor: "var(--popover)",
              boxShadow: "var(--elevation-md)",
              minWidth: 220, maxWidth: 280,
            }}
          >
            {/* Header */}
            <div
              className="px-3 py-1.5 flex items-center gap-1.5"
              style={{ backgroundColor: "var(--warning-alpha-6)", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "var(--border)" }}
            >
              <CircleAlert size={12} style={{ color: "var(--chart-3)", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--chart-3)" }}>
                Неповнолітній працівник
              </span>
            </div>
            {/* Content */}
            <div className="px-3 py-2 flex flex-col gap-1">
              {restrictions.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>
                    {r.label}
                  </span>
                  <span style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-weight-medium)" as any,
                    color: r.warn ? "var(--chart-3)" : "var(--foreground)",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                  }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </span>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

function isFullDayAbsence(shifts: ShiftData[]): boolean {
  return (
    shifts.length === 1 &&
    isBlockingStatus(shifts[0].status) &&
    shifts[0].timeRange === "00:00–24:00"
  );
}

function getAbsenceSpans(
  emp: Employee,
  totalDays: number
): { start: number; length: number; shift: ShiftData }[] {
  const spans: { start: number; length: number; shift: ShiftData }[] = [];
  let i = 0;
  while (i < totalDays) {
    const dayShifts = emp.shifts[String(i)] || [];
    if (isFullDayAbsence(dayShifts)) {
      const absShift = dayShifts[0];
      const status = absShift.status;
      const label = absShift.absenceLabel;
      let len = 1;
      while (i + len < totalDays) {
        const nextShifts = emp.shifts[String(i + len)] || [];
        if (
          isFullDayAbsence(nextShifts) &&
          nextShifts[0].status === status &&
          nextShifts[0].absenceLabel === label
        ) {
          len++;
        } else break;
      }
      if (len > 1) spans.push({ start: i, length: len, shift: absShift });
      i += len;
    } else {
      i++;
    }
  }
  return spans;
}

function parseH(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

function shiftBounds(s: ShiftData): { start: number; end: number } | null {
  const p = s.timeRange.split("–");
  if (p.length !== 2) return null;
  let start = parseH(p[0].trim());
  let end = parseH(p[1].trim());
  if (end <= start) end += 24;
  return { start, end };
}

function computeShiftValidation(
  shift: ShiftData,
  allDayShifts: ShiftData[],
  employee: Employee,
  dayIndex: number,
): { validationLevel: "error" | "warning" | null; validationMessage: string } {
  if (isBlockingStatus(shift.status) || shift.status === "open") return { validationLevel: null, validationMessage: "" };
  const bounds = shiftBounds(shift);
  if (!bounds) return { validationLevel: null, validationMessage: "" };

  // 1. Overlap with another normal shift in the same day
  const others = allDayShifts.filter(s => s.id !== shift.id && !isBlockingStatus(s.status) && s.status !== "open");
  for (const other of others) {
    const ob = shiftBounds(other);
    if (ob && bounds.start < ob.end && ob.start < bounds.end) {
      return { validationLevel: "error", validationMessage: `Перетин з ${other.timeRange}` };
    }
  }

  // 2. Inter-shift rest < 11h (check with previous and next day)
  const MIN_REST = 11;
  const prevShifts = (employee.shifts[String(dayIndex - 1)] || []).filter(s => !isBlockingStatus(s.status));
  for (const prev of prevShifts) {
    const pb = shiftBounds(prev);
    if (!pb) continue;
    // prev ended at pb.end (may be >24 for overnight), this starts at bounds.start + 24
    const prevEnd = pb.end <= pb.start ? pb.end + 24 : pb.end;
    const thisStart = bounds.start + 24;
    const rest = thisStart - prevEnd;
    if (rest < MIN_REST) {
      return { validationLevel: "error", validationMessage: `Відпочинок ${rest.toFixed(1)}г < 11г (з ${prev.timeRange})` };
    }
  }
  const nextShifts = (employee.shifts[String(dayIndex + 1)] || []).filter(s => !isBlockingStatus(s.status));
  for (const next of nextShifts) {
    const nb = shiftBounds(next);
    if (!nb) continue;
    const thisEnd = bounds.end <= bounds.start ? bounds.end + 24 : bounds.end;
    const nextStart = nb.start + 24;
    const rest = nextStart - thisEnd;
    if (rest < MIN_REST) {
      return { validationLevel: "error", validationMessage: `Відпочинок ${rest.toFixed(1)}г < 11г (до ${next.timeRange})` };
    }
  }

  // 3. Daily limit > 12h
  const totalDay = allDayShifts
    .filter(s => !isBlockingStatus(s.status))
    .reduce((sum, s) => { const b = shiftBounds(s); return b ? sum + (b.end - b.start) : sum; }, 0);
  if (totalDay > 12) {
    return { validationLevel: "error", validationMessage: `Денний ліміт: ${Math.round(totalDay)}г` };
  }

  // 4. Minor + night shift (before 6:00 or after 22:00)
  if (employee.isMinor && (bounds.start < 6 || bounds.end > 22)) {
    return { validationLevel: "error", validationMessage: "Нічна зміна для неповнолітнього" };
  }

  // 5. Near or over monthly norm (warning)
  if (employee.workedHours >= employee.monthlyNorm) {
    return { validationLevel: "warning", validationMessage: `Понаднормово: ${employee.workedHours}/${employee.monthlyNorm}г` };
  }
  if (employee.workedHours >= employee.monthlyNorm * 0.9) {
    return { validationLevel: "warning", validationMessage: `Близько до норми: ${employee.workedHours}/${employee.monthlyNorm}г` };
  }

  return { validationLevel: null, validationMessage: "" };
}

function wouldOverlap(incoming: ShiftData, existing: ShiftData[]): boolean {
  const parts = incoming.timeRange.split("–");
  if (parts.length !== 2) return false;
  const [sH, sM] = parts[0].trim().split(":").map(Number);
  const [eH, eM] = parts[1].trim().split(":").map(Number);
  let iStart = sH + sM / 60;
  let iEnd = eH + eM / 60;
  if (iEnd <= iStart) iEnd += 24;
  for (const sh of existing) {
    const p = sh.timeRange.split("–");
    if (p.length !== 2) continue;
    const [s2H, s2M] = p[0].trim().split(":").map(Number);
    const [e2H, e2M] = p[1].trim().split(":").map(Number);
    let eStart = s2H + s2M / 60;
    let eEnd = e2H + e2M / 60;
    if (eEnd <= eStart) eEnd += 24;
    if (iStart < eEnd && eStart < iEnd) return true;
  }
  return false;
}

function heatmapBg(delta: number): string {
  if (delta > 0) return "var(--success-alpha-5)";
  if (delta < 0) return "var(--destructive-alpha-5)";
  return "transparent";
}

function deltaColor(delta: number): string {
  if (delta > 0) return "var(--chart-2)";
  if (delta < 0) return "var(--destructive)";
  return "var(--muted-foreground)";
}

function fmtDelta(delta: number): string {
  if (delta === 0) return "0г";
  return delta > 0 ? `+${delta}г` : `${delta}г`;
}

/** Check if a shift belongs to a specific sub-unit */
function shiftBelongsToSubUnit(shift: ShiftData, subUnitName: string): boolean {
  if (!shift.subUnits || shift.subUnits.length === 0) return false;
  return shift.subUnits.some((su) => su.unit === subUnitName);
}

// ── Drop-aware day cell ─────────────────────────────────────────────

interface DayCellProps {
  dayIndex: number;
  todayIndex: number;
  shifts: ShiftData[];
  employee: Employee;
  dept: Department;
  isFact: boolean;
  selectedShiftId?: string;
  focusedSubUnit?: string | null;
  onShiftClick: (shift: ShiftData, emp: Employee, dept: Department) => void;
  onShiftContextMenu: (e: React.MouseEvent, shift: ShiftData, emp: Employee, dept: Department) => void;
  onEmptyCellClick: (emp: Employee, dayIndex: number, dept: Department) => void;
  onDrop: (item: DragItem, targetEmpId: string, targetDayIndex: number) => void;
  onCellContextMenu?: (e: React.MouseEvent, emp: Employee, dayIndex: number, dept: Department) => void;
  readOnly?: boolean;
}

function DayCell({
  dayIndex, todayIndex, shifts, employee, dept, isFact, selectedShiftId, focusedSubUnit,
  onShiftClick, onShiftContextMenu, onEmptyCellClick, onDrop, onCellContextMenu, readOnly = false,
}: DayCellProps) {
  const [hovered, setHovered] = useState(false);
  const blocked = hasBlockingShift(shifts);

  const [{ isOver, canDrop, dragItem }, dropRef] = useDrop(
    () => ({
      accept: [SHIFT_DND_TYPE, OPEN_SHIFT_DND_TYPE],
      canDrop: (item: DragItem) => {
        if (item.sourceType === "employee" && item.sourceEmployeeId === employee.id && item.sourceDayIndex === dayIndex) return false;
        if (blocked) return false;
        return true;
      },
      drop: (item: DragItem) => { onDrop(item, employee.id, dayIndex); },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
        dragItem: monitor.getItem() as DragItem | null,
      }),
    }),
    [employee.id, dayIndex, shifts, onDrop, blocked]
  );

  const hasConflict = isOver && canDrop && dragItem ? wouldOverlap(dragItem.shift, shifts) : false;
  const isBlocked = isOver && blocked;
  const isEmpty = shifts.length === 0;
  const hasOnlyAbsences = shifts.length > 0 && shifts.every((s) => isBlockingStatus(s.status));

  let dropBorder = "";
  let dropBg = "";
  if (isBlocked) {
    dropBorder = "2px solid var(--destructive)";
    dropBg = "var(--destructive-alpha-6)";
  } else if (isOver && canDrop) {
    if (hasConflict) {
      dropBorder = "2px solid var(--destructive)";
      dropBg = "var(--destructive-alpha-6)";
    } else {
      dropBorder = "2px solid var(--primary)";
      dropBg = "var(--primary-alpha-6)";
    }
  } else if (isOver && !canDrop) {
    dropBorder = "2px dashed var(--border)";
  }

  return (
    <td
      ref={(node) => { dropRef(node); }}
      className="px-1 py-1 border-b border-r border-[var(--border)] align-top relative"
      style={{
        backgroundColor: dropBg || (dayIndex === todayIndex ? "var(--primary-alpha-4)" : undefined),
        outline: dropBorder || undefined,
        outlineOffset: "-2px",
        transition: "outline 0.15s, background-color 0.15s",
        cursor: !isFact && !readOnly ? "pointer" : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={(e) => {
        // Only fire empty cell context menu if right-click is not on a shift card
        if (!readOnly && !isFact && onCellContextMenu && (e.target as HTMLElement).closest("[data-shift-card]") === null) {
          e.preventDefault();
          e.stopPropagation();
          onCellContextMenu(e, employee, dayIndex, dept);
        }
      }}
      onClick={(e) => {
        // Click on any empty space in cell (not on a shift card) → add shift
        if (!isFact && !blocked && !readOnly && (e.target as HTMLElement).closest("[data-shift-card]") === null) {
          onEmptyCellClick(employee, dayIndex, dept);
        }
      }}
    >
      <div className="flex flex-col gap-1" style={{ marginRight: !isFact && !readOnly ? 14 : 0 }}>
        {shifts.map((shift) => {
          // Focus mode: reduce opacity for non-matching shifts
          const dimmed = focusedSubUnit ? !shiftBelongsToSubUnit(shift, focusedSubUnit) : false;
          return isFact ? (
            <div key={shift.id} style={{ opacity: dimmed ? 0.4 : 1, transition: "opacity 0.2s" }}>
              <FactShiftCard shift={shift} isSelected={selectedShiftId === shift.id} onClick={() => onShiftClick(shift, employee, dept)} />
            </div>
          ) : (
            <div key={shift.id} data-shift-card style={{ opacity: dimmed ? 0.4 : 1, transition: "opacity 0.2s" }}>
              <ShiftCard
                shift={shift} isSelected={selectedShiftId === shift.id}
                onClick={() => onShiftClick(shift, employee, dept)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onShiftContextMenu(e, shift, employee, dept); }}
                employeeId={employee.id} dayIndex={dayIndex} draggable={!isFact && !readOnly && !isBlockingStatus(shift.status)}
                {...computeShiftValidation(shift, shifts, employee, dayIndex)}
              />
            </div>
          );
        })}

      </div>
      {/* Empty cell: full-area hover hint with centered "+" */}
      {(isEmpty || hasOnlyAbsences) && !isFact && !blocked && !isOver && !readOnly && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer transition-colors"
          style={{ backgroundColor: hovered ? "var(--primary-alpha-4)" : "transparent" }}
          onClick={() => onEmptyCellClick(employee, dayIndex, dept)}
          title="Натисніть, щоб створити зміну"
        >
          <div
            className="flex items-center justify-center rounded-full transition-opacity"
            style={{
              width: 22,
              height: 22,
              backgroundColor: "var(--primary-alpha-12)",
              opacity: hovered ? 1 : 0,
            }}
          >
            <Plus size={14} style={{ color: "var(--primary)" }} />
          </div>
        </div>
      )}
      {isOver && canDrop && hasConflict && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-0.5" style={{ backgroundColor: "var(--destructive-alpha-12)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--destructive)" }}>
          <AlertTriangle size={10} /> Конфлікт
        </div>
      )}
      {isBlocked && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-0.5" style={{ backgroundColor: "var(--destructive-alpha-12)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--destructive)" }}>
          <CircleAlert size={10} /> Заблоковано
        </div>
      )}
    </td>
  );
}

// ── Custom Drag Layer ───────────────────────────────────────────────

function CustomDragLayer() {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem() as DragItem | null,
    currentOffset: monitor.getClientOffset(),
  }));
  if (!isDragging || !item || !currentOffset) return null;
  return (
    <div className="fixed pointer-events-none" style={{ left: currentOffset.x - 65, top: currentOffset.y - 20, zIndex: 1000 }}>
      <DragGhostPreview shift={item.shift} />
    </div>
  );
}

// ── Efficiency computation ──────────────────────────────────────────
// Measures how evenly shifts are distributed throughout the day.
// 100% = perfect match with forecast curve, lower = imbalance.

function computeEfficiency(
  dept: Department,
  dayIndex: number,
): { efficiency: number; status: "ok" | "warn" | "problem"; description: string } {
  // Build 30-min slot coverage for this department-day
  const slots: { scheduled: number; forecast: number }[] = [];

  // Helper to parse time range
  const pTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  // Forecast weight distribution (same as EfficiencyTable)
  const fWeight = (h: number) => {
    if (h < 7) return 0.3;
    if (h < 8) return 0.5;
    if (h < 9) return 0.7;
    if (h < 10) return 0.9;
    if (h < 14) return 1.0;
    if (h < 15) return 0.9;
    if (h < 17) return 0.8;
    if (h < 18) return 0.7;
    if (h < 19) return 0.6;
    if (h < 20) return 0.5;
    if (h < 21) return 0.4;
    if (h < 22) return 0.3;
    return 0.15;
  };

  let totalWeight = 0;
  for (let h = 0; h < 24; h += 0.5) totalWeight += fWeight(h);

  // Get all sub-unit names
  const unitNames = new Set<string>();
  for (const emp of dept.employees) {
    const dayShifts = emp.shifts[String(dayIndex)] || [];
    for (const sh of dayShifts) {
      for (const su of sh.subUnits) unitNames.add(su.unit);
    }
  }
  if (dept.resourceControl) {
    for (const su of dept.resourceControl.subUnits) unitNames.add(su.name);
  }

  // Compute 30-min slots for range 6:00-22:00 (main working hours)
  const rangeStart = 6;
  const rangeEnd = 22;
  for (let slotH = rangeStart; slotH < rangeEnd; slotH += 0.5) {
    const slotEnd = slotH + 0.5;
    let scheduled = 0;
    let forecast = 0;

    for (const emp of dept.employees) {
      const dayShifts = emp.shifts[String(dayIndex)] || [];
      for (const sh of dayShifts) {
        if (sh.status && sh.status !== "normal" && sh.status !== "open") continue;
        const matchesSu = sh.subUnits?.some((su) => {
          const parts = su.time.split("–");
          if (parts.length !== 2) return false;
          let start = pTime(parts[0].trim());
          let end = pTime(parts[1].trim());
          if (end <= start) end += 24;
          return start < slotEnd && end > slotH;
        });
        if (matchesSu) scheduled++;
      }
    }

    if (dept.resourceControl) {
      for (const suRes of dept.resourceControl.subUnits) {
        if (suRes.daily[dayIndex]) {
          const dailyForecast = suRes.daily[dayIndex].forecast;
          const weight = fWeight(slotH);
          forecast += Math.round(((dailyForecast / (0.5 * totalWeight)) * weight) * 10) / 10;
        }
      }
    }

    slots.push({ scheduled, forecast });
  }

  // Calculate efficiency
  let totalDeviation = 0;
  let validSlots = 0;
  let morningExcess = 0;
  let eveningDeficit = 0;

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (s.forecast <= 0) continue;
    const ratio = s.scheduled / s.forecast;
    totalDeviation += Math.abs(ratio - 1.0);
    validSlots++;

    const slotH = rangeStart + i * 0.5;
    const delta = s.scheduled - s.forecast;
    if (slotH < 13 && delta > 0) morningExcess += delta;
    if (slotH >= 17 && delta < 0) eveningDeficit += Math.abs(delta);
  }

  if (validSlots === 0) {
    return { efficiency: 100, status: "ok", description: "" };
  }

  const avgDeviation = totalDeviation / validSlots;
  const efficiency = Math.round(Math.max(0, 100 * (1 - avgDeviation)));

  let status: "ok" | "warn" | "problem";
  if (efficiency >= 85) status = "ok";
  else if (efficiency >= 70) status = "warn";
  else status = "problem";

  let description = "";
  if (status !== "ok") {
    const parts: string[] = [];
    if (morningExcess > 1) parts.push(`перебір зранку (+${Math.round(morningExcess)})`);
    if (eveningDeficit > 1) parts.push(`нестача ввечері (-${Math.round(eveningDeficit)})`);
    if (parts.length > 0) {
      description = parts.join(", ");
    } else {
      description = "нерівномірний розподіл годин";
    }
  }

  return { efficiency, status, description };
}

// ══════════════════════════════════════════════════════════════════════
// Resource Breakdown Popover — informational drill-down per day
// ══════════════════════════════════════════════════════════════════════

interface ResourcePopoverProps {
  dept: Department;
  rc: ResourceControl;
  dayIndex: number;
  dayLabel: string;
  days: string[];
  isFact: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onCreateOpenShift?: (deptId: string, dayIndex: number) => void;
}

function ResourcePopover({ dept, rc, dayIndex, dayLabel, days, isFact, onClose, anchorRect, onMouseEnter, onMouseLeave, onCreateOpenShift }: ResourcePopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEsc);
    return () => { document.removeEventListener("keydown", handleEsc); };
  }, [onClose]);

  const top = anchorRect ? anchorRect.bottom + 4 : 0;
  let left = anchorRect ? anchorRect.left + anchorRect.width / 2 - 150 : 0;
  if (left < 8) left = 8;
  if (left + 300 > window.innerWidth) left = window.innerWidth - 308;

  const computeMetrics = (su: SubUnitResource) => {
    const sd = su.daily[dayIndex];
    const compare = isFact ? (sd.actual ?? sd.scheduled) : sd.scheduled;
    return { forecast: sd.forecast, scheduled: compare, delta: compare - sd.forecast };
  };

  const deptMetrics = (() => {
    const d = rc.daily[dayIndex];
    const compare = isFact ? (d.actual ?? d.scheduled) : d.scheduled;
    return { forecast: d.forecast, scheduled: compare, delta: compare - d.forecast };
  })();

  const coveragePct = deptMetrics.forecast > 0 ? Math.round((deptMetrics.scheduled / deptMetrics.forecast) * 100) : 0;
  const coverageStatus = coveragePct >= 100 ? "ok" : coveragePct >= 70 ? "warning" : "critical";
  const coverageColor = coverageStatus === "ok" ? "var(--chart-2)" : coverageStatus === "warning" ? "var(--chart-3)" : "var(--destructive)";
  const coverageBadgeBg = coverageStatus === "ok" ? "var(--success-alpha-12)" : coverageStatus === "warning" ? "var(--warning-alpha-10)" : "var(--destructive-alpha-10)";

  const eff = computeEfficiency(dept, dayIndex);
  const effColor = eff.status === "ok" ? "var(--success)" : eff.status === "warn" ? "var(--chart-3)" : "var(--destructive)";
  const effBadgeBg = eff.status === "ok" ? "var(--success-alpha-12)" : eff.status === "warn" ? "var(--warning-alpha-10)" : "var(--destructive-alpha-10)";

  // Combined overall status — coverage is the ONLY driver for the banner.
  // Efficiency is informational only and does NOT affect the banner status.
  const combined = coverageStatus;
  const combinedText = combined === "ok" ? "День у нормі" : combined === "warning" ? "Є відхилення" : "Потребує уваги";
  const combinedColor = combined === "ok" ? "var(--chart-2)" : combined === "warning" ? "var(--chart-3)" : "var(--destructive)";
  const combinedBg = combined === "ok" ? "var(--success-alpha-5)" : combined === "warning" ? "var(--warning-alpha-5)" : "var(--destructive-alpha-5)";

  const planLabel = isFact ? "Факт" : "План";

  // Shared section label style
  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: "var(--font-weight-semibold)" as any,
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };
  // Shared badge style (no dot — consistent for both sections)
  const badge = (color: string, bg: string, text: string) => (
    <span className="px-1.5 py-px rounded-full" style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)" as any, color, backgroundColor: bg }}>
      {text}
    </span>
  );

  return (
    <div
      ref={ref}
      className="fixed z-50 w-[300px] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden"
      style={{ top, left, backgroundColor: "var(--popover)", boxShadow: "var(--elevation-md)" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-3 py-2 border-b border-[var(--border)]" style={{ backgroundColor: "var(--muted)" }}>
        <div>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>
            {dayLabel}
          </span>
          <p style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", marginTop: 1 }}>
            {dept.name}
          </p>
        </div>
        <button onClick={onClose} className="p-0.5 rounded-[var(--radius-sm)] hover:bg-[var(--border)] transition-colors">
          <X size={14} style={{ color: "var(--muted-foreground)" }} />
        </button>
      </div>

      {/* ── Overall day status ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border)]" style={{ backgroundColor: combinedBg }}>
        {combined === "ok"
          ? <CheckCircle2 size={13} style={{ color: combinedColor, flexShrink: 0 }} />
          : combined === "warning"
            ? <AlertTriangle size={13} style={{ color: combinedColor, flexShrink: 0 }} />
            : <CircleAlert size={13} style={{ color: combinedColor, flexShrink: 0 }} />
        }
        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: combinedColor }}>
          {combinedText}
        </span>
      </div>

      {/* ── Ефективність розподілу ── */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-1">
          <span style={sectionLabel}>Ефективність розподілу</span>
          {badge(effColor, effBadgeBg, `${eff.efficiency}%`)}
        </div>
        {eff.status !== "ok" ? (
          <>
            <p style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", lineHeight: 1.45, marginTop: 2 }}>
              {eff.description}
            </p>
            <button
              onClick={() => {
                document.dispatchEvent(new CustomEvent("open-efficiency-panel", { detail: { dayIndex, deptId: dept.id } }));
                onClose();
              }}
              style={{
                display: "block", width: "100%", textAlign: "center",
                fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any,
                color: "var(--primary)", backgroundColor: "var(--primary-alpha-5)",
                border: "1px solid var(--primary-alpha-25)", padding: "4px 10px", borderRadius: "var(--radius-sm)",
                cursor: "pointer", marginTop: 6,
              }}
            >
              Переглянути розподіл →
            </button>
          </>
        ) : (
          <p style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", marginTop: 2 }}>
            Зміни рівномірно розподілені
          </p>
        )}
      </div>

      {/* ── Покриття ── */}
      <div style={{ padding: "10px 12px 0" }}>
        <div className="flex items-center justify-between mb-1">
          <span style={sectionLabel}>Покриття</span>
          {badge(coverageColor, coverageBadgeBg, `${coveragePct}%`)}
        </div>
        {/* Totals row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Прогноз:</span>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{deptMetrics.forecast}г</span>
          </div>
          <div className="flex items-center gap-1">
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{planLabel}:</span>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{deptMetrics.scheduled}г</span>
          </div>
          <div className="flex items-center gap-1">
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Різн.:</span>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: deltaColor(deptMetrics.delta) }}>
              {fmtDelta(deptMetrics.delta)}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-unit breakdown */}
      {rc.subUnits.length > 0 && (
        <div className="px-3 pb-2 flex flex-col gap-0.5" style={{ paddingTop: 6 }}>
          {/* Column headers */}
          <div className="flex items-center px-2 py-0.5">
            <span className="flex-1" style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Дільниця</span>
            <div className="flex flex-shrink-0" style={{ width: 130 }}>
              <span className="w-[36px] text-right" style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Прогн.</span>
              <span className="w-[40px] text-right" style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{planLabel}</span>
              <span className="w-[46px] text-right" style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Різн.</span>
            </div>
          </div>
          {rc.subUnits.map((su) => {
            const m = computeMetrics(su);
            return (
              <div key={su.name} className="flex items-center px-2 py-1 rounded-[var(--radius-sm)]" style={{ backgroundColor: heatmapBg(m.delta) }}>
                <span className="flex-1 truncate" style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)" }}>
                  {su.name}
                </span>
                <div className="flex flex-shrink-0" style={{ width: 130 }}>
                  <span className="w-[36px] text-right" style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{m.forecast}г</span>
                  <span className="w-[40px] text-right" style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)" }}>{m.scheduled}г</span>
                  <span className="w-[46px] text-right" style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: deltaColor(m.delta) }}>
                    {fmtDelta(m.delta)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create open shift CTA — only when coverage is below target ── */}
      {coverageStatus !== "ok" && onCreateOpenShift && (
        <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => { onCreateOpenShift(dept.id, dayIndex); onClose(); }}
            style={{
              display: "block", width: "100%", textAlign: "center",
              fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any,
              color: "var(--primary)", backgroundColor: "var(--primary-alpha-5)",
              border: "1px solid var(--primary-alpha-25)", borderRadius: "var(--radius-sm)",
              padding: "5px 12px", cursor: "pointer",
            }}
          >
            Створити відкриту зміну
          </button>
        </div>
      )}

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Resource Summary Row — compact row with popover on day click
// ═════════════════════════════════════════════════��════════════════════

interface ResourceSummaryRowProps {
  dept: Department;
  rc: ResourceControl;
  effectiveDaily: { forecast: number; scheduled: number; actual?: number }[];
  days: string[];
  dayDates: string[];
  todayIndex: number;
  isFact: boolean;
  weeklyForecast: number;
  weeklyCompare: number;
  focusedSubUnit?: string | null;
  activeDayIndex: number | null;
  onDayEnter: (deptId: string, dayIndex: number, cell: HTMLElement) => void;
  onDayLeave: () => void;
}

function rscDayCoverageColor(scheduled: number, forecast: number): string {
  if (forecast <= 0) return "var(--muted-foreground)";
  const ratio = scheduled / forecast;
  if (ratio >= 1) return "var(--chart-2)";
  if (ratio >= 0.75) return "var(--chart-3)";
  return "var(--destructive)";
}

function ResourceSummaryRow({
  dept, rc, effectiveDaily, days, dayDates, todayIndex, isFact,
  weeklyForecast, weeklyCompare, focusedSubUnit,
  activeDayIndex, onDayEnter, onDayLeave,
}: ResourceSummaryRowProps) {
  const gap = weeklyCompare - weeklyForecast;
  const gapLabel = gap === 0 ? "0г" : gap > 0 ? `+${gap}г` : `${gap}г`;
  const pct = weeklyForecast > 0 ? Math.round((weeklyCompare / weeklyForecast) * 100) : 0;
  const tooltipText = `Тижневе покриття: ${pct}%\nПрогноз: ${weeklyForecast}г\n${isFact ? "Фактично" : "Заплановано"}: ${weeklyCompare}г\nРізниця: ${gapLabel}`;

  return (
    <tr style={{ backgroundColor: "var(--muted)" }}>
      <td
        className="sticky left-0 z-10 px-3 py-1.5 border-b border-r border-[var(--border)]"
        style={{ backgroundColor: "var(--muted)" }}
        title={tooltipText}
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={13} style={{ color: "var(--muted-foreground)" }} />
          <div className="flex items-center gap-1">
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>Прогноз</span>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>{weeklyForecast}г</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>/</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>Графік</span>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>{weeklyCompare}г</span>
          </div>
          {focusedSubUnit && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full"
              style={{ fontSize: "var(--text-3xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--chart-5)", backgroundColor: "var(--purple-alpha-12)" }}
            >
              <Layers size={9} />
              {focusedSubUnit}
            </span>
          )}
        </div>
      </td>
      {days.map((_, di) => {
        const d = effectiveDaily[di];
        if (!d) return <td key={di} className="px-1.5 py-1.5 border-b border-r border-[var(--border)]" />;
        const compareVal = isFact ? (d.actual ?? d.scheduled) : d.scheduled;
        const isActive = activeDayIndex === di;
        const coverageColor = rscDayCoverageColor(compareVal, d.forecast);
        return (
          <td
            key={di}
            className="group px-1.5 py-1.5 border-b border-r border-[var(--border)] text-center align-middle cursor-pointer transition-colors hover:bg-[var(--primary-alpha-4)]"
            style={{
              backgroundColor: isActive
                ? "var(--primary-alpha-10)"
                : di === todayIndex
                  ? "var(--primary-alpha-4)"
                  : "transparent",
            }}
            onMouseEnter={(e) => onDayEnter(dept.id, di, e.currentTarget)}
            onMouseLeave={onDayLeave}
          >
            <div className="flex items-center justify-center gap-0.5">
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: coverageColor,
                }}
              >
                {d.forecast}/{compareVal}г
              </span>
            </div>
          </td>
        );
      })}
    </tr>
  );
}

// ── Props ────────────────────────────────────────────────────────────

interface WeeklyTableProps {
  departments: Department[];
  days: string[];
  dayDates: string[];
  todayIndex: number;
  onShiftClick: (shift: ShiftData, employee: Employee, department: Department) => void;
  onEmployeeClick: (employee: Employee) => void;
  onEmptyCellClick?: (employee: Employee, dayIndex: number, department: Department) => void;
  onShiftContextMenu?: (e: React.MouseEvent, shift: ShiftData, employee: Employee, department: Department) => void;
  onShiftDrop?: (item: DragItem, targetEmployeeId: string, targetDayIndex: number) => void;
  onDropToOpenShift?: (item: DragItem, targetDayIndex: number, deptId: string) => void;
  onOpenShiftContextMenu?: (e: React.MouseEvent, openShift: OpenShift, department: Department) => void;
  onOpenShiftClick?: (openShift: OpenShift, department: Department) => void;
  onOpenShiftEmptyCellClick?: (dayIndex: number, department: Department) => void;
  onEmptyCellContextMenu?: (e: React.MouseEvent, employee: Employee, dayIndex: number, department: Department) => void;
  selectedShiftId?: string;
  planFact?: "plan" | "fact";
  /** Currently focused sub-unit (null = department-level summary) */
  focusedSubUnit?: string | null;
  /** Whether the issues-only filter is active */
  issuesFilterActive?: boolean;
  /** Set of employee IDs that have issues (used when issuesFilterActive is true) */
  issueEmployeeIds?: Set<string>;
  /** Set of department IDs that have resource deficits or open-shift violations */
  issueDeptIds?: Set<string>;
  /** Whether the schedule is in read-only mode (pending/approved) */
  readOnly?: boolean;
}

export function WeeklyTable({
  departments, days, dayDates, todayIndex, onShiftClick, onEmployeeClick,
  onEmptyCellClick, onShiftContextMenu, onShiftDrop, onDropToOpenShift, onOpenShiftContextMenu,
  onOpenShiftClick, onOpenShiftEmptyCellClick, onEmptyCellContextMenu, selectedShiftId,
  planFact = "plan", focusedSubUnit = null,
  issuesFilterActive = false, issueEmployeeIds, issueDeptIds,
  readOnly = false,
}: WeeklyTableProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const isFact = planFact === "fact";

  // ── Thead height for sticky dept headers ───────────────────────────
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [theadHeight, setTheadHeight] = useState(52);
  useEffect(() => {
    if (!theadRef.current) return;
    const ro = new ResizeObserver(([entry]) => setTheadHeight(entry.contentRect.height));
    ro.observe(theadRef.current);
    return () => ro.disconnect();
  }, []);

  const allCollapsed = departments.length > 0 && departments.every((d) => collapsed[d.id]);
  const allExpanded = departments.length > 0 && departments.every((d) => !collapsed[d.id]);
  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsed({});
    } else {
      const next: Record<string, boolean> = {};
      departments.forEach((d) => { next[d.id] = true; });
      setCollapsed(next);
    }
  };

  // ── Dot indicator → full ResourcePopover (same as resource row) ─────
  const [dotPopover, setDotPopover] = useState<{ deptId: string; dayIndex: number } | null>(null);
  const [dotAnchorRect, setDotAnchorRect] = useState<DOMRect | null>(null);
  const dotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelDotTimer = () => { if (dotTimerRef.current) { clearTimeout(dotTimerRef.current); dotTimerRef.current = null; } };
  const handleDotEnter = (deptId: string, dayIndex: number, cell: HTMLElement) => {
    cancelDotTimer();
    const rect = cell.getBoundingClientRect();
    dotTimerRef.current = setTimeout(() => {
      setDotAnchorRect(rect);
      setDotPopover({ deptId, dayIndex });
    }, 400);
  };
  const handleDotLeave = () => {
    cancelDotTimer();
    dotTimerRef.current = setTimeout(() => setDotPopover(null), 200);
  };
  const handleDotPopoverEnter = () => { cancelDotTimer(); };
  const handleDotPopoverLeave = () => {
    cancelDotTimer();
    dotTimerRef.current = setTimeout(() => setDotPopover(null), 200);
  };

  // ── Instant tooltip state (badges only) ────────────────────────────
  const [tooltip, setTooltip] = useState<{ rect: DOMRect; lines: string[] } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelTooltipTimer = () => { if (tooltipTimerRef.current) { clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = null; } };
  const showTooltip = (el: HTMLElement, lines: string[]) => {
    cancelTooltipTimer();
    setTooltip({ rect: el.getBoundingClientRect(), lines });
  };
  const hideTooltip = () => {
    cancelTooltipTimer();
    tooltipTimerRef.current = setTimeout(() => setTooltip(null), 120);
  };

  const toggleDept = (deptId: string) => {
    setCollapsed((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  const handleEmptyCellClick = useCallback(
    (emp: Employee, di: number, dept: Department) => { onEmptyCellClick?.(emp, di, dept); },
    [onEmptyCellClick]
  );
  const handleShiftContext = useCallback(
    (e: React.MouseEvent, shift: ShiftData, emp: Employee, dept: Department) => { onShiftContextMenu?.(e, shift, emp, dept); },
    [onShiftContextMenu]
  );
  const handleDrop = useCallback(
    (item: DragItem, targetEmpId: string, targetDay: number) => { onShiftDrop?.(item, targetEmpId, targetDay); },
    [onShiftDrop]
  );
  const handleDropToOpen = useCallback(
    (item: DragItem, targetDay: number, deptId: string) => { onDropToOpenShift?.(item, targetDay, deptId); },
    [onDropToOpenShift]
  );
  const handleCellContextMenu = useCallback(
    (e: React.MouseEvent, emp: Employee, di: number, dept: Department) => { onEmptyCellContextMenu?.(e, emp, di, dept); },
    [onEmptyCellContextMenu]
  );

  return (
    <div className="flex-1 overflow-auto">
      <CustomDragLayer />

      {/* Fact mode banner */}
      {isFact && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-[var(--border)]" style={{ backgroundColor: "var(--primary-alpha-6)" }}>
          <Clock size={14} style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--primary)" }}>
            Режим Факт — Відображення фактичних годин
          </span>
          <div className="flex items-center gap-3 ml-4">
            {[
              { color: "var(--chart-2)", label: "Вчасно" },
              { color: "var(--destructive)", label: "Понаднормово" },
              { color: "var(--chart-3)", label: "Відсутність" },
            ].map(({ color, label }) => (
              <span key={label} className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>{label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Focus mode indicator bar */}
      {focusedSubUnit && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-[var(--border)]" style={{ backgroundColor: "var(--purple-alpha-5)" }}>
          <Layers size={14} style={{ color: "var(--chart-5)" }} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--chart-5)" }}>
            Фокус: {focusedSubUnit}
          </span>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>
            — Покриття відфільтровано, відповідні зміни підсвічено
          </span>
        </div>
      )}

      {/* Read-only mode banner */}
      {readOnly && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-[var(--border)]" style={{ backgroundColor: "var(--warning-alpha-5)" }}>
          <CircleAlert size={14} style={{ color: "var(--chart-3)" }} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--chart-3)" }}>
            Графік заблоковано для редагування
          </span>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>
            — Перегляд покриття, проблем та завантаженості працівників доступний
          </span>
        </div>
      )}

      {/* Issues filter banner */}
      {issuesFilterActive && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-[var(--border)]" style={{ backgroundColor: "var(--destructive-alpha-6)" }}>
          <AlertTriangle size={14} style={{ color: "var(--destructive)" }} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--destructive)" }}>
            Показано лише рядки з проблемами
          </span>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>
            — Натисніть на значок помилки для повного перегляду
          </span>
        </div>
      )}

      <table className="w-full" style={{ minWidth: 1200, tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0 }}>
        <colgroup>
          <col style={{ width: 240 }} />
          {days.map((_, i) => (
            <col key={i} />
          ))}
        </colgroup>
        <thead ref={theadRef} className="sticky top-0 z-30">
          <tr style={{ backgroundColor: "var(--muted)" }}>
            <th
              className="sticky left-0 z-20 px-3 py-2 text-left"
              style={{ width: 240, minWidth: 240, fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)", backgroundColor: "var(--muted)", border: "1px solid var(--border)", borderLeftWidth: 0, borderTopWidth: 0 }}
            >
              <div className="flex items-center justify-between gap-2">
                <span>Працівник</span>
                <button
                  onClick={toggleAll}
                  className="inline-flex items-center gap-1 px-1.5 py-1 rounded-[var(--radius-sm)] hover:bg-[var(--border)] transition-colors"
                  style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--muted-foreground)" }}
                  title={allCollapsed ? "Розгорнути всі відділи" : "Згорнути всі відділи"}
                >
                  {allCollapsed ? <ChevronsUpDown size={12} /> : <ChevronsDownUp size={12} />}
                  <span>{allCollapsed ? "Усі" : "Усі"}</span>
                </button>
              </div>
            </th>
            {days.map((day, i) => (
              <th
                key={day}
                className="px-2 py-2 text-center"
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: i === todayIndex ? "var(--primary)" : "var(--muted-foreground)",
                  backgroundColor: i === todayIndex ? "var(--primary-alpha-8)" : undefined,
                  border: "1px solid var(--border)",
                  borderLeftWidth: 0,
                  borderTopWidth: 0,
                }}
              >
                <div>{day}</div>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>
                  {dayDates[i]}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {departments.map((dept, deptIdx) => {
          const isCollapsed = collapsed[dept.id] ?? false;
          const deptAccentColors = ["var(--primary)", "var(--chart-2)", "var(--chart-3)", "var(--chart-5)", "var(--chart-4)", "var(--secondary)", "var(--chart-1)"];
          const deptAccent = deptAccentColors[deptIdx % deptAccentColors.length];
          const deptOvertimeCount = isFact ? dept.employees.reduce((cnt, emp) =>
            cnt + Object.values(emp.shifts).flat().filter((sh) => sh.factStatus === "overtime").length, 0) : 0;
          const deptMissingCount = isFact ? dept.employees.reduce((cnt, emp) =>
            cnt + Object.values(emp.shifts).flat().filter((sh) => sh.factStatus === "missing" || sh.factStatus === "no-show").length, 0) : 0;

          // ── Department-level computed metrics ──────────────────────────
          const rc = dept.resourceControl;
          const focusedSu = focusedSubUnit && rc ? rc.subUnits.find((su) => su.name === focusedSubUnit) : null;
          const effectiveDaily = focusedSu ? focusedSu.daily : rc?.daily ?? [];
          const weeklyForecast = effectiveDaily.reduce((s, d) => s + d.forecast, 0);
          const weeklyScheduled = effectiveDaily.reduce((s, d) => s + d.scheduled, 0);
          const weeklyActual = effectiveDaily.reduce((s, d) => s + (d.actual ?? d.scheduled), 0);
          const weeklyCompare = isFact ? weeklyActual : weeklyScheduled;
          const weeklyDeficit = Math.max(weeklyForecast - weeklyCompare, 0);

          // Issue counts for this department
          const deptIssueCount = dept.employees.filter((emp) => issueEmployeeIds?.has(emp.id)).length
            + (isFact ? deptOvertimeCount + deptMissingCount : 0);
          const openShiftCount = isFact ? 0 : dept.openShifts.length;
          const exchangeCount = isFact ? 0 : dept.openShifts.filter((os) => os.shift.exchangeStatus === "on-exchange").length;

          // Per-day coverage status for micro-indicators
          const dayCoverage = days.map((_, di) => {
            const dayData = effectiveDaily[di];
            if (!dayData || dayData.forecast === 0) return "ok" as const;
            const value = isFact ? (dayData.actual ?? dayData.scheduled) : dayData.scheduled;
            const ratio = value / dayData.forecast;
            const dayOpenShifts = dept.openShifts.filter((os) => os.dayIndex === di).length;
            // Dot = coverage only. Efficiency is secondary info shown in the popover.
            if (ratio >= 1 && dayOpenShifts === 0) return "ok" as const;
            if (ratio >= 0.8) return "warning" as const;  // only 80%+ gets orange, below is red
            return "critical" as const;
          });

          return (
            <tbody key={dept.id}>
              {/* Department header with per-day coverage indicators */}
              <tr
                className="cursor-pointer transition-colors"
                onClick={() => toggleDept(dept.id)}
                style={{ backgroundColor: "var(--sidebar)" }}
              >
                {/* Name cell — sticky left + sticky top (dept header) */}
                <td
                  style={{
                    position: "sticky", left: 0, top: theadHeight, zIndex: 12,
                    backgroundColor: "var(--sidebar)",
                    border: "1px solid rgba(117, 113, 126, 0.25)",
                    borderLeftWidth: 0,
                    boxShadow: `inset 3px 0 0 ${deptAccent}`,
                    paddingLeft: 10, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  }}
                >
                  <div className="flex items-center gap-1.5" style={{ minWidth: 0 }}>
                    {isCollapsed ? (
                      <ChevronRight size={14} style={{ color: "var(--foreground)", flexShrink: 0 }} />
                    ) : (
                      <ChevronDown size={14} style={{ color: "var(--foreground)", flexShrink: 0 }} />
                    )}
                    <span
                      className="truncate"
                      style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}
                    >
                      {dept.name}
                    </span>
                    <span
                      className="px-1.5 py-px rounded-full shrink-0"
                      style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)", backgroundColor: "var(--border)" }}
                      onMouseEnter={(e) => showTooltip(e.currentTarget, [`Працівників у відділі: ${dept.employees.length}`])}
                      onMouseLeave={hideTooltip}
                    >
                      {dept.employees.length}
                    </span>
                    {deptIssueCount > 0 && (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-full shrink-0"
                        style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--destructive)", backgroundColor: "var(--destructive-alpha-10)" }}
                        onMouseEnter={(e) => showTooltip(e.currentTarget, [`Проблеми: ${deptIssueCount}`, "Конфлікти, перевищення норм або порушення"])}
                        onMouseLeave={hideTooltip}
                      >
                        <AlertTriangle size={10} />
                        {deptIssueCount}
                      </span>
                    )}
                    {exchangeCount > 0 && (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-full shrink-0"
                        style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--chart-5)", backgroundColor: "var(--purple-alpha-12)" }}
                        onMouseEnter={(e) => showTooltip(e.currentTarget, [`Зміни на біржі: ${exchangeCount}`, "Очікують призначення працівника"])}
                        onMouseLeave={hideTooltip}
                      >
                        <ArrowRightLeft size={10} />
                        {exchangeCount}
                      </span>
                    )}
                  </div>
                </td>
                {/* Per-day coverage dot indicators — always trigger shared popover */}
                {days.map((_, di) => {
                  const status = dayCoverage[di];
                  const dotColor = status === "ok" ? "var(--chart-2)" : status === "warning" ? "var(--chart-3)" : "var(--destructive)";
                  const isActive = dotPopover?.deptId === dept.id && dotPopover?.dayIndex === di;

                  return (
                    <td
                      key={di}
                      className="align-middle cursor-pointer"
                      style={{
                        position: "sticky",
                        top: theadHeight,
                        zIndex: 7,
                        backgroundColor: isActive ? "var(--primary-alpha-10)" : "var(--sidebar)",
                        padding: "6px 0",
                        transition: "background-color 0.15s",
                        border: "1px solid rgba(117, 113, 126, 0.25)",
                        borderLeftWidth: 0,
                      }}
                      onMouseEnter={(e) => handleDotEnter(dept.id, di, e.currentTarget)}
                      onMouseLeave={handleDotLeave}
                    >
                      <div className="flex items-center justify-center">
                        <span
                          className="rounded-full"
                          style={{
                            width: 6,
                            height: 6,
                            backgroundColor: dotColor,
                            opacity: status === "ok" ? 0.45 : 1,
                          }}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Resources summary row — visible when expanded */}
              {!isCollapsed && rc && (
                <ResourceSummaryRow
                  dept={dept}
                  rc={rc}
                  effectiveDaily={effectiveDaily}
                  days={days}
                  dayDates={dayDates}
                  todayIndex={todayIndex}
                  isFact={isFact}
                  weeklyForecast={weeklyForecast}
                  weeklyCompare={weeklyCompare}
                  focusedSubUnit={focusedSubUnit}
                  activeDayIndex={dotPopover?.deptId === dept.id ? dotPopover.dayIndex : null}
                  onDayEnter={handleDotEnter}
                  onDayLeave={handleDotLeave}
                />
              )}

              {/* Open shifts row (Plan mode only) */}
              {!isCollapsed && !isFact && (
                <OpenShiftRow
                  dept={dept} days={days} todayIndex={todayIndex}
                  selectedShiftId={selectedShiftId}
                  focusedSubUnit={focusedSubUnit}
                  onOpenShiftClick={onOpenShiftClick}
                  onOpenShiftContextMenu={onOpenShiftContextMenu}
                  onOpenShiftEmptyCellClick={onOpenShiftEmptyCellClick}
                  onDropToOpenShift={handleDropToOpen}
                  readOnly={readOnly}
                />
              )}

              {/* Employee rows */}
              {!isCollapsed &&
                (() => {
                  const filteredEmps = dept.employees.filter((emp) => !issuesFilterActive || !issueEmployeeIds || issueEmployeeIds.has(emp.id));
                  const staffEmps = filteredEmps.filter((emp) => !emp.origin);
                  const tempEmps = filteredEmps.filter((emp) => !!emp.origin);

                  const renderEmployeeRow = (emp: Employee) => {
                    const monthlyProgress = Math.min((emp.workedHours / emp.monthlyNorm) * 100, 100);
                    const overwork = emp.workedHours > emp.monthlyNorm;
                    const nearLimit = !overwork && emp.workedHours >= emp.monthlyNorm * 0.9;
                    const progressBarColor = overwork
                      ? "var(--destructive)"
                      : nearLimit
                        ? "var(--chart-3)"
                        : "var(--chart-2)";

                    const originTooltip = emp.origin
                      ? emp.origin.type === "another-department"
                        ? `з ${emp.origin.label}`
                        : emp.origin.type === "another-store"
                          ? `з ${emp.origin.label}`
                          : `з ${emp.origin.label}`
                      : undefined;

                    // Compute planned hours for this week from shifts
                    const weekPlannedHours = Object.values(emp.shifts).flat().reduce((sum, sh) => {
                      const parts = sh.timeRange.split("–");
                      if (parts.length === 2) {
                        const [sH, sM] = parts[0].trim().split(":").map(Number);
                        const [eH, eM] = parts[1].trim().split(":").map(Number);
                        let s = (sH || 0) + (sM || 0) / 60;
                        let e = (eH || 0) + (eM || 0) / 60;
                        if (e <= s) e += 24;
                        return sum + (e - s);
                      }
                      return sum;
                    }, 0);

                    const remaining = Math.max(emp.monthlyNorm - emp.workedHours, 0);
                    const exceeded = overwork ? emp.workedHours - emp.monthlyNorm : 0;

                    return (
                      <tr key={emp.id} className="hover:bg-[var(--muted)] transition-colors" style={{ height: 72 }}>
                        <td
                          className="sticky left-0 z-10 px-3 py-1.5 cursor-pointer hover:bg-[var(--muted)] transition-colors"
                          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderLeftWidth: 0, borderTopWidth: 0 }}
                          onClick={() => onEmployeeClick(emp)}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--muted)" }}>
                                <User size={14} style={{ color: "var(--muted-foreground)" }} />
                              </div>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="truncate"
                                  title={originTooltip}
                                  style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)", lineHeight: 1.33, cursor: originTooltip ? "help" : undefined }}
                                >
                                  {emp.name}
                                </span>
                                {emp.isMinor && <MinorBadge />}
                              </div>
                              <span className="truncate" style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                                {emp.position} · {emp.fte}%
                              </span>
                              {/* Progress bar + hours with tooltip trigger */}
                              <EmployeeHoursTooltip emp={emp} weekPlannedHours={weekPlannedHours} remaining={remaining} exceeded={exceeded} overwork={overwork}>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: "var(--border)", width: 56 }}>
                                    <div className="h-full rounded-full transition-all" style={{ width: `${monthlyProgress}%`, backgroundColor: progressBarColor }} />
                                  </div>
                                  <span className="flex-shrink-0" style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: overwork ? "var(--destructive)" : "var(--muted-foreground)" }}>
                                    {emp.workedHours}/{emp.monthlyNorm}г
                                  </span>
                                  {overwork && (
                                    <AlertTriangle size={10} style={{ color: "var(--destructive)", flexShrink: 0 }} />
                                  )}
                                </div>
                              </EmployeeHoursTooltip>
                            </div>
                          </div>
                        </td>

                        {/* Day cells with multi-day leave spanning */}
                        {(() => {
                          const absSpans = getAbsenceSpans(emp, days.length);
                          const spannedDays = new Set<number>();
                          absSpans.forEach((span) => {
                            for (let d = span.start + 1; d < span.start + span.length; d++) spannedDays.add(d);
                          });
                          return days.map((_, di) => {
                            if (spannedDays.has(di)) return null;
                            const span = absSpans.find((s) => s.start === di);
                            const dayShifts = emp.shifts[String(di)] || [];
                            if (span) {
                              const dimmed = focusedSubUnit ? !shiftBelongsToSubUnit(span.shift, focusedSubUnit) : false;
                              return (
                                <td key={di} colSpan={span.length} className="px-1 py-1 border-b border-r border-[var(--border)] align-top">
                                  <div data-shift-card style={{ opacity: dimmed ? 0.4 : 1, transition: "opacity 0.2s" }}>
                                    <ShiftCard shift={span.shift} isSelected={selectedShiftId === span.shift.id}
                                      onClick={() => onShiftClick(span.shift, emp, dept)}
                                      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); handleShiftContext(e, span.shift, emp, dept); }}
                                      employeeId={emp.id} dayIndex={di} draggable={false}
                                    />
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <DayCell key={di} dayIndex={di} todayIndex={todayIndex} shifts={dayShifts}
                                employee={emp} dept={dept} isFact={isFact} selectedShiftId={selectedShiftId}
                                focusedSubUnit={focusedSubUnit}
                                onShiftClick={onShiftClick} onShiftContextMenu={handleShiftContext}
                                onEmptyCellClick={handleEmptyCellClick} onDrop={handleDrop}
                                onCellContextMenu={handleCellContextMenu} readOnly={readOnly}
                              />
                            );
                          });
                        })()}

                      </tr>
                    );
                  };

                  const tempSeparator = tempEmps.length > 0 ? [
                    <tr key="__temp-separator__">
                      <td
                        colSpan={1 + days.length}
                        className="sticky left-0 z-10 px-3 py-1 border-b border-[var(--border)]"
                        style={{ backgroundColor: "var(--muted)" }}
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                            Залучені з інших відділів
                          </span>
                          <Info
                            size={12}
                            style={{ color: "var(--muted-foreground)", flexShrink: 0, cursor: "help" }}
                            onMouseEnter={(e) => showTooltip(e.currentTarget as HTMLElement, ["Залучені з інших відділів", "Співробітники з інших відділів або з біржі змін,", "що тимчасово працюють у цьому відділі"])}
                            onMouseLeave={hideTooltip}
                          />
                          <span className="inline-flex items-center justify-center rounded-full" style={{ height: 16, minWidth: 16, paddingLeft: 6, paddingRight: 6, fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--muted-foreground)", backgroundColor: "var(--muted)", lineHeight: 1 }}>
                            {tempEmps.length}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ] : [];

                  return [
                    ...staffEmps.map(renderEmployeeRow),
                    ...tempSeparator,
                    ...tempEmps.map(renderEmployeeRow),
                  ];
                })()}

            </tbody>
          );
        })}
      </table>

      {/* Dot indicator → full ResourcePopover portal */}
      {dotPopover && (() => {
        const popDept = departments.find((d) => d.id === dotPopover.deptId);
        const popRc = popDept?.resourceControl;
        if (!popRc) return null;
        return createPortal(
          <ResourcePopover
            dept={popDept}
            rc={popRc}
            dayIndex={dotPopover.dayIndex}
            dayLabel={`${days[dotPopover.dayIndex]} ${dayDates[dotPopover.dayIndex]}`}
            days={days}
            isFact={isFact}
            onClose={() => setDotPopover(null)}
            anchorRect={dotAnchorRect}
            onMouseEnter={handleDotPopoverEnter}
            onMouseLeave={handleDotPopoverLeave}
            onCreateOpenShift={(deptId, di) => {
              onOpenShiftEmptyCellClick?.(di, popDept);
              setDotPopover(null);
            }}
          />,
          document.body
        );
      })()}

      {/* Instant tooltip portal — badges */}
      {tooltip && createPortal(
        <div
          className="fixed z-[100] pointer-events-none"
          style={{
            top: tooltip.rect.bottom + 6,
            left: Math.max(8, Math.min(tooltip.rect.left + tooltip.rect.width / 2 - 100, window.innerWidth - 216)),
            width: 200,
          }}
        >
          <div
            className="px-2.5 py-1.5 rounded-[var(--radius)] border border-[var(--border)]"
            style={{
              backgroundColor: "var(--popover)",
              boxShadow: "var(--elevation-sm)",
            }}
          >
            {tooltip.lines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: i === 0 ? "var(--text-xs)" : "var(--text-2xs)",
                  fontWeight: i === 0 ? "var(--font-weight-semibold)" : "var(--font-weight-normal)" as any,
                  color: i === 0 ? "var(--foreground)" : "var(--muted-foreground)",
                  lineHeight: 1.4,
                  marginTop: i > 0 ? 2 : 0,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Open Shift Row ──────────────────────────────────────────────────

interface OpenShiftRowProps {
  dept: Department;
  days: string[];
  todayIndex: number;
  selectedShiftId?: string;
  focusedSubUnit?: string | null;
  onOpenShiftClick?: (openShift: OpenShift, department: Department) => void;
  onOpenShiftContextMenu?: (e: React.MouseEvent, openShift: OpenShift, department: Department) => void;
  onOpenShiftEmptyCellClick?: (dayIndex: number, department: Department) => void;
  onDropToOpenShift?: (item: DragItem, targetDayIndex: number, deptId: string) => void;
  readOnly?: boolean;
}

function OpenShiftRow({
  dept, days, todayIndex, selectedShiftId, focusedSubUnit,
  onOpenShiftClick, onOpenShiftContextMenu, onOpenShiftEmptyCellClick,
  onDropToOpenShift, readOnly = false,
}: OpenShiftRowProps) {
  return (
    <tr style={{ backgroundColor: "var(--muted)" }}>
      <td className="sticky left-0 z-10 px-3 py-1.5 border-b border-r border-[var(--border)]" style={{ backgroundColor: "var(--muted)" }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--chart-2)" }}>
            Відкриті зміни
          </span>
        </div>
      </td>
      {days.map((_, di) => {
        const dayShifts = dept.openShifts.filter((os) => os.dayIndex === di);
        return (
          <OpenShiftDayCell
            key={di}
            dayIndex={di}
            todayIndex={todayIndex}
            dept={dept}
            dayShifts={dayShifts}
            selectedShiftId={selectedShiftId}
            focusedSubUnit={focusedSubUnit}
            onOpenShiftClick={onOpenShiftClick}
            onOpenShiftContextMenu={onOpenShiftContextMenu}
            onOpenShiftEmptyCellClick={onOpenShiftEmptyCellClick}
            onDropToOpenShift={onDropToOpenShift}
            readOnly={readOnly}
          />
        );
      })}
    </tr>
  );
}

// ── Drop-aware open shift day cell ──────────────────────────────────

interface OpenShiftDayCellProps {
  dayIndex: number;
  todayIndex: number;
  dept: Department;
  dayShifts: OpenShift[];
  selectedShiftId?: string;
  focusedSubUnit?: string | null;
  onOpenShiftClick?: (openShift: OpenShift, department: Department) => void;
  onOpenShiftContextMenu?: (e: React.MouseEvent, openShift: OpenShift, department: Department) => void;
  onOpenShiftEmptyCellClick?: (dayIndex: number, department: Department) => void;
  onDropToOpenShift?: (item: DragItem, targetDayIndex: number, deptId: string) => void;
  readOnly?: boolean;
}

function OpenShiftDayCell({
  dayIndex, todayIndex, dept, dayShifts, selectedShiftId, focusedSubUnit,
  onOpenShiftClick, onOpenShiftContextMenu, onOpenShiftEmptyCellClick,
  onDropToOpenShift, readOnly = false,
}: OpenShiftDayCellProps) {
  const [hovered, setHovered] = useState(false);
  const isEmpty = dayShifts.length === 0;

  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: [SHIFT_DND_TYPE],
      canDrop: (item: DragItem) => {
        // Only accept employee shifts (not open-shift-to-open-shift)
        if (item.sourceType !== "employee") return false;
        return true;
      },
      drop: (item: DragItem) => { onDropToOpenShift?.(item, dayIndex, dept.id); },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [dayIndex, dept.id, onDropToOpenShift]
  );

  let dropBorder = "";
  let dropBg = "";
  if (isOver && canDrop) {
    dropBorder = "2px solid var(--chart-2)";
    dropBg = "var(--success-alpha-8)";
  } else if (isOver && !canDrop) {
    dropBorder = "2px dashed var(--border)";
  }

  return (
    <td
      ref={(node) => { dropRef(node); }}
      className="px-1 py-1 border-b border-r border-[var(--border)] align-top relative"
      style={{
        backgroundColor: dropBg || (dayIndex === todayIndex ? "var(--primary-alpha-4)" : undefined),
        outline: dropBorder || undefined,
        outlineOffset: "-2px",
        transition: "outline 0.15s, background-color 0.15s",
        minHeight: 40,
        cursor: !readOnly ? "pointer" : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { if (!readOnly && (e.target as HTMLElement).closest("[data-shift-card]") === null) onOpenShiftEmptyCellClick?.(dayIndex, dept); }}
      onContextMenu={(e) => {
        if (isEmpty && !readOnly) {
          e.preventDefault();
          e.stopPropagation();
          onOpenShiftEmptyCellClick?.(dayIndex, dept);
        }
      }}
    >
      <div className="flex flex-col gap-1" style={{ marginRight: !readOnly ? 14 : 0 }}>
        {dayShifts.map((os) => {
          const dimmed = focusedSubUnit ? !shiftBelongsToSubUnit(os.shift, focusedSubUnit) : false;
          return (
            <div key={os.id} data-shift-card style={{ opacity: dimmed ? 0.4 : 1, transition: "opacity 0.2s" }}>
              <OpenShiftCard
                shift={os.shift} openShiftId={os.id} deptId={dept.id} dayIndex={dayIndex}
                isSelected={selectedShiftId === os.shift.id}
                onClick={() => onOpenShiftClick?.(os, dept)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onOpenShiftContextMenu?.(e, os, dept); }}
              />
            </div>
          );
        })}
      </div>
      {/* Empty open-shift cell overlay */}
      {isEmpty && !isOver && !readOnly && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer transition-colors"
          style={{ backgroundColor: hovered ? "var(--success-alpha-5)" : "transparent" }}
          title="Створити відкриту зміну"
        >
          <div
            className="flex items-center justify-center rounded-full transition-opacity"
            style={{ width: 22, height: 22, backgroundColor: "var(--success-alpha-12)", opacity: hovered ? 1 : 0 }}
          >
            <Plus size={14} style={{ color: "var(--chart-2)" }} />
          </div>
        </div>
      )}
      {isOver && canDrop && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-0.5" style={{ backgroundColor: "var(--success-alpha-12)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--chart-2)" }}>
          <ArrowRightLeft size={10} /> Зняти призначення
        </div>
      )}
    </td>
  );
}

// ── Employee Hours Tooltip ──────────────────────────────────────────

interface EmployeeHoursTooltipProps {
  emp: Employee;
  weekPlannedHours: number;
  remaining: number;
  exceeded: number;
  overwork: boolean;
  children: React.ReactNode;
}

function EmployeeHoursTooltip({ emp, weekPlannedHours, remaining, exceeded, overwork, children }: EmployeeHoursTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const MONTH_NAMES = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
  const currentMonth = MONTH_NAMES[2]; // March 2026

  // Multi-month check
  const weekStart = new Date(2026, 2, 2);
  const weekEnd = new Date(2026, 2, 8);
  const isCrossMonth = weekStart.getMonth() !== weekEnd.getMonth();

  const handleEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
    setIsOpen(true);
  };

  const actualHours = Math.round(emp.workedHours * 0.79);

  // ── Compute absences + marketplace ──
  const ABSENCE_LABELS: Record<string, string> = {
    leave: "Відпустка",
    sick: "Лікарняний",
    reserved: "Резерв",
    "temp-assignment": "Тимч. призначення",
  };
  const absenceSummary: Record<string, number> = {};
  for (const dayShifts of Object.values(emp.shifts)) {
    for (const sh of dayShifts) {
      if (sh.status && (sh.status === "leave" || sh.status === "sick" || sh.status === "reserved" || sh.status === "temp-assignment")) {
        const label = ABSENCE_LABELS[sh.status] || sh.status;
        absenceSummary[label] = (absenceSummary[label] || 0) + 1;
      }
    }
  }
  const absenceEntries = Object.entries(absenceSummary);
  const totalAbsenceDays = absenceEntries.reduce((s, [, v]) => s + v, 0);
  const mktHours = emp.marketplaceHours || 0;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setIsOpen(false)}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      {isOpen && pos && createPortal(
        <div
          className="fixed pointer-events-none"
          style={{ zIndex: 9999, top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}
        >
          <div
            className="rounded-[var(--radius)] overflow-hidden pointer-events-auto"
            style={{
              borderStyle: "solid", borderWidth: 1,
              borderTopColor: overwork ? "var(--destructive-alpha-15)" : "var(--border)",
              borderRightColor: overwork ? "var(--destructive-alpha-15)" : "var(--border)",
              borderBottomColor: overwork ? "var(--destructive-alpha-15)" : "var(--border)",
              borderLeftColor: overwork ? "var(--destructive-alpha-15)" : "var(--border)",
              backgroundColor: "var(--popover)", boxShadow: "var(--elevation-md)",
              minWidth: 220, maxWidth: 300,
            }}
          >
            {/* Header */}
            <div
              className="px-3 py-1.5"
              style={{ backgroundColor: overwork ? "var(--destructive-alpha-6)" : "var(--muted)", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "var(--border)" }}
            >
              {overwork ? (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={12} style={{ color: "var(--destructive)" }} />
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--destructive)" }}>Перевищення норми</span>
                </div>
              ) : (
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{currentMonth}</span>
              )}
            </div>
            {/* Content */}
            <div className="px-3 py-2 flex flex-col gap-1">
              {overwork ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Заплановано</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--destructive)" }}>{emp.workedHours}г</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Норма</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--foreground)" }}>{emp.monthlyNorm}г</span>
                  </div>
                  {emp.marketplaceHours != null && emp.marketplaceHours > 0 && (
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Біржа змін</span>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--chart-5)" }}>{emp.marketplaceHours}г</span>
                    </div>
                  )}
                  <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--destructive)" }}>Перевищено на</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--destructive)" }}>+{exceeded}г</span>
                  </div>
                  {!emp.isMinor && (
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>Загальне навантаження</span>
                      <span className="shrink-0 whitespace-nowrap" style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{(emp.workedHours + mktHours).toFixed(1)} / 250г</span>
                    </div>
                  )}
                </div>
              ) : isCrossMonth ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--primary)" }}>{MONTH_NAMES[weekStart.getMonth()]}</span>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Заплановано</span>
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--foreground)" }}>{Math.round(weekPlannedHours * 0.6)} / {emp.monthlyNorm}г</span>
                    </div>
                  </div>
                  <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
                  <div className="flex flex-col gap-0.5">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--primary)" }}>{MONTH_NAMES[weekEnd.getMonth()]}</span>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Заплановано</span>
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--foreground)" }}>{Math.round(weekPlannedHours * 0.4)} / {emp.monthlyNorm}г</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Норма</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--foreground)" }}>{emp.monthlyNorm}г</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Заплановано</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--foreground)" }}>{emp.workedHours}г</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Фактично</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--foreground)" }}>{actualHours}г</span>
                  </div>
                  {emp.marketplaceHours != null && emp.marketplaceHours > 0 && (
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Біржа змін</span>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--chart-5)" }}>{emp.marketplaceHours}г</span>
                    </div>
                  )}
                  <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--chart-2)" }}>Залишок</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--chart-2)" }}>{remaining}г</span>
                  </div>
                  {!emp.isMinor && (
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>Загальне навантаження</span>
                      <span className="shrink-0 whitespace-nowrap" style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{(emp.workedHours + mktHours).toFixed(1)} / 250г</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* ── Absences ── */}
            {totalAbsenceDays > 0 && (
              <div
                className="px-3 py-1.5 flex flex-col gap-0.5"
                style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: "var(--border)" }}
              >
                {absenceEntries.map(([label, count]) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label === "Лікарняний" ? "var(--chart-3)" : label === "Відпустка" ? "var(--chart-5)" : "var(--muted-foreground)" }} />
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>{label}</span>
                    </div>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--foreground)" }}>
                      {count} {count === 1 ? "день" : count < 5 ? "дні" : "днів"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
