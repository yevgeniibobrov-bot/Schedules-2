import React, { useMemo, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Department, ResourceControl, Employee } from "./WeeklyTable";
import type { ShiftData } from "./ShiftCard";
import { RESOURCE_ROW_H, gridWidthPx, type TimeRange } from "./DayViewComponents";

// ── Helpers ───────────────────────────────────────────────────────────

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

function parseTimeRange(range: string): { start: number; end: number } | null {
  const parts = range.split("–");
  if (parts.length !== 2) return null;
  let start = parseTime(parts[0].trim());
  let end = parseTime(parts[1].trim());
  if (end <= start) end += 24;
  return { start, end };
}

function hourToPercent(hour: number, range: TimeRange): number {
  const span = range.end - range.start;
  return ((hour - range.start) / span) * 100;
}

function shiftBelongsToSubUnit(shift: ShiftData, subUnitName: string): boolean {
  if (!shift.subUnits || shift.subUnits.length === 0) return false;
  return shift.subUnits.some((su) => su.unit === subUnitName);
}

function isBlockingStatus(status?: string): boolean {
  if (!status) return false;
  return ["vacation", "sick", "dayoff", "reserved", "maternity", "study"].includes(status);
}

function formatHour(h: number): string {
  const hh = String(Math.floor(h)).padStart(2, "0");
  const mm = h % 1 === 0 ? "00" : "30";
  return `${hh}:${mm}`;
}

/** Format number: max 1 decimal, hide trailing .0 */
function fmtNum(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
}

/** Format signed delta: +1, -2.3, 0 */
function fmtDelta(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  if (rounded === 0) return "0";
  const abs = Math.abs(rounded);
  const s = abs % 1 === 0 ? String(abs) : abs.toFixed(1);
  return rounded > 0 ? `+${s}` : `-${s}`;
}

// ── Forecast Distribution ─────────────────────────────────────────────

function buildForecastWeights(range: TimeRange): number[] {
  const halfHoursCount = (range.end - range.start) * 2;
  const w: number[] = [];
  for (let i = 0; i < halfHoursCount; i++) {
    const hour = range.start + i * 0.5;
    if (hour < 7) w.push(0.3);
    else if (hour < 8) w.push(0.5);
    else if (hour < 9) w.push(0.7);
    else if (hour < 10) w.push(0.9);
    else if (hour < 14) w.push(1.0);
    else if (hour < 15) w.push(0.9);
    else if (hour < 17) w.push(0.8);
    else if (hour < 18) w.push(0.7);
    else if (hour < 19) w.push(0.6);
    else if (hour < 20) w.push(0.5);
    else if (hour < 21) w.push(0.4);
    else if (hour < 22) w.push(0.3);
    else w.push(0.15);
  }
  return w;
}

function distributeForecast(dailyForecastHours: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return weights.map(() => 0);
  const scale = dailyForecastHours / (0.5 * totalWeight);
  return weights.map((w) => Math.round(w * scale * 10) / 10);
}

function computeScheduledPerHalfHour(
  employees: Employee[],
  dayIndex: number,
  focusedSubUnit: string | null,
  range: TimeRange
): number[] {
  const halfHoursCount = (range.end - range.start) * 2;
  const counts = new Array(halfHoursCount).fill(0);
  for (const emp of employees) {
    const dayShifts = emp.shifts[String(dayIndex)] || [];
    for (const shift of dayShifts) {
      if (isBlockingStatus(shift.status)) continue;
      if (focusedSubUnit && !shiftBelongsToSubUnit(shift, focusedSubUnit)) continue;

      const parsed = parseTimeRange(shift.timeRange);
      if (!parsed) continue;
      const clampedStart = Math.max(parsed.start, range.start);
      const clampedEnd = Math.min(parsed.end, range.end);

      for (let i = 0; i < halfHoursCount; i++) {
        const slotStart = range.start + i * 0.5;
        const slotEnd = slotStart + 0.5;
        if (clampedStart < slotEnd && clampedEnd > slotStart) {
          counts[i]++;
        }
      }
    }
  }
  return counts;
}

function computeSubUnitBreakdown(
  employees: Employee[],
  dayIndex: number,
  slotStart: number,
  slotEnd: number
): { unit: string; count: number }[] {
  const map = new Map<string, number>();
  for (const emp of employees) {
    const dayShifts = emp.shifts[String(dayIndex)] || [];
    for (const shift of dayShifts) {
      if (isBlockingStatus(shift.status)) continue;
      const parsed = parseTimeRange(shift.timeRange);
      if (!parsed) continue;
      if (parsed.start >= slotEnd || parsed.end <= slotStart) continue;
      if (shift.subUnits && shift.subUnits.length > 0) {
        for (const su of shift.subUnits) {
          const suParsed = parseTimeRange(su.time);
          if (!suParsed) continue;
          if (suParsed.start < slotEnd && suParsed.end > slotStart) {
            map.set(su.unit, (map.get(su.unit) || 0) + 1);
          }
        }
      } else {
        map.set("Загальне", (map.get("Загальне") || 0) + 1);
      }
    }
  }
  return Array.from(map.entries())
    .map(([unit, count]) => ({ unit, count }))
    .sort((a, b) => b.count - a.count);
}

// ══════════════════════════════════════════════════════════════════════
// CoveragePopover — unified component (desktop hover/click, tablet tap)
// ══════════════════════════════════════════════════════════════════════

interface CoveragePopoverProps {
  timeLabel: string;
  forecast: number;
  scheduled: number;
  breakdown: { unit: string; count: number }[];
  anchorRect: DOMRect;
}

function CoveragePopover({ timeLabel, forecast, scheduled, breakdown, anchorRect }: CoveragePopoverProps) {
  const diff = scheduled - forecast;
  const diffColor = diff < 0 ? "var(--destructive)" : diff > 0 ? "var(--chart-2)" : "var(--muted-foreground)";

  const top = anchorRect.top - 8;
  const left = anchorRect.left + anchorRect.width / 2;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: `calc(100vh - ${top}px)`,
          left: left,
          transform: "translateX(-50%)",
          pointerEvents: "auto",
          backgroundColor: "var(--popover)",
          color: "var(--popover-foreground)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--elevation-md)",
          border: "1px solid var(--border)",
          padding: "8px 12px",
          minWidth: 180,
          maxWidth: 260,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Time header */}
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
            marginBottom: 6,
            borderBottom: "1px solid var(--border)",
            paddingBottom: 6,
          }}
        >
          {timeLabel}
        </div>

        {/* Metrics rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <PopoverRow
            dotColor="var(--primary)"
            label="Прогноз"
            value={`${fmtNum(forecast)} осіб`}
          />
          <PopoverRow
            dotColor="var(--chart-2)"
            label="Графік"
            value={`${fmtNum(scheduled)} осіб`}
          />
          <PopoverRow
            dotColor={diffColor}
            label="Різниця"
            value={`${fmtDelta(diff)} осіб`}
            valueColor={diffColor}
          />
        </div>

        {/* Sub-unit breakdown */}
        {breakdown.length > 1 && (
          <div
            style={{
              marginTop: 6,
              paddingTop: 6,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "var(--text-2xs)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--muted-foreground)",
                marginBottom: 3,
              }}
            >
              За дільницями
            </div>
            {breakdown.map((b) => (
              <div
                key={b.unit}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  padding: "1px 0",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--text-2xs)",
                    fontWeight: "var(--font-weight-normal)",
                    color: "var(--foreground)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {b.unit}
                </span>
                <span
                  style={{
                    fontSize: "var(--text-2xs)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)",
                    flexShrink: 0,
                  }}
                >
                  {b.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function PopoverRow({
  dotColor,
  label,
  value,
  valueColor,
}: {
  dotColor: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: dotColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--font-weight-normal)",
            color: "var(--muted-foreground)",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "var(--text-2xs)",
          fontWeight: "var(--font-weight-semibold)",
          color: valueColor || "var(--foreground)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Resource Row Timeline Component
// ══════════════════════════════════════════════════════════════════════

interface DayResourceRowProps {
  dept: Department;
  rc: ResourceControl;
  dayIndex: number;
  isFact: boolean;
  focusedSubUnit?: string | null;
  range: TimeRange;
}

export function DayResourceRow({
  dept,
  rc,
  dayIndex,
  isFact,
  focusedSubUnit,
  range,
}: DayResourceRowProps) {
  const focusedSu = focusedSubUnit
    ? rc.subUnits.find((su) => su.name === focusedSubUnit)
    : null;
  const effective = focusedSu ? focusedSu.daily : rc.daily;
  const d = effective[dayIndex];
  if (!d) return null;

  const w = gridWidthPx(range);
  const span = range.end - range.start;

  const forecastWeights = useMemo(() => buildForecastWeights(range), [range]);
  const forecastPerSlot = useMemo(
    () => distributeForecast(d.forecast, forecastWeights),
    [d.forecast, forecastWeights]
  );
  const scheduledPerSlot = useMemo(
    () => computeScheduledPerHalfHour(dept.employees, dayIndex, focusedSubUnit || null, range),
    [dept.employees, dayIndex, focusedSubUnit, range]
  );

  const maxVal = Math.max(1, ...forecastPerSlot, ...scheduledPerSlot);

  // Popover: hover OR click to pin
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSlotEnter = useCallback((idx: number) => {
    if (pinned) return;
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setActiveSlot(idx);
  }, [pinned]);

  const handleSlotLeave = useCallback(() => {
    if (pinned) return;
    hideTimeout.current = setTimeout(() => setActiveSlot(null), 120);
  }, [pinned]);

  const handleSlotClick = useCallback((idx: number) => {
    if (pinned && activeSlot === idx) {
      setPinned(false);
      setActiveSlot(null);
    } else {
      setActiveSlot(idx);
      setPinned(true);
    }
  }, [pinned, activeSlot]);

  // Close pinned popover on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!pinned) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPinned(false);
        setActiveSlot(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pinned]);

  // Popover data
  const popoverData = useMemo(() => {
    if (activeSlot === null) return null;
    const slotHour = range.start + activeSlot * 0.5;
    const slotEnd = slotHour + 0.5;
    const timeLabel = `${formatHour(slotHour)} – ${formatHour(slotEnd)}`;
    const forecast = forecastPerSlot[activeSlot] ?? 0;
    const scheduled = scheduledPerSlot[activeSlot] ?? 0;
    const breakdown = computeSubUnitBreakdown(dept.employees, dayIndex, slotHour, slotEnd);
    return { timeLabel, forecast, scheduled, breakdown };
  }, [activeSlot, range, forecastPerSlot, scheduledPerSlot, dept.employees, dayIndex]);

  const anchorRect = activeSlot !== null && slotRefs.current[activeSlot]
    ? slotRefs.current[activeSlot]!.getBoundingClientRect()
    : null;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        height: RESOURCE_ROW_H,
        width: w,
        backgroundColor: "var(--muted)",
        padding: "4px 0 4px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Bar chart */}
      <div className="relative w-full h-full flex items-end" style={{ zIndex: 2 }}>
        {forecastPerSlot.map((forecast, i) => {
          const scheduled = scheduledPerSlot[i];
          const slotHour = range.start + i * 0.5;
          const leftPct = hourToPercent(slotHour, range);
          const widthPct = (0.5 / span) * 100;
          const barMaxH = RESOURCE_ROW_H - 10;

          const forecastH = maxVal > 0 ? (forecast / maxVal) * barMaxH : 0;
          const scheduledH =
            maxVal > 0 ? (Math.min(scheduled, forecast) / maxVal) * barMaxH : 0;
          const overH = scheduled > forecast ? ((scheduled - forecast) / maxVal) * barMaxH : 0;
          const deficit = forecast > 0 && scheduled < forecast;
          const isActive = activeSlot === i;

          return (
            <div
              key={i}
              ref={(el) => { slotRefs.current[i] = el; }}
              className="absolute bottom-0 flex flex-col items-center justify-end"
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                height: "100%",
                padding: "0 1px",
                cursor: "pointer",
              }}
              onMouseEnter={() => handleSlotEnter(i)}
              onMouseLeave={handleSlotLeave}
              onClick={() => handleSlotClick(i)}
            >
              {/* Forecast outline bar */}
              <div
                className="w-full relative rounded-t-sm"
                style={{
                  height: Math.max(forecastH, 1),
                  backgroundColor: isActive ? "var(--primary-alpha-12)" : "var(--primary-alpha-8)",
                  borderLeft: "1px solid var(--primary-alpha-25)",
                  borderRight: "1px solid var(--primary-alpha-25)",
                  borderTop: "1px solid var(--primary-alpha-25)",
                  transition: "background-color 0.1s",
                }}
              >
                {/* Scheduled fill */}
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-sm"
                  style={{
                    height: Math.min(scheduledH + overH, forecastH + overH),
                    backgroundColor: deficit
                      ? "var(--destructive-alpha-15)"
                      : "var(--success-alpha-12)",
                  }}
                />
                {/* Solid scheduled portion */}
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: scheduledH,
                    backgroundColor: deficit ? "var(--destructive)" : "var(--chart-2)",
                    opacity: isActive ? 0.8 : 0.6,
                    borderRadius: "1px 1px 0 0",
                    transition: "opacity 0.1s",
                  }}
                />
                {/* Over-coverage */}
                {overH > 0 && (
                  <div
                    className="absolute left-0 right-0 rounded-t-sm"
                    style={{
                      bottom: forecastH,
                      height: overH,
                      backgroundColor: "var(--chart-2)",
                      opacity: 0.35,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Popover */}
      {popoverData && anchorRect && (
        <CoveragePopover
          timeLabel={popoverData.timeLabel}
          forecast={popoverData.forecast}
          scheduled={popoverData.scheduled}
          breakdown={popoverData.breakdown}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}