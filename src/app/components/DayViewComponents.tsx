import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { User, AlertTriangle } from "lucide-react";
import type { Employee, Department, OpenShift } from "./WeeklyTable";
import type { ShiftData } from "./ShiftCard";
import { ShiftTooltip } from "./ShiftCard";
import { DayShiftCard, DayFactShiftCard, DayOpenShiftCard } from "./DayViewCards";

// ── Full 24-hour range ────────────────────────────────────────────────

export interface TimeRange {
  start: number;
  end: number;
}

/** The single continuous timeline always spans 0–24 */
export const FULL_RANGE: TimeRange = { start: 0, end: 24 };

/** Quick-jump targets — scroll into the shared 24h surface */
export const JUMP_RANGES: TimeRange[] = [
  { start: 0, end: 9 },
  { start: 6, end: 15 },
  { start: 15, end: 24 },
];
export const DEFAULT_JUMP_INDEX = 1;

// ── Constants ─────────────────────────────────────────────────────────

const PX_PER_HOUR = 120;
export const RESOURCE_ROW_H = 64;
export const OPEN_SHIFT_ROW_H = 60;
export const EMPLOYEE_ROW_H = 72;
const CARD_INSET_Y = 4;
const CARD_INSET_Y_SM = 6;

// ── Layout helpers ────────────────────────────────────────────────────

export function gridWidthPx(range: TimeRange): number {
  return (range.end - range.start) * PX_PER_HOUR;
}

function hourToLeft(hour: number, range: TimeRange): number {
  return (hour - range.start) * PX_PER_HOUR;
}

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

function clampShift(
  shift: ShiftData,
  range: TimeRange
): { left: number; width: number } | null {
  const parts = shift.timeRange.split("–");
  if (parts.length !== 2) return null;
  let start = parseTime(parts[0].trim());
  let end = parseTime(parts[1].trim());
  if (end <= start) end += 24;

  const clampedStart = Math.max(start, range.start);
  const clampedEnd = Math.min(end, range.end);
  if (clampedStart >= clampedEnd) return null;

  const left = hourToLeft(clampedStart, range);
  const width = (clampedEnd - clampedStart) * PX_PER_HOUR;
  return { left, width };
}

// ══════════════════════════════════════════════════════════════════════
// TimeGridLines — hourly + 30-minute grid
// ══════════════════════════════════════════════════════════════════════

export function TimeGridLines({ range }: { range: TimeRange }) {
  const lines: React.ReactNode[] = [];
  for (let h = range.start; h <= range.end; h += 0.5) {
    const x = hourToLeft(h, range);
    const isFullHour = h % 1 === 0;
    const isEdge = h === range.start || h === range.end;
    lines.push(
      <div
        key={h}
        className="absolute top-0 bottom-0"
        style={{
          left: x,
          width: 1,
          backgroundColor: "var(--border)",
          opacity: isEdge ? 0 : isFullHour ? 0.5 : 0.25,
        }}
      />
    );
  }
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {lines}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// TimeHeader — full hours (primary) + half hours (secondary)
// ══════════════════════════════════════════════════════════════════════

export function TimeHeader({ range }: { range: TimeRange }) {
  const labels: React.ReactNode[] = [];
  for (let h = range.start; h <= range.end; h += 0.5) {
    const x = hourToLeft(h, range);
    const isFullHour = h % 1 === 0;
    const displayHour = h % 24;
    const label = isFullHour
      ? `${String(Math.floor(displayHour)).padStart(2, "0")}:00`
      : `${String(Math.floor(displayHour)).padStart(2, "0")}:30`;

    labels.push(
      <div
        key={h}
        className="absolute top-0 bottom-0 flex items-center"
        style={{ left: x, transform: "translateX(-50%)" }}
      >
        <span
          style={{
            fontSize: isFullHour ? "var(--text-2xs)" : "9px",
            fontWeight: isFullHour ? "var(--font-weight-medium)" : "var(--font-weight-normal)",
            color: isFullHour ? "var(--muted-foreground)" : "var(--border)",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
    );

    // Tick marks
    labels.push(
      <div
        key={`tick-${h}`}
        className="absolute bottom-0"
        style={{
          left: x,
          width: 1,
          height: isFullHour ? 6 : 3,
          backgroundColor: "var(--border)",
        }}
      />
    );
  }
  return (
    <div className="absolute inset-0" style={{ zIndex: 2 }}>
      {labels}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// CurrentTimeIndicator — subtle marker + thin line (only inside grid)
// ══════════════════════════════════════════════════════════════════════

export function CurrentTimeIndicator({
  isToday,
  range,
}: {
  isToday: boolean;
  range: TimeRange;
}) {
  if (!isToday) return null;
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  if (nowHour < range.start || nowHour > range.end) return null;
  const x = hourToLeft(nowHour, range);
  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left: x,
        width: 0,
        height: "100%",
        zIndex: 30,
      }}
    >
      {/* Small triangle marker at top */}
      <div
        style={{
          position: "absolute",
          top: -1,
          left: -4,
          width: 0,
          height: 0,
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderTop: "5px solid var(--destructive)",
        }}
      />
      {/* Thin subtle line */}
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 0,
          width: 1,
          bottom: 0,
          backgroundColor: "var(--destructive)",
          opacity: 0.4,
        }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MinorBadge
// ══════════════════════════════════════════════════════════════════════

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
          backgroundColor: "var(--warning-alpha-8)",
        }}
      >
        &lt;18
      </span>
      {show && pos && createPortal(
        <div className="fixed pointer-events-none" style={{ zIndex: 9999, top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}>
          <div
            className="rounded-[var(--radius)] overflow-hidden pointer-events-auto"
            style={{ borderStyle: "solid", borderWidth: 1, borderColor: "var(--border)", backgroundColor: "var(--popover)", boxShadow: "var(--elevation-md)", minWidth: 200 }}
          >
            <div className="px-3 py-1.5" style={{ backgroundColor: "var(--warning-alpha-8)", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--chart-3)" }}>Неповнолітній працівник</span>
            </div>
            <div className="px-3 py-2 flex flex-col gap-1">
              {restrictions.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3">
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>{r.label}</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: r.warn ? "var(--chart-3)" : "var(--foreground)", whiteSpace: "nowrap" }}>{r.value}</span>
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

// ══════════════════════════════════════════════════════════════════════
// EmployeeHoursTooltip
// ══════════════════════════════════════════════════════════════════════

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
  const currentMonth = MONTH_NAMES[2];

  const handleEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
    setIsOpen(true);
  };

  const actualHours = Math.round(emp.workedHours * 0.79);
  const mktHours = emp.marketplaceHours || 0;

  const ABSENCE_LABELS: Record<string, string> = {
    leave: "Відпустка", sick: "Лікарняний", reserved: "Резерв", "temp-assignment": "Тимч. призначення",
  };
  const absenceSummary: Record<string, number> = {};
  for (const dayShifts of Object.values(emp.shifts)) {
    for (const sh of dayShifts) {
      if (sh.status && ["leave", "sick", "reserved", "temp-assignment"].includes(sh.status)) {
        const label = ABSENCE_LABELS[sh.status] || sh.status;
        absenceSummary[label] = (absenceSummary[label] || 0) + 1;
      }
    }
  }
  const absenceEntries = Object.entries(absenceSummary);
  const totalAbsenceDays = absenceEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <div ref={triggerRef} onMouseEnter={handleEnter} onMouseLeave={() => setIsOpen(false)} onClick={(e) => e.stopPropagation()}>
      {children}
      {isOpen && pos && createPortal(
        <div className="fixed pointer-events-none" style={{ zIndex: 9999, top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}>
          <div
            className="rounded-[var(--radius)] overflow-hidden pointer-events-auto"
            style={{
              borderStyle: "solid", borderWidth: 1,
              borderColor: overwork ? "var(--destructive-alpha-15)" : "var(--border)",
              backgroundColor: "var(--popover)", boxShadow: "var(--elevation-md)",
              minWidth: 220, maxWidth: 300,
            }}
          >
            <div className="px-3 py-1.5" style={{ backgroundColor: overwork ? "var(--destructive-alpha-6)" : "var(--muted)", borderBottom: "1px solid var(--border)" }}>
              {overwork ? (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={12} style={{ color: "var(--destructive)" }} />
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--destructive)" }}>Перевищення норми</span>
                </div>
              ) : (
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{currentMonth}</span>
              )}
            </div>
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
                  {mktHours > 0 && (
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Біржа змін</span>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--chart-5)" }}>{mktHours}г</span>
                    </div>
                  )}
                  <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--destructive)" }}>Перевищено на</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--destructive)" }}>+{exceeded}г</span>
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
                  {mktHours > 0 && (
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Біржа змін</span>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--chart-5)" }}>{mktHours}г</span>
                    </div>
                  )}
                  <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--chart-2)" }}>Залишок</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--chart-2)" }}>{remaining}г</span>
                  </div>
                </div>
              )}
            </div>
            {totalAbsenceDays > 0 && (
              <div className="px-3 py-1.5 flex flex-col gap-0.5" style={{ borderTop: "1px solid var(--border)" }}>
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

// ══════════════════════════════════════════════════════════════════════
// DayEmployeeCell
// ══════════════════════════════════════════════════════════════════════

interface DayEmployeeCellProps {
  emp: Employee;
  onEmployeeClick: (employee: Employee) => void;
}

export function DayEmployeeCell({ emp, onEmployeeClick }: DayEmployeeCellProps) {
  const monthlyProgress = Math.min((emp.workedHours / emp.monthlyNorm) * 100, 100);
  const overwork = emp.workedHours > emp.monthlyNorm;
  const nearLimit = !overwork && emp.workedHours >= emp.monthlyNorm * 0.9;
  const progressBarColor = overwork
    ? "var(--destructive)"
    : nearLimit
      ? "var(--chart-3)"
      : "var(--chart-2)";

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
  const originTooltip = emp.origin ? `з ${emp.origin.label}` : undefined;

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-[var(--muted)] transition-colors"
      style={{
        height: EMPLOYEE_ROW_H,
        backgroundColor: "var(--card)",
        borderBottom: "1px solid var(--border)",
      }}
      onClick={() => onEmployeeClick(emp)}
    >
      <div className="flex-shrink-0">
        <div className="rounded-full flex items-center justify-center" style={{ width: 32, height: 32, backgroundColor: "var(--muted)" }}>
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
        <EmployeeHoursTooltip emp={emp} weekPlannedHours={weekPlannedHours} remaining={remaining} exceeded={exceeded} overwork={overwork}>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: "var(--border)", width: 56 }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${monthlyProgress}%`, backgroundColor: progressBarColor }} />
            </div>
            <span className="flex-shrink-0" style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: overwork ? "var(--destructive)" : "var(--muted-foreground)" }}>
              {emp.workedHours}/{emp.monthlyNorm}г
            </span>
            {overwork && <AlertTriangle size={10} style={{ color: "var(--destructive)", flexShrink: 0 }} />}
          </div>
        </EmployeeHoursTooltip>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// DayEmployeeTimeline
// ══════════════════════════════════════════════════════════════════════

interface DayEmployeeTimelineProps {
  emp: Employee;
  dept: Department;
  dayIndex: number;
  isFact: boolean;
  readOnly: boolean;
  selectedShiftId?: string;
  focusedSubUnit?: string | null;
  isToday: boolean;
  range: TimeRange;
  onShiftClick: (shift: ShiftData, employee: Employee, department: Department) => void;
  onShiftContextMenu?: (e: React.MouseEvent, shift: ShiftData, employee: Employee, department: Department) => void;
  onEmptyCellClick?: (employee: Employee, dayIndex: number, department: Department) => void;
}

export function DayEmployeeTimeline({
  emp, dept, dayIndex, isFact, readOnly, selectedShiftId, focusedSubUnit, isToday, range,
  onShiftClick, onShiftContextMenu, onEmptyCellClick,
}: DayEmployeeTimelineProps) {
  const w = gridWidthPx(range);
  const dayShifts = emp.shifts[String(dayIndex)] || [];

  const filtered = focusedSubUnit
    ? dayShifts.filter((s) => s.subUnits?.some((su) => su.unit === focusedSubUnit) || s.status === "leave" || s.status === "sick")
    : dayShifts;

  return (
    <div
      className="relative"
      style={{ height: EMPLOYEE_ROW_H, width: w, borderBottom: "1px solid var(--border)" }}
      onClick={(e) => {
        if ((e.target as HTMLElement) === e.currentTarget && !readOnly) {
          onEmptyCellClick?.(emp, dayIndex, dept);
        }
      }}
    >
      {filtered.map((shift, idx) => {
        const pos = clampShift(shift, range);
        if (!pos) return null;
        const isSelected = shift.id === selectedShiftId;
        const ShiftComp = isFact ? DayFactShiftCard : DayShiftCard;
        return (
          <div
            key={shift.id || idx}
            className="absolute"
            style={{ left: pos.left + 2, top: CARD_INSET_Y, width: pos.width - 4, height: EMPLOYEE_ROW_H - CARD_INSET_Y * 2, zIndex: isSelected ? 10 : 5 }}
          >
            <ShiftTooltip shift={shift}>
              <ShiftComp
                shift={shift}
                isSelected={isSelected}
                onClick={() => onShiftClick(shift, emp, dept)}
                onContextMenu={onShiftContextMenu ? (e: React.MouseEvent) => onShiftContextMenu(e, shift, emp, dept) : undefined}
              />
            </ShiftTooltip>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// DayOpenShiftTimeline
// ══════════════════════════════════════════════════════════════════════

interface DayOpenShiftTimelineProps {
  dept: Department;
  dayIndex: number;
  readOnly: boolean;
  selectedShiftId?: string;
  focusedSubUnit?: string | null;
  isToday: boolean;
  range: TimeRange;
  onOpenShiftClick?: (openShift: OpenShift, department: Department) => void;
  onOpenShiftContextMenu?: (e: React.MouseEvent, openShift: OpenShift, department: Department) => void;
  onOpenShiftEmptyCellClick?: (dayIndex: number, department: Department) => void;
}

export function DayOpenShiftTimeline({
  dept, dayIndex, readOnly, selectedShiftId, focusedSubUnit, isToday, range,
  onOpenShiftClick, onOpenShiftContextMenu, onOpenShiftEmptyCellClick,
}: DayOpenShiftTimelineProps) {
  const w = gridWidthPx(range);
  const dayOpenShifts = dept.openShifts.filter((os) => os.dayIndex === dayIndex);
  const filtered = focusedSubUnit
    ? dayOpenShifts.filter((os) => os.shift.subUnits?.some((su) => su.unit === focusedSubUnit))
    : dayOpenShifts;

  return (
    <div
      className="relative"
      style={{ height: OPEN_SHIFT_ROW_H, width: w, backgroundColor: "var(--success-alpha-4)", borderBottom: "1px solid var(--border)" }}
      onClick={(e) => {
        if ((e.target as HTMLElement) === e.currentTarget && !readOnly) {
          onOpenShiftEmptyCellClick?.(dayIndex, dept);
        }
      }}
    >
      {filtered.map((os, idx) => {
        const pos = clampShift(os.shift, range);
        if (!pos) return null;
        const isSelected = os.shift.id === selectedShiftId;
        return (
          <div
            key={os.id || idx}
            className="absolute"
            style={{ left: pos.left + 2, top: CARD_INSET_Y_SM, width: pos.width - 4, height: OPEN_SHIFT_ROW_H - CARD_INSET_Y_SM * 2, zIndex: isSelected ? 10 : 5 }}
          >
            <DayOpenShiftCard
              shift={os.shift}
              openShiftId={os.id}
              deptId={dept.id}
              dayIndex={dayIndex}
              isSelected={isSelected}
              onClick={() => onOpenShiftClick?.(os, dept)}
              onContextMenu={onOpenShiftContextMenu ? (e: React.MouseEvent) => onOpenShiftContextMenu(e, os, dept) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
