import React from "react";
import { Thermometer } from "lucide-react";
import { Leaf, Building02, ShieldCheck, Coffee, Layers, ArrowLeftRight, PaperPlane, AddPlus, Clock, TriangleWarning } from "@fzwp/ui-kit/icons";
import type { ShiftData } from "./ShiftCard";
import { getSubUnitColor, getSubUnitAlphaColor } from "./subUnitColors";

// ══════════════════════════════════════════════════════════════════════
// Day View Card Components — optimized for timeline display
// Best practices: Google Calendar, Calendly, Outlook, Notion Calendar
// Nielsen Norman: context-appropriate detail density, minimalism
// Multi-segment visualization: sub-units as colored blocks + break gaps
// ══════════════════════════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────────────────────────

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

interface TimeSegment {
  type: "subunit" | "break";
  start: number;
  end: number;
  duration: number;
  unit?: string;
  color?: string;
}

/** Parse shift into timeline segments (subunits + breaks) */
function parseShiftSegments(shift: ShiftData): TimeSegment[] {
  const segments: TimeSegment[] = [];
  
  // Parse main time range
  const mainParts = shift.timeRange.split("–");
  if (mainParts.length !== 2) return segments;
  
  const shiftStart = parseTime(mainParts[0].trim());
  let shiftEnd = parseTime(mainParts[1].trim());
  if (shiftEnd <= shiftStart) shiftEnd += 24;

  // Parse break if exists
  let breakStart: number | null = null;
  let breakEnd: number | null = null;
  
  if (shift.breakStart && shift.breakDuration) {
    breakStart = parseTime(shift.breakStart);
    breakEnd = breakStart + shift.breakDuration / 60;
  }

  // Parse sub-units
  const subUnits = shift.subUnits || [];
  
  if (subUnits.length === 0) {
    // No sub-units - entire shift as one segment
    segments.push({
      type: "subunit",
      start: shiftStart,
      end: shiftEnd,
      duration: shiftEnd - shiftStart,
      unit: "",
      color: "var(--chart-1)",
    });
    return segments;
  }

  // Build timeline from sub-units with alpha colors
  const unitColorMap: Record<string, string> = {};
  const uniqueUnits = Array.from(new Set(subUnits.map(su => su.unit)));
  uniqueUnits.forEach((unit) => {
    unitColorMap[unit] = getSubUnitAlphaColor(unit);
  });

  // Sort sub-units by time
  const sortedSubUnits = [...subUnits].sort((a, b) => {
    const timeA = parseTime(a.time.split("–")[0].trim());
    const timeB = parseTime(b.time.split("–")[0].trim());
    return timeA - timeB;
  });

  // Build segments
  sortedSubUnits.forEach((su, idx) => {
    const parts = su.time.split("–");
    if (parts.length !== 2) return;
    
    let start = parseTime(parts[0].trim());
    let end = parseTime(parts[1].trim());
    if (end <= start) end += 24;

    // Check if break falls within this sub-unit
    if (breakStart !== null && breakEnd !== null && breakStart >= start && breakEnd <= end) {
      // Split around break
      if (breakStart > start) {
        segments.push({
          type: "subunit",
          start,
          end: breakStart,
          duration: breakStart - start,
          unit: su.unit,
          color: unitColorMap[su.unit],
        });
      }
      
      segments.push({
        type: "break",
        start: breakStart,
        end: breakEnd,
        duration: breakEnd - breakStart,
      });
      
      if (breakEnd < end) {
        segments.push({
          type: "subunit",
          start: breakEnd,
          end,
          duration: end - breakEnd,
          unit: su.unit,
          color: unitColorMap[su.unit],
        });
      }
    } else {
      // No break in this segment
      segments.push({
        type: "subunit",
        start,
        end,
        duration: end - start,
        unit: su.unit,
        color: unitColorMap[su.unit],
      });
    }
  });

  // MERGE consecutive segments with same unit (reduce visual noise)
  const merged: TimeSegment[] = [];
  for (let i = 0; i < segments.length; i++) {
    const current = segments[i];
    
    if (current.type === "break") {
      merged.push(current);
      continue;
    }

    // Try to merge with previous if same unit (skip breaks for merge check)
    if (merged.length > 0) {
      const prev = merged[merged.length - 1];
      if (prev.type === "subunit" && prev.unit === current.unit) {
        // Merge: extend duration
        prev.duration += current.duration;
        prev.end = current.end;
        continue;
      }
    }

    merged.push(current);
  }

  return merged;
}

/**
 * Determine whether a subunit segment should show its label.
 * For split-around-break: if both sides of the break belong to the
 * same workstation (unit + color), show the label only on the FIRST part.
 */
function shouldShowUnitLabel(segments: TimeSegment[], idx: number): boolean {
  const seg = segments[idx];
  if (seg.type !== "subunit" || !seg.unit) return false;

  // Walk backward through preceding segments
  for (let i = idx - 1; i >= 0; i--) {
    const prev = segments[i];
    if (prev.type === "break") continue; // skip over breaks
    // Found a preceding subunit — compare
    return prev.unit !== seg.unit || prev.color !== seg.color;
  }
  // No preceding subunit → this is the first one, show label
  return true;
}

// ── Status helpers ────────────────────────────────────────────────────

const STATUS_ICONS: Record<string, React.ReactNode> = {
  leave: <Leaf size={12} />,
  sick: <Thermometer size={12} />,
  "temp-assignment": <Building02 size={12} />,
  reserved: <ShieldCheck size={12} />,
};

const STATUS_LABELS: Record<string, string> = {
  leave: "Відпустка",
  sick: "Лікарняний",
  "temp-assignment": "Тимчасове призначення",
  reserved: "Резерв",
};

const FACT_STATUS_CONFIG: Record<
  string,
  { color: string; bgColor: string; label: string }
> = {
  overtime: {
    color: "var(--destructive)",
    bgColor: "var(--destructive-alpha-8)",
    label: "Понаднормово",
  },
  missing: {
    color: "var(--chart-3)",
    bgColor: "var(--warning-alpha-8)",
    label: "Відсутність",
  },
  "no-show": {
    color: "var(--chart-3)",
    bgColor: "var(--warning-alpha-8)",
    label: "Не з'явився",
  },
  matched: {
    color: "var(--chart-2)",
    bgColor: "var(--success-alpha-8)",
    label: "Відповідає",
  },
};

function hasMarketplaceSignal(shift: ShiftData): boolean {
  return !!(shift.marketplaceSource || shift.exchangeStatus || shift.proposalStatus);
}

// ── Break visualization ───────────────────────────────────────────────

interface BreakIndicatorProps {
  breakText?: string;
}

function BreakIndicator({ breakText }: BreakIndicatorProps) {
  if (!breakText) return null;
  return (
    <div className="flex items-center gap-0.5">
      <Coffee size={10} style={{ color: "var(--muted-foreground)" }} />
      <span
        style={{
          fontSize: "var(--text-2xs)",
          fontWeight: "var(--font-weight-normal)",
          color: "var(--muted-foreground)",
          lineHeight: 1.2,
        }}
      >
        {breakText}
      </span>
    </div>
  );
}

// ── Sub-units inline ──────────────────────────────────────────────────

interface SubUnitsInlineProps {
  subUnits?: { time: string; unit: string }[];
}

function SubUnitsInline({ subUnits }: SubUnitsInlineProps) {
  if (!subUnits || subUnits.length === 0) return null;
  const uniqueUnits = Array.from(new Set(subUnits.map((su) => su.unit)));
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {uniqueUnits.map((unit, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-0.5 px-1 py-px rounded-[var(--radius-sm)]"
          style={{
            fontSize: "var(--text-3xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--chart-5)",
            backgroundColor: "var(--purple-alpha-8)",
          }}
        >
          <Layers size={8} />
          {unit}
        </span>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// DayShiftCard — Plan mode, timeline-optimized (minimal text approach)
// Reference: Google Calendar, Outlook, Deputy — position encodes time
// ══════════════════════════════════════════════════════════════════════

interface DayShiftCardProps {
  shift: ShiftData;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function DayShiftCard({
  shift,
  isSelected,
  onClick,
  onContextMenu,
}: DayShiftCardProps) {
  const isAbsence = shift.status && ["leave", "sick", "temp-assignment", "reserved"].includes(shift.status);
  const isMarketplace = hasMarketplaceSignal(shift);

  // For absences, show monolithic card
  if (isAbsence) {
    let bgColor = "var(--card)";
    let borderColor = "var(--border)";
    let displayText = "";

    if (shift.status === "leave") {
      bgColor = "var(--primary-alpha-8)";
      borderColor = "var(--chart-1)";
      displayText = shift.absenceLabel || "ВІДПУСТКА";
    } else if (shift.status === "sick") {
      bgColor = "var(--destructive-alpha-8)";
      borderColor = "var(--chart-4)";
      displayText = shift.absenceLabel || "СТ.ЛІК";
    } else if (shift.status === "temp-assignment") {
      bgColor = "var(--warning-alpha-8)";
      borderColor = "var(--chart-3)";
      displayText = shift.absenceLabel || "ВІДРЯДЖ.";
    } else if (shift.status === "reserved") {
      bgColor = "var(--purple-alpha-8)";
      borderColor = "var(--chart-5)";
      displayText = shift.absenceLabel || "РЕЗЕРВ";
    }

    return (
      <button
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={`w-full h-full text-left rounded-[var(--radius)] cursor-pointer transition-shadow hover:shadow-[var(--elevation-sm)] ${
          isSelected ? "ring-2 ring-[var(--ring)]" : ""
        }`}
        style={{
          borderStyle: "solid",
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderLeftWidth: 1,
          borderTopColor: borderColor,
          borderRightColor: borderColor,
          borderBottomColor: borderColor,
          borderLeftColor: borderColor,
          backgroundColor: bgColor,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "4px 6px",
        }}
      >
        <span
          className="truncate text-center"
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: borderColor,
            lineHeight: 1.2,
          }}
        >
          {displayText}
        </span>
      </button>
    );
  }

  // Normal shift - multi-segment visualization
  const segments = parseShiftSegments(shift);
  const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full h-full text-left rounded-[var(--radius)] cursor-pointer transition-shadow hover:shadow-[var(--elevation-sm)] ${
        isSelected ? "ring-2 ring-[var(--ring)]" : ""
      }`}
      style={{
        borderStyle: isMarketplace ? "dashed" : "solid",
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderTopColor: isMarketplace ? "var(--chart-5)" : "var(--border)",
        borderRightColor: isMarketplace ? "var(--chart-5)" : "var(--border)",
        borderBottomColor: isMarketplace ? "var(--chart-5)" : "var(--border)",
        borderLeftColor: isMarketplace ? "var(--chart-5)" : "var(--border)",
        backgroundColor: "var(--card)",
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        position: "relative",
        padding: 0,
      }}
    >
      {/* Multi-segment timeline */}
      {segments.map((seg, idx) => {
        const widthPercent = totalDuration > 0 ? (seg.duration / totalDuration) * 100 : 0;
        
        if (seg.type === "break") {
          // Break gap - visual separator
          return (
            <div
              key={idx}
              style={{
                width: `${widthPercent}%`,
                height: "100%",
                backgroundColor: "var(--muted)",
                borderLeft: idx > 0 ? "1px solid var(--border)" : "none",
                borderRight: idx < segments.length - 1 ? "1px solid var(--border)" : "none",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Coffee size={10} style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
            </div>
          );
        }

        // Use shouldShowUnitLabel for smart dedup across breaks
        const showUnitName = shouldShowUnitLabel(segments, idx);

        return (
          <div
            key={idx}
            style={{
              width: `${widthPercent}%`,
              height: "100%",
              backgroundColor: seg.color,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2px 4px",
            }}
          >
            {showUnitName && widthPercent > 15 && seg.unit && (
              <span
                className="truncate text-center"
                style={{
                  fontSize: "var(--text-2xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--foreground)",
                  lineHeight: 1.2,
                  maxWidth: "100%",
                }}
              >
                {seg.unit}
              </span>
            )}
          </div>
        );
      })}

      {/* Marketplace/exchange indicators overlay (top-right corner) */}
      {(shift.exchangeStatus === "on-exchange" || shift.proposalStatus || shift.marketplaceSource) && (
        <div
          className="absolute top-0.5 right-0.5 flex items-center gap-0.5 px-1 py-0.5 rounded-[var(--radius-sm)]"
          style={{
            backgroundColor: "var(--purple-alpha-12)",
            zIndex: 10,
          }}
        >
          {(shift.exchangeStatus === "on-exchange" || shift.marketplaceSource) && (
            <ArrowLeftRight size={12} style={{ color: "var(--chart-5)" }} />
          )}
          {shift.proposalStatus === "pending" && (
            <PaperPlane size={12} style={{ color: "var(--chart-5)" }} />
          )}
        </div>
      )}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════
// DayFactShiftCard — Fact mode, shows actual vs planned
// ══════════════════════════════════════════════════════════════════════

interface DayFactShiftCardProps {
  shift: ShiftData;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function DayFactShiftCard({
  shift,
  isSelected,
  onClick,
  onContextMenu,
}: DayFactShiftCardProps) {
  const isAbsence = shift.status && ["leave", "sick", "temp-assignment", "reserved"].includes(shift.status);
  const actualTime = shift.actualTimeRange || shift.timeRange;
  const plannedTime = shift.timeRange;
  const hasDeviation = actualTime !== plannedTime;
  const factStatus = shift.factStatus || "matched";
  const statusConfig = FACT_STATUS_CONFIG[factStatus];

  // For absences, show monolithic card
  if (isAbsence) {
    let bgColor = statusConfig.bgColor;
    let borderColor = statusConfig.color;
    let displayText = "";

    if (shift.status === "leave") {
      bgColor = "var(--primary-alpha-8)";
      borderColor = "var(--chart-1)";
      displayText = shift.absenceLabel || "ВІДПУСТКА";
    } else if (shift.status === "sick") {
      bgColor = "var(--destructive-alpha-8)";
      borderColor = "var(--chart-4)";
      displayText = shift.absenceLabel || "СТ.ЛІК";
    } else if (shift.status === "temp-assignment") {
      bgColor = "var(--warning-alpha-8)";
      borderColor = "var(--chart-3)";
      displayText = shift.absenceLabel || "ВІДРЯДЖ.";
    } else if (shift.status === "reserved") {
      bgColor = "var(--purple-alpha-8)";
      borderColor = "var(--chart-5)";
      displayText = shift.absenceLabel || "РЕЗЕРВ";
    }

    return (
      <button
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={`w-full h-full text-left rounded-[var(--radius)] cursor-pointer transition-shadow hover:shadow-[var(--elevation-sm)] ${
          isSelected ? "ring-2 ring-[var(--ring)]" : ""
        }`}
        style={{
          borderStyle: "solid",
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderLeftWidth: 1,
          borderTopColor: borderColor,
          borderRightColor: borderColor,
          borderBottomColor: borderColor,
          borderLeftColor: borderColor,
          backgroundColor: bgColor,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "4px 6px",
        }}
      >
        <span
          className="truncate text-center"
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: borderColor,
            lineHeight: 1.2,
          }}
        >
          {displayText}
        </span>
      </button>
    );
  }

  // Normal shift - multi-segment visualization (using actual sub-units if available)
  const actualSubUnits = shift.actualSubUnits || shift.subUnits;
  const segments = parseShiftSegments({
    ...shift,
    subUnits: actualSubUnits,
    timeRange: actualTime,
  });
  const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full h-full text-left rounded-[var(--radius)] cursor-pointer transition-shadow hover:shadow-[var(--elevation-sm)] ${
        isSelected ? "ring-2 ring-[var(--ring)]" : ""
      }`}
      style={{
        borderStyle: "solid",
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderTopColor: statusConfig.color,
        borderRightColor: statusConfig.color,
        borderBottomColor: statusConfig.color,
        borderLeftColor: statusConfig.color,
        backgroundColor: "transparent",
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        position: "relative",
        padding: 0,
      }}
    >
      {/* Multi-segment timeline */}
      {segments.map((seg, idx) => {
        const widthPercent = totalDuration > 0 ? (seg.duration / totalDuration) * 100 : 0;
        
        if (seg.type === "break") {
          // Break gap - visual separator
          return (
            <div
              key={idx}
              style={{
                width: `${widthPercent}%`,
                height: "100%",
                backgroundColor: "var(--muted)",
                borderLeft: idx > 0 ? "1px solid var(--border)" : "none",
                borderRight: idx < segments.length - 1 ? "1px solid var(--border)" : "none",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Coffee size={10} style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
            </div>
          );
        }

        // Sub-unit segment - show unit name ONLY if different from previous segment
        const prevSegment = idx > 0 ? segments[idx - 1] : null;
        const showUnitName = !prevSegment || prevSegment.type === "break" || prevSegment.unit !== seg.unit;

        return (
          <div
            key={idx}
            style={{
              width: `${widthPercent}%`,
              height: "100%",
              backgroundColor: seg.color,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2px 4px",
            }}
          >
            {showUnitName && widthPercent > 15 && seg.unit && (
              <span
                className="truncate text-center"
                style={{
                  fontSize: "var(--text-2xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--foreground)",
                  lineHeight: 1.2,
                  maxWidth: "100%",
                }}
              >
                {seg.unit}
              </span>
            )}
          </div>
        );
      })}

      {/* Deviation underline (bottom red bar if time changed) */}
      {hasDeviation && (
        <div
          className="absolute left-0 right-0 bottom-0 pointer-events-none"
          style={{
            height: 3,
            backgroundColor: "var(--destructive)",
            borderBottomLeftRadius: "var(--radius)",
            borderBottomRightRadius: "var(--radius)",
            zIndex: 10,
          }}
        />
      )}

      {/* Status badge overlay (top-left corner) */}
      {factStatus !== "matched" && (
        <div
          className="absolute top-0.5 left-0.5 px-1 py-px rounded-[var(--radius-sm)]"
          style={{
            fontSize: "var(--text-3xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: statusConfig.color,
            backgroundColor: "var(--background)",
            zIndex: 10,
          }}
        >
          {statusConfig.label}
        </div>
      )}

      {/* Delta hours badge (top-right corner) */}
      {shift.deltaHours !== undefined && shift.deltaHours !== 0 && (
        <div
          className="absolute top-0.5 right-0.5 px-1 py-px rounded-[var(--radius-sm)]"
          style={{
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: shift.deltaHours > 0 ? "var(--destructive)" : "var(--chart-2)",
            backgroundColor: "var(--background)",
            zIndex: 10,
          }}
        >
          {shift.deltaHours > 0 ? "+" : ""}
          {shift.deltaHours}г
        </div>
      )}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════
// DayOpenShiftCard — Open shifts in timeline
// ══════════════════════════════════════════════════════════════════════

interface DayOpenShiftCardProps {
  shift: ShiftData;
  openShiftId: string;
  deptId: string;
  dayIndex: number;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function DayOpenShiftCard({
  shift,
  openShiftId,
  deptId,
  dayIndex,
  isSelected,
  onClick,
  onContextMenu,
}: DayOpenShiftCardProps) {
  const isMarketplace = hasMarketplaceSignal(shift);
  const uniqueUnits = Array.from(new Set(shift.subUnits.map((su) => su.unit)));
  const displayText = uniqueUnits.join(" • ");
  const hasBreak = !!shift.breakText;

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full h-full text-left rounded-[var(--radius)] cursor-pointer transition-shadow hover:shadow-[var(--elevation-sm)] ${
        isSelected ? "ring-2 ring-[var(--ring)]" : ""
      }`}
      style={{
        borderStyle: isMarketplace ? "dashed" : "solid",
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderTopColor: "var(--chart-2)",
        borderRightColor: "var(--chart-2)",
        borderBottomColor: "var(--chart-2)",
        borderLeftColor: "var(--chart-2)",
        backgroundColor: "var(--success-alpha-8)",
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: "4px 6px",
      }}
    >
      {/* Break pattern overlay */}
      {hasBreak && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, var(--muted-foreground) 4px, var(--muted-foreground) 5px)",
            opacity: 0.08,
            borderRadius: "var(--radius)",
          }}
        />
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-0.5">
        {/* Plus icon (prominent) */}
        <AddPlus size={14} style={{ color: "var(--chart-2)" }} />

        {/* Display text */}
        {displayText && (
          <span
            className="truncate text-center"
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--chart-2)",
              lineHeight: 1.2,
              maxWidth: "100%",
            }}
          >
            {displayText}
          </span>
        )}

        {/* Marketplace/exchange indicators (minimal) */}
        <div className="flex items-center gap-1">
          {shift.exchangeStatus === "on-exchange" && (
            <ArrowLeftRight size={9} style={{ color: "var(--chart-5)" }} />
          )}
          {shift.proposalStatus === "pending" && (
            <PaperPlane size={9} style={{ color: "var(--chart-5)" }} />
          )}
        </div>
      </div>
    </button>
  );
}
