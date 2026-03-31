import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  BarChart3,
  Layers,
  AlertTriangle,
  ArrowRightLeft,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@fzwp/ui-kit/button";
import { Tooltip } from "@fzwp/ui-kit/tooltip";
import { Badge } from "@fzwp/ui-kit/badge";
import type { ShiftData } from "./ShiftCard";
import type { Employee, Department, OpenShift } from "./WeeklyTable";
import {
  TimeHeader,
  TimeGridLines,
  CurrentTimeIndicator,
  DayEmployeeCell,
  DayEmployeeTimeline,
  DayOpenShiftTimeline,
  RESOURCE_ROW_H,
  OPEN_SHIFT_ROW_H,
  EMPLOYEE_ROW_H,
  gridWidthPx,
  JUMP_RANGES,
  DEFAULT_JUMP_INDEX,
  type TimeRange,
} from "./DayViewComponents";
import { DayResourceRow } from "./DayViewResourceRow";

// ── Layout constants ──────────────────────────────────────────────────
const EMPLOYEE_COL_W = 240;
const HEADER_H = 36;
const RANGE_BAR_H = 32;

function rangeLabel(r: TimeRange): string {
  return `${String(r.start).padStart(2, "0")}:00–${String(r.end).padStart(2, "0")}:00`;
}

// ══════════════════════════════════════════════════════════════════════
// DayView — 3 fixed range states (no horizontal scroll)
// ═════════════════════════════════════════════════════════════════════

interface DayViewProps {
  departments: Department[];
  dayIndex: number;
  dayLabel: string;
  isToday: boolean;
  isFact: boolean;
  selectedShiftId?: string;
  focusedSubUnit?: string | null;
  activeRangeIndex?: number;
  onActiveRangeChange?: (idx: number) => void;
  onShiftClick: (shift: ShiftData, employee: Employee, department: Department) => void;
  onEmployeeClick: (employee: Employee) => void;
  onEmptyCellClick?: (employee: Employee, dayIndex: number, department: Department) => void;
  onShiftContextMenu?: (e: React.MouseEvent, shift: ShiftData, employee: Employee, department: Department) => void;
  onOpenShiftContextMenu?: (e: React.MouseEvent, openShift: OpenShift, department: Department) => void;
  onOpenShiftClick?: (openShift: OpenShift, department: Department) => void;
  onOpenShiftEmptyCellClick?: (dayIndex: number, department: Department) => void;
  issuesFilterActive?: boolean;
  issueEmployeeIds?: Set<string>;
  issueDeptIds?: Set<string>;
  readOnly?: boolean;
}

export function DayView({
  departments,
  dayIndex,
  dayLabel,
  isToday,
  isFact,
  selectedShiftId,
  focusedSubUnit,
  activeRangeIndex,
  onActiveRangeChange,
  onShiftClick,
  onEmployeeClick,
  onEmptyCellClick,
  onShiftContextMenu,
  onOpenShiftContextMenu,
  onOpenShiftClick,
  onOpenShiftEmptyCellClick,
  issuesFilterActive = false,
  issueEmployeeIds,
  issueDeptIds,
  readOnly = false,
}: DayViewProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeRange, setActiveRange] = useState(activeRangeIndex ?? DEFAULT_JUMP_INDEX);

  // Sync with external prop when provided
  React.useEffect(() => {
    if (activeRangeIndex !== undefined) {
      setActiveRange(activeRangeIndex);
    }
  }, [activeRangeIndex]);

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  // Current visible range
  const currentRange = JUMP_RANGES[activeRange];

  const toggleDept = (deptId: string) => {
    setCollapsed((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  // ── Toggle all departments ──
  const allCollapsed = departments.length > 0 && departments.every((d) => collapsed[d.id]);
  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    const target = !allCollapsed;
    departments.forEach((d) => { next[d.id] = target; });
    setCollapsed(next);
  };

  // ── Vertical scroll sync: right → left ──
  const handleRightScroll = useCallback(() => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const right = rightPanelRef.current;
    const left = leftPanelRef.current;
    if (right && left) {
      left.scrollTop = right.scrollTop;
    }
    requestAnimationFrame(() => { isSyncing.current = false; });
  }, []);

  // ── Forward wheel events from the left panel into the right panel ──
  useEffect(() => {
    const left = leftPanelRef.current;
    const right = rightPanelRef.current;
    if (!left || !right) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      right.scrollTop += e.deltaY;
    };
    left.addEventListener("wheel", onWheel, { passive: false });
    return () => left.removeEventListener("wheel", onWheel);
  }, []);

  // ── Accent palette per department ──
  const deptAccentColors = [
    "var(--primary)", "var(--chart-2)", "var(--chart-3)", "var(--chart-5)",
    "var(--chart-4)", "var(--secondary)", "var(--chart-1)",
  ];

  // ══════════════════════════════════════════════════════════════════════
  // Build paired left / right row arrays
  // ══════════════════════════════════════════════════════════════════════

  const leftRows: React.ReactNode[] = [];
  const rightRows: React.ReactNode[] = [];

  departments.forEach((dept, deptIdx) => {
    const isCollapsed = collapsed[dept.id] ?? false;
    const deptAccent = deptAccentColors[deptIdx % deptAccentColors.length];

    const deptIssueCount =
      dept.employees.filter((emp) => issueEmployeeIds?.has(emp.id)).length +
      (isFact
        ? dept.employees.reduce(
            (cnt, emp) =>
              cnt +
              Object.values(emp.shifts)
                .flat()
                .filter((sh) => sh.factStatus === "overtime" || sh.factStatus === "missing" || sh.factStatus === "no-show").length,
            0
          )
        : 0);

    const exchangeCount = isFact
      ? 0
      : dept.openShifts.filter((os) => os.dayIndex === dayIndex && os.shift.exchangeStatus === "on-exchange").length;

    // ── Department header (left panel) ────────────────────────────
    leftRows.push(
      <div
        key={`dept-l-${dept.id}`}
        className="flex items-center cursor-pointer"
        style={{
          height: HEADER_H,
          backgroundColor: "var(--sidebar)",
          boxShadow: `inset 3px 0 0 ${deptAccent}`,
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: HEADER_H + RANGE_BAR_H,
          zIndex: 15,
          paddingLeft: 10,
          paddingRight: 12,
        }}
        onClick={() => toggleDept(dept.id)}
      >
        <div className="flex items-center gap-1.5" style={{ minWidth: 0, flex: 1 }}>
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
          <Badge
            size="sm"
            variant="flat"
            className="shrink-0"
            style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)", backgroundColor: "var(--border)" }}
          >
            {dept.employees.length}
          </Badge>
          {deptIssueCount > 0 && (
            <Badge
              size="sm"
              variant="flat"
              color="danger"
              className="inline-flex items-center gap-0.5 shrink-0"
              style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--destructive)", backgroundColor: "var(--destructive-alpha-10)" }}
            >
              <AlertTriangle size={10} />
              {deptIssueCount}
            </Badge>
          )}
          {exchangeCount > 0 && (
            <Badge
              size="sm"
              variant="flat"
              className="inline-flex items-center gap-0.5 shrink-0"
              style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--chart-5)", backgroundColor: "var(--purple-alpha-12)" }}
            >
              <ArrowRightLeft size={10} />
              {exchangeCount}
            </Badge>
          )}
        </div>
      </div>
    );
    rightRows.push(
      <div
        key={`dept-r-${dept.id}`}
        style={{
          height: HEADER_H,
          backgroundColor: "var(--sidebar)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: HEADER_H + RANGE_BAR_H,
          zIndex: 15,
        }}
      />
    );

    if (isCollapsed) return;

    // ── Resource row (inline plan/schedule label with legend) ──────
    if (dept.resourceControl) {
      const rcDay = dept.resourceControl.daily[dayIndex];
      const rcForecast = rcDay?.forecast ?? 0;
      const rcScheduled = rcDay?.scheduled ?? 0;

      leftRows.push(
        <div
          key={`res-l-${dept.id}`}
          className="px-3 flex flex-col justify-center"
          style={{
            height: RESOURCE_ROW_H,
            backgroundColor: "var(--muted)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Inline label + values */}
          <div className="flex items-center gap-2">
            <BarChart3 size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
              План / Графік
            </span>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", whiteSpace: "nowrap" }}>
              {rcForecast}г / {rcScheduled}г
            </span>
          </div>
          {/* Compact legend */}
          <div className="flex items-center gap-3 mt-1" style={{ paddingLeft: 0 }}>
            <div className="flex items-center gap-1">
              <div className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, backgroundColor: "var(--primary)" }} />
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>прогноз</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, backgroundColor: "var(--chart-2)" }} />
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>покрито</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, backgroundColor: "var(--destructive)" }} />
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>нестача</span>
            </div>
          </div>
        </div>
      );
      rightRows.push(
        <DayResourceRow
          key={`res-r-${dept.id}`}
          dept={dept}
          rc={dept.resourceControl}
          dayIndex={dayIndex}
          isFact={isFact}
          focusedSubUnit={focusedSubUnit}
          range={currentRange}
        />
      );
    }

    // ── Open shifts row ─────────────��─────────────────────────────
    if (!isFact) {
      leftRows.push(
        <div
          key={`os-l-${dept.id}`}
          className="px-3 flex items-center"
          style={{
            height: OPEN_SHIFT_ROW_H,
            backgroundColor: "var(--success-alpha-4)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span
            className="truncate"
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: "var(--chart-2)",
            }}
          >
            Відкриті зміни
          </span>
        </div>
      );
      rightRows.push(
        <DayOpenShiftTimeline
          key={`os-r-${dept.id}`}
          dept={dept}
          dayIndex={dayIndex}
          readOnly={readOnly}
          selectedShiftId={selectedShiftId}
          focusedSubUnit={focusedSubUnit}
          isToday={isToday}
          range={currentRange}
          onOpenShiftClick={onOpenShiftClick}
          onOpenShiftContextMenu={onOpenShiftContextMenu}
          onOpenShiftEmptyCellClick={onOpenShiftEmptyCellClick}
        />
      );
    }

    // ── Employee rows ─────────────────────────────────────────────
    const filteredEmps = dept.employees.filter(
      (emp) => !issuesFilterActive || !issueEmployeeIds || issueEmployeeIds.has(emp.id)
    );
    filteredEmps.forEach((emp) => {
      leftRows.push(
        <DayEmployeeCell key={`emp-l-${emp.id}`} emp={emp} onEmployeeClick={onEmployeeClick} />
      );
      rightRows.push(
        <DayEmployeeTimeline
          key={`emp-r-${emp.id}`}
          emp={emp}
          dept={dept}
          dayIndex={dayIndex}
          isFact={isFact}
          readOnly={readOnly}
          selectedShiftId={selectedShiftId}
          focusedSubUnit={focusedSubUnit}
          isToday={isToday}
          range={currentRange}
          onShiftClick={onShiftClick}
          onShiftContextMenu={onShiftContextMenu}
          onEmptyCellClick={onEmptyCellClick}
        />
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════

  const timelineWidth = gridWidthPx(currentRange);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Banners ── */}
      {isFact && (
        <div
          className="flex items-center gap-2 px-4 py-1.5"
          style={{ backgroundColor: "var(--primary-alpha-6)", borderBottom: "1px solid var(--border)" }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--primary)" }}>
            Режим Факт — Відображення фактичних годин
          </span>
        </div>
      )}
      {focusedSubUnit && (
        <div
          className="flex items-center gap-2 px-4 py-1.5"
          style={{ backgroundColor: "var(--purple-alpha-5)", borderBottom: "1px solid var(--border)" }}
        >
          <Layers size={14} style={{ color: "var(--chart-5)" }} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--chart-5)" }}>
            Фокус: {focusedSubUnit}
          </span>
        </div>
      )}
      {issuesFilterActive && (
        <div
          className="flex items-center gap-2 px-4 py-1.5"
          style={{ backgroundColor: "var(--destructive-alpha-6)", borderBottom: "1px solid var(--border)" }}
        >
          <AlertTriangle size={14} style={{ color: "var(--destructive)" }} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--destructive)" }}>
            Показано лише рядки з проблемами
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
           Two-Panel Layout — sticky left column, fixed-width right panel (no horizontal scroll)
           ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ── */}
        <div
          ref={leftPanelRef}
          className="flex-shrink-0"
          style={{
            width: EMPLOYEE_COL_W,
            overflowX: "hidden",
            overflowY: "hidden",
            borderRight: "1px solid var(--border)",
          }}
        >
          {/* Header — aligns with timeline header + range bar */}
          <div
            className="flex items-center justify-between px-3"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              height: HEADER_H + RANGE_BAR_H,
              backgroundColor: "var(--muted)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)" }}>
              Працівник
            </span>
            {/* "Усі" toggle — normal-sized tertiary control */}
            <Tooltip content={allCollapsed ? "Розгорнути всі" : "Згорнути всі"}>
              <Button
                variant="light"
                size="sm"
                onPress={toggleAll}
                className="flex items-center gap-1.5"
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--muted-foreground)",
                }}
              >
                <ChevronsUpDown size={14} style={{ color: "var(--muted-foreground)" }} />
                Усі
              </Button>
            </Tooltip>
          </div>
          {leftRows}
        </div>

        {/* ── RIGHT PANEL (vertical scroll only, no horizontal scroll) ── */}
        <div
          ref={rightPanelRef}
          className="flex-1"
          onScroll={handleRightScroll}
          style={{ overflowX: "hidden", overflowY: "auto" }}
        >
          <div style={{ width: timelineWidth, minWidth: timelineWidth }}>
            {/* Sticky header block: range selector + time header */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 20,
                backgroundColor: "var(--muted)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {/* ── Range selector buttons ── */}
              <div className="flex items-center gap-1 px-2" style={{ height: RANGE_BAR_H }}>
                {JUMP_RANGES.map((r, idx) => {
                  const isActive = idx === activeRange;
                  return (
                    <Button
                      key={idx}
                      variant={isActive ? "bordered" : "light"}
                      size="sm"
                      onPress={() => {
                        setActiveRange(idx);
                        onActiveRangeChange?.(idx);
                      }}
                      style={{
                        fontSize: "var(--text-2xs)",
                        fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-medium)",
                        color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                        backgroundColor: isActive ? "var(--primary-alpha-10)" : "transparent",
                        borderColor: isActive ? "var(--primary-alpha-25)" : "transparent",
                        padding: "3px 10px",
                        whiteSpace: "nowrap",
                        lineHeight: 1.4,
                      }}
                    >
                      {rangeLabel(r)}
                    </Button>
                  );
                })}
              </div>

              {/* ── Time labels row ── */}
              <div className="relative" style={{ height: HEADER_H }}>
                <TimeHeader range={currentRange} />
              </div>
            </div>

            {/* ── Current time indicator layer (one instance for the whole grid) ── */}
            <div className="relative">
              {/* Global current-time line overlay */}
              {isToday && (
                <div className="absolute top-0 bottom-0 pointer-events-none" style={{ zIndex: 25, left: 0, width: timelineWidth }}>
                  <CurrentTimeIndicator isToday={isToday} range={currentRange} />
                </div>
              )}
              {/* Grid lines overlay */}
              <div className="absolute top-0 bottom-0 pointer-events-none" style={{ zIndex: 1, left: 0, width: timelineWidth }}>
                <TimeGridLines range={currentRange} />
              </div>
              {/* Content rows */}
              <div className="relative" style={{ zIndex: 2 }}>
                {rightRows}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
