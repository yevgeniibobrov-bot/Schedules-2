import React from "react";
import { TriangleWarning, CircleCheck, Clock, ArrowLeftRight } from "@fzwp/ui-kit/icons";
import type { Department } from "./WeeklyTable";

interface ScheduleSummaryBarProps {
  departments: Department[];
  isFact: boolean;
  focusedSubUnit?: string | null;
  focusedDeptId?: string | null;
}

export function ScheduleSummaryBar({
  departments,
  isFact,
  focusedSubUnit,
  focusedDeptId,
}: ScheduleSummaryBarProps) {
  // Hide the summary bar when a specific department is selected
  // Department-level coverage is shown in the department header row
  if (focusedDeptId) return null;

  const metricDepts = departments;

  let totalForecast = 0;
  let totalScheduled = 0;
  let exchangeCount = 0;

  for (const dept of metricDepts) {
    const rc = dept.resourceControl;
    if (rc) {
      const focusedSu = focusedSubUnit
        ? rc.subUnits.find((su) => su.name === focusedSubUnit)
        : null;
      const daily = focusedSu ? focusedSu.daily : rc.daily;
      for (const d of daily) {
        totalForecast += d.forecast;
        totalScheduled += isFact ? (d.actual ?? d.scheduled) : d.scheduled;
      }
    }
    if (!isFact) {
      exchangeCount += dept.openShifts.filter(
        (os) => os.shift.exchangeStatus === "on-exchange"
      ).length;
    }
  }

  const gap = totalScheduled - totalForecast;
  const gapAbs = Math.abs(gap);
  const gapIsDeficit = gap < 0;
  const isOk = gap >= 0;

  const labelStyle = {
    fontSize: "var(--text-sm)",
    fontWeight: "var(--font-weight-normal)" as any,
    color: "var(--muted-foreground)",
    whiteSpace: "nowrap" as const,
  };

  const valueStyle = {
    fontSize: "var(--text-sm)",
    fontWeight: "var(--font-weight-semibold)" as any,
    color: "var(--foreground)",
    whiteSpace: "nowrap" as const,
  };

  const iconColor = "var(--muted-foreground)";

  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "20px 16px" }}
    >
      {/* ── Left: Status ── */}
      <div className="flex items-center gap-1.5">
        {gapIsDeficit ? (
          <>
            <TriangleWarning size={14} style={{ color: "var(--destructive)", flexShrink: 0 }} />
            <span style={{ ...labelStyle, color: "var(--muted-foreground)" }}>Нестача</span>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--destructive)", whiteSpace: "nowrap" as const }}>
              {gapAbs}г
            </span>
          </>
        ) : (
          <>
            <CircleCheck size={14} style={{ color: "var(--chart-2)", flexShrink: 0 }} />
            <span style={{ ...labelStyle, color: "var(--chart-2)" }}>
              {isOk && gap > 0 ? "Надлишок" : "Збалансовано"}
            </span>
            {isOk && gap > 0 && (
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--chart-2)", whiteSpace: "nowrap" as const }}>
                +{gap}г
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Right: Metrics group ── */}
      <div className="flex items-center" style={{ gap: 20 }}>
        {/* Coverage metric */}
        <div className="flex items-center gap-1.5">
          <Clock size={14} style={{ color: iconColor, flexShrink: 0 }} />
          <span style={labelStyle}>Покриття</span>
          <span style={valueStyle}>
            {totalForecast}г
            <span style={{ fontWeight: "var(--font-weight-normal)" as any, color: "var(--muted-foreground)" }}> / </span>
            {totalScheduled}г
          </span>
        </div>

        {/* Exchange metric */}
        {!isFact && (
          <div className="flex items-center gap-1.5">
            <ArrowLeftRight size={14} style={{ color: iconColor, flexShrink: 0 }} />
            <span style={labelStyle}>Біржа</span>
            <span style={valueStyle}>{exchangeCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}