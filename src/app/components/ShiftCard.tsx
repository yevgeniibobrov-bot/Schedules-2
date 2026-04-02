import React, { useState, useRef, useEffect, useMemo } from "react";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import {
  Palmtree,
  Thermometer,
  Building2,
  ShieldCheck,
  Coffee,
  ArrowRightLeft,
  Send,
  AlertTriangle,
} from "lucide-react";
import { Tooltip } from "@fzwp/ui-kit/tooltip";
import { Divider } from "@fzwp/ui-kit/divider";
import { getSubUnitColor } from "./subUnitColors";

export const SHIFT_DND_TYPE = "SHIFT_CARD";
export const OPEN_SHIFT_DND_TYPE = "OPEN_SHIFT_CARD";

// ── Session-created shift tracking ──────────────────────────────────
// Module-level Set to track shifts created during the current session.
// Used for subtle "recently created" visual indicator.
export const sessionCreatedShiftIds = new Set<string>();

export type ShiftStatus =
  | "normal"
  | "open"
  | "leave"
  | "sick"
  | "temp-assignment"
  | "reserved";

export type ExchangeStatus = "on-exchange";

export interface ShiftData {
  id: string;
  timeRange: string;
  breakText?: string;
  /** Explicit break start time, e.g. "13:00" */
  breakStart?: string;
  /** Explicit break duration in minutes, e.g. 30 */
  breakDuration?: number;
  subUnits: { time: string; unit: string }[];
  status?: ShiftStatus;
  exchangeStatus?: ExchangeStatus;
  /** Whether this shift was filled via the shift marketplace (біржа змін) */
  marketplaceSource?: boolean;
  /** Proposal lifecycle: pending = sent to employee (✈), accepted = employee confirmed (⇄) */
  proposalStatus?: "pending" | "accepted";
  absenceLabel?: string;
  actualTimeRange?: string;
  actualSubUnits?: { time: string; unit: string }[];
  factStatus?: "overtime" | "missing" | "matched" | "no-show";
  deltaHours?: number;
}

export interface DragItem {
  type: typeof SHIFT_DND_TYPE | typeof OPEN_SHIFT_DND_TYPE;
  shiftId: string;
  shift: ShiftData;
  sourceEmployeeId: string;
  sourceDayIndex: number;
  sourceType: "employee" | "open-shift";
  sourceDeptId?: string;
  sourceOpenShiftId?: string;
}

// ── Blocking helpers ─────────────────────────────────────────────────

const BLOCKING_STATUSES: ShiftStatus[] = ["leave", "sick", "temp-assignment", "reserved"];

export function isBlockingStatus(status?: ShiftStatus): boolean {
  return !!status && BLOCKING_STATUSES.includes(status);
}

export function hasBlockingShift(shifts: ShiftData[]): boolean {
  return shifts.some((s) => isBlockingStatus(s.status));
}

// ── Status visual config ──────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { borderColor: string; bg: string; icon?: React.ReactNode; label?: string }
> = {
  normal: {
    borderColor: "var(--border)",
    bg: "var(--card)",
  },
  open: {
    borderColor: "var(--border)",
    bg: "var(--success-alpha-5)",
  },
  leave: {
    borderColor: "var(--chart-1)",
    bg: "var(--primary-alpha-8)",
    icon: <Palmtree size={10} />,
    label: "Відпустка",
  },
  sick: {
    borderColor: "var(--chart-4)",
    bg: "var(--destructive-alpha-8)",
    icon: <Thermometer size={10} />,
    label: "Лікарняний",
  },
  "temp-assignment": {
    borderColor: "var(--chart-3)",
    bg: "var(--warning-alpha-8)",
    icon: <Building2 size={10} />,
    label: "Тимч. призначення",
  },
  reserved: {
    borderColor: "var(--chart-5)",
    bg: "var(--purple-alpha-12)",
    icon: <ShieldCheck size={10} />,
    label: "Резерв",
  },
};

// ── Shared marketplace indicator ─────────────────────────────────────

/**
 * Proposal-aware indicator:
 * - proposalStatus === 'pending' → Send (paper plane) icon
 * - proposalStatus === 'accepted' or regular marketplace → ArrowRightLeft icon
 */
function MarketplaceIndicator({ shift }: { shift: ShiftData }) {
  const isPendingProposal = shift.proposalStatus === "pending";
  return (
    <Tooltip content={isPendingProposal ? "Пропозиція надіслана" : "Зміна з біржі"}>
      <span
        className="inline-flex items-center flex-shrink-0 cursor-default"
      >
        {isPendingProposal
          ? <Send size={12} style={{ color: "var(--primary)" }} />
          : <ArrowRightLeft size={12} style={{ color: "var(--muted-foreground)" }} />
        }
      </span>
    </Tooltip>
  );
}

/** Whether a shift should show the marketplace indicator */
function hasMarketplaceSignal(shift: ShiftData): boolean {
  return !!(shift.marketplaceSource || shift.exchangeStatus === "on-exchange" || shift.proposalStatus);
}

// ── Row 2: Unit name + badge (no break here) ─────────────────────────

const UNIT_NAME_MAX_CHARS = 20;

/** Hard-truncate a unit/role name to a max visible length with ellipsis */
function truncateUnitName(name: string): string {
  if (name.length <= UNIT_NAME_MAX_CHARS) return name;
  return name.slice(0, UNIT_NAME_MAX_CHARS - 1).trimEnd() + "\u2026";
}

function SubUnitRow({ subUnits }: { subUnits: { time: string; unit: string }[] }) {
  if (subUnits.length === 0) return null;
  const primary = subUnits[0].unit;
  const extra = subUnits.length - 1;

  return (
    <div className="flex items-baseline gap-1 min-w-0">
      <Tooltip content={primary}>
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-normal)" as any,
            color: "var(--muted-foreground)",
            lineHeight: 1.35,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
            maxWidth: "100%",
            display: "block",
          }}
        >
          {truncateUnitName(primary)}
        </span>
      </Tooltip>
      {extra > 0 && (
        <span
          className="inline-flex items-center px-1 py-px rounded-[var(--radius-sm)] flex-shrink-0"
          style={{
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--font-weight-medium)" as any,
            color: "var(--muted-foreground)",
            backgroundColor: "var(--border)",
            lineHeight: 1.4,
          }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

// ── Time helpers ──────────────────────────────────────────────────────

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

function parseBreakMinutes(breakText?: string): number | null {
  if (!breakText) return null;
  const m = breakText.match(/(\d+)\s*хв/);
  return m ? Number(m[1]) : null;
}

// ── Tooltip timeline helpers ─────────────────────────────────────────

/** Format a numeric hour (e.g. 9.5) back to "09:30" */
function fmtTime(h: number): string {
  const hh = Math.floor(h % 24);
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

type TooltipSegment = {
  start: number;
  end: number;
  label: string;
  isBreak: boolean;
  color?: string;
};

/**
 * Build chronological segments for the tooltip.
 * Interleaves sub-unit work blocks with the break in the correct position.
 */
function buildTooltipSegments(shift: ShiftData): TooltipSegment[] {
  const rangeParts = shift.timeRange.split("–");
  if (rangeParts.length !== 2) return [];

  const shiftStart = parseTime(rangeParts[0].trim());
  let shiftEnd = parseTime(rangeParts[1].trim());
  if (shiftEnd <= shiftStart) shiftEnd += 24;

  const breakMins =
    shift.breakDuration != null && shift.breakDuration > 0
      ? shift.breakDuration
      : parseBreakMinutes(shift.breakText);
  const hasBreak = breakMins != null && breakMins > 0;
  const breakStartH = shift.breakStart ? parseTime(shift.breakStart) : null;

  // Collect work segments from sub-units with individual time ranges
  const workSegs: TooltipSegment[] = [];
  const hasIndividualTimes = shift.subUnits.some(
    (su) => su.time && su.time !== shift.timeRange && su.time.includes("–")
  );

  if (hasIndividualTimes) {
    for (const su of shift.subUnits) {
      const tp = (su.time || shift.timeRange).split("–");
      if (tp.length !== 2) continue;
      const s = parseTime(tp[0].trim());
      let e = parseTime(tp[1].trim());
      if (e <= s) e += 24;
      workSegs.push({ start: s, end: e, label: su.unit, isBreak: false, color: getSubUnitColor(su.unit) });
    }
  } else {
    // All sub-units share the full shift range — create a single work segment
    const unitLabel = shift.subUnits.map((su) => su.unit).join(", ") || "Робота";
    const color = shift.subUnits.length > 0 ? getSubUnitColor(shift.subUnits[0].unit) : undefined;
    workSegs.push({ start: shiftStart, end: shiftEnd, label: unitLabel, isBreak: false, color });
  }

  // If no break or no break start time, just return work segments sorted
  if (!hasBreak || breakStartH == null || !breakMins) {
    workSegs.sort((a, b) => a.start - b.start);
    return workSegs;
  }

  const breakEndH = breakStartH + breakMins / 60;

  // Split work segments around the break
  const result: TooltipSegment[] = [];
  for (const seg of workSegs) {
    if (seg.end <= breakStartH || seg.start >= breakEndH) {
      // Entirely before or after break
      result.push(seg);
    } else {
      // Split: part before break
      if (seg.start < breakStartH) {
        result.push({ ...seg, end: breakStartH });
      }
      // Part after break
      if (seg.end > breakEndH) {
        result.push({ ...seg, start: breakEndH });
      }
    }
  }

  // Add break segment
  result.push({ start: breakStartH, end: breakEndH, label: "Перерва", isBreak: true });

  result.sort((a, b) => a.start - b.start);
  return result;
}

// ── ShiftTooltip ─────────────────────────────────────────────────────

interface ShiftTooltipProps {
  shift: ShiftData;
  children: React.ReactNode;
  validationLevel?: "error" | "warning" | null;
  validationMessage?: string;
}

function ShiftTooltip({ shift, children, validationLevel, validationMessage }: ShiftTooltipProps) {
  const segments = useMemo(() => buildTooltipSegments(shift), [shift]);

  const tooltipContent = (
    <div className="flex flex-col gap-1">
      {segments.map((seg, i) => (
        <div key={i} className="flex items-center gap-2">
          {seg.isBreak ? (
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: "var(--border)" }}
            />
          ) : (
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color || "var(--primary)" }}
            />
          )}
          <span style={{
            fontSize: "var(--text-xs)",
            fontWeight: (seg.isBreak ? "var(--font-weight-normal)" : "var(--font-weight-medium)") as any,
            color: seg.isBreak ? "var(--muted-foreground)" : "var(--foreground)",
          }}>
            {fmtTime(seg.start)}–{fmtTime(seg.end % 24 === 0 && seg.end >= 24 ? 24 : seg.end)}
          </span>
          <span style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-normal)" as any,
            color: "var(--muted-foreground)",
          }}>
            {seg.label}
          </span>
        </div>
      ))}
      {validationLevel && validationMessage && (
        <>
          <Divider className="my-1" />
          <div style={{
            fontSize: "12px",
            color: validationLevel === "error" ? "var(--destructive)" : "var(--chart-3)",
            fontWeight: "var(--font-weight-medium)" as any,
            lineHeight: 1.4,
          }}>
            {validationMessage}
          </div>
        </>
      )}
    </div>
  );

  return (
    <Tooltip
      content={tooltipContent}
      placement="top"
      delay={500}
      closeDelay={150}
      classNames={{
        content: "px-3 py-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--popover)]",
      }}
    >
      <div className="w-full">
        {children}
      </div>
    </Tooltip>
  );
}

export { ShiftTooltip };

// ── Row 3+4: Break label + timeline bar ──────────────────────────────

function BreakAndBar({ shift, breakText }: { shift: ShiftData; breakText?: string }) {
  const breakMins = shift.breakDuration != null && shift.breakDuration > 0
    ? shift.breakDuration
    : parseBreakMinutes(breakText);
  const hasBreak = breakMins != null && breakMins > 0;

  return (
    <div className="flex flex-col gap-0.5 mt-0.5">
      {/* Line 3: Break label */}
      {hasBreak && (
        <div className="flex items-center gap-1">
          <Coffee size={10} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          <span
            style={{
              fontSize: "var(--text-2xs)",
              fontWeight: "var(--font-weight-normal)" as any,
              color: "var(--muted-foreground)",
              lineHeight: 1.3,
            }}
          >
            {breakMins}хв
          </span>
        </div>
      )}
      {/* Line 4: Timeline strip */}
      <ShiftTimelineBar shift={shift} height={4} />
    </div>
  );
}

// ── Main ShiftCard ────────────────────────────────────────────────────

interface ShiftCardProps {
  shift: ShiftData;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  employeeId?: string;
  dayIndex?: number;
  draggable?: boolean;
  validationLevel?: "error" | "warning" | null;
  validationMessage?: string;
}

export function ShiftCard({
  shift,
  onClick,
  onContextMenu,
  isSelected,
  employeeId,
  dayIndex,
  draggable = false,
  validationLevel = null,
  validationMessage = "",
}: ShiftCardProps) {
  const status = shift.status || "normal";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.normal;
  const isAbsence = isBlockingStatus(status);
  const isFullDay = shift.timeRange === "00:00–24:00";

  const [{ isDragging }, dragRef, preview] = useDrag(
    () => ({
      type: SHIFT_DND_TYPE,
      item: {
        type: SHIFT_DND_TYPE,
        shiftId: shift.id,
        shift,
        sourceEmployeeId: employeeId || "",
        sourceDayIndex: dayIndex ?? -1,
        sourceType: "employee" as const,
      } as DragItem,
      canDrag: draggable && !isAbsence,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [shift, employeeId, dayIndex, draggable, isAbsence]
  );

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const ref = useRef<HTMLButtonElement>(null);

  // Always connect drag connector using callback ref pattern
  const combinedRef = React.useCallback((node: HTMLButtonElement | null) => {
    ref.current = node;
    dragRef(node);
  }, [dragRef]);

  // ── Absence card ──
  if (isAbsence) {
    const absenceDisplayLabel = shift.absenceLabel || config.label || "";
    const cardContent = (
      <button
        ref={ref}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={`w-full text-left rounded-[var(--radius)] px-1 py-1 cursor-default transition-shadow hover:shadow-[var(--elevation-sm)] ${isSelected ? "ring-2 ring-[var(--ring)]" : ""}`}
        style={{
          minHeight: 0,
          overflow: "hidden",
          opacity: isDragging ? 0.35 : 1,
          borderStyle: "solid",
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderLeftWidth: 1,
          borderTopColor: "var(--border)",
          borderRightColor: "var(--border)",
          borderBottomColor: "var(--border)",
          borderLeftColor: "var(--border)",
          backgroundColor: config.bg,
        }}
      >
        {/* Row 1: Time + type badge */}
        <div className="flex items-center justify-between gap-1">
          <p
            className="truncate"
            style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, lineHeight: 1.33, color: "var(--foreground)" }}
          >
            {isFullDay ? "Весь день" : shift.timeRange}
          </p>
        </div>

        {/* Row 2: Absence label as location equivalent */}
        <div className="flex items-baseline gap-1 min-w-0">
          {config.icon && (
            <span className="inline-flex items-center flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
              {config.icon}
            </span>
          )}
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-normal)" as any,
              color: "var(--muted-foreground)",
              lineHeight: 1.35,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
              maxWidth: "100%",
              display: "block",
            }}
          >
            {absenceDisplayLabel}
          </span>
        </div>

        {/* Row 3+4: Progress bar (for non-full-day absences) */}
        {!isFullDay && <BreakAndBar shift={shift} breakText={shift.breakText} />}
      </button>
    );

    return (
      <ShiftTooltip shift={shift}>
        {cardContent}
      </ShiftTooltip>
    );
  }

  // ── Normal shift card ──
  // Border: marketplace gets dashed purple; errors/warnings use inline icon only (no border change)
  const isMarketplace = hasMarketplaceSignal(shift);
  const borderColor = isMarketplace ? "var(--chart-5)" : "var(--border)";
  const borderWidth = 1;
  const borderStyle = isMarketplace ? "dashed" : "solid";
  const cardBg = isMarketplace ? "var(--purple-alpha-5)" : "var(--card)";
  const showRing = isSelected;

  // "Recently created" one-time entry animation
  const isNew = sessionCreatedShiftIds.has(shift.id);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isNew && cardRef.current) {
      const el = cardRef.current;
      el.style.animation = "shiftCreatedPulse 1.5s ease-out";
      const handler = () => {
        el.style.animation = "";
        sessionCreatedShiftIds.delete(shift.id);
      };
      el.addEventListener("animationend", handler, { once: true });
      return () => el.removeEventListener("animationend", handler);
    }
  }, [isNew, shift.id]);

  // Post-edit feedback: brief ring fade-out when the drawer closes
  const prevSelectedRef = useRef(isSelected);
  const [postEditGlow, setPostEditGlow] = useState(false);
  useEffect(() => {
    const wasSelected = prevSelectedRef.current;
    prevSelectedRef.current = isSelected;
    if (wasSelected && !isSelected) {
      setPostEditGlow(true);
      const t = setTimeout(() => setPostEditGlow(false), 700);
      return () => clearTimeout(t);
    }
  }, [isSelected]);

  const cardContent = (
    <div ref={cardRef}>
      <button
        ref={combinedRef}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={`w-full text-left rounded-[var(--radius)] px-1 py-1 cursor-pointer transition-shadow hover:shadow-[var(--elevation-sm)] ${showRing ? "ring-2 ring-[var(--ring)]" : ""}`}
        style={{
          minHeight: 0,
          overflow: "hidden",
          opacity: isDragging ? 0.35 : 1,
          cursor: draggable ? "grab" : "pointer",
          borderStyle,
          borderTopWidth: borderWidth,
          borderRightWidth: borderWidth,
          borderBottomWidth: borderWidth,
          borderLeftWidth: borderWidth,
          borderTopColor: borderColor,
          borderRightColor: borderColor,
          borderBottomColor: borderColor,
          borderLeftColor: borderColor,
          backgroundColor: cardBg,
          animation: postEditGlow ? "shiftPostEditFade 0.7s ease-out forwards" : undefined,
        }}
      >
        {/* Row 1: Time (left) + status icons row (right) */}
        <div className="flex items-center justify-between gap-1">
          <p
            className="truncate"
            style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, lineHeight: 1.33, color: "var(--foreground)" }}
          >
            {shift.timeRange}
          </p>
          {/* Right: critical error + marketplace icons only */}
          {(validationLevel === "error" || hasMarketplaceSignal(shift)) && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {validationLevel === "error" && (
                <AlertTriangle size={11} style={{ color: "var(--destructive)", flexShrink: 0 }} />
              )}
              {hasMarketplaceSignal(shift) && <MarketplaceIndicator shift={shift} />}
            </div>
          )}
        </div>

        {/* Row 2: Unit name + +N badge */}
        <SubUnitRow subUnits={shift.subUnits} />

        {/* Row 3+4: Break label (☕ 30хв) + ShiftTimelineBar */}
        <BreakAndBar shift={shift} breakText={shift.breakText} />
      </button>
    </div>
  );

  return (
    <ShiftTooltip shift={shift} validationLevel={validationLevel} validationMessage={validationMessage}>
      {cardContent}
    </ShiftTooltip>
  );
}

// ── Open Shift Card ───────────────────────────────────────────────────

interface OpenShiftCardProps {
  shift: ShiftData;
  openShiftId: string;
  deptId: string;
  dayIndex: number;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
}

export function OpenShiftCard({
  shift,
  openShiftId,
  deptId,
  dayIndex,
  onClick,
  onContextMenu,
  isSelected,
}: OpenShiftCardProps) {
  const isOnExchange = shift.exchangeStatus === "on-exchange";

  const [{ isDragging }, dragRef, preview] = useDrag(
    () => ({
      type: OPEN_SHIFT_DND_TYPE,
      item: {
        type: OPEN_SHIFT_DND_TYPE,
        shiftId: shift.id,
        shift,
        sourceEmployeeId: "",
        sourceDayIndex: dayIndex,
        sourceType: "open-shift" as const,
        sourceDeptId: deptId,
        sourceOpenShiftId: openShiftId,
      } as DragItem,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [shift, dayIndex, deptId, openShiftId]
  );

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const ref = useRef<HTMLButtonElement>(null);

  // Always connect drag connector using callback ref pattern for open shifts
  const combinedOpenRef = React.useCallback((node: HTMLButtonElement | null) => {
    ref.current = node;
    dragRef(node);
  }, [dragRef]);

  // Open/unassigned → grey/muted; exchange → purple dashed
  const bgColor = isOnExchange ? "var(--purple-alpha-5)" : "var(--muted)";
  const borderClr = isOnExchange ? "var(--chart-5)" : "var(--border)";

  const cardContent = (
    <button
      ref={combinedOpenRef}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full text-left rounded-[var(--radius)] px-1 py-1 cursor-grab transition-shadow hover:shadow-[var(--elevation-sm)] ${isSelected ? "ring-2 ring-[var(--ring)]" : ""}`}
      style={{
        minHeight: 0,
        overflow: "hidden",
        opacity: isDragging ? 0.35 : 1,
        borderStyle: isOnExchange ? "dashed" : "solid",
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderTopColor: borderClr,
        borderRightColor: borderClr,
        borderBottomColor: borderClr,
        borderLeftColor: borderClr,
        backgroundColor: bgColor,
      }}
    >
      {/* Row 1: Time + marketplace icon */}
      <div className="flex items-center justify-between gap-1">
        <p
          className="truncate"
          style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, lineHeight: 1.33, color: "var(--foreground)" }}
        >
          {shift.timeRange}
        </p>
        {isOnExchange && <MarketplaceIndicator shift={shift} />}
      </div>

      {/* Row 2: Unit + badge */}
      <SubUnitRow subUnits={shift.subUnits} />

      {/* Row 3+4: Break meta + bar */}
      <BreakAndBar shift={shift} breakText={shift.breakText} />
    </button>
  );

  return (
    <ShiftTooltip shift={shift}>
      {cardContent}
    </ShiftTooltip>
  );
}

// ── Fact-mode shift card ──────────────────────────────────────────────

interface FactShiftCardProps {
  shift: ShiftData;
  onClick?: () => void;
  isSelected?: boolean;
}

export function FactShiftCard({
  shift,
  onClick,
  isSelected,
}: FactShiftCardProps) {
  const status = shift.status || "normal";
  const isAbsence = isBlockingStatus(status);
  const absConfig = STATUS_CONFIG[status] || STATUS_CONFIG.normal;

  if (isAbsence) {
    const isFullDayFact = shift.timeRange === "00:00–24:00";
    const absenceDisplayLabel = shift.absenceLabel || absConfig.label || "";
    return (
      <button
        onClick={onClick}
        className={`w-full text-left rounded-[var(--radius)] px-1 py-1 cursor-pointer transition-shadow hover:shadow-[var(--elevation-sm)] ${isSelected ? "ring-2 ring-[var(--ring)]" : ""}`}
        style={{
          minHeight: 0,
          overflow: "hidden",
          borderStyle: "solid",
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderLeftWidth: 1,
          borderTopColor: "var(--border)",
          borderRightColor: "var(--border)",
          borderBottomColor: "var(--border)",
          borderLeftColor: "var(--border)",
          backgroundColor: absConfig.bg,
        }}
      >
        {/* Row 1: Time */}
        <div className="flex items-center justify-between gap-1">
          <p
            className="truncate"
            style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, lineHeight: 1.33, color: "var(--foreground)" }}
          >
            {isFullDayFact ? "Весь день" : shift.timeRange}
          </p>
        </div>

        {/* Row 2: Absence label */}
        <div className="flex items-baseline gap-1 min-w-0">
          {absConfig.icon && (
            <span className="inline-flex items-center flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
              {absConfig.icon}
            </span>
          )}
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-normal)" as any,
              color: "var(--muted-foreground)",
              lineHeight: 1.35,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
              maxWidth: "100%",
              display: "block",
            }}
          >
            {absenceDisplayLabel}
          </span>
        </div>

        {/* Row 3+4: Progress bar (for non-full-day absences) */}
        {!isFullDayFact && <BreakAndBar shift={shift} breakText={shift.breakText} />}
      </button>
    );
  }

  // ── Determine fact visual status ──
  // In-progress: shift has no actualTimeRange and no explicit factStatus
  const isInProgress = !shift.actualTimeRange && !shift.factStatus;
  const factStatus = isInProgress ? "in-progress" : (shift.factStatus || "matched");

  const actualTime = shift.actualTimeRange || shift.timeRange;
  const actualUnits = shift.actualSubUnits || shift.subUnits;
  const delta = shift.deltaHours ?? 0;

  // Ultra-minimalist visual config
  const isMatched = factStatus === "matched";
  const isNoShow = factStatus === "no-show";

  // Border color: only colored for problems, neutral otherwise
  const borderColor: Record<string, string> = {
    "in-progress": "var(--primary)",
    overtime: "var(--destructive)",
    missing: "var(--chart-3)",
    matched: "var(--border)",
    "no-show": "var(--destructive)",
  };

  // Background: matched = muted (silent), in-progress = primary tint, problems = subtle
  const bgColor: Record<string, string> = {
    "in-progress": "var(--primary-alpha-4)",
    overtime: "var(--destructive-alpha-5)",
    missing: "var(--warning-alpha-5)",
    matched: "var(--muted)",
    "no-show": "var(--destructive-alpha-8)",
  };

  // Delta badge: minimal format
  const deltaLabel =
    isNoShow ? null :
    isMatched ? null :
    isInProgress ? null :
    delta > 0 ? `+${Math.round(delta * 10) / 10}` :
    delta < 0 ? `${Math.round(delta * 10) / 10}` :
    null;

  const deltaColor: Record<string, string> = {
    overtime: "var(--destructive)",
    missing: "var(--chart-3)",
  };
  const deltaBgMap: Record<string, string> = {
    overtime: "var(--destructive-alpha-10)",
    missing: "var(--warning-alpha-10)",
  };

  const actualShiftForBar: ShiftData = {
    ...shift,
    timeRange: actualTime,
    subUnits: actualUnits,
  };

  const cardContent = (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-[var(--radius)] px-1 py-1 cursor-pointer transition-all hover:shadow-[var(--elevation-sm)] ${isSelected ? "ring-2 ring-[var(--ring)]" : ""}`}
      style={{
        minHeight: 0,
        overflow: "hidden",
        borderStyle: isInProgress ? "dashed" : "solid",
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderTopColor: borderColor[factStatus],
        borderRightColor: borderColor[factStatus],
        borderBottomColor: borderColor[factStatus],
        borderLeftColor: borderColor[factStatus],
        backgroundColor: bgColor[factStatus],
        // Matched = silent success: reduced opacity, full on hover
        opacity: isMatched ? 0.6 : 1,
        transition: "opacity 150ms ease, box-shadow 150ms ease",
      }}
      onMouseEnter={(e) => { if (isMatched) e.currentTarget.style.opacity = "1"; }}
      onMouseLeave={(e) => { if (isMatched) e.currentTarget.style.opacity = "0.6"; }}
    >
      {/* Row 1: Actual time + indicators */}
      <div className="flex items-center justify-between gap-1">
        <p
          className="truncate"
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)" as any,
            lineHeight: 1.33,
            color: isNoShow ? "var(--destructive)" : isMatched ? "var(--muted-foreground)" : "var(--foreground)",
            textDecoration: isNoShow ? "line-through" : "none",
          }}
        >
          {actualTime}
        </p>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* In-progress: pulsing dot */}
          {isInProgress && (
            <span
              className="flex-shrink-0"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--primary)",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          )}
          {/* No-show: ✗ marker */}
          {isNoShow && (
            <span
              className="flex-shrink-0"
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-weight-semibold)" as any,
                color: "var(--destructive)",
                lineHeight: 1,
              }}
            >
              ✗
            </span>
          )}
          {/* Delta badge: only for overtime/missing */}
          {deltaLabel && (
            <span
              className="flex-shrink-0 px-1 py-px rounded-[var(--radius-sm)]"
              style={{
                fontSize: "var(--text-2xs)",
                fontWeight: "var(--font-weight-semibold)" as any,
                color: deltaColor[factStatus] || "var(--foreground)",
                backgroundColor: deltaBgMap[factStatus] || "transparent",
                lineHeight: 1.4,
              }}
            >
              {deltaLabel}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Unit + badge */}
      <SubUnitRow subUnits={actualUnits} />

      {/* Row 3: Break meta */}
      <BreakAndBar shift={actualShiftForBar} breakText={shift.breakText} />
    </button>
  );

  return (
    <ShiftTooltip shift={shift}>
      {cardContent}
    </ShiftTooltip>
  );
}

// ── Drag Ghost Preview ────────────────────────────────────────────────

export function DragGhostPreview({ shift }: { shift: ShiftData }) {
  return (
    <div
      className="rounded-[var(--radius)] px-1 py-1 pointer-events-none"
      style={{
        width: 130,
        borderStyle: "solid",
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderTopColor: "var(--border)",
        borderRightColor: "var(--border)",
        borderBottomColor: "var(--border)",
        borderLeftColor: "var(--border)",
        backgroundColor: "var(--card)",
        boxShadow: "var(--elevation-lg)",
        opacity: 0.9,
      }}
    >
      <p
        className="truncate"
        style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, lineHeight: 1.33, color: "var(--foreground)" }}
      >
        {shift.timeRange}
      </p>
      <SubUnitRow subUnits={shift.subUnits} />
    </div>
  );
}

// ── Timeline progress bar ─────────────────────────────────────────────

interface ShiftTimelineBarProps {
  shift: ShiftData;
  height?: number;
}

function ShiftTimelineBar({ shift, height = 4 }: ShiftTimelineBarProps) {
  const segments = buildTooltipSegments(shift);
  if (segments.length === 0) return null;

  const rangeParts = shift.timeRange.split("–");
  if (rangeParts.length !== 2) return null;
  const shiftStart = parseTime(rangeParts[0].trim());
  let shiftEnd = parseTime(rangeParts[1].trim());
  if (shiftEnd <= shiftStart) shiftEnd += 24;
  const totalH = shiftEnd - shiftStart;
  if (totalH <= 0) return null;

  const timelineTitle = segments.map((s) => `${fmtTime(s.start)}–${fmtTime(s.end)} ${s.label}`).join(" → ");

  return (
    <Tooltip content={timelineTitle}>
    <div
      className="flex rounded-full overflow-hidden"
      style={{ width: 96, height }}
    >
      {segments.map((seg, i) => (
        <div
          key={i}
          style={{
            width: `${((seg.end - seg.start) / totalH) * 100}%`,
            backgroundColor: seg.isBreak ? "var(--card)" : (seg.color || "var(--primary)"),
            backgroundImage: seg.isBreak
              ? "repeating-linear-gradient(135deg, transparent, transparent 1.5px, var(--muted-foreground) 1.5px, var(--muted-foreground) 2px)"
              : undefined,
            backgroundSize: seg.isBreak ? "4px 4px" : undefined,
            opacity: seg.isBreak ? 0.4 : undefined,
            height: "100%",
          }}
        />
      ))}
    </div>
    </Tooltip>
  );
}

// ── CSS keyframes for entry animation ────────────────────────────────
if (typeof document !== "undefined") {
  const styleId = "shift-card-keyframes";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes shiftCreatedPulse {
        0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.25); transform: scale(0.97); opacity: 0.7; }
        30% { box-shadow: 0 0 0 4px rgba(59,130,246,0.15); transform: scale(1); opacity: 1; }
        100% { box-shadow: 0 0 0 0 transparent; transform: scale(1); opacity: 1; }
      }
      @keyframes shiftPostEditFade {
        0% { box-shadow: 0 0 0 2px rgba(59,130,246,0.45); }
        60% { box-shadow: 0 0 0 2px rgba(59,130,246,0.08); }
        100% { box-shadow: 0 0 0 0 transparent; }
      }
    `;
    document.head.appendChild(style);
  }
}
