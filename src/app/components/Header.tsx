import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Printer,
  Send,
  AlertCircle,
  AlertTriangle,
  Layers,
  X,
  Check,
  Edit3,
  CheckCircle2,
  RotateCcw,
  User,
  Maximize2,
  Minimize2,
  Filter,
  BarChart3,
  ArrowLeftRight,
  Target,
} from "lucide-react";

import { Button } from '@fzwp/ui-kit/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@fzwp/ui-kit/modal';
import { Divider } from '@fzwp/ui-kit/divider';
import { Tooltip } from '@fzwp/ui-kit/tooltip';
import { Badge } from '@fzwp/ui-kit/badge';

import type { Department } from "./WeeklyTable";
import { ValidationModal } from "./ValidationModal";

// ── Schedule lifecycle types ────────────────────────────────────────────

export type ScheduleStatus = "draft" | "published";

export interface ValidationProblem {
  id: string;
  severity: "error" | "warning";
  employeeName: string;
  employeeId: string;
  day: string;
  description: string;
  deptId?: string;
}

interface HeaderProps {
  department: string;
  weekLabel: string;
  viewMode: "week" | "day";
  planFact: "plan" | "fact";
  errorCount: number;
  /** All available sub-unit names across departments */
  subUnitNames?: string[];
  /** Currently focused sub-unit name (null = department-level) */
  focusedSubUnit?: string | null;
  /** Whether the issues-only filter is active */
  issuesFilterActive?: boolean;
  /** All departments for department filter */
  departments?: Department[];
  /** Currently focused department id */
  focusedDeptId?: string | null;
  onViewModeChange: (mode: "week" | "day") => void;
  onPlanFactChange: (mode: "plan" | "fact") => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onFocusedSubUnitChange?: (subUnit: string | null) => void;
  onIssuesFilterToggle?: () => void;
  /** Whether the current view is the "today" week */
  isCurrentWeek?: boolean;
  /** Whether prev navigation is available */
  canGoPrev?: boolean;
  /** Whether next navigation is available */
  canGoNext?: boolean;
  onFocusedDeptChange?: (deptId: string | null) => void;
  /** Current schedule lifecycle status */
  scheduleStatus?: ScheduleStatus;
  /** Callback to change schedule status */
  onScheduleStatusChange?: (status: ScheduleStatus) => void;
  /** Validation problems for the schedule */
  validationProblems?: ValidationProblem[];
  /** Callback when a problem is clicked in the validation modal */
  onProblemClick?: (problem: ValidationProblem) => void;
  /** Whether focus mode is active */
  isFocusMode?: boolean;
  /** Toggle focus mode */
  onFocusModeToggle?: () => void;
  /** Whether showing fact mode (for summary metrics) */
  isFact?: boolean;
}

export function Header({
  department,
  weekLabel,
  viewMode,
  planFact,
  errorCount,
  subUnitNames = [],
  focusedSubUnit = null,
  issuesFilterActive = false,
  departments = [],
  focusedDeptId = null,
  isCurrentWeek = true,
  canGoPrev = true,
  canGoNext = true,
  onViewModeChange,
  onPlanFactChange,
  onPrevWeek,
  onNextWeek,
  onToday,
  onFocusedSubUnitChange,
  onIssuesFilterToggle,
  onFocusedDeptChange,
  scheduleStatus,
  onScheduleStatusChange,
  validationProblems,
  onProblemClick,
  isFocusMode = false,
  onFocusModeToggle,
  isFact = false,
}: HeaderProps) {
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const [subUnitDropdownOpen, setSubUnitDropdownOpen] = useState(false);
  const subUnitDropdownRef = useRef<HTMLDivElement>(null);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarText, setSnackbarText] = useState("Розклад успішно опубліковано.");

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target as Node)) {
        setDeptDropdownOpen(false);
      }
      if (subUnitDropdownRef.current && !subUnitDropdownRef.current.contains(e.target as Node)) {
        setSubUnitDropdownOpen(false);
      }
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target as Node)) {
        setViewDropdownOpen(false);
      }
    }
    if (deptDropdownOpen || subUnitDropdownOpen || viewDropdownOpen) {
      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }
  }, [deptDropdownOpen, subUnitDropdownOpen, viewDropdownOpen]);

  // Auto-dismiss snackbar after 3.5 seconds
  useEffect(() => {
    if (!showSnackbar) return;
    const timer = setTimeout(() => setShowSnackbar(false), 3500);
    return () => clearTimeout(timer);
  }, [showSnackbar]);

  const handlePublishConfirm = () => {
    setShowPublishModal(false);
    onScheduleStatusChange?.("published");
    setSnackbarText("Графік опубліковано.");
    setShowSnackbar(true);
  };

  // Lifecycle-aware publish click
  const status = scheduleStatus ?? "draft";
  const problems = validationProblems ?? [];
  const errorProblems = problems.filter(p => p.severity === "error");
  const warningProblems = problems.filter(p => p.severity === "warning");
  const hasErrors = errorProblems.length > 0;
  const hasWarnings = warningProblems.length > 0;
  const hasIssues = hasErrors || hasWarnings;

  const handlePublishClick = () => {
    if (status === "draft") {
      if (hasIssues) {
        setShowValidationModal(true);
      } else {
        onScheduleStatusChange?.("published");
        setSnackbarText("Графік опубліковано.");
        setShowSnackbar(true);
      }
    }
  };

  const handleValidationPublish = () => {
    setShowValidationModal(false);
    onScheduleStatusChange?.("published");
    setSnackbarText("Графік опубліковано (з попередженнями).");
    setShowSnackbar(true);
  };

  const handleReturnToDraft = () => {
    onScheduleStatusChange?.("draft");
    setSnackbarText("Графік повернуто до чернетки.");
    setShowSnackbar(true);
  };

  // Group problems by employee
  const groupedProblems = problems.reduce<Record<string, ValidationProblem[]>>((acc, p) => {
    const key = p.employeeId || "__general__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  // Status indicator config
  const STATUS_CONFIG: Record<ScheduleStatus, { icon: typeof Edit3; label: string; desc: string; color: string; bg: string }> = {
    draft: { icon: Edit3, label: "Чернетка", desc: "Графік редагується", color: "var(--muted-foreground)", bg: "var(--muted)" },
    published: { icon: CheckCircle2, label: "Опубліковано", desc: "Графік доступний працівникам", color: "var(--chart-2)", bg: "var(--success-alpha-10)" },
  };
  const statusCfg = STATUS_CONFIG[status];
  const StatusIcon = statusCfg.icon;

  // ── Summary metrics (merged from ScheduleSummaryBar) ──────────────────
  const summaryMetrics = (() => {
    if (focusedDeptId) return null; // dept-level coverage shown in dept header
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
    return { totalForecast, totalScheduled, gap, exchangeCount };
  })();

  return (
    <div className="contents">
    <header
      className="flex flex-col bg-[var(--card)]"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {/* ── Row 1: Scope + Navigation + Primary Actions ── */}
      <div
        className="flex items-center gap-3 px-4"
        style={{ minHeight: 44, paddingTop: 8, paddingBottom: 8 }}
      >
      {/* 1. Department dropdown */}
      <div className="relative" ref={deptDropdownRef}>
        <Button
          variant="bordered"
          size="sm"
          onPress={() => setDeptDropdownOpen(!deptDropdownOpen)}
          endContent={<ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />}
          className="gap-1.5"
        >
          <span style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-medium)",
            color: "var(--foreground)",
            whiteSpace: "nowrap",
          }}>
            {focusedDeptId
              ? departments.find(d => d.id === focusedDeptId)?.name ?? "Всі відділи"
              : "Всі відділи"}
          </span>
        </Button>

        {/* Dropdown menu */}
        {deptDropdownOpen && (
          <div
            className="absolute top-full left-0 mt-1 z-50 w-[220px] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden"
            style={{
              backgroundColor: "var(--popover)",
              boxShadow: "var(--elevation-md)",
            }}
          >
            <div className="max-h-[280px] overflow-y-auto">
              {/* "Всі відділи" option */}
              <Button
                variant="light"
                className="w-full justify-start gap-2 px-3 py-2"
                style={{
                  backgroundColor: !focusedDeptId ? "var(--primary-alpha-6)" : undefined,
                }}
                onPress={() => {
                  onFocusedDeptChange?.(null);
                  setDeptDropdownOpen(false);
                }}
              >
                <span
                  className="flex-1 text-left"
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: !focusedDeptId ? "var(--font-weight-semibold)" : "var(--font-weight-normal)",
                    color: !focusedDeptId ? "var(--primary)" : "var(--foreground)",
                  }}
                >
                  Всі відділи
                </span>
                {!focusedDeptId && <Check size={14} style={{ color: "var(--primary)" }} />}
              </Button>

              {/* Individual departments */}
              {departments.map((dept) => {
                const isActive = focusedDeptId === dept.id;
                return (
                  <Button
                    key={dept.id}
                    variant="light"
                    className="w-full justify-start gap-2 px-3 py-2"
                    style={{
                      backgroundColor: isActive ? "var(--primary-alpha-6)" : undefined,
                    }}
                    onPress={() => {
                      onFocusedDeptChange?.(isActive ? null : dept.id);
                      setDeptDropdownOpen(false);
                    }}
                  >
                    <span
                      className="flex-1 text-left truncate"
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)",
                        color: isActive ? "var(--primary)" : "var(--foreground)",
                      }}
                    >
                      {dept.name}
                    </span>
                    {isActive && <Check size={14} style={{ color: "var(--primary)" }} />}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Sub-units focus dropdown — immediately after department */}
      {onFocusedSubUnitChange && subUnitNames.length > 0 && (
        <div className="relative" ref={subUnitDropdownRef}>
          <Button
            variant="bordered"
            size="sm"
            onPress={() => setSubUnitDropdownOpen(!subUnitDropdownOpen)}
            className="gap-1.5"
            style={{
              borderColor: focusedSubUnit ? "var(--primary)" : "var(--border)",
              backgroundColor: focusedSubUnit ? "var(--primary-alpha-8)" : "var(--input-background)",
            }}
            startContent={<Layers size={14} style={{ color: focusedSubUnit ? "var(--primary)" : "var(--muted-foreground)" }} />}
            endContent={focusedSubUnit ? (
              <X
                size={14}
                style={{ color: "var(--primary)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onFocusedSubUnitChange(null);
                  setSubUnitDropdownOpen(false);
                }}
              />
            ) : (
              <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />
            )}
          >
            <span style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: focusedSubUnit ? "var(--primary)" : "var(--foreground)",
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {focusedSubUnit || "Дільниці"}
            </span>
          </Button>

          {/* Dropdown menu */}
          {subUnitDropdownOpen && (
            <div
              className="absolute top-full left-0 mt-1 z-50 w-[320px] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden"
              style={{
                backgroundColor: "var(--popover)",
                boxShadow: "var(--elevation-md)",
              }}
            >
              {/* Clear selection */}
              {focusedSubUnit && (
                <Button
                  variant="light"
                  className="w-full justify-start gap-2 px-3 py-2 border-b border-[var(--border)]"
                  onPress={() => {
                    onFocusedSubUnitChange(null);
                    setSubUnitDropdownOpen(false);
                  }}
                >
                  <X size={13} style={{ color: "var(--muted-foreground)" }} />
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>
                    Скинути вибір
                  </span>
                </Button>
              )}

              {/* Header label */}
              <div className="px-3 py-1.5" style={{ backgroundColor: "var(--muted)" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)" }}>
                  Фокус на дільниці
                </span>
              </div>

              {/* Sub-unit options */}
              <div className="max-h-[240px] overflow-y-auto">
                {subUnitNames.map((name) => {
                  const isActive = focusedSubUnit === name;
                  return (
                    <Button
                      key={name}
                      variant="light"
                      className="w-full justify-start gap-2 px-3 py-2"
                      style={{
                        backgroundColor: isActive ? "var(--primary-alpha-6)" : undefined,
                      }}
                      onPress={() => {
                        onFocusedSubUnitChange(isActive ? null : name);
                        setSubUnitDropdownOpen(false);
                      }}
                    >
                      <Layers size={12} style={{ color: isActive ? "var(--primary)" : "var(--secondary)" }} />
                      <span
                        className="flex-1 text-left truncate"
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)",
                          color: isActive ? "var(--primary)" : "var(--foreground)",
                        }}
                      >
                        {name}
                      </span>
                      {isActive && <Check size={14} style={{ color: "var(--primary)" }} />}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <Divider orientation="vertical" className="h-6" />

      {/* 3. Today button — highlighted when navigated away from current week */}
      <Button
        variant="bordered"
        size="sm"
        onPress={onToday}
        className="gap-1.5"
        style={{
          borderColor: isCurrentWeek ? "var(--border)" : "var(--primary)",
          backgroundColor: isCurrentWeek ? "var(--input-background)" : "var(--primary-alpha-8)",
        }}
      >
        <span style={{
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-medium)",
          color: isCurrentWeek ? "var(--foreground)" : "var(--primary)",
        }}>
          Сьогодні
        </span>
      </Button>

      {/* Week navigation */}
      <div className="flex items-center gap-1">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={onPrevWeek}
          isDisabled={!canGoPrev}
        >
          <ChevronLeft size={18} style={{ color: "var(--muted-foreground)" }} />
        </Button>
        <span
          className="min-w-[180px] text-center select-none"
          style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}
        >
          {weekLabel}
        </span>
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={onNextWeek}
          isDisabled={!canGoNext}
        >
          <ChevronRight size={18} style={{ color: "var(--muted-foreground)" }} />
        </Button>
      </div>

      {/* Divider */}
      <Divider orientation="vertical" className="h-6" />

      {/* 4. View dropdown (replaces segmented Week/Day switch) */}
      <div className="relative" ref={viewDropdownRef}>
        <Button
          variant="bordered"
          size="sm"
          onPress={() => setViewDropdownOpen(!viewDropdownOpen)}
          endContent={<ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />}
          className="gap-1.5"
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
            {viewMode === "week" ? "Тиждень" : "День"}
          </span>
        </Button>

        {viewDropdownOpen && (
          <div
            className="absolute top-full left-0 mt-1 z-50 w-[140px] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden"
            style={{
              backgroundColor: "var(--popover)",
              boxShadow: "var(--elevation-md)",
            }}
          >
            {(["week", "day"] as const).map((mode) => {
              const isActive = viewMode === mode;
              return (
                <Button
                  key={mode}
                  variant="light"
                  className="w-full justify-start gap-2 px-3 py-2"
                  style={{
                    backgroundColor: isActive ? "var(--primary-alpha-6)" : undefined,
                  }}
                  onPress={() => {
                    onViewModeChange(mode);
                    setViewDropdownOpen(false);
                  }}
                >
                  <span
                    className="flex-1 text-left"
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)",
                      color: isActive ? "var(--primary)" : "var(--foreground)",
                    }}
                  >
                    {mode === "week" ? "Тиждень" : "День"}
                  </span>
                  {isActive && <Check size={14} style={{ color: "var(--primary)" }} />}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Plan / Fact toggle */}
      <div className="flex items-center rounded-[var(--radius)] border border-[var(--border)] overflow-hidden">
        {(["plan", "fact"] as const).map((mode) => (
          <Button
            key={mode}
            variant={planFact === mode ? "solid" : "light"}
            size="sm"
            onPress={() => onPlanFactChange(mode)}
            className="rounded-none"
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-medium)",
              backgroundColor: planFact === mode ? "var(--secondary)" : "var(--input-background)",
              color: planFact === mode ? "var(--secondary-foreground)" : "var(--muted-foreground)",
            }}
          >
            {mode === "plan" ? "План" : "Факт"}
          </Button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* 7. Schedule status indicator */}
      <Tooltip content={statusCfg.desc}>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius)]"
          style={{ backgroundColor: statusCfg.bg }}
        >
          <StatusIcon size={14} style={{ color: statusCfg.color }} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>
      </Tooltip>

      {/* 8. Lifecycle action buttons */}
      {status === "draft" && (
        <Button
          color="primary"
          onPress={handlePublishClick}
          startContent={<Send size={14} />}
          className="gap-1.5"
          style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any }}>
            Відправити
          </span>
        </Button>
      )}

      {status === "published" && (
        <Button
          variant="bordered"
          onPress={handleReturnToDraft}
          startContent={<RotateCcw size={14} style={{ color: "var(--muted-foreground)" }} />}
          className="gap-1.5"
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)" as any, color: "var(--foreground)" }}>
            Повернути до чернетки
          </span>
        </Button>
      )}
      </div>

      {/* ── Row 2: Metrics + Secondary Tools ── */}
      <div
        className="flex items-center gap-3 px-4"
        style={{ minHeight: 36, paddingTop: 6, paddingBottom: 6 }}
      >
        {/* Summary metrics */}
        {summaryMetrics ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5" title="Прогноз / Графік годин та покриття">
              <BarChart3 size={13} style={{ color: "var(--muted-foreground)" }} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                Прогноз
              </span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", whiteSpace: "nowrap" }}>
                {summaryMetrics.totalForecast}г
              </span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                / Графік
              </span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", whiteSpace: "nowrap" }}>
                {summaryMetrics.totalScheduled}г
              </span>
              {summaryMetrics.totalForecast > 0 && (() => {
                const pct = Math.round((summaryMetrics.totalScheduled / summaryMetrics.totalForecast) * 100);
                return (
                  <div className="flex items-center gap-1.5" style={{ marginLeft: 8 }}>
                    <Target size={13} style={{ color: "var(--muted-foreground)" }} />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                      Покриття
                    </span>
                    <span
                      title={`Покриття ${pct}% — графік покриває прогноз на ${pct}%`}
                      style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)" as any, color: "var(--foreground)", whiteSpace: "nowrap" }}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })()}
            </div>
            {!isFact && summaryMetrics.exchangeCount > 0 && (
              <div className="flex items-center gap-1.5" title="Зміни на біржі">
                <ArrowLeftRight size={13} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                  Біржа
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                  {summaryMetrics.exchangeCount}
                </span>
              </div>
            )}
          </div>
        ) : null}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Error badge — click opens validation modal */}
        {errorCount > 0 ? (
          <Tooltip content="Перевірка графіку — помилки правил розкладу">
            <div className="flex items-center gap-0">
              <Button
                variant="light"
                size="sm"
                className="gap-1.5 px-2.5 py-1.5"
                style={{
                  backgroundColor: issuesFilterActive ? "var(--destructive)" : "var(--destructive-alpha-10)",
                  borderRadius: issuesFilterActive ? "var(--radius) 0 0 var(--radius)" : "var(--radius)",
                }}
                onPress={() => setShowValidationModal(true)}
              >
                <AlertCircle size={14} style={{ color: issuesFilterActive ? "var(--destructive-foreground)" : "var(--destructive)" }} />
                <span style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-medium)",
                  color: issuesFilterActive ? "var(--destructive-foreground)" : "var(--destructive)",
                }}>
                  Помилки
                </span>
                <span style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: issuesFilterActive ? "var(--destructive-foreground)" : "var(--destructive)",
                  minWidth: 16,
                  textAlign: "center",
                }}>
                  {errorCount}
                </span>
              </Button>
              {issuesFilterActive && (
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  className="self-stretch px-1.5"
                  style={{
                    backgroundColor: "var(--destructive)",
                    borderRadius: "0 var(--radius) var(--radius) 0",
                    borderLeft: "1px solid rgba(255,255,255,0.2)",
                  }}
                  onPress={() => onIssuesFilterToggle?.()}
                  title="Вимкнути фільтр помилок"
                >
                  <X size={13} style={{ color: "var(--destructive-foreground)" }} />
                </Button>
              )}
            </div>
          </Tooltip>
        ) : (
          <Tooltip content="Усі правила дотримано">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius)]"
              style={{
                backgroundColor: "var(--muted)",
                cursor: "default",
                opacity: 0.6,
              }}
            >
              <CheckCircle2 size={14} style={{ color: "var(--muted-foreground)" }} />
              <span style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--muted-foreground)",
              }}>
                Помилки
              </span>
              <span style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--muted-foreground)",
              }}>
                0
              </span>
            </div>
          </Tooltip>
        )}

        {/* 6. Print — icon only */}
        <Tooltip content="Друк">
          <Button
            isIconOnly
            variant="bordered"
            size="sm"
          >
            <Printer size={16} style={{ color: "var(--muted-foreground)" }} />
          </Button>
        </Tooltip>

        {/* Focus mode toggle */}
        {onFocusModeToggle && (
          <Tooltip content={isFocusMode ? "Вийти з режиму фокусу (Esc)" : "Режим фокусу — приховати навігацію"}>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={onFocusModeToggle}
              style={{
                backgroundColor: isFocusMode ? "var(--primary-alpha-10)" : "transparent",
                border: isFocusMode ? "1px solid var(--primary-alpha-25)" : "1px solid transparent",
              }}
            >
              {isFocusMode ? (
                <Minimize2 size={16} style={{ color: "var(--primary)" }} />
              ) : (
                <Maximize2 size={16} style={{ color: "var(--muted-foreground)" }} />
              )}
            </Button>
          </Tooltip>
        )}
      </div>
    </header>

    {/* ── Publish Confirmation Modal ── */}
    <Modal isOpen={showPublishModal} onClose={() => setShowPublishModal(false)}>
      <ModalContent>
        <ModalHeader>Відправити розклад?</ModalHeader>
        <ModalBody>
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-normal)",
              color: "var(--muted-foreground)",
              lineHeight: 1.5,
            }}
          >
            Це зробить розклад видимим для працівників.
          </span>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" onPress={() => setShowPublishModal(false)}>
            Скасувати
          </Button>
          <Button color="primary" onPress={handlePublishConfirm} startContent={<Send size={14} />}>
            Відправити
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    {/* ── Validation Modal ── */}
    {showValidationModal && (
      <ValidationModal
        problems={problems}
        onClose={() => setShowValidationModal(false)}
        onPublishAnyway={handleValidationPublish}
        onShowOnSchedule={() => {
          if (!issuesFilterActive) onIssuesFilterToggle?.();
          setShowValidationModal(false);
        }}
        onProblemClick={(p) => {
          onProblemClick?.(p);
          if (!issuesFilterActive) onIssuesFilterToggle?.();
          setShowValidationModal(false);
        }}
      />
    )}

    {/* ── Snackbar notification ── */}
    {showSnackbar && (
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2.5 px-4 py-3 rounded-[var(--radius)] border border-[var(--border)]"
        style={{
          backgroundColor: "var(--card)",
          boxShadow: "var(--elevation-md)",
          animation: "snackbar-in 0.25s ease-out",
        }}
      >
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--success-alpha-12)" }}
        >
          <Check size={12} style={{ color: "var(--chart-2)" }} />
        </div>
        <span
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-medium)",
            color: "var(--foreground)",
            whiteSpace: "nowrap",
          }}
        >
          {snackbarText}
        </span>
        <Button
          isIconOnly
          variant="light"
          size="sm"
          className="ml-1 flex-shrink-0"
          onPress={() => setShowSnackbar(false)}
        >
          <X size={14} style={{ color: "var(--muted-foreground)" }} />
        </Button>
      </div>
    )}
    </div>
  );
}
