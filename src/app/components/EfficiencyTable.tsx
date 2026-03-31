import React, { useState, useMemo, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@fzwp/ui-kit/button";
import { Badge } from "@fzwp/ui-kit/badge";
import type { Department } from "./WeeklyTable";
import { JUMP_RANGES } from "./DayViewComponents";

// ── Helpers ────────────────────────────────────────────────────────────

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

function parseTimeRange(range: string): { start: number; end: number } | null {
  const parts = range.split("–");
  if (parts.length !== 2) return null;
  let start = parseTime(parts[0].trim());
  let end = parseTime(parts[1].trim());
  if (end <= start) end += 24;
  return { start, end };
}

function parseHoursFromRange(range: string): number {
  const p = parseTimeRange(range);
  return p ? p.end - p.start : 0;
}

function fmtNum(n: number): string {
  const r = Math.round(n * 10) / 10;
  return r % 1 === 0 ? String(r) : r.toFixed(1);
}

function formatHour(h: number): string {
  const hh = String(Math.floor(h)).padStart(2, "0");
  const mm = h % 1 === 0 ? "00" : "30";
  return `${hh}:${mm}`;
}

// ── Forecast weight distribution ──────────────────────────────────────

function buildForecastWeight(h: number): number {
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
}

// ── Coverage model ────────────────────────────────────────────────────

interface CoverageData {
  scheduled: number;
  forecast: number;
}

type CoverageStatus = "ok" | "shortage_warn" | "shortage_crit" | "overplan" | "empty";

function getStatus(d: CoverageData): CoverageStatus {
  if (d.scheduled === 0 && d.forecast === 0) return "empty";
  if (d.forecast === 0 && d.scheduled > 0) return "overplan";
  const ratio = d.scheduled / d.forecast;
  if (ratio >= 0.90 && ratio <= 1.10) return "ok";
  if (ratio > 1.10) return "overplan";
  if (ratio >= 0.75) return "shortage_warn"; // >10% deficit
  return "shortage_crit"; // >25% deficit
}

function statusColor(st: CoverageStatus): string {
  switch (st) {
    case "ok": return "var(--success)";
    case "shortage_warn": return "var(--warning)";
    case "shortage_crit": return "var(--destructive)";
    case "overplan": return "var(--muted-foreground)";
    default: return "var(--muted-foreground)";
  }
}

interface SubUnitCoverage {
  unitName: string;
  columns: CoverageData[];
  total: CoverageData;
}

interface DeptCoverage {
  deptId: string;
  deptName: string;
  subUnits: SubUnitCoverage[];
  summary: SubUnitCoverage;
}

// ── Compute Weekly Coverage ───────────────────────────────────────────

function computeWeeklyCoverage(
  planDepts: Department[],
  factDepts: Department[]
): DeptCoverage[] {
  const result: DeptCoverage[] = [];

  for (const planDept of planDepts) {
    const factDept = factDepts.find((d) => d.id === planDept.id);
    const unitNames = new Set<string>();

    for (const emp of planDept.employees) {
      for (const shifts of Object.values(emp.shifts)) {
        for (const sh of shifts) {
          for (const su of sh.subUnits) unitNames.add(su.unit);
        }
      }
    }
    if (factDept) {
      for (const emp of factDept.employees) {
        for (const shifts of Object.values(emp.shifts)) {
          for (const sh of shifts) {
            const units = sh.actualSubUnits || sh.subUnits;
            for (const su of units) unitNames.add(su.unit);
          }
        }
      }
    }
    if (planDept.resourceControl) {
      for (const su of planDept.resourceControl.subUnits) unitNames.add(su.name);
    }

    const sorted = Array.from(unitNames).sort();

    const subUnits: SubUnitCoverage[] = sorted.map((unitName) => {
      const columns: CoverageData[] = [];
      for (let d = 0; d < 7; d++) {
        let scheduled = 0;
        let forecast = 0;
        for (const emp of planDept.employees) {
          const dayShifts = emp.shifts[String(d)] || [];
          for (const sh of dayShifts) {
            if (sh.status && sh.status !== "normal" && sh.status !== "open") continue;
            for (const su of sh.subUnits) {
              if (su.unit === unitName) scheduled += parseHoursFromRange(su.time);
            }
          }
        }
        if (planDept.resourceControl) {
          const suRes = planDept.resourceControl.subUnits.find((s) => s.name === unitName);
          if (suRes && suRes.daily[d]) forecast = suRes.daily[d].forecast;
        }
        columns.push({ scheduled: Math.round(scheduled), forecast: Math.round(forecast) });
      }
      const total: CoverageData = {
        scheduled: columns.reduce((s, c) => s + c.scheduled, 0),
        forecast: columns.reduce((s, c) => s + c.forecast, 0),
      };
      return { unitName, columns, total };
    });

    const summaryColumns: CoverageData[] = [];
    for (let d = 0; d < 7; d++) {
      summaryColumns.push({
        scheduled: subUnits.reduce((s, u) => s + u.columns[d].scheduled, 0),
        forecast: subUnits.reduce((s, u) => s + u.columns[d].forecast, 0),
      });
    }
    const summaryTotal: CoverageData = {
      scheduled: summaryColumns.reduce((s, c) => s + c.scheduled, 0),
      forecast: summaryColumns.reduce((s, c) => s + c.forecast, 0),
    };

    result.push({
      deptId: planDept.id,
      deptName: planDept.name,
      subUnits,
      summary: { unitName: planDept.name, columns: summaryColumns, total: summaryTotal },
    });
  }
  return result;
}

// ── Compute Day Coverage ──────────────────────────────────────────────

function computeDayCoverage(
  planDepts: Department[],
  dayIndex: number,
  rangeStart: number,
  rangeEnd: number
): DeptCoverage[] {
  const slots: number[] = [];
  for (let h = rangeStart; h < rangeEnd; h += 0.5) slots.push(h);

  let totalWeight = 0;
  for (let h = 0; h < 24; h += 0.5) totalWeight += buildForecastWeight(h);

  const result: DeptCoverage[] = [];

  for (const dept of planDepts) {
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

    const sorted = Array.from(unitNames).sort();

    const subUnits: SubUnitCoverage[] = sorted.map((unitName) => {
      const columns: CoverageData[] = slots.map((slotH) => {
        const slotEnd = slotH + 0.5;
        let scheduled = 0;
        for (const emp of dept.employees) {
          const dayShifts = emp.shifts[String(dayIndex)] || [];
          for (const sh of dayShifts) {
            if (sh.status && sh.status !== "normal" && sh.status !== "open") continue;
            const matchesSu = sh.subUnits?.some((su) => {
              if (su.unit !== unitName) return false;
              const parsed = parseTimeRange(su.time);
              return parsed && parsed.start < slotEnd && parsed.end > slotH;
            });
            if (matchesSu) scheduled++;
          }
        }
        let forecast = 0;
        if (dept.resourceControl) {
          const suRes = dept.resourceControl.subUnits.find((s) => s.name === unitName);
          if (suRes && suRes.daily[dayIndex]) {
            const dailyForecast = suRes.daily[dayIndex].forecast;
            const weight = buildForecastWeight(slotH);
            forecast = Math.round(((dailyForecast / (0.5 * totalWeight)) * weight) * 10) / 10;
          }
        }
        return { scheduled, forecast };
      });
      const total: CoverageData = {
        scheduled: columns.reduce((s, c) => s + c.scheduled, 0),
        forecast: Math.round(columns.reduce((s, c) => s + c.forecast, 0) * 10) / 10,
      };
      return { unitName, columns, total };
    });

    const summaryColumns: CoverageData[] = slots.map((_, i) => ({
      scheduled: subUnits.reduce((s, u) => s + u.columns[i].scheduled, 0),
      forecast: Math.round(subUnits.reduce((s, u) => s + u.columns[i].forecast, 0) * 10) / 10,
    }));
    const summaryTotal: CoverageData = {
      scheduled: summaryColumns.reduce((s, c) => s + c.scheduled, 0),
      forecast: Math.round(summaryColumns.reduce((s, c) => s + c.forecast, 0) * 10) / 10,
    };

    result.push({
      deptId: dept.id,
      deptName: dept.name,
      subUnits,
      summary: { unitName: dept.name, columns: summaryColumns, total: summaryTotal },
    });
  }
  return result;
}

// ── Aggregate 30-min → hourly ─────────────────────────────────────────

function aggregateToHourly(coverage: SubUnitCoverage): CoverageData[] {
  const hourly: CoverageData[] = [];
  for (let i = 0; i < coverage.columns.length; i += 2) {
    const a = coverage.columns[i];
    const b = coverage.columns[i + 1];
    if (b) {
      hourly.push({
        scheduled: Math.max(a.scheduled, b.scheduled),
        forecast: Math.round(((a.forecast + b.forecast) / 2) * 10) / 10,
      });
    } else {
      hourly.push(a);
    }
  }
  return hourly;
}

// =====================================================================
// ── Cell Renderers ──────────────────────────────────────────────────
// =====================================================================
//
// Design rules:
// 1. Default cell = "X / Y" — plain, neutral, no color.
// 2. Empty (0/0) = muted dash.
// 3. Exception cells (shortage/overplan) = subtle bg tint only.
//    No delta in regular data cells.
// 4. Summary column ("Тижд." / "Всього") = CAN show delta for exceptions.

/**
 * Compact pair: "План / Графік" (forecast / scheduled).
 * Order: forecast (muted reference) / scheduled (color-coded signal).
 * No delta — problems communicated via color + cell bg only.
 */
function PairValue({
  d,
  condensed,
  intOnly,
}: {
  d: CoverageData;
  condensed?: boolean;
  intOnly?: boolean;
}) {
  const st = getStatus(d);
  const isProblematic = st === "shortage_warn" || st === "shortage_crit";
  const isOk = st === "ok";
  // Ok = quiet success, overplan = neutral, shortage = loud signal
  const color = isProblematic
    ? statusColor(st)
    : isOk
      ? "color-mix(in srgb, var(--success) 70%, var(--muted-foreground))"
      : "var(--muted-foreground)";
  const weight = isProblematic
    ? ("var(--font-weight-semibold)" as any)
    : ("var(--font-weight-normal)" as any);
  // Quiet ok cells get reduced opacity for scheduled value
  const scheduledOpacity = isOk ? 0.7 : 1;

  const fmt = intOnly ? (n: number) => String(Math.round(n)) : fmtNum;

  return (
    <span>
      {/* План (forecast) — muted reference */}
      <span
        style={{
          fontWeight: "var(--font-weight-normal)" as any,
          color: "var(--muted-foreground)",
          opacity: 0.45,
        }}
      >
        {fmt(d.forecast)}
      </span>
      <span
        style={{
          color: "var(--muted-foreground)",
          opacity: 0.2,
          margin: condensed ? "0 0.5px" : "0 1.5px",
          fontWeight: "var(--font-weight-normal)" as any,
        }}
      >
        /
      </span>
      {/* Графік (scheduled) — color-coded signal */}
      <span style={{ fontWeight: weight, color, opacity: scheduledOpacity }}>
        {fmt(d.scheduled)}
      </span>
    </span>
  );
}

// ── Cell background — exception only ──────────────────────────────────
// Shortage = primary signal, clear soft red.
// Overplan = secondary, barely visible. NOT a warning color.

function cellBg(status: CoverageStatus, isSummaryCol?: boolean): string {
  if (status === "shortage_crit") {
    return isSummaryCol ? "var(--destructive-alpha-8)" : "var(--destructive-alpha-4)";
  }
  if (status === "shortage_warn") {
    return isSummaryCol ? "var(--warning-alpha-8, rgba(234,179,8,0.08))" : "var(--warning-alpha-4, rgba(234,179,8,0.04))";
  }
  return "transparent";
}

// =====================================================================
// ── Main Component ──────────────────────────────────────────────────
// =====================================================================

interface EfficiencyTableProps {
  planDepts: Department[];
  factDepts: Department[];
  focusedDeptId: string | null;
  focusedSubUnit?: string | null;
  viewMode: "week" | "day";
  selectedDayIndex: number;
  dayRangeIndex?: number;
}

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
type DayDensity = "1h" | "30m";

export function EfficiencyTable({
  planDepts,
  factDepts,
  focusedDeptId,
  focusedSubUnit,
  viewMode,
  selectedDayIndex,
  dayRangeIndex = 1,
}: EfficiencyTableProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"day" | "week">(
    viewMode === "day" ? "day" : "week"
  );
  const [dayDensity] = useState<DayDensity>("30m");

  useEffect(() => {
    setActiveTab(viewMode === "day" ? "day" : "week");
  }, [viewMode]);

  // Listen for "open-efficiency-panel" from ResourcePopover CTA
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { dayIndex?: number; deptId?: string } | undefined;
      setExpanded(true);
      setActiveTab("day");
      if (detail?.deptId) {
        setExpandedDepts(new Set([detail.deptId]));
      }
    };
    document.addEventListener("open-efficiency-panel", handler);
    return () => document.removeEventListener("open-efficiency-panel", handler);
  }, []);

  useEffect(() => {
    if (expanded && focusedDeptId) {
      setExpandedDepts((prev) => {
        if (activeTab === "day") return new Set([focusedDeptId]);
        const next = new Set(prev);
        next.add(focusedDeptId);
        return next;
      });
    }
  }, [expanded, focusedDeptId, activeTab]);

  // ── Data ──
  const dayFilteredPlanDepts = focusedDeptId
    ? planDepts.filter((d) => d.id === focusedDeptId)
    : planDepts;

  const weeklyData = useMemo(
    () => computeWeeklyCoverage(planDepts, factDepts),
    [planDepts, factDepts]
  );

  const dayRange = JUMP_RANGES[dayRangeIndex] || JUMP_RANGES[1];

  const dailyData30m = useMemo(
    () => computeDayCoverage(dayFilteredPlanDepts, selectedDayIndex, dayRange.start, dayRange.end),
    [dayFilteredPlanDepts, selectedDayIndex, dayRange]
  );

  const slotLabels30m = useMemo(() => {
    const l: string[] = [];
    for (let h = dayRange.start; h < dayRange.end; h += 0.5) l.push(formatHour(h));
    return l;
  }, [dayRange]);

  const slotLabelsHourly = useMemo(() => {
    const l: string[] = [];
    for (let h = dayRange.start; h < dayRange.end; h += 1) l.push(formatHour(h));
    return l;
  }, [dayRange]);

  const slotHours30m = useMemo(() => {
    const h: number[] = [];
    for (let t = dayRange.start; t < dayRange.end; t += 0.5) h.push(t);
    return h;
  }, [dayRange]);

  const isDay = activeTab === "day";
  const isHourly = dayDensity === "1h";
  const is30m = isDay && !isHourly;
  const data = isDay ? dailyData30m : weeklyData;

  const displayData: DeptCoverage[] = useMemo(() => {
    if (!isDay || !isHourly) return data;
    return data.map((dept) => ({
      ...dept,
      subUnits: dept.subUnits.map((su) => ({
        ...su,
        columns: aggregateToHourly(su),
      })),
      summary: {
        ...dept.summary,
        columns: aggregateToHourly(dept.summary),
      },
    }));
  }, [data, isDay, isHourly]);

  const columnHeaders = isDay
    ? isHourly
      ? slotLabelsHourly
      : slotLabels30m
    : DAY_LABELS;

  // Grand total
  const grandTotal = useMemo(() => {
    const colCount = displayData[0]?.summary.columns.length || 0;
    const columns: CoverageData[] = [];
    for (let i = 0; i < colCount; i++) {
      columns.push({
        scheduled: displayData.reduce((s, d) => s + d.summary.columns[i].scheduled, 0),
        forecast: Math.round(
          displayData.reduce((s, d) => s + d.summary.columns[i].forecast, 0) * 10
        ) / 10,
      });
    }
    return {
      columns,
      total: {
        scheduled: columns.reduce((s, c) => s + c.scheduled, 0),
        forecast: Math.round(columns.reduce((s, c) => s + c.forecast, 0) * 10) / 10,
      } as CoverageData,
    };
  }, [displayData]);

  const toggleDept = (deptId: string) => {
    setExpandedDepts((prev) => {
      if (activeTab === "day") {
        return prev.has(deptId) ? new Set() : new Set([deptId]);
      }
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  // ── Column borders ──
  function colBorder(i: number): React.CSSProperties {
    if (!is30m) return { borderLeft: "1px solid var(--border)" };
    const h = slotHours30m[i];
    if (h !== undefined && h % 1 === 0) return { borderLeft: "1px solid var(--border)" };
    return { borderLeft: "1px solid color-mix(in srgb, var(--border) 30%, transparent)" };
  }

  // ── Sizing ──
  const dayColW = is30m ? 36 : 56;
  const dayMinW = columnHeaders.length * dayColW + 170 + 72;

  // ── Labels ──
  const sectionSubtitle = isDay
    ? `${DAY_LABELS[selectedDayIndex]} ${String(dayRange.start).padStart(2, "0")}:00–${String(dayRange.end).padStart(2, "0")}:00`
    : "Години по відділах";

  return (
    <>
      {expanded && (
        <div className="fixed inset-0 bg-black/45" style={{ zIndex: 39 }} onClick={() => setExpanded(false)} />
      )}
    <div
      className="flex-shrink-0"
      style={{
        backgroundColor: "var(--background)",
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
        position: "relative",
        zIndex: expanded ? 40 : undefined,
        borderTop: "2px solid color-mix(in srgb, var(--border) 80%, var(--foreground))",
      }}
    >
      {/* ── Collapse toggle ── */}
      <Button
        variant="light"
        onPress={() => setExpanded((p) => !p)}
        className="flex items-center gap-2.5 w-full px-4 cursor-pointer transition-colors"
        style={{
          minHeight: 44,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: expanded ? "var(--background)" : "var(--muted)",
          minWidth: 0,
          overflow: "hidden",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = expanded ? "var(--muted)" : "var(--primary-alpha-5)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = expanded ? "var(--background)" : "var(--muted)")
        }
      >
        {/* Icon button — consistent container in both states */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 22,
            height: 22,
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--primary-alpha-10)",
            transition: "background-color 150ms ease",
          }}
        >
          {expanded ? (
            <ChevronDown size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
          ) : (
            <ChevronRight size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
          )}
        </div>
        <div className="flex flex-col items-start gap-0.5" style={{ flex: "1 1 0", minWidth: 0 }}>
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-semibold)" as any,
              color: "var(--foreground)",
              lineHeight: "16px",
            }}
          >
            Покриття (План / Графік)
          </span>
        </div>
        {/* Badge affordance — secondary, present in both states */}
        <Badge
          size="sm"
          variant="flat"
          className="flex-shrink-0"
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-medium)" as any,
            color: expanded ? "var(--muted-foreground)" : "var(--primary)",
            whiteSpace: "nowrap",
            backgroundColor: expanded ? "var(--muted)" : "var(--primary-alpha-8)",
          }}
        >
          {expanded ? "Згорнути" : "Розгорнути"}
        </Badge>
      </Button>

      {/* ── Content ── */}
      {expanded && (
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          {/* Toolbar */}
          <div
            className="flex items-center justify-between px-4"
            style={{
              borderBottom: "1px solid var(--border)",
              paddingTop: 3,
              paddingBottom: 5,
            }}
          >
            <div className="flex items-center gap-3">
              {/* Tab switch */}
              <div
                className="flex items-center"
                style={{
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--muted)",
                  padding: 1,
                }}
              >
                {(["week", "day"] as const).map((tab) => {
                  const active = activeTab === tab;
                  return (
                    <Button
                      key={tab}
                      variant={active ? "solid" : "light"}
                      size="sm"
                      onPress={() => setActiveTab(tab)}
                      style={{
                        fontSize: "var(--text-2xs)",
                        fontWeight: active
                          ? ("var(--font-weight-semibold)" as any)
                          : ("var(--font-weight-normal)" as any),
                        color: active ? "var(--foreground)" : "var(--muted-foreground)",
                        backgroundColor: active ? "var(--background)" : "transparent",
                        borderRadius: "var(--radius-sm)",
                        padding: "2px 10px",
                        boxShadow: active ? "var(--elevation-sm)" : "none",
                      }}
                    >
                      {tab === "week" ? "Тиждень" : "День"}
                    </Button>
                  );
                })}
              </div>

              {/* Context label — only show in day view */}
              {isDay && (
                <span
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--muted-foreground)",
                    opacity: 0.7,
                  }}
                >
                  {sectionSubtitle}
                </span>
              )}
            </div>

            {/* Day mode label */}
            {isDay && (
              <span
                style={{
                  fontSize: "var(--text-3xs)",
                  color: "var(--muted-foreground)",
                  opacity: 0.6,
                }}
              >
                30 хв
              </span>
            )}
          </div>

          {/* ── Table ── */}
          <div
            className="overflow-x-auto overflow-y-auto relative"
            style={{ maxHeight: 360 }}
          >
            <table
              className="border-collapse"
              style={{
                width: "100%",
                minWidth: isDay ? dayMinW : 680,
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: 170, minWidth: 170 }} />
                {columnHeaders.map((_, i) => (
                  <col key={i} style={{ width: isDay ? dayColW : undefined }} />
                ))}
                <col style={{ width: 72 }} />
              </colgroup>

              {/* Header */}
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th
                    className="text-left sticky top-0 left-0 z-20"
                    style={{
                      backgroundColor: "var(--muted)",
                      fontSize: "var(--text-3xs)",
                      fontWeight: "var(--font-weight-medium)" as any,
                      color: "var(--muted-foreground)",
                      padding: "4px 12px",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Відділ / Дільниця
                  </th>
                  {columnHeaders.map((label, i) => {
                    const isHourBound =
                      is30m &&
                      slotHours30m[i] !== undefined &&
                      slotHours30m[i] % 1 === 0;
                    const isHalfHour = is30m && !isHourBound;
                    // In 30-min mode: show short ":30" for half-hours, full label for full hours
                    const displayLabel = isHalfHour ? ":30" : label;
                    return (
                      <th
                        key={i}
                        className="text-center sticky top-0 z-10"
                        style={{
                          backgroundColor: "var(--muted)",
                          fontSize: is30m ? "var(--text-3xs)" : "var(--text-2xs)",
                          fontWeight: "var(--font-weight-medium)" as any,
                          color: "var(--muted-foreground)",
                          opacity: isHalfHour ? 0.5 : 1,
                          whiteSpace: "nowrap",
                          padding: is30m ? "4px 0" : "4px 2px",
                          ...colBorder(i),
                        }}
                      >
                        {displayLabel}
                      </th>
                    );
                  })}
                  <th
                    className="text-center sticky top-0 z-10"
                    style={{
                      backgroundColor: "var(--muted)",
                      fontSize: "var(--text-2xs)",
                      fontWeight: "var(--font-weight-semibold)" as any,
                      color: "var(--foreground)",
                      borderLeft: "2px solid var(--border)",
                      padding: "4px 4px",
                    }}
                  >
                    {isDay ? "Всього" : "Тижд."}
                  </th>
                </tr>
              </thead>

              {/* Department groups */}
              {displayData.map((dept) => {
                const isDeptExpanded = expandedDepts.has(dept.deptId);
                const summaryStatus = getStatus(dept.summary.total);
                // Dept rows: subtle tint to separate from pure-white data and muted header/footer
                const deptBg = "color-mix(in srgb, var(--foreground) 3%, var(--background))";

                return (
                  <tbody key={dept.deptId}>
                    {/* ── Dept summary row ── */}
                    <tr
                      className="cursor-pointer"
                      onClick={() => toggleDept(dept.deptId)}
                      style={{
                        borderTop: "1px solid var(--border)",
                        borderBottom: "1px solid var(--border)",
                        backgroundColor: deptBg,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--primary-alpha-5)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = deptBg)
                      }
                    >
                      <td
                        className="sticky left-0 z-10"
                        style={{
                          fontWeight: "var(--font-weight-semibold)" as any,
                          fontSize: "var(--text-2xs)",
                          color: "var(--foreground)",
                          backgroundColor: deptBg,
                          padding: "7px 12px",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          {isDeptExpanded ? (
                            <ChevronDown
                              size={11}
                              style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
                            />
                          ) : (
                            <ChevronRight
                              size={11}
                              style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
                            />
                          )}
                          <span className="truncate">{dept.deptName}</span>
                        </div>
                      </td>
                      {dept.summary.columns.map((d, i) => {
                        const st = getStatus(d);
                        const bg = cellBg(st);
                        return (
                          <td
                            key={i}
                            className="text-center"
                            style={{
                              fontSize: "var(--text-3xs)",
                              backgroundColor: bg !== "transparent" ? bg : deptBg,
                              whiteSpace: "nowrap",
                              padding: is30m ? "6px 0" : "6px 2px",
                              ...colBorder(i),
                            }}
                          >
                            {st === "empty" ? (
                              <span
                                style={{
                                  color: "var(--muted-foreground)",
                                  opacity: 0.25,
                                }}
                              >
                                —
                              </span>
                            ) : (
                              <PairValue d={d} condensed={is30m} intOnly={isDay} />
                            )}
                          </td>
                        );
                      })}
                      {/* Summary col */}
                      {(() => {
                        const ts = getStatus(dept.summary.total);
                        const bg = cellBg(ts, true);
                        return (
                          <td
                            className="text-center"
                            style={{
                              fontSize: "var(--text-2xs)",
                              backgroundColor: bg !== "transparent" ? bg : deptBg,
                              borderLeft: "2px solid var(--border)",
                              padding: "5px 4px",
                            }}
                          >
                            {ts === "empty" ? (
                              <span
                                style={{
                                  color: "var(--muted-foreground)",
                                  opacity: 0.25,
                                }}
                              >
                                —
                              </span>
                            ) : (
                              <PairValue
                                d={dept.summary.total}
                                intOnly={isDay}
                              />
                            )}
                          </td>
                        );
                      })()}
                    </tr>

                    {/* ── Sub-unit rows ── */}
                    {isDeptExpanded &&
                      dept.subUnits.map((unit, uIdx) => {
                        const isHighlighted =
                          focusedSubUnit === unit.unitName;
                        const rowBg = isHighlighted
                          ? "var(--purple-alpha-5)"
                          : "var(--background)";

                        return (
                          <tr
                            key={uIdx}
                            style={{
                              borderBottom:
                                "1px solid color-mix(in srgb, var(--border) 40%, transparent)",
                              backgroundColor: rowBg,
                            }}
                          >
                            <td
                              className="sticky left-0 z-10"
                              style={{
                                backgroundColor: rowBg,
                                fontSize: "var(--text-2xs)",
                                fontWeight: isHighlighted
                                  ? ("var(--font-weight-semibold)" as any)
                                  : ("var(--font-weight-normal)" as any),
                                color: isHighlighted
                                  ? "var(--chart-5)"
                                  : "var(--muted-foreground)",
                                padding: "3px 12px 3px 30px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 170,
                              }}
                            >
                              <span className="truncate block">
                                {unit.unitName}
                              </span>
                            </td>
                            {unit.columns.map((d, i) => {
                              const st = getStatus(d);
                              return (
                                <td
                                  key={i}
                                  className="text-center"
                                  style={{
                                    fontSize: is30m
                                      ? "var(--text-3xs)"
                                      : "var(--text-3xs)",
                                    backgroundColor: cellBg(st),
                                    whiteSpace: "nowrap",
                                    padding: is30m ? "5px 0" : "5px 1px",
                                    ...colBorder(i),
                                  }}
                                >
                                  {st === "empty" ? (
                                    <span
                                      style={{
                                        color: "var(--muted-foreground)",
                                        opacity: 0.2,
                                      }}
                                    >
                                      —
                                    </span>
                                  ) : (
                                    <PairValue d={d} condensed={is30m} intOnly={isDay} />
                                  )}
                                </td>
                              );
                            })}
                            {/* Sub-unit summary col */}
                            {(() => {
                              const ts = getStatus(unit.total);
                              return (
                                <td
                                  className="text-center"
                                  style={{
                                    fontSize: "var(--text-2xs)",
                                    backgroundColor: cellBg(ts, true),
                                    borderLeft: "2px solid var(--border)",
                                    padding: "4px 4px",
                                  }}
                                >
                                  {ts === "empty" ? (
                                    <span
                                      style={{
                                        color: "var(--muted-foreground)",
                                        opacity: 0.2,
                                      }}
                                    >
                                      —
                                    </span>
                                  ) : (
                                    <PairValue
                                      d={unit.total}
                                      intOnly={isDay}
                                    />
                                  )}
                                </td>
                              );
                            })()}
                          </tr>
                        );
                      })}
                  </tbody>
                );
              })}

              {/* ── Grand total ── */}
              <tfoot>
                <tr
                  style={{
                    backgroundColor: "var(--muted)",
                    position: "sticky",
                    bottom: 0,
                    zIndex: 5,
                    borderTop: "2px solid var(--border)",
                  }}
                >
                  <td
                    className="sticky left-0 z-10"
                    style={{
                      backgroundColor: "var(--muted)",
                      fontWeight: "var(--font-weight-semibold)" as any,
                      fontSize: "var(--text-2xs)",
                      color: "var(--foreground)",
                      padding: "5px 12px",
                    }}
                  >
                    Всього
                  </td>
                  {grandTotal.columns.map((d, i) => {
                    const st = getStatus(d);
                    return (
                      <td
                        key={i}
                        className="text-center"
                        style={{
                          fontSize: is30m
                            ? "var(--text-3xs)"
                            : "var(--text-3xs)",
                          whiteSpace: "nowrap",
                          padding: is30m ? "6px 0" : "6px 2px",
                          backgroundColor:
                            (st === "shortage_warn" || st === "shortage_crit")
                              ? cellBg(st)
                              : "var(--muted)",
                          ...colBorder(i),
                        }}
                      >
                        {st === "empty" ? (
                          <span
                            style={{
                              color: "var(--muted-foreground)",
                              opacity: 0.25,
                            }}
                          >
                            —
                          </span>
                        ) : (
                          <PairValue d={d} condensed={is30m} intOnly={isDay} />
                        )}
                      </td>
                    );
                  })}
                  {/* Grand total summary col */}
                  {(() => {
                    const ts = getStatus(grandTotal.total);
                    return (
                      <td
                        className="text-center"
                        style={{
                          fontSize: "var(--text-2xs)",
                          fontWeight: "var(--font-weight-semibold)" as any,
                          backgroundColor:
                            (ts === "shortage_warn" || ts === "shortage_crit")
                              ? cellBg(ts, true)
                              : "var(--muted)",
                          borderLeft: "2px solid var(--border)",
                          padding: "5px 4px",
                        }}
                      >
                        {ts === "empty" ? (
                          <span
                            style={{
                              color: "var(--muted-foreground)",
                              opacity: 0.25,
                            }}
                          >
                            —
                          </span>
                        ) : (
                          <PairValue
                            d={grandTotal.total}
                            intOnly={isDay}
                          />
                        )}
                      </td>
                    );
                  })()}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
