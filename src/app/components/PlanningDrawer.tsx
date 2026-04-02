import React, { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Thermometer } from "lucide-react";
import {
  CloseMD,
  Clock,
  User01,
  AddPlus,
  TriangleWarning,
  CircleWarning,
  CircleCheck,
  ChevronDown,
  TrashFull,
  StopSign,
  CalendarDays,
  UserAdd,
  Leaf,
  ShieldCheck,
  ArrowLeftRight,
  PaperPlane,
  Star,
} from "@fzwp/ui-kit/icons";
import { Button } from "@fzwp/ui-kit/button";
import type { ShiftData } from "./ShiftCard";
import { hasBlockingShift } from "./ShiftCard";
import type { Employee, Department } from "./WeeklyTable";

// ── Types ──────────────────────────────────────────────────────────────

export type DrawerMode = "shift" | "employee" | "create" | "create-open";

/** Top-level type switch for create/edit */
type TypeMode = "shift" | "absence";

/** Absence sub-types */
type AbsenceType = "vacation" | "sick" | "other";

interface TimeBlock {
  id: string;
  start: string;
  end: string;
  unit: string;
}

interface BreakState {
  start: string;
  end: string;
  paid: boolean;
}

interface BreakEntry {
  id: string;
  durationMin: number;
  startTime: string;
}

let breakIdCounter = 0;

export interface PlanningDrawerProps {
  mode: DrawerMode;
  employee: Employee;
  department: Department;
  shift?: ShiftData;
  dayIndex?: number;
  onClose: () => void;
  /** All departments — needed for department selector in create mode */
  allDepartments?: Department[];
  /** All employees in current dataset */
  allEmployees?: Employee[];
  /** Whether the shift being edited is an open/exchange shift (no employee) */
  isOpenShift?: boolean;
  /** Called when a new shift is created via the drawer */
  onCreateShift?: (params: {
    deptId: string;
    employeeId: string;
    dayIndex: number;
    shift: ShiftData;
    shiftType: "standard" | "exchange" | "proposal";
  }) => void;
  /** Called when an existing shift is saved (edit mode) */
  onSaveShift?: (params: {
    deptId: string;
    employeeId: string;
    dayIndex: number;
    shift: ShiftData;
    originalShiftId: string;
    isOpenShift: boolean;
    isMarketplace: boolean;
    isProposal: boolean;
  }) => void;
  /** Called when an existing shift is deleted from the drawer */
  onDeleteShift?: (params: { deptId: string; employeeId: string; dayIndex: number; shiftId: string }) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────

function parseHour(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

function calcDuration(start: string, end: string): number {
  const s = parseHour(start);
  const e = parseHour(end);
  return e >= s ? e - s : 24 - s + e;
}

function fmtDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}г ${m}хв` : `${h}г`;
}

function fmtHour(decimal: number): string {
  const h = Math.floor(decimal) % 24;
  const m = Math.round((decimal - Math.floor(decimal)) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

let blockIdCounter = 0;

function shiftToBlocks(shift: ShiftData): TimeBlock[] {
  return shift.subUnits.map((su) => {
    const [start, end] = su.time.split("–").map((s) => s.trim());
    return { id: `block-${blockIdCounter++}`, start, end, unit: su.unit };
  });
}

function inferBreakFromShift(shift: ShiftData): BreakState {
  // Prefer explicit breakStart/breakDuration
  if (shift.breakStart && shift.breakDuration) {
    const brkStartH = parseHour(shift.breakStart);
    const brkEndH = brkStartH + shift.breakDuration / 60;
    return {
      start: shift.breakStart,
      end: fmtHour(brkEndH),
      paid: false,
    };
  }
  const breakMin = shift.breakText ? parseInt(shift.breakText) || 30 : 30;
  const [s, e] = shift.timeRange.split("–").map((t) => t.trim());
  const startH = parseHour(s);
  const endH = parseHour(e);
  const mid = startH + (endH > startH ? endH - startH : endH + 24 - startH) / 2;
  const brkStart = mid - breakMin / 120;
  const brkEnd = brkStart + breakMin / 60;
  return {
    start: fmtHour(brkStart),
    end: fmtHour(brkEnd),
    paid: false,
  };
}

// ── Sub-unit color system ─────────────────────────────────────────────

const SUB_UNIT_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--sidebar-accent)",
  "var(--primary)",
  "var(--destructive)",
];

function buildSubUnitColorMap(employee: Employee): Record<string, string> {
  const names = new Set<string>();
  Object.values(employee.shifts)
    .flat()
    .forEach((sh) => sh.subUnits.forEach((su) => names.add(su.unit)));
  const sorted = Array.from(names).sort();
  const map: Record<string, string> = {};
  sorted.forEach((name, i) => {
    map[name] = SUB_UNIT_PALETTE[i % SUB_UNIT_PALETTE.length];
  });
  return map;
}

function buildColorMapFromUnits(units: string[]): Record<string, string> {
  const unique = Array.from(new Set(units)).sort();
  const map: Record<string, string> = {};
  unique.forEach((name, i) => {
    map[name] = SUB_UNIT_PALETTE[i % SUB_UNIT_PALETTE.length];
  });
  return map;
}

// ── Small shared components ───────────────────────────────────────────

function SectionDivider() {
  return <div className="h-px bg-[var(--border)]" />;
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "danger" | "success" | "warning";
}) {
  const colorMap: Record<string, string> = {
    danger: "var(--destructive)",
    success: "var(--chart-2)",
    warning: "var(--chart-3)",
  };
  return (
    <div className="flex items-center justify-between py-1.5">
      <span
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-medium)",
          color: "var(--muted-foreground)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "var(--text-base)",
          fontWeight: "var(--font-weight-semibold)",
          color: highlight ? colorMap[highlight] : "var(--foreground)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function MiniStat({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center py-1.5 px-2 rounded-[var(--radius-sm)]"
      style={{ backgroundColor: "var(--card)" }}
    >
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>
        {label}
      </span>
      <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: danger ? "var(--destructive)" : "var(--foreground)" }}>
        {value}
      </span>
    </div>
  );
}

function ResourceChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>
        {label}
      </span>
      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color }}>
        {value}
      </span>
    </div>
  );
}

function ValidationRow({
  type,
  text,
}: {
  type: "error" | "warning" | "info";
  text: string;
}) {
  const config = {
    error: {
      bg: "var(--destructive-alpha-6)",
      color: "var(--destructive)",
      Icon: TriangleWarning,
    },
    warning: {
      bg: "var(--warning-alpha-8)",
      color: "var(--chart-3)",
      Icon: TriangleWarning,
    },
    info: {
      bg: "var(--muted)",
      color: "var(--muted-foreground)",
      Icon: CircleCheck,
    },
  }[type];

  return (
    <div
      className="flex items-start gap-2 p-2.5 rounded-[var(--radius)]"
      style={{ backgroundColor: config.bg }}
    >
      <config.Icon
        size={15}
        className="mt-0.5 flex-shrink-0"
        style={{ color: config.color }}
      />
      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-normal)", color: config.color }}>
        {text}
      </span>
    </div>
  );
}

// ── Sub-unit pill / chip ──────────────────────────────────────────────

function SubUnitPill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="relative inline-flex items-center px-1.5 py-px rounded-full flex-shrink-0 whitespace-nowrap overflow-hidden"
      style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color }}
    >
      <span className="absolute inset-0 rounded-full pointer-events-none" style={{ backgroundColor: color, opacity: 0.12 }} />
      <span className="relative">{name}</span>
    </span>
  );
}

function SubUnitChips({
  units,
  colorMap,
  max = 3,
}: {
  units: string[];
  colorMap: Record<string, string>;
  max?: number;
}) {
  const visible = units.slice(0, max);
  const extra = units.length - max;
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {visible.map((u) => (
        <SubUnitPill key={u} name={u} color={colorMap[u] || "var(--secondary)"} />
      ))}
      {extra > 0 && (
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>
          +{extra}
        </span>
      )}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════
// TIMELINE
// ══════════════════════════════════════════════════════════════════════

const TIMELINE_START = 6;
const TIMELINE_END = 24;
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START;

interface TimelineSegment { start: number; end: number; label: string; color: string; }
interface TimelineBreak { start: number; end: number; label: string; }

function toPercent(h: number) {
  return Math.max(0, Math.min(100, ((h - TIMELINE_START) / TIMELINE_SPAN) * 100));
}

function TimelineBar({ segments, breaks }: { segments: TimelineSegment[]; breaks: TimelineBreak[] }) {
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);
  const [hoveredBrk, setHoveredBrk] = useState<number | null>(null);
  const ticks: number[] = [];
  for (let h = TIMELINE_START; h <= TIMELINE_END; h += 2) ticks.push(h);

  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-6 rounded-[var(--radius-sm)] overflow-visible" style={{ backgroundColor: "var(--border)" }}>
        {segments.map((seg, i) => {
          const left = toPercent(seg.start);
          const width = toPercent(seg.end) - left;
          return (
            <div key={`seg-${i}`} className="absolute top-0 h-full rounded-[var(--radius-sm)]"
              style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%`, backgroundColor: seg.color, opacity: 0.65, zIndex: 1 }}
              onMouseEnter={() => setHoveredSeg(i)} onMouseLeave={() => setHoveredSeg(null)}
            >
              {hoveredSeg === i && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded-[var(--radius-sm)] whitespace-nowrap pointer-events-none"
                  style={{ backgroundColor: "var(--foreground)", color: "var(--card)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", zIndex: 20 }}
                >{seg.label}</div>
              )}
            </div>
          );
        })}
        {breaks.map((brk, i) => {
          const left = toPercent(brk.start);
          const width = toPercent(brk.end) - left;
          return (
            <div key={`brk-${i}`} className="absolute top-0 h-full"
              style={{
                left: `${left}%`, width: `${Math.max(width, 0.5)}%`, zIndex: 2,
                backgroundColor: "var(--card)",
                backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 2px, var(--muted-foreground) 2px, var(--muted-foreground) 2.5px)",
                backgroundSize: "6px 6px",
                opacity: 0.35,
                borderLeft: "1.5px solid var(--muted-foreground)",
                borderRight: "1.5px solid var(--muted-foreground)",
              }}
              onMouseEnter={() => setHoveredBrk(i)} onMouseLeave={() => setHoveredBrk(null)}
            >
              {hoveredBrk === i && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded-[var(--radius-sm)] whitespace-nowrap pointer-events-none"
                  style={{ backgroundColor: "var(--foreground)", color: "var(--card)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", zIndex: 20 }}
                >{brk.label}</div>
              )}
            </div>
          );
        })}
      </div>
      <div className="relative h-3">
        {ticks.map((h) => (
          <span key={h} className="absolute -translate-x-1/2"
            style={{ left: `${toPercent(h)}%`, fontSize: "var(--text-3xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)", lineHeight: 1 }}
          >{String(h % 24).padStart(2, "0")}</span>
        ))}
      </div>
      {breaks.length > 0 && (
        <span style={{ fontSize: "var(--text-3xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>
          Перерва {fmtHour(breaks[0].start)}–{fmtHour(breaks[0].end)}
        </span>
      )}
    </div>
  );
}

function HourlyTimeline({ shifts, colorMap }: { shifts: ShiftData[]; colorMap: Record<string, string> }) {
  const segments: TimelineSegment[] = [];
  const breaks: TimelineBreak[] = [];
  shifts.forEach((sh) => {
    sh.subUnits.forEach((su) => {
      const [s, e] = su.time.split("–").map((t) => t.trim());
      const startH = parseHour(s);
      const endH = parseHour(e);
      segments.push({ start: startH, end: endH > startH ? endH : endH + 24, label: `${su.time} ${su.unit}`, color: colorMap[su.unit] || "var(--secondary)" });
    });
    if (sh.breakStart && sh.breakDuration) {
      const brkStart = parseHour(sh.breakStart);
      const brkEnd = brkStart + sh.breakDuration / 60;
      breaks.push({ start: brkStart, end: brkEnd, label: `Перерва ${sh.breakStart}–${fmtHour(brkEnd)}` });
    } else if (sh.breakText) {
      const breakMin = parseInt(sh.breakText) || 30;
      const [s, e] = sh.timeRange.split("–").map((t) => t.trim());
      const startH = parseHour(s);
      const endH = parseHour(e);
      const mid = startH + (endH > startH ? endH - startH : endH + 24 - startH) / 2;
      const brkStart = mid - breakMin / 120;
      const brkEnd = brkStart + breakMin / 60;
      breaks.push({ start: brkStart, end: brkEnd, label: `Перерва ${fmtHour(brkStart)}–${fmtHour(brkEnd)}` });
    }
  });
  return <div className="pt-2 pb-1"><TimelineBar segments={segments} breaks={breaks} /></div>;
}

function ShiftTimeline({ timeBlocks, breakState, colorMap, breakEntries = [] }: { timeBlocks: TimeBlock[]; breakState: BreakState; colorMap: Record<string, string>; breakEntries?: BreakEntry[] }) {
  const segments: TimelineSegment[] = timeBlocks.filter((b) => b.start && b.end).map((b) => {
    const startH = parseHour(b.start);
    const endH = parseHour(b.end);
    return { start: startH, end: endH > startH ? endH : endH + 24, label: `${b.start}–${b.end} ${b.unit || "Не призначено"}`, color: colorMap[b.unit] || "var(--border)" };
  });
  const breaks: TimelineBreak[] = breakEntries.map((brk) => {
    const brkStartH = parseHour(brk.startTime);
    const brkEndH = brkStartH + brk.durationMin / 60;
    return { start: brkStartH, end: brkEndH, label: `Перерва ${brk.startTime}–${fmtHour(brkEndH)} (${brk.durationMin} хв)` };
  });
  if (breaks.length === 0 && breakState.start && breakState.end) {
    const brkStartH = parseHour(breakState.start);
    const brkEndH = parseHour(breakState.end);
    breaks.push({ start: brkStartH, end: brkEndH > brkStartH ? brkEndH : brkEndH + 24, label: `Перерва ${breakState.start}–${breakState.end}` });
  }
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>Шкала часу зміни</label>
      <TimelineBar segments={segments} breaks={breaks} />
      {segments.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {timeBlocks.filter((b) => b.unit).map((b) => (
            <span key={b.id} className="inline-flex items-center gap-1" style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>
              <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colorMap[b.unit] || "var(--secondary)" }} />
              {b.unit}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Available sub-unit options from department ─────────────────────────

function getAvailableUnits(department: Department): string[] {
  const units = new Set<string>();
  department.employees.forEach((emp) =>
    Object.values(emp.shifts).flat().forEach((sh) => sh.subUnits.forEach((su) => units.add(su.unit)))
  );
  department.openShifts.forEach((os) => os.shift.subUnits.forEach((su) => units.add(su.unit)));
  if (department.resourceControl) department.resourceControl.subUnits.forEach((su) => units.add(su.name));
  return Array.from(units).sort();
}

// ── Quick time-range recommendations based on "historical" patterns ──

interface TimeRecommendation {
  start: string;
  end: string;
  label: string;
  /** frequency score (higher = more common historically) */
  score: number;
}

/**
 * Generates smart time-range recommendations for a given sub-unit.
 * Scans all shifts across the department to find the most common
 * time ranges used for the specified sub-unit, simulating historical data.
 */
function getTimeRecommendations(
  department: Department,
  unitName: string,
  allDepartments?: Department[],
): TimeRecommendation[] {
  if (!unitName) return [];

  // Collect all time ranges used for this unit across all employees
  const rangeCounts: Record<string, number> = {};
  const scanDept = (dept: Department) => {
    dept.employees.forEach((emp) => {
      Object.values(emp.shifts).flat().forEach((sh) => {
        sh.subUnits.forEach((su) => {
          if (su.unit === unitName) {
            const key = su.time;
            rangeCounts[key] = (rangeCounts[key] || 0) + 1;
          }
        });
      });
    });
    dept.openShifts.forEach((os) => {
      os.shift.subUnits.forEach((su) => {
        if (su.unit === unitName) {
          rangeCounts[su.time] = (rangeCounts[su.time] || 0) + 1;
        }
      });
    });
  };

  scanDept(department);
  // Also scan other departments for cross-department patterns
  if (allDepartments) {
    allDepartments.forEach((d) => {
      if (d.id !== department.id) scanDept(d);
    });
  }

  // Convert to sorted recommendations
  const recs: TimeRecommendation[] = Object.entries(rangeCounts)
    .map(([range, count]) => {
      const [start, end] = range.split("–").map((s) => s.trim());
      if (!start || !end) return null;
      const dur = calcDuration(start, end);
      return {
        start,
        end,
        label: `${start}–${end}`,
        score: count + (dur >= 7 ? 2 : dur >= 4 ? 1 : 0), // boost longer shifts
      };
    })
    .filter(Boolean) as TimeRecommendation[];

  // Deduplicate by label, keep highest score
  const unique = new Map<string, TimeRecommendation>();
  recs.forEach((r) => {
    const existing = unique.get(r.label);
    if (!existing || r.score > existing.score) unique.set(r.label, r);
  });

  // Sort by score descending, take top 5
  return Array.from(unique.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ══════════════════════════════════════════════════════════════════════
// VALIDATION
// ══════════════════════════════════════════════════════════════════════

// ── 30-minute increment time options ──────────────────────────────────
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

// ── Smart time parser ─────────────────────────────────────────────────
/** Parse user's raw time input and snap to nearest 30-minute increment */
function smartParseTime(raw: string): string | null {
  const cleaned = raw.trim().replace(/[^0-9:.,]/g, "");
  if (!cleaned) return null;
  let hours = 0;
  let minutes = 0;
  const colonMatch = cleaned.match(/^(\d{1,2})[:.,](\d{1,2})$/);
  if (colonMatch) {
    hours = parseInt(colonMatch[1], 10);
    minutes = parseInt(colonMatch[2], 10);
  } else {
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) return null;
    if (cleaned.length <= 2) { hours = num; minutes = 0; }
    else if (cleaned.length === 3) { hours = Math.floor(num / 100); minutes = num % 100; }
    else if (cleaned.length === 4) { hours = Math.floor(num / 100); minutes = num % 100; }
    else return null;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  const snapped = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
  if (minutes >= 45) hours = (hours + 1) % 24;
  return `${String(hours).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
}

/** Combobox-style time input: editable text field + scrollable dropdown list */
function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { setDraft(value); }, [value]);

  // Scroll to the selected/matching item when dropdown opens
  React.useEffect(() => {
    if (open && listRef.current) {
      const target = draft || value;
      const idx = TIME_OPTIONS.indexOf(target);
      if (idx >= 0) {
        const item = listRef.current.children[idx] as HTMLElement;
        if (item) item.scrollIntoView({ block: "center" });
      }
    }
  }, [open]);

  const commit = React.useCallback((val?: string) => {
    const raw = val ?? draft;
    const parsed = smartParseTime(raw);
    if (parsed) { onChange(parsed); setDraft(parsed); } else { setDraft(value); }
    setOpen(false);
  }, [draft, value, onChange]);

  const handleSelect = (t: string) => {
    setDraft(t);
    onChange(t);
    setOpen(false);
    inputRef.current?.blur();
  };

  // Filter options based on typed draft
  const filtered = React.useMemo(() => {
    if (!draft || draft === value) return TIME_OPTIONS;
    const cleaned = draft.replace(/[^0-9:]/g, "");
    if (!cleaned) return TIME_OPTIONS;
    return TIME_OPTIONS.filter((t) => t.startsWith(cleaned) || t.includes(cleaned));
  }, [draft, value]);

  // Close dropdown on outside click (check both container and portal dropdown)
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        listRef.current && !listRef.current.contains(target)
      ) {
        commit();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, commit]);

  // Compute dropdown position based on input element
  const [dropdownPos, setDropdownPos] = React.useState<{ top: number; left: number; width: number } | null>(null);
  React.useEffect(() => {
    if (open && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative" style={{ width: 82 }}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => { setDraft(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setTimeout(() => inputRef.current?.select(), 0); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { commit(); inputRef.current?.blur(); }
            if (e.key === "Escape") { setDraft(value); setOpen(false); inputRef.current?.blur(); }
            if (e.key === "ArrowDown" && !open) setOpen(true);
          }}
          className="w-full appearance-none px-2 py-1 pr-6 rounded-[var(--radius-sm)] bg-[var(--input-background)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
          style={{
            fontSize: "var(--text-sm)", color: "var(--foreground)",
            borderStyle: "solid", borderWidth: 1,
            borderColor: open ? "var(--ring)" : "var(--border)",
            textAlign: "center",
          }}
          placeholder="ЧЧ:ХХ"
          maxLength={5}
        />
        <ChevronDown
          size={12}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--muted-foreground)", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : undefined }}
        />
      </div>
      {open && dropdownPos && createPortal(
        <div
          ref={listRef}
          className="fixed rounded-[var(--radius)] border border-[var(--border)] overflow-auto"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            backgroundColor: "var(--popover)",
            boxShadow: "var(--elevation-md)",
            maxHeight: 200,
            zIndex: 9999,
          }}
        >
          {filtered.length > 0 ? filtered.map((t) => (
            <div
              key={t}
              className="px-2.5 py-1.5 cursor-pointer transition-colors hover:bg-[var(--muted)]"
              style={{
                fontSize: "var(--text-sm)",
                color: t === value ? "var(--primary)" : "var(--foreground)",
                fontWeight: (t === value ? "var(--font-weight-semibold)" : "var(--font-weight-normal)") as any,
                backgroundColor: t === value ? "var(--primary-alpha-6)" : undefined,
              }}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(t); }}
            >
              {t}
            </div>
          )) : (
            <div className="px-2.5 py-2 text-center" style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
              Не знайдено
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

function rangesOverlap(s1: number, e1: number, s2: number, e2: number): boolean {
  const ne1 = e1 > s1 ? e1 : e1 + 24;
  const ne2 = e2 > s2 ? e2 : e2 + 24;
  return s1 < ne2 && s2 < ne1;
}

function detectOverlaps(blocks: TimeBlock[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i], b = blocks[j];
      if (!a.start || !a.end || !b.start || !b.end) continue;
      if (rangesOverlap(parseHour(a.start), parseHour(a.end), parseHour(b.start), parseHour(b.end))) {
        ids.add(a.id);
        ids.add(b.id);
      }
    }
  }
  return ids;
}

interface BlockValidation { severity: "error" | "warning" | null; messages: string[]; }

// ══════════════════════════════════════════════════════════════════════
// TYPE SWITCH (Shift / Absence)
// ══════════════════════════════════════════════════════════════════════

function TypeSwitch({ value, onChange }: { value: TypeMode; onChange: (v: TypeMode) => void }) {
  return (
    <div className="flex p-0.5 rounded-[var(--radius)] gap-0.5" style={{ backgroundColor: "var(--muted)" }}>
      {(["shift", "absence"] as const).map((t) => {
        const active = value === t;
        return (
          <Button
            key={t}
            variant="light"
            onPress={() => onChange(t)}
            className="flex-1 py-1.5 px-3 rounded-[var(--radius-sm)] transition-all"
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: active ? "var(--font-weight-semibold)" : "var(--font-weight-medium)",
              color: active ? "var(--foreground)" : "var(--muted-foreground)",
              backgroundColor: active ? "var(--card)" : "transparent",
              boxShadow: active ? "var(--elevation-sm)" : "none",
            }}
          >
            {t === "shift" ? "Зміна" : "Відсутність"}
          </Button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ABSENCE CONFIG
// ══════════════════════════════════════════════════════════════════════

const ABSENCE_TYPE_CONFIG: Record<AbsenceType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  vacation: { label: "Відпустка", icon: <Leaf size={14} />, color: "var(--chart-1)", bg: "var(--primary-alpha-8)" },
  sick: { label: "Лікарняний", icon: <Thermometer size={14} />, color: "var(--chart-4)", bg: "var(--destructive-alpha-8)" },
  other: { label: "Інше", icon: <ShieldCheck size={14} />, color: "var(--chart-5)", bg: "var(--purple-alpha-5)" },
};

// ══════════════════════════════════════════════════════════════════════
// SHIFT ACTION STATUS — unified state machine (mutually exclusive)
// ════════════��═════════════════════════════════════════════════════════

type ShiftActionStatus = "standard" | "marketplace" | "proposal";

function ActionCard({
  selected,
  icon,
  title,
  description,
  onClick,
  color,
  bgColor,
  disabled,
  disabledHint,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
  bgColor: string;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <Button
      variant="light"
      fullWidth
      isDisabled={disabled}
      onPress={disabled ? undefined : onClick}
      className="flex items-start gap-2.5 px-3 py-2.5 rounded-[var(--radius)] transition-all text-left justify-start"
      style={{
        backgroundColor: disabled ? "var(--muted)" : selected ? bgColor : "transparent",
        borderStyle: "solid",
        borderWidth: selected ? 1.5 : 1,
        borderColor: disabled ? "var(--border)" : selected ? color : "var(--border)",
        opacity: disabled ? 0.6 : 1,
        height: "auto",
        minWidth: 0,
      }}
    >
      <span className="mt-0.5 flex-shrink-0" style={{ color: disabled ? "var(--muted-foreground)" : color }}>{icon}</span>
      <div className="flex flex-col min-w-0 gap-0.5">
        <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: selected ? color : "var(--foreground)" }}>
          {title}
        </span>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
          {disabled && disabledHint ? disabledHint : description}
        </span>
      </div>
      {selected && !disabled && (
        <CircleCheck size={16} className="mt-0.5 ml-auto flex-shrink-0" style={{ color }} />
      )}
    </Button>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

export function PlanningDrawer({
  mode,
  employee,
  department,
  shift,
  dayIndex,
  onClose,
  allDepartments,
  allEmployees,
  isOpenShift = false,
  onCreateShift,
  onSaveShift,
  onDeleteShift,
}: PlanningDrawerProps) {
  const isCreateAssigned = mode === "create";
  const isCreateOpen = mode === "create-open";
  const isAnyCreate = isCreateAssigned || isCreateOpen;
  const isShiftMode = mode === "shift";
  const isShiftOrCreate = isShiftMode || isAnyCreate;
  const editingOpenShift = isShiftMode && (isOpenShift || shift?.status === "open");
  const editingExchangeShift = editingOpenShift && shift?.exchangeStatus === "on-exchange";

  // ── Type mode (Shift / Absence) ─────────────────────────────────────
  // Infer initial type from existing shift status
  const inferredType: TypeMode = shift && (shift.status === "leave" || shift.status === "sick" || shift.status === "reserved" || shift.status === "temp-assignment")
    ? "absence"
    : "shift";
  const [typeMode, setTypeMode] = useState<TypeMode>(inferredType);

  // ── Create-mode selectors ───────────────────────────────────────────
  const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
  const [selectedDeptId, setSelectedDeptId] = useState(department.id);

  // Employee: preselect from employee cell; only empty in create-open mode
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    isCreateOpen ? "" : employee.id
  );
  const [selectedDay, setSelectedDay] = useState(dayIndex ?? 0);
  // Unified shift action state machine (mutually exclusive)
  const [shiftActionStatus, setShiftActionStatus] = useState<ShiftActionStatus>(() => {
    if (isShiftMode && shift?.proposalStatus === "pending") return "proposal";
    if (isShiftMode && shift?.exchangeStatus === "on-exchange") return "marketplace";
    return "standard";
  });
  // Derived booleans for backward compatibility
  const isProposal = shiftActionStatus === "proposal";
  const isMarketplace = shiftActionStatus === "marketplace";

  // ── Absence-mode state ──────────────────────────────────────────────
  const [absenceType, setAbsenceType] = useState<AbsenceType>("vacation");
  const [absenceStartDay, setAbsenceStartDay] = useState(dayIndex ?? 0);
  const [absenceEndDay, setAbsenceEndDay] = useState(dayIndex ?? 0);

  // ── Dropdown states (replacing native <select> elements) ───────────
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const deptDropdownRef = React.useRef<HTMLDivElement>(null);
  const [openUnitDropdownId, setOpenUnitDropdownId] = useState<string | null>(null);
  const [openBreakDurationId, setOpenBreakDurationId] = useState<string | null>(null);
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const empDropdownRef = React.useRef<HTMLDivElement>(null);
  const [absTypeDropdownOpen, setAbsTypeDropdownOpen] = useState(false);
  const absTypeDropdownRef = React.useRef<HTMLDivElement>(null);
  const [absStartDropdownOpen, setAbsStartDropdownOpen] = useState(false);
  const absStartDropdownRef = React.useRef<HTMLDivElement>(null);
  const [absEndDropdownOpen, setAbsEndDropdownOpen] = useState(false);
  const absEndDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  React.useEffect(() => {
    if (!deptDropdownOpen && !openUnitDropdownId && !openBreakDurationId && !empDropdownOpen && !absTypeDropdownOpen && !absStartDropdownOpen && !absEndDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (deptDropdownOpen && deptDropdownRef.current && !deptDropdownRef.current.contains(target)) {
        setDeptDropdownOpen(false);
      }
      if (empDropdownOpen && empDropdownRef.current && !empDropdownRef.current.contains(target)) {
        setEmpDropdownOpen(false);
      }
      if (absTypeDropdownOpen && absTypeDropdownRef.current && !absTypeDropdownRef.current.contains(target)) {
        setAbsTypeDropdownOpen(false);
      }
      if (absStartDropdownOpen && absStartDropdownRef.current && !absStartDropdownRef.current.contains(target)) {
        setAbsStartDropdownOpen(false);
      }
      if (absEndDropdownOpen && absEndDropdownRef.current && !absEndDropdownRef.current.contains(target)) {
        setAbsEndDropdownOpen(false);
      }
      // Unit and break duration dropdowns close if click is outside their containers
      // (handled via data attributes on the containers)
      if (openUnitDropdownId) {
        const unitContainer = document.querySelector(`[data-unit-dropdown="${openUnitDropdownId}"]`);
        if (unitContainer && !unitContainer.contains(target)) setOpenUnitDropdownId(null);
      }
      if (openBreakDurationId) {
        const breakContainer = document.querySelector(`[data-break-dropdown="${openBreakDurationId}"]`);
        if (breakContainer && !breakContainer.contains(target)) setOpenBreakDurationId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [deptDropdownOpen, openUnitDropdownId, openBreakDurationId, empDropdownOpen, absTypeDropdownOpen, absStartDropdownOpen, absEndDropdownOpen]);

  // Resolve current selections
  const activeDept = (allDepartments ?? [department]).find((d) => d.id === selectedDeptId) ?? department;
  const allEmpList = allEmployees ?? activeDept.employees;
  const activeEmp = allEmpList.find((e) => e.id === selectedEmpId) ?? null;

  // Is employee selected? (for create/shift modes)
  const hasEmployee = selectedEmpId !== "";

  // Derive shift type from unified action status
  const derivedShiftType: "standard" | "exchange" | "proposal" =
    shiftActionStatus === "marketplace" ? "exchange" : shiftActionStatus === "proposal" ? "proposal" : "standard";

  // Determine if current operation acts as open shift
  const isEffectivelyOpen = isAnyCreate
    ? !hasEmployee
    : editingOpenShift;

  // Display employee for stats
  const displayEmp = activeEmp ?? employee;
  const remaining = Math.max(displayEmp.monthlyNorm - displayEmp.workedHours, 0);
  const overwork = displayEmp.workedHours > displayEmp.monthlyNorm;

  // ── Employee workload stats (employee mode) ───────────────────────────
  const employeeWorkloadStats = useMemo(() => {
    if (mode !== "employee") return null;

    const emp = displayEmp;
    const norm = emp.monthlyNorm;
    const hardLimit = norm * (192 / 176);

    // Today is Friday Mar 6, 2026 → todayDayIndex = 4 (Mon=0)
    const todayDayIndex = 4;

    // Week dates: Mon Mar 2 – Sun Mar 8, all in March → single month
    const weekStartDate = new Date(2026, 2, 2); // Mar 2
    const weekEndDate = new Date(2026, 2, 8);   // Mar 8

    const startMonth = weekStartDate.getMonth();
    const endMonth = weekEndDate.getMonth();
    const isCrossMonth = startMonth !== endMonth;

    // Compute per-day hours
    type DayStat = { hours: number; isAbsence: boolean; isPast: boolean };
    const dayStats: DayStat[] = [];
    for (let di = 0; di < 7; di++) {
      const shifts = emp.shifts[String(di)] || [];
      let hours = 0;
      let isAbsence = false;
      for (const sh of shifts) {
        const parts = sh.timeRange.split("–");
        if (parts.length === 2) hours += calcDuration(parts[0].trim(), parts[1].trim());
        if (sh.status === "leave" || sh.status === "sick" || sh.status === "reserved" || sh.status === "temp-assignment") {
          isAbsence = true;
        }
      }
      dayStats.push({ hours, isAbsence, isPast: di < todayDayIndex });
    }

    const scheduledHours = dayStats.reduce((s, d) => s + d.hours, 0);
    const workedHoursPast = dayStats.filter(d => d.isPast && !d.isAbsence).reduce((s, d) => s + d.hours, 0);
    const plannedHoursFuture = dayStats.filter(d => !d.isPast && !d.isAbsence).reduce((s, d) => s + d.hours, 0);
    const absenceHours = dayStats.filter(d => d.isAbsence).reduce((s, d) => s + d.hours, 0);

    // Planned = employee.workedHours (the monthly total shown in the row)
    const planned = emp.workedHours;
    const remainingToNorm = Math.max(norm - planned, 0);

    // Exchange hours this employee personally took — no data available yet
    const exchangeHours = 0;
    const hasExchangeData = false;

    const totalHours = planned + exchangeHours;
    const overScheduled = planned > norm;
    const overHard = planned > hardLimit;
    const overtimeHours = overScheduled ? planned - norm : 0;
    const allowanceLeft = !overHard ? Math.max(hardLimit - planned, 0) : 0;

    // Progress bar state — matches the employee row (Заплановано / Норма)
    let barColor: string;
    if (planned > hardLimit) {
      barColor = "var(--destructive)";
    } else if (planned > norm) {
      barColor = "var(--chart-3)";
    } else {
      barColor = "var(--chart-2)";
    }
    const barPct = Math.min((planned / norm) * 100, 100);

    // Cross-month split
    const MONTH_NAMES = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
    let monthBlocks: { label: string; norm: number; hours: number }[] | null = null;
    if (isCrossMonth) {
      const crossDayIndex = (() => {
        for (let di = 0; di < 7; di++) {
          const d = new Date(weekStartDate);
          d.setDate(d.getDate() + di);
          if (d.getMonth() !== startMonth) return di;
        }
        return 7;
      })();
      const hoursMonth1 = dayStats.slice(0, crossDayIndex).reduce((s, d) => s + d.hours, 0);
      const hoursMonth2 = dayStats.slice(crossDayIndex).reduce((s, d) => s + d.hours, 0);
      monthBlocks = [
        { label: MONTH_NAMES[startMonth], norm, hours: hoursMonth1 },
        { label: MONTH_NAMES[endMonth], norm, hours: hoursMonth2 },
      ];
    }

    return {
      scheduledHours, workedHoursPast, plannedHoursFuture, absenceHours,
      planned, remainingToNorm,
      exchangeHours, hasExchangeData, totalHours,
      overScheduled, overHard, overtimeHours, allowanceLeft,
      barColor, barPct, hardLimit,
      isCrossMonth, monthBlocks,
    };
  }, [mode, displayEmp]);

  // ─── Shift-mode state ────────────────────────────────────────────────
  const defaultUnit = useMemo(() => getAvailableUnits(activeDept)[0] || "", [activeDept]);
  const initialBlocks: TimeBlock[] = shift
    ? shiftToBlocks(shift)
    : isAnyCreate
      ? [{ id: `block-${blockIdCounter++}`, start: "08:00", end: "12:00", unit: defaultUnit }]
      : [];
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(initialBlocks);
  // ── Multi-break state ─────────────────────────────────────────────
  const [breakEntries, setBreakEntries] = useState<BreakEntry[]>(() => {
    if (shift && (shift.breakStart || shift.breakText)) {
      const brk = inferBreakFromShift(shift);
      const dur = Math.round(calcDuration(brk.start, brk.end) * 60);
      if (dur > 0) return [{ id: `brk-${breakIdCounter++}`, durationMin: dur, startTime: brk.start }];
    }
    return []; // Default: "Без перерв"
  });

  const addBreak = useCallback((durationMin: number) => {
    // Calculate midpoint of the entire shift span across all time blocks
    let shiftStartH = Infinity;
    let shiftEndH = -Infinity;
    for (const blk of timeBlocks) {
      if (blk.start && blk.end) {
        const s = parseHour(blk.start);
        let e = parseHour(blk.end);
        if (e <= s) e += 24;
        if (s < shiftStartH) shiftStartH = s;
        if (e > shiftEndH) shiftEndH = e;
      }
    }
    const breakDurH = durationMin / 60;
    let defaultStart: string;
    if (shiftStartH < Infinity && shiftEndH > -Infinity) {
      const mid = (shiftStartH + shiftEndH) / 2;
      const rawStart = mid - breakDurH / 2;
      // Snap to nearest 30-minute increment
      const snappedH = Math.floor(rawStart);
      const snappedM = Math.round((rawStart - snappedH) * 60);
      const m30 = snappedM < 15 ? 0 : snappedM < 45 ? 30 : 0;
      const h30 = snappedM >= 45 ? (snappedH + 1) % 24 : snappedH;
      defaultStart = `${String(h30).padStart(2, "0")}:${String(m30).padStart(2, "0")}`;
    } else {
      defaultStart = "13:00";
    }
    setBreakEntries((prev) => [...prev, { id: `brk-${breakIdCounter++}`, durationMin, startTime: defaultStart }]);
  }, [timeBlocks]);

  const removeBreak = useCallback((id: string) => {
    setBreakEntries((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateBreakDuration = useCallback((id: string, dur: number) => {
    setBreakEntries((prev) => prev.map((b) => b.id === id ? { ...b, durationMin: dur } : b));
  }, []);

  const updateBreakStart = useCallback((id: string, start: string) => {
    setBreakEntries((prev) => prev.map((b) => b.id === id ? { ...b, startTime: start } : b));
  }, []);

  // Legacy compat: derive single breakStartTime/breakEndTime from first entry
  const breakStartTime = breakEntries.length > 0 ? breakEntries[0].startTime : "";
  const breakEndTime = breakEntries.length > 0 ? fmtHour(parseHour(breakEntries[0].startTime) + breakEntries[0].durationMin / 60) : "";

  // Total break minutes across all entries
  const breakMinutes = breakEntries.reduce((sum, b) => sum + b.durationMin, 0);

  // Derive breakState for ShiftTimeline compatibility (uses first break)
  const breakState = useMemo<BreakState>(() => {
    if (breakEntries.length === 0 || timeBlocks.length === 0) return { start: "", end: "", paid: false };
    const first = breakEntries[0];
    return { start: first.startTime, end: fmtHour(parseHour(first.startTime) + first.durationMin / 60), paid: false };
  }, [breakEntries, timeBlocks]);

  const breakDurationHours = breakMinutes / 60;

  // ── Total shift duration ────────────────────────────────────────────
  const totalShiftHours = useMemo(() => {
    return timeBlocks.reduce((sum, b) => sum + calcDuration(b.start, b.end), 0);
  }, [timeBlocks]);
  const netHours = Math.max(totalShiftHours - breakDurationHours, 0);

  // ── Available units ─────────────────────────────────────────────────
  const availableUnits = useMemo(
    () => getAvailableUnits(isAnyCreate ? activeDept : department),
    [isAnyCreate, activeDept, department]
  );

  // ── Time range recommendations per unit ──────────────────────────────
  const unitRecommendations = useMemo(() => {
    const targetDept = isAnyCreate ? activeDept : department;
    const map: Record<string, TimeRecommendation[]> = {};
    availableUnits.forEach((u) => {
      map[u] = getTimeRecommendations(targetDept, u, allDepartments);
    });
    return map;
  }, [isAnyCreate, activeDept, department, availableUnits, allDepartments]);

  // ── Color map for shift mode ────────────────────────────────────────
  const shiftColorMap = useMemo(() => {
    const units = timeBlocks.map((b) => b.unit).filter(Boolean);
    return buildColorMapFromUnits(units);
  }, [timeBlocks]);

  // ── Resource info per sub-unit for this day ─────────────────────────
  const subUnitResources = useMemo(() => {
    if (!department.resourceControl || dayIndex == null) return {};
    const map: Record<string, { forecast: number; scheduled: number; remaining: number }> = {};
    department.resourceControl.subUnits.forEach((su) => {
      const d = su.daily[dayIndex];
      if (d) map[su.name] = { forecast: d.forecast, scheduled: d.scheduled, remaining: d.forecast - d.scheduled };
    });
    return map;
  }, [department, dayIndex]);

  // ── Validation (shift mode only) ────────────────────────────���────��─
  const overlappingBlockIds = useMemo(
    () => (isShiftOrCreate && typeMode === "shift" ? detectOverlaps(timeBlocks) : new Set<string>()),
    [isShiftOrCreate, typeMode, timeBlocks]
  );

  const blockValidationMap = useMemo(() => {
    const map: Record<string, BlockValidation> = {};
    if (!isShiftOrCreate || typeMode !== "shift") return map;
    timeBlocks.forEach((b) => {
      const msgs: string[] = [];
      let severity: "error" | "warning" | null = null;
      if (overlappingBlockIds.has(b.id)) { msgs.push("Перекриття часового діапазону з іншим блоком."); severity = "error"; }
      if (!b.unit) { msgs.push("Дільницю не призначено."); severity = "error"; }
      if (b.unit && subUnitResources[b.unit]) {
        const res = subUnitResources[b.unit];
        const blockHours = calcDuration(b.start, b.end);
        if (res.scheduled + blockHours > res.forecast && res.forecast > 0) {
          msgs.push(`${b.unit} перепризначено: ${res.scheduled + blockHours}г заплановано проти ${res.forecast}г прогнозу.`);
          if (!severity) severity = "warning";
        }
      }
      if (msgs.length > 0) map[b.id] = { severity, messages: msgs };
    });
    return map;
  }, [isShiftOrCreate, typeMode, timeBlocks, overlappingBlockIds, subUnitResources]);

  const validationMessages = useMemo(() => {
    const msgs: { type: "error" | "warning" | "info"; text: string }[] = [];

    if (typeMode === "absence") {
      // Absence validations
      if (hasEmployee) {
        const targetDays = [];
        for (let d = absenceStartDay; d <= absenceEndDay; d++) targetDays.push(d);
        for (const d of targetDays) {
          const existingShifts = displayEmp.shifts[String(d)] || [];
          if (existingShifts.length > 0 && !existingShifts.every((s) => s.status === "leave" || s.status === "sick" || s.status === "reserved" || s.status === "temp-assignment")) {
            msgs.push({ type: "warning", text: `Працівник має існуючі зміни на ${DAY_LABELS[d]}. Створення відсутності позначить їх як перекриті.` });
          }
        }
      }
      if (!hasEmployee && isAnyCreate) {
        msgs.push({ type: "error", text: "Для відсутності потрібно обрати працівника." });
      }
      if (absenceEndDay < absenceStartDay) {
        msgs.push({ type: "error", text: "Кінцевий день не може бути раніше початкового." });
      }
      if (msgs.length === 0) msgs.push({ type: "info", text: "Усі правила дотримано." });
      return msgs;
    }

    // Shift mode validations
    if (isAnyCreate && typeMode === "shift" && timeBlocks.length === 0) {
      msgs.push({ type: "error", text: "Додайте щонайменше одну частину зміни." });
    }
    if (isShiftOrCreate && timeBlocks.length > 0) {
      if (hasEmployee) {
        const targetDay = isAnyCreate ? selectedDay : dayIndex;
        if (targetDay != null) {
          const existingShifts = displayEmp.shifts[String(targetDay)] || [];
          if (hasBlockingShift(existingShifts)) {
            msgs.push({ type: "error", text: "Неможливо створити зміну: працівник має Відпустку, Лікарняний, Резерв або Тимч. призначення в цей день." });
          }
          // ── Gap rule: two shifts in one day require gap < 1:30h ──
          const otherShifts = existingShifts.filter((s) =>
            s.status !== "leave" && s.status !== "sick" && s.status !== "reserved" && s.status !== "temp-assignment"
            && (!shift || s.id !== shift.id)
          );
          if (otherShifts.length > 0 && timeBlocks.length > 0) {
            const newStart = parseHour(timeBlocks[0].start);
            const newEnd = parseHour(timeBlocks[timeBlocks.length - 1].end);
            for (const existing of otherShifts) {
              const [exS, exE] = existing.timeRange.split("–").map((t) => parseHour(t.trim()));
              const gap = newStart >= exE ? newStart - exE : exS >= newEnd ? exS - newEnd : 0;
              if (gap >= 1.5) {
                if (shiftActionStatus !== "marketplace") {
                  msgs.push({ type: "error", text: `У працівника вже є зміна в цей день. Розрив ${fmtDuration(gap)} перевищує допустимі 1:30г — система не збереже другу зміну. Щоб обійти обмеження, створіть цю зміну як біржову (опція "На біржу").` });
                } else {
                  msgs.push({ type: "info", text: `Розрив між змінами ${fmtDuration(gap)} — біржова зміна дозволяє обійти обмеження на мінімальний розрив.` });
                }
                break;
              }
            }
          }
        }
      }
      // ── Marketplace + >2 units rule ──
      if (shiftActionStatus === "marketplace") {
        const uniqueUnits = new Set(timeBlocks.map((b) => b.unit).filter(Boolean));
        if (uniqueUnits.size > 2) {
          msgs.push({ type: "error", text: `Біржова зміна підтримує максимум 2 дільниці. Зараз призначено ${uniqueUnits.size} — спростіть зміну або оберіть стандартне створення.` });
        } else if (uniqueUnits.size === 2) {
          msgs.push({ type: "info", text: "Біржова зміна з 2 дільницями — це максимум для біржі. Додати більше не вдасться." });
        }
      }
      if (overlappingBlockIds.size > 0) msgs.push({ type: "error", text: `Перекриття змін: ${overlappingBlockIds.size} блок(ів) мають конфліктуючі часові діапазони.` });
      if (totalShiftHours > 16) msgs.push({ type: "error", text: "Зміна перевищує максимальну тривалість 16 годин." });
      if (timeBlocks.some((b) => !b.unit)) msgs.push({ type: "error", text: "Кожен сегмент зміни повинен мати призначену дільницю." });
      if (totalShiftHours > 8 && totalShiftHours <= 16) msgs.push({ type: "warning", text: `Зміна ${fmtDuration(totalShiftHours)} — перевищує рекомендований денний ліміт 8г.` });
      if (breakDurationHours < 0.5 && totalShiftHours >= 6) msgs.push({ type: "warning", text: "Перерва щонайменше 30 хв потрібна для змін >= 6г." });
      if (hasEmployee) {
        const newTotal = displayEmp.workedHours + netHours;
        if (newTotal > displayEmp.monthlyNorm) msgs.push({ type: "warning", text: `Додавання цієї зміни (${fmtDuration(netHours)} нетто) збільшить місячні години до ${newTotal.toFixed(1)}г — понад ${displayEmp.monthlyNorm}г норми.` });
      }
      const overAssigned = timeBlocks.filter((b) => blockValidationMap[b.id]?.messages.some((m) => m.includes("перепризначено")));
      if (overAssigned.length > 0) {
        const unitNames = Array.from(new Set(overAssigned.map((b) => b.unit)));
        msgs.push({ type: "warning", text: `Перепризначення дільниць: ${unitNames.join(", ")} перевищують прогноз на цей день.` });
      }
    }
    if (msgs.length === 0) msgs.push({ type: "info", text: "Усі правила дотримано." });
    return msgs;
  }, [isShiftOrCreate, typeMode, isAnyCreate, hasEmployee, selectedDay, dayIndex, timeBlocks, overlappingBlockIds, totalShiftHours, breakDurationHours, netHours, displayEmp, blockValidationMap, absenceStartDay, absenceEndDay, DAY_LABELS, shiftActionStatus, shift]);

  const hardErrorCount = validationMessages.filter((m) => m.type === "error").length;
  const warningCount = validationMessages.filter((m) => m.type === "warning").length;
  const hasHardErrors = hardErrorCount > 0;
  const isBlocked = hasHardErrors;

  // ── Time block handlers ─────────────────────────────────────────────
  const addBlock = useCallback(() => {
    const lastEnd = timeBlocks.length > 0 ? timeBlocks[timeBlocks.length - 1].end : "08:00";
    const newEnd = `${String(Math.min(parseHour(lastEnd) + 4, 23)).padStart(2, "0")}:00`;
    setTimeBlocks((prev) => [...prev, { id: `block-${blockIdCounter++}`, start: lastEnd, end: newEnd, unit: availableUnits[0] || "" }]);
  }, [timeBlocks, availableUnits]);

  const removeBlock = useCallback((id: string) => {
    setTimeBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateBlock = useCallback((id: string, field: keyof TimeBlock, value: string) => {
    setTimeBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  }, []);

  // ── Header config ───────────────────────────────────────────────────
  const headerTitle = (() => {
    if (isAnyCreate) {
      return typeMode === "absence" ? "Створити відсутність" : "Створити зміну";
    }
    if (isShiftMode) {
      if (typeMode === "absence") return "Редагувати відсутність";
      if (editingExchangeShift) return "Редагувати зміну біржі";
      if (editingOpenShift) return "Редагувати відкриту зміну";
      return "Редагувати зміну";
    }
    return "Огляд працівника";
  })();
  const HeaderIcon = typeMode === "absence" ? CalendarDays : isShiftOrCreate ? Clock : User;

  // ── Button labels ───────────────────────────────────────────────────
  const primaryButtonLabel = (() => {
    if (hasHardErrors) {
      return isAnyCreate ? "Створення заблоковано" : "Збереження заблоковано";
    }

    if (typeMode === "absence") {
      return isAnyCreate ? "Створити відсутність" : "Зберегти відсутність";
    }

    if (isAnyCreate) {
      return "Створити";
    }

    return shift ? "Зберегти" : "Створити";
  })();

  // ═══════════════════════════════════════════════════════════���═══════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  // ── Breadcrumb context ──────────────────────────────────────────────
  const WEEK_START = new Date(2026, 2, 2); // Mon Mar 2
  const UA_MONTHS = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];
  const contextDayIdx = isAnyCreate ? selectedDay : (dayIndex ?? 0);
  const contextDate = new Date(WEEK_START);
  contextDate.setDate(WEEK_START.getDate() + contextDayIdx);

  const drawerContent = (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-39 bg-black/45" onClick={onClose} />

      <div className="fixed top-0 right-0 bottom-0 z-40 w-[380px] bg-[var(--card)] flex flex-col" style={{ borderLeftWidth: 1, borderLeftStyle: "solid", borderLeftColor: "var(--border)", boxShadow: "var(--elevation-lg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <HeaderIcon size={18} style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
            {headerTitle}
          </span>
        </div>
        <Button isIconOnly variant="light" size="sm" onPress={onClose} className="p-1 rounded-[var(--radius-sm)] flex-shrink-0">
          <CloseMD size={18} style={{ color: "var(--muted-foreground)" }} />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

        {/* ═══ Type Switch (Shift / Absence) ═══════════════════════ */}
        {isShiftOrCreate && (
          <TypeSwitch value={typeMode} onChange={setTypeMode} />
        )}

        {/* ═══ Shift Status Summary Card ═══════════════════════════ */}
        {isShiftOrCreate && typeMode === "shift" && (() => {
          const isExchange = shiftActionStatus === "marketplace" || editingExchangeShift;
          const isProposalCard = shiftActionStatus === "proposal";
          const isOpen = !isExchange && !isProposalCard && !hasEmployee;
          const bg = isExchange ? "var(--purple-alpha-5)" : isProposalCard ? "var(--primary-alpha-5)" : isOpen ? "var(--muted)" : "var(--success-alpha-5)";
          const iconColor = isExchange ? "var(--chart-5)" : isProposalCard ? "var(--primary)" : isOpen ? "var(--muted-foreground)" : "var(--chart-2)";
          const StatusIcon = isExchange ? ArrowRightLeft : isProposalCard ? PaperPlane : isOpen ? UserAdd : User01;
          const title = isExchange ? "Зміна біржі" : isProposalCard ? "Персональна пропозиція" : isOpen ? "Відкрита зміна" : "Призначена працівнику";
          const desc = isExchange
            ? "Видима всім відповідним працівникам на біржі."
            : isProposalCard
              ? `Пропозиція надіслана: ${displayEmp.name}`
              : isOpen
                ? "Без призначеного працівника, доступна для призначення."
                : `${displayEmp.name} · ${displayEmp.position}`;
          const cardDept = isAnyCreate ? activeDept : department;
          const validBlocks = timeBlocks.filter((b) => b.start && b.end);
          const shiftStart = validBlocks.length > 0 ? validBlocks[0].start : (shift?.timeRange?.split("–")[0]?.trim() ?? "");
          const shiftEnd = validBlocks.length > 0 ? validBlocks[validBlocks.length - 1].end : (shift?.timeRange?.split("–")[1]?.trim() ?? "");
          const hasTime = !!(shiftStart && shiftEnd);
          return (
            <div className="rounded-[var(--radius)] overflow-hidden flex-shrink-0" style={{ backgroundColor: bg }}>
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <StatusIcon size={15} style={{ color: iconColor, flexShrink: 0 }} />
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>{title}</span>
              </div>
              <div className="px-3 pb-3">
                <span style={{ fontSize: "var(--text-xs)", lineHeight: 1.4, color: "var(--muted-foreground)" }}>{desc}</span>
              </div>
              <div className="px-3 py-2 flex items-center justify-between" style={{ borderTop: "1px solid color-mix(in srgb, var(--border) 60%, transparent)" }}>
                <div className="flex flex-col gap-0.5">
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)", lineHeight: 1.3 }}>
                    {DAY_LABELS[contextDayIdx]}, {contextDate.getDate()} {UA_MONTHS[contextDate.getMonth()]}
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.3 }}>{cardDept.name}</span>
                </div>
                {hasTime && (
                  <div className="flex flex-col items-end gap-0.5">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", lineHeight: 1.3 }}>
                      {shiftStart}–{shiftEnd}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.3 }}>{fmtDuration(totalShiftHours)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}


        {/* ═══ Create/Edit Mode – shared selectors ═══════════════════ */}
        {isShiftOrCreate && (
          <div className="contents">
            <SectionDivider />
            <div className="flex flex-col gap-3">
              <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                {typeMode === "absence" ? "Деталі відсутності" : "Деталі зміни"}
              </label>

              {/* Employee selector — primary control for shift type */}
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>Працівник</span>
                <div className="relative" ref={empDropdownRef}>
                  <Button
                    variant="bordered"
                    size="sm"
                    fullWidth
                    onPress={() => setEmpDropdownOpen(!empDropdownOpen)}
                    endContent={<ChevronDown size={14} style={{ color: "var(--muted-foreground)", transition: "transform 0.15s", transform: empDropdownOpen ? "rotate(180deg)" : undefined }} />}
                    className="w-full justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)]"
                    style={{ fontSize: "var(--text-sm)", color: selectedEmpId ? "var(--foreground)" : "var(--muted-foreground)" }}
                  >
                    <span className="truncate text-left flex-1">
                      {selectedEmpId
                        ? (() => { const emp = allEmpList.find((e) => e.id === selectedEmpId); return emp ? `${emp.name} — ${emp.position}` : ""; })()
                        : (typeMode === "absence" ? "Оберіть працівника..." : "Немає (Відкрита зміна)")}
                    </span>
                  </Button>
                  {empDropdownOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 z-50 w-full rounded-[var(--radius)] border border-[var(--border)] overflow-hidden"
                      style={{ backgroundColor: "var(--popover)", boxShadow: "var(--elevation-md)" }}
                    >
                      <div className="max-h-[200px] overflow-y-auto">
                        <Button
                          variant="light"
                          size="sm"
                          fullWidth
                          onPress={() => { setSelectedEmpId(""); setShiftActionStatus("standard"); setEmpDropdownOpen(false); }}
                          className="flex items-center justify-start px-3 py-2"
                          style={{ backgroundColor: !selectedEmpId ? "var(--primary-alpha-6)" : undefined, borderRadius: 0 }}
                        >
                          <span className="flex-1 text-left truncate" style={{ fontSize: "var(--text-sm)", fontWeight: !selectedEmpId ? "var(--font-weight-semibold)" : "var(--font-weight-normal)", color: !selectedEmpId ? "var(--primary)" : "var(--muted-foreground)" }}>
                            {typeMode === "absence" ? "Оберіть працівника..." : "Немає (Відкрита зміна)"}
                          </span>
                        </Button>
                        {allEmpList.map((e) => {
                          const isActive = e.id === selectedEmpId;
                          return (
                            <Button
                              key={e.id}
                              variant="light"
                              size="sm"
                              fullWidth
                              onPress={() => { setSelectedEmpId(e.id); setEmpDropdownOpen(false); }}
                              className="flex items-center justify-start px-3 py-2"
                              style={{ backgroundColor: isActive ? "var(--primary-alpha-6)" : undefined, borderRadius: 0 }}
                            >
                              <span className="flex-1 text-left truncate" style={{ fontSize: "var(--text-sm)", fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)", color: isActive ? "var(--primary)" : "var(--foreground)" }}>
                                {e.name} — {e.position}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {typeMode === "shift" && (() => {
                  if (shiftActionStatus === "proposal" && hasEmployee) return (
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--chart-5)" }}>
                      Зміна буде надіслана як персональна пропозиція цьому працівнику
                    </span>
                  );
                  if (shiftActionStatus === "marketplace") return (
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--chart-5)" }}>
                      Зміна буде створена як відкрита на біржі
                    </span>
                  );
                  if (hasEmployee) return (
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--chart-2)" }}>
                      Зміна буде призначена працівнику
                    </span>
                  );
                  return (
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>
                      Зміна буде створена як відкрита
                    </span>
                  );
                })()}
              </div>

              {/* ── Unified action cards (same pattern for Create & Edit) ── */}
              {isShiftOrCreate && typeMode === "shift" && (() => {
                // Determine which cards to show based on context
                const isEditingMarketplace = isShiftMode && editingExchangeShift;

                // Case: editing an open marketplace shift → show only "Зняти з біржі"
                if (isEditingMarketplace && shiftActionStatus === "marketplace") {
                  return (
                    <div className="flex flex-col gap-1.5">
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--muted-foreground)" }}>Дії <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)", opacity: 0.6 }}>(опціонально)</span></span>
                      <ActionCard
                        selected={true}
                        icon={<ArrowLeftRight size={15} />}
                        title="Зняти з біржі"
                        description="Зміна стане звичайною відкритою зміною"
                        onClick={() => setShiftActionStatus("standard")}
                        color="var(--chart-5)"
                        bgColor="var(--purple-alpha-5)"
                      />
                    </div>
                  );
                }

                // Standard case: show marketplace card + proposal card (if employee selected)
                return (
                  <div className="flex flex-col gap-1.5">
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--muted-foreground)" }}>Дії <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)", opacity: 0.6 }}>(опціонально)</span></span>
                    {(() => {
                      const uniqueUnitsCount = new Set(timeBlocks.map((b) => b.unit).filter(Boolean)).size;
                      const tooManyUnits = uniqueUnitsCount > 2;
                      return (
                        <ActionCard
                          selected={shiftActionStatus === "marketplace"}
                          icon={<ArrowLeftRight size={15} />}
                          title="Розмістити на біржі"
                          description="Зміна буде доступна будь-якому працівнику на біржі"
                          onClick={() => setShiftActionStatus(shiftActionStatus === "marketplace" ? "standard" : "marketplace")}
                          color="var(--chart-5)"
                          bgColor="var(--purple-alpha-5)"
                          disabled={tooManyUnits}
                          disabledHint={`Біржа підтримує зміни з 1–2 дільницями. Зараз ${uniqueUnitsCount} — зменшіть кількість сегментів`}
                        />
                      );
                    })()}
                    {hasEmployee && (
                      <ActionCard
                        selected={shiftActionStatus === "proposal"}
                        icon={<PaperPlane size={15} />}
                        title="Запропонувати працівнику"
                        description="Персональна пропозиція тільки цьому працівнику через біржу"
                        onClick={() => setShiftActionStatus(shiftActionStatus === "proposal" ? "standard" : "proposal")}
                        color="var(--primary)"
                        bgColor="var(--primary-alpha-8)"
                      />
                    )}
                  </div>
                );
              })()}

              {/* ── Absence-specific fields ─────────────────────────── */}
              {typeMode === "absence" && (
                <div className="contents">
                  {/* Absence Type */}
                  <div className="flex flex-col gap-1">
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>Тип відсутності</span>
                    <div className="relative" ref={absTypeDropdownRef}>
                      <Button
                        variant="bordered"
                        size="sm"
                        fullWidth
                        onPress={() => setAbsTypeDropdownOpen(!absTypeDropdownOpen)}
                        endContent={<ChevronDown size={14} style={{ color: "var(--muted-foreground)", transition: "transform 0.15s", transform: absTypeDropdownOpen ? "rotate(180deg)" : undefined }} />}
                        className="w-full justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)]"
                        style={{ fontSize: "var(--text-sm)", color: "var(--foreground)" }}
                      >
                        <span className="truncate text-left flex-1">{ABSENCE_TYPE_CONFIG[absenceType].label}</span>
                      </Button>
                      {absTypeDropdownOpen && (
                        <div
                          className="absolute top-full left-0 mt-1 z-50 w-full rounded-[var(--radius)] border border-[var(--border)] overflow-hidden"
                          style={{ backgroundColor: "var(--popover)", boxShadow: "var(--elevation-md)" }}
                        >
                          <div className="max-h-[200px] overflow-y-auto">
                            {(["vacation", "sick", "other"] as AbsenceType[]).map((t) => {
                              const isActive = t === absenceType;
                              return (
                                <Button
                                  key={t}
                                  variant="light"
                                  size="sm"
                                  fullWidth
                                  onPress={() => { setAbsenceType(t); setAbsTypeDropdownOpen(false); }}
                                  className="flex items-center justify-start px-3 py-2"
                                  style={{ backgroundColor: isActive ? "var(--primary-alpha-6)" : undefined, borderRadius: 0 }}
                                >
                                  <span className="flex-1 text-left truncate" style={{ fontSize: "var(--text-sm)", fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)", color: isActive ? "var(--primary)" : "var(--foreground)" }}>
                                    {ABSENCE_TYPE_CONFIG[t].label}
                                  </span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Absence type preview chip */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius)]" style={{ backgroundColor: ABSENCE_TYPE_CONFIG[absenceType].bg }}>
                    <span style={{ color: ABSENCE_TYPE_CONFIG[absenceType].color }}>{ABSENCE_TYPE_CONFIG[absenceType].icon}</span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: ABSENCE_TYPE_CONFIG[absenceType].color }}>
                      {ABSENCE_TYPE_CONFIG[absenceType].label}
                    </span>
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)", marginLeft: "auto" }}>
                      Весь день
                    </span>
                  </div>

                  {/* Date range (multi-day) */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>Початок</span>
                      <div className="relative" ref={absStartDropdownRef}>
                        <Button
                          variant="bordered"
                          size="sm"
                          fullWidth
                          onPress={() => setAbsStartDropdownOpen(!absStartDropdownOpen)}
                          endContent={<ChevronDown size={14} style={{ color: "var(--muted-foreground)", transition: "transform 0.15s", transform: absStartDropdownOpen ? "rotate(180deg)" : undefined }} />}
                          className="w-full justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)]"
                          style={{ fontSize: "var(--text-sm)", color: "var(--foreground)" }}
                        >
                          <span className="truncate text-left flex-1">{DAY_LABELS[absenceStartDay]}</span>
                        </Button>
                        {absStartDropdownOpen && (
                          <div
                            className="absolute top-full left-0 mt-1 z-50 w-full rounded-[var(--radius)] border border-[var(--border)] overflow-hidden"
                            style={{ backgroundColor: "var(--popover)", boxShadow: "var(--elevation-md)" }}
                          >
                            <div className="max-h-[200px] overflow-y-auto">
                              {DAY_LABELS.map((d, i) => {
                                const isActive = i === absenceStartDay;
                                return (
                                  <Button
                                    key={i}
                                    variant="light"
                                    size="sm"
                                    fullWidth
                                    onPress={() => { setAbsenceStartDay(i); if (absenceEndDay < i) setAbsenceEndDay(i); setAbsStartDropdownOpen(false); }}
                                    className="flex items-center justify-start px-3 py-2"
                                    style={{ backgroundColor: isActive ? "var(--primary-alpha-6)" : undefined, borderRadius: 0 }}
                                  >
                                    <span className="flex-1 text-left truncate" style={{ fontSize: "var(--text-sm)", fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)", color: isActive ? "var(--primary)" : "var(--foreground)" }}>
                                      {d}
                                    </span>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", marginTop: 16 }}>до</span>
                    <div className="flex flex-col gap-1 flex-1">
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>Кінець</span>
                      <div className="relative" ref={absEndDropdownRef}>
                        <Button
                          variant="bordered"
                          size="sm"
                          fullWidth
                          onPress={() => setAbsEndDropdownOpen(!absEndDropdownOpen)}
                          endContent={<ChevronDown size={14} style={{ color: "var(--muted-foreground)", transition: "transform 0.15s", transform: absEndDropdownOpen ? "rotate(180deg)" : undefined }} />}
                          className="w-full justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)]"
                          style={{ fontSize: "var(--text-sm)", color: "var(--foreground)" }}
                        >
                          <span className="truncate text-left flex-1">{DAY_LABELS[absenceEndDay]}</span>
                        </Button>
                        {absEndDropdownOpen && (
                          <div
                            className="absolute top-full left-0 mt-1 z-50 w-full rounded-[var(--radius)] border border-[var(--border)] overflow-hidden"
                            style={{ backgroundColor: "var(--popover)", boxShadow: "var(--elevation-md)" }}
                          >
                            <div className="max-h-[200px] overflow-y-auto">
                              {DAY_LABELS.map((d, i) => {
                                const isActive = i === absenceEndDay;
                                const isDisabled = i < absenceStartDay;
                                return (
                                  <Button
                                    key={i}
                                    variant="light"
                                    size="sm"
                                    fullWidth
                                    isDisabled={isDisabled}
                                    onPress={() => { setAbsenceEndDay(i); setAbsEndDropdownOpen(false); }}
                                    className="flex items-center justify-start px-3 py-2"
                                    style={{ backgroundColor: isActive ? "var(--primary-alpha-6)" : undefined, borderRadius: 0, opacity: isDisabled ? 0.4 : 1 }}
                                  >
                                    <span className="flex-1 text-left truncate" style={{ fontSize: "var(--text-sm)", fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)", color: isActive ? "var(--primary)" : "var(--foreground)" }}>
                                      {d}
                                    </span>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Day count summary */}
                  <div className="flex items-center justify-between py-1">
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>Тривалість</span>
                    <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                      {absenceEndDay - absenceStartDay + 1} дн.
                    </span>
                  </div>
                </div>
              )}

              {/* ── Shift-specific selectors ───────────────────────── */}
              {typeMode === "shift" && (
                <div className="contents">
                  {/* Department selector — hidden when opened from a specific department row (dayIndex provided) */}
                  {allDepartments && allDepartments.length > 1 && dayIndex == null && (
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>Відділ</span>
                      <div className="relative" ref={deptDropdownRef}>
                        <Button
                          variant="bordered"
                          size="sm"
                          fullWidth
                          onPress={() => setDeptDropdownOpen(!deptDropdownOpen)}
                          endContent={<ChevronDown size={14} style={{ color: "var(--muted-foreground)", transition: "transform 0.15s", transform: deptDropdownOpen ? "rotate(180deg)" : undefined }} />}
                          className="w-full justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)]"
                          style={{ fontSize: "var(--text-sm)", color: "var(--foreground)" }}
                        >
                          <span className="truncate text-left flex-1">{allDepartments.find((d) => d.id === selectedDeptId)?.name ?? "Оберіть відділ..."}</span>
                        </Button>
                        {deptDropdownOpen && (
                          <div
                            className="absolute top-full left-0 mt-1 z-50 w-full rounded-[var(--radius)] border border-[var(--border)] overflow-hidden"
                            style={{ backgroundColor: "var(--popover)", boxShadow: "var(--elevation-md)" }}
                          >
                            <div className="max-h-[200px] overflow-y-auto">
                              {allDepartments.map((d) => {
                                const isActive = d.id === selectedDeptId;
                                return (
                                  <Button
                                    key={d.id}
                                    variant="light"
                                    size="sm"
                                    fullWidth
                                    onPress={() => { setSelectedDeptId(d.id); setDeptDropdownOpen(false); }}
                                    className="flex items-center justify-start px-3 py-2"
                                    style={{ backgroundColor: isActive ? "var(--primary-alpha-6)" : undefined, borderRadius: 0 }}
                                  >
                                    <span className="flex-1 text-left truncate" style={{ fontSize: "var(--text-sm)", fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)", color: isActive ? "var(--primary)" : "var(--foreground)" }}>
                                      {d.name}
                                    </span>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}


                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ Employee-only: A) Profile → B) Monthly Balance → C) Total Workload → D) This Week ═══ */}
        {mode === "employee" && (() => {
          const wl = employeeWorkloadStats!;
          const weekShiftCount = Object.values(employee.shifts).flat().length;
          const weekHours = Object.values(employee.shifts).flat().reduce((sum, sh) => {
            const parts = sh.timeRange.split("–");
            if (parts.length === 2) {
              const s = parseHour(parts[0].trim());
              const e = parseHour(parts[1].trim());
              return sum + (e >= s ? e - s : 24 - s + e);
            }
            return sum;
          }, 0);

          return (
          <div className="contents">
            {/* ── A. Employee Profile ──────────────────────────── */}
            <div className="rounded-[var(--radius)] overflow-hidden" style={{ backgroundColor: "var(--muted)" }}>
              <div className="flex items-center gap-3 px-3 py-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--border)" }}>
                  <User01 size={18} style={{ color: "var(--muted-foreground)" }} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate" style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)", lineHeight: 1.25 }}>
                    {employee.name}
                  </span>
                  <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                    {employee.position} · {department.name}
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--primary)", lineHeight: 1.4, marginTop: 2 }}>
                    Зайнятість {employee.fte}%
                  </span>
                </div>
              </div>

              {/* Progress bar — matches employee row: Заплановано / Норма */}
              <div className="px-3 pb-3 flex flex-col gap-1">
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${wl.barPct}%`, backgroundColor: wl.barColor }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>
                    {employee.workedHours} / {employee.monthlyNorm}г
                  </span>
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>
                    {wl.barPct.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* ── B. Monthly Hours Balance ────────────────────── */}
            <div className="flex flex-col gap-2">
              {/* Level 1: Section title */}
              <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>Баланс годин (місяць)</label>

              {!wl.isCrossMonth ? (
                <div className="flex flex-col gap-1.5 rounded-[var(--radius)] px-3 py-2.5" style={{ backgroundColor: "var(--muted)" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Норма</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{employee.monthlyNorm}г</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Заплановано</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{employee.workedHours}г</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Факт</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--foreground)" }}>{wl.workedHoursPast.toFixed(1)}г</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Відсутності</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: wl.absenceHours > 0 ? "var(--chart-3)" : "var(--foreground)" }}>{wl.absenceHours.toFixed(1)}г</span>
                  </div>

                  {/* Залишок до норми */}
                  <div className="flex items-center justify-between pt-1" style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: "var(--border)" }}>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: wl.overScheduled ? "var(--destructive)" : "var(--chart-2)" }}>Залишок до норми</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: wl.overScheduled ? "var(--destructive)" : "var(--chart-2)" }}>
                      {wl.overScheduled ? `−${wl.overtimeHours.toFixed(1)}г` : `${wl.remainingToNorm.toFixed(1)}г`}
                    </span>
                  </div>

                  {/* Overtime warning */}
                  {wl.overScheduled && (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <TriangleWarning size={11} style={{ color: "var(--destructive)" }} />
                        <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--destructive)" }}>
                          Перевищення норми на {wl.overtimeHours.toFixed(1)}г
                        </span>
                      </div>
                      {!wl.overHard && wl.allowanceLeft > 0 && (
                        <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--chart-3)", paddingLeft: 17 }}>
                          Допустимо ще {wl.allowanceLeft.toFixed(1)}г
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {wl.monthBlocks!.map((mb, mi) => (
                    <div key={mi} className="flex flex-col gap-1.5 rounded-[var(--radius)] px-3 py-2.5" style={{ backgroundColor: "var(--muted)" }}>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--primary)" }}>{mb.label}</span>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Норма</span>
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{mb.norm}г</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Заплановано</span>
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{mb.hours.toFixed(1)}г</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── C. Total Workload ───────────────────────────── */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>Загальне навантаження</label>
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>(з урахуванням біржі змін)</span>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius)] px-3 py-2.5" style={{ backgroundColor: "var(--muted)" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>
                  Ліміт працівника
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>
                  {wl.totalHours.toFixed(1)} / 250г
                </span>
              </div>
            </div>

            {/* ── D. Current Week Summary ─────────────────────── */}
            <SectionDivider />
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>Цей тиждень</label>
              <div className="flex flex-col gap-1.5 rounded-[var(--radius)] px-3 py-2.5" style={{ backgroundColor: "var(--muted)" }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Зміни</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{weekShiftCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Заплановані години</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{weekHours.toFixed(1)}г</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}>Фактичні години</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>{wl.workedHoursPast.toFixed(1)}г</span>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* ═══ Shift Mode – Combined Parts / Breaks / Timeline block ═══ */}
        {isShiftOrCreate && typeMode === "shift" && (
          <div className="contents">
            <SectionDivider />

            {/* Single cohesive block for shift configuration */}
            <div className="rounded-[var(--radius)]" style={{ borderStyle: "solid", borderWidth: 1, borderColor: "var(--border)" }}>

            {/* ── Shift Parts ── */}
            <div className="flex flex-col gap-2 p-3">
              <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>Частини зміни</label>
              {timeBlocks.map((block, idx) => {
                const dur = calcDuration(block.start, block.end);
                const bv = blockValidationMap[block.id];
                const borderClr = bv?.severity === "error" ? "var(--destructive)" : "var(--border)";
                const showPartNumber = timeBlocks.length > 1;
                const recommendations = unitRecommendations[block.unit] || [];
                const visibleRecommendations = recommendations.slice(0, 3);
                const hiddenRecommendationsCount = Math.max(recommendations.length - visibleRecommendations.length, 0);
                return (
                  <div key={block.id} className="rounded-[var(--radius)] overflow-hidden transition-colors" style={{ borderStyle: "solid", borderWidth: 1.5, borderTopColor: borderClr, borderRightColor: borderClr, borderBottomColor: borderClr, borderLeftColor: borderClr }}>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--muted)]">
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)", width: 20, textAlign: "center" }}>{idx + 1}</span>
                      <TimeInput value={block.start} onChange={(v) => updateBlock(block.id, "start", v)} />
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>–</span>
                      <TimeInput value={block.end} onChange={(v) => updateBlock(block.id, "end", v)} />
                      <span className="ml-auto px-1.5 py-0.5 rounded-[var(--radius-sm)]"
                        style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary)", backgroundColor: "var(--primary-alpha-10)" }}>
                        {fmtDuration(dur)}
                      </span>
                      <Button isIconOnly variant="light" size="sm" onPress={() => removeBlock(block.id)} className="p-1 rounded-[var(--radius-sm)]">
                        <TrashFull size={14} style={{ color: "var(--muted-foreground)" }} />
                      </Button>
                    </div>
                    <div className="px-3 py-2 flex items-center gap-2">
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>Дільниця</span>
                      <div className="relative flex-1" data-unit-dropdown={block.id}>
                        <Button
                          variant="bordered"
                          size="sm"
                          fullWidth
                          onPress={() => setOpenUnitDropdownId(openUnitDropdownId === block.id ? null : block.id)}
                          endContent={<ChevronDown size={14} style={{ color: "var(--muted-foreground)", transition: "transform 0.15s", transform: openUnitDropdownId === block.id ? "rotate(180deg)" : undefined }} />}
                          className="w-full justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)]"
                          style={{ fontSize: "var(--text-sm)", color: block.unit ? "var(--foreground)" : "var(--muted-foreground)" }}
                        >
                          <span className="truncate text-left flex-1">{block.unit || "Оберіть дільницю..."}</span>
                        </Button>
                        {openUnitDropdownId === block.id && (
                          <div
                            className="absolute top-full left-0 mt-1 z-50 w-full rounded-[var(--radius)] border border-[var(--border)] overflow-hidden"
                            style={{ backgroundColor: "var(--popover)", boxShadow: "var(--elevation-md)" }}
                          >
                            <div className="max-h-[200px] overflow-y-auto">
                              <Button
                                variant="light"
                                size="sm"
                                fullWidth
                                onPress={() => { updateBlock(block.id, "unit", ""); setOpenUnitDropdownId(null); }}
                                className="flex items-center justify-start px-3 py-2"
                                style={{ backgroundColor: !block.unit ? "var(--primary-alpha-6)" : undefined, borderRadius: 0 }}
                              >
                                <span className="flex-1 text-left" style={{ fontSize: "var(--text-sm)", fontWeight: !block.unit ? "var(--font-weight-semibold)" : "var(--font-weight-normal)", color: !block.unit ? "var(--primary)" : "var(--muted-foreground)" }}>
                                  Оберіть дільницю...
                                </span>
                              </Button>
                              {availableUnits.map((u) => {
                                const isActive = block.unit === u;
                                return (
                                  <Button
                                    key={u}
                                    variant="light"
                                    size="sm"
                                    fullWidth
                                    onPress={() => { updateBlock(block.id, "unit", u); setOpenUnitDropdownId(null); }}
                                    className="flex items-center justify-start px-3 py-2"
                                    style={{ backgroundColor: isActive ? "var(--primary-alpha-6)" : undefined, borderRadius: 0 }}
                                  >
                                    <span className="flex-1 text-left truncate" style={{ fontSize: "var(--text-sm)", fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)", color: isActive ? "var(--primary)" : "var(--foreground)" }}>
                                      {u}
                                    </span>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {block.unit && (unitRecommendations[block.unit] || []).length > 0 && (
                      <div className="px-3 py-1.5 flex items-center gap-1.5 flex-wrap" style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: "var(--border)" }}>
                        <Star size={10} className="flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                        <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>Рекомендації:</span>
                        {(unitRecommendations[block.unit] || []).map((rec) => {
                          const isActive = block.start === rec.start && block.end === rec.end;
                          return (
                            <Button
                              key={rec.label}
                              size="sm"
                              variant={isActive ? "solid" : "flat"}
                              color="primary"
                              onPress={() => {
                                setTimeBlocks((prev) => prev.map((b) =>
                                  b.id === block.id ? { ...b, start: rec.start, end: rec.end } : b
                                ));
                              }}
                              className="px-1.5 py-0.5 rounded-[var(--radius-sm)] transition-colors"
                              style={{
                                fontSize: "var(--text-2xs)",
                                fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-medium)",
                                color: isActive ? "var(--background)" : "var(--primary)",
                                backgroundColor: isActive ? "var(--primary)" : "var(--primary-alpha-10)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {rec.label}
                            </Button>
                          );
                        })}
                      </div>
                    )}

                    {bv && bv.messages.length > 0 && (
                      <div className="px-3 py-1.5 flex flex-col gap-0.5" style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: borderClr, backgroundColor: bv.severity === "error" ? "var(--destructive-alpha-4)" : "var(--warning-alpha-4)" }}>
                        {bv.messages.map((msg, mi) => (
                          <div key={mi} className="flex items-start gap-1.5">
                            {bv.severity === "error"
                              ? <CircleWarning size={12} className="mt-px flex-shrink-0" style={{ color: "var(--destructive)" }} />
                              : <TriangleWarning size={12} className="mt-px flex-shrink-0" style={{ color: "var(--chart-3)" }} />}
                            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)", color: bv.severity === "error" ? "var(--destructive)" : "var(--chart-3)", lineHeight: 1.4 }}>{msg}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <Button variant="bordered" color="primary" fullWidth size="sm" onPress={addBlock} startContent={<AddPlus size={14} />}
                className="justify-center"
                style={{ borderStyle: "dashed" }}
              >
                Додати частину
              </Button>
            </div>

            {/* Internal divider */}
            <div className="h-px bg-[var(--border)]" />

            {/* ── Breaks ── */}
            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>Перерви</span>
                {breakMinutes > 0 && (
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--muted-foreground)" }}>
                    Всього: {breakMinutes} хв
                  </span>
                )}
              </div>

              {breakEntries.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius)]" style={{ backgroundColor: "var(--muted)" }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)", flex: 1 }}>
                    Без перерв
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {breakEntries.map((brk) => (
                    <div key={brk.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)]" style={{ backgroundColor: "var(--muted)" }}>
                      {/* Duration selector */}
                      <div className="relative" data-break-dropdown={brk.id}>
                        <Button
                          variant="bordered"
                          size="sm"
                          onPress={() => setOpenBreakDurationId(openBreakDurationId === brk.id ? null : brk.id)}
                          endContent={<ChevronDown size={12} style={{ color: "var(--muted-foreground)", transition: "transform 0.15s", transform: openBreakDurationId === brk.id ? "rotate(180deg)" : undefined }} />}
                          className="px-2 py-1 rounded-[var(--radius-sm)]"
                          style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--foreground)", width: 90 }}
                        >
                          {brk.durationMin} хв
                        </Button>
                        {openBreakDurationId === brk.id && (
                          <div
                            className="absolute top-full left-0 mt-1 z-50 rounded-[var(--radius)] border border-[var(--border)] overflow-hidden"
                            style={{ backgroundColor: "var(--popover)", boxShadow: "var(--elevation-md)", minWidth: 90 }}
                          >
                            {[30, 60, 90, 120].map((dur) => {
                              const isActive = brk.durationMin === dur;
                              return (
                                <Button
                                  key={dur}
                                  variant="light"
                                  size="sm"
                                  fullWidth
                                  onPress={() => { updateBreakDuration(brk.id, dur); setOpenBreakDurationId(null); }}
                                  className="flex items-center justify-start px-3 py-1.5"
                                  style={{ backgroundColor: isActive ? "var(--primary-alpha-6)" : undefined, borderRadius: 0 }}
                                >
                                  <span style={{ fontSize: "var(--text-sm)", fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)", color: isActive ? "var(--primary)" : "var(--foreground)" }}>
                                    {dur} хв
                                  </span>
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Start time */}
                      <TimeInput value={brk.startTime} onChange={(v) => updateBreakStart(brk.id, v)} />

                      <span className="flex-1" />

                      {/* Delete */}
                      <Button isIconOnly variant="light" size="sm" onPress={() => removeBreak(brk.id)} className="p-1 rounded-[var(--radius-sm)]">
                        <TrashFull size={13} style={{ color: "var(--muted-foreground)" }} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick add buttons (spec #8: no duplicated + in text) */}
              <div className="flex items-center gap-2">
                <Button
                  variant="bordered"
                  color="primary"
                  size="sm"
                  onPress={() => addBreak(30)}
                  startContent={<AddPlus size={13} />}
                  style={{ borderStyle: "dashed" }}
                >
                  30 хв
                </Button>
                <Button
                  variant="bordered"
                  color="primary"
                  size="sm"
                  onPress={() => addBreak(60)}
                  startContent={<AddPlus size={13} />}
                  style={{ borderStyle: "dashed" }}
                >
                  60 хв
                </Button>
              </div>
            </div>

            {/* ── Timeline (visual preview) ── */}
            {timeBlocks.length > 0 && (
              <div className="contents">
                <div className="h-px bg-[var(--border)]" />
                <div className="p-3">
                  <ShiftTimeline timeBlocks={timeBlocks} breakState={breakState} colorMap={shiftColorMap} breakEntries={breakEntries} />
                </div>
              </div>
            )}

            </div>{/* end cohesive block */}

          </div>
        )}

        {/* ═══ Validation (both shift and absence) ═══════════════════ */}
        {isShiftOrCreate && (
          <div className="contents">
            <SectionDivider />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)" }}>Перевірка</label>
                {hardErrorCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full"
                    style={{ backgroundColor: "var(--destructive)", color: "var(--destructive-foreground)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", lineHeight: 1 }}>
                    {hardErrorCount}
                  </span>
                )}
                {warningCount > 0 && hardErrorCount === 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full"
                    style={{ backgroundColor: "var(--chart-3)", color: "var(--card)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", lineHeight: 1 }}>
                    {warningCount}
                  </span>
                )}
              </div>
              {validationMessages.map((msg, i) => <ValidationRow key={i} type={msg.type} text={msg.text} />)}
            </div>
          </div>
        )}
      </div>

      {/* Footer — only two buttons: Скасувати / Створити */}
      {isShiftOrCreate && (
        <div className="px-4 py-3" style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: "var(--border)" }}>
          {isShiftMode && !isAnyCreate && onDeleteShift && shift && (
            <Button
              variant="bordered"
              color="danger"
              fullWidth
              onPress={() => {
                onDeleteShift({
                  deptId: selectedDeptId,
                  employeeId: selectedEmpId,
                  dayIndex: dayIndex ?? 0,
                  shiftId: shift.id,
                });
                onClose();
              }}
              size="md"
              startContent={<TrashFull size={13} />}
              className="justify-center"
              style={{ marginBottom: 8 }}
            >
              Видалити зміну
            </Button>
          )}
        <div className="flex items-center gap-2">
          <Button variant="bordered" color="default" size="md" onPress={onClose}>
            Скасувати
          </Button>
          <Button
            color="primary"
            isDisabled={isBlocked}
            onPress={() => {
              if (isBlocked) return;
              // Determine effective status for save
              // Spec: marketplace card on assigned shift → becomes open marketplace shift
              // Spec: proposal → stays on employee, gets proposalStatus: 'pending', shows Send icon
              const effectiveIsOpen = shiftActionStatus === "marketplace" || (!hasEmployee && shiftActionStatus !== "proposal");
              const effectiveExchange = shiftActionStatus === "marketplace" || shiftActionStatus === "proposal" ? "on-exchange" : undefined;
              const effectiveProposalStatus = shiftActionStatus === "proposal" ? "pending" as const : undefined;

              if (isAnyCreate && typeMode === "shift" && onCreateShift && timeBlocks.length > 0) {
                const timeRange = `${timeBlocks[0].start}–${timeBlocks[timeBlocks.length - 1].end}`;
                const newShift: ShiftData = {
                  id: `shift-new-${Date.now()}`,
                  timeRange,
                  subUnits: timeBlocks.map((b) => ({ unit: b.unit || "—", time: `${b.start}–${b.end}` })),
                  breakText: breakMinutes > 0 ? `${breakMinutes} хв` : undefined,
                  breakStart: breakEntries.length > 0 ? breakEntries[0].startTime : undefined,
                  breakDuration: breakMinutes > 0 ? breakMinutes : undefined,
                  status: effectiveIsOpen ? "open" : "normal",
                  exchangeStatus: effectiveExchange as ShiftData["exchangeStatus"],
                  proposalStatus: effectiveProposalStatus,
                };
                onCreateShift({
                  deptId: selectedDeptId,
                  employeeId: shiftActionStatus === "marketplace" ? "" : selectedEmpId,
                  dayIndex: selectedDay,
                  shift: newShift,
                  shiftType: shiftActionStatus === "marketplace" ? "exchange" : shiftActionStatus === "proposal" ? "proposal" : "standard",
                });
                onClose();
                return;
              }
              // Edit mode: save changes
              if (isShiftMode && typeMode === "shift" && onSaveShift && shift) {
                const timeRange = timeBlocks.length > 0
                  ? `${timeBlocks[0].start}–${timeBlocks[timeBlocks.length - 1].end}`
                  : shift.timeRange;
                const updatedShift: ShiftData = {
                  ...shift,
                  timeRange,
                  subUnits: timeBlocks.length > 0
                    ? timeBlocks.map((b) => ({ unit: b.unit || "—", time: `${b.start}–${b.end}` }))
                    : shift.subUnits,
                  breakText: breakMinutes > 0 ? `${breakMinutes} хв` : undefined,
                  breakStart: breakEntries.length > 0 ? breakEntries[0].startTime : undefined,
                  breakDuration: breakMinutes > 0 ? breakMinutes : undefined,
                  status: effectiveIsOpen ? "open" : "normal",
                  exchangeStatus: effectiveExchange as ShiftData["exchangeStatus"],
                  proposalStatus: effectiveProposalStatus,
                };
                onSaveShift({
                  deptId: selectedDeptId,
                  employeeId: shiftActionStatus === "marketplace" ? "" : selectedEmpId,
                  dayIndex: dayIndex ?? 0,
                  shift: updatedShift,
                  originalShiftId: shift.id,
                  isOpenShift: effectiveIsOpen,
                  isMarketplace: shiftActionStatus === "marketplace",
                  isProposal: shiftActionStatus === "proposal",
                });
                onClose();
                return;
              }
              onClose();
            }}
            variant="solid"
            size="md"
            className="flex-1"
            style={{
              backgroundColor: isBlocked
                ? "var(--muted-foreground)"
                : typeMode === "absence"
                  ? ABSENCE_TYPE_CONFIG[absenceType].color
                  : shiftActionStatus === "marketplace"
                    ? "var(--chart-5)"
                    : undefined,
            }}
          >
            {hasHardErrors ? (
              <span className="inline-flex items-center gap-1.5 justify-center"><StopSign size={14} />{primaryButtonLabel}</span>
            ) : (
              primaryButtonLabel
            )}
          </Button>
        </div>
        </div>
      )}
      </div>
    </>
  );

  if (typeof document === "undefined") return drawerContent;
  return createPortal(drawerContent, document.body);
}
