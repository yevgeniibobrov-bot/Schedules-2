import React, { useState, useMemo } from "react";
import {
  X,
  AlertCircle,
  AlertTriangle,
  Filter,
  Send,
  ChevronDown,
  ChevronRight,
  User,
  Layers,
} from "lucide-react";
import type { ValidationProblem } from "./Header";

// ── Warning type detection ────────────────────────────────────────────

interface WarningGroup {
  type: string;
  label: string;
  icon: React.ReactNode;
  items: ValidationProblem[];
}

function classifyWarningType(p: ValidationProblem): string {
  const d = p.description.toLowerCase();
  if (d.includes("покриття")) return "coverage";
  if (d.includes("відкрита зміна") || d.includes("незакрита")) return "open-shift";
  if (d.includes("перевищення") || d.includes("норми")) return "overwork";
  return "other";
}

const WARNING_TYPE_LABELS: Record<string, string> = {
  coverage: "Покриття нижче прогнозу",
  "open-shift": "Незакриті відкриті зміни",
  overwork: "Перевищення місячної норми",
  other: "Інші попередження",
};

function pluralCount(n: number): string {
  if (n === 1) return "1 випадок";
  if (n >= 2 && n <= 4) return `${n} випадки`;
  return `${n} випадків`;
}

// ══════════════════════════════════════════════════════════════════════
// ValidationModal
// ══════════════════════════════════════════════════════════════════════

interface ValidationModalProps {
  problems: ValidationProblem[];
  onClose: () => void;
  onPublishAnyway: () => void;
  onShowOnSchedule: () => void;
  onProblemClick: (problem: ValidationProblem) => void;
}

export function ValidationModal({
  problems,
  onClose,
  onPublishAnyway,
  onShowOnSchedule,
  onProblemClick,
}: ValidationModalProps) {
  const errorProblems = useMemo(() => problems.filter((p) => p.severity === "error"), [problems]);
  const warningProblems = useMemo(() => problems.filter((p) => p.severity === "warning"), [problems]);
  const hasErrors = errorProblems.length > 0;
  const hasWarnings = warningProblems.length > 0;

  // ── Group errors by employee ──
  const errorsByEmployee = useMemo(() => {
    const map: Record<string, { name: string; items: ValidationProblem[] }> = {};
    for (const p of errorProblems) {
      if (!map[p.employeeId]) map[p.employeeId] = { name: p.employeeName, items: [] };
      map[p.employeeId].items.push(p);
    }
    return Object.entries(map);
  }, [errorProblems]);

  // ── Group warnings by type ──
  const warningGroups = useMemo<WarningGroup[]>(() => {
    const map: Record<string, ValidationProblem[]> = {};
    for (const p of warningProblems) {
      const type = classifyWarningType(p);
      if (!map[type]) map[type] = [];
      map[type].push(p);
    }
    return Object.entries(map).map(([type, items]) => ({
      type,
      label: WARNING_TYPE_LABELS[type] || type,
      icon:
        type === "coverage" ? (
          <Layers size={13} style={{ color: "var(--chart-3)" }} />
        ) : (
          <AlertTriangle size={13} style={{ color: "var(--chart-3)" }} />
        ),
      items,
    }));
  }, [warningProblems]);

  // ── Expandable section states ──
  // Errors expanded by default, warning groups collapsed by default when errors exist
  const [expandedWarningGroups, setExpandedWarningGroups] = useState<Record<string, boolean>>({});

  const [warningsSectionExpanded, setWarningsSectionExpanded] = useState(!hasErrors);

  const toggleWarningGroup = (type: string) => {
    setExpandedWarningGroups((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // ══════════════════════════════════════════════════════════════════════
  // State A: Critical errors exist
  // ══════════════════════════════════════════════════════════════════════

  if (hasErrors) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ backgroundColor: "var(--overlay)" }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-[560px] mx-4 rounded-[var(--radius)] flex flex-col"
          style={{
            backgroundColor: "var(--card)",
            boxShadow: "var(--elevation-lg)",
            maxHeight: "80vh",
            border: "1px solid var(--destructive-alpha-15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between px-5 pt-5 pb-3">
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "var(--destructive-alpha-10)",
                }}
              >
                <AlertCircle size={20} style={{ color: "var(--destructive)" }} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)",
                  }}
                >
                  Графік містить критичні помилки
                </span>
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-normal)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Публікація заблокована до вирішення помилок
                </span>
              </div>
            </div>
            <button
              className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--muted)] transition-colors flex-shrink-0"
              onClick={onClose}
              style={{ border: "none", backgroundColor: "transparent", cursor: "pointer" }}
            >
              <X size={16} style={{ color: "var(--muted-foreground)" }} />
            </button>
          </div>

          {/* ── Summary bar ── */}
          <div
            className="mx-5 mb-3 px-3 py-2.5 rounded-[var(--radius)] flex items-center gap-3"
            style={{ backgroundColor: "var(--destructive-alpha-6)" }}
          >
            <span
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--destructive)",
              }}
            >
              {errorProblems.length}{" "}
              {errorProblems.length === 1
                ? "критична помилка"
                : errorProblems.length < 5
                ? "критичні помилки"
                : "критичних помилок"}
            </span>
            {hasWarnings && (
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-normal)",
                  color: "var(--muted-foreground)",
                }}
              >
                та {warningProblems.length}{" "}
                {warningProblems.length === 1 ? "попередження" : "попереджень"}
              </span>
            )}
          </div>

          {/* ── Problem list ── */}
          <div className="flex-1 overflow-y-auto px-5 pb-3 flex flex-col gap-4" style={{ minHeight: 0 }}>
            {/* Errors section — always expanded */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 py-0.5">
                <AlertCircle size={13} style={{ color: "var(--destructive)" }} />
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--destructive)",
                  }}
                >
                  Критичні помилки
                </span>
              </div>
              {errorsByEmployee.map(([empId, { name, items }]) => (
                <div
                  key={`err-${empId}`}
                  className="rounded-[var(--radius)] overflow-hidden"
                  style={{ border: "1px solid var(--destructive-alpha-15)" }}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2"
                    style={{ backgroundColor: "var(--destructive-alpha-6)" }}
                  >
                    <User size={12} style={{ color: "var(--destructive)" }} />
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-weight-semibold)",
                        color: "var(--foreground)",
                      }}
                    >
                      {name}
                    </span>
                    <span
                      className="ml-auto"
                      style={{
                        fontSize: "var(--text-2xs)",
                        fontWeight: "var(--font-weight-medium)",
                        color: "var(--destructive)",
                      }}
                    >
                      {items.length}
                    </span>
                  </div>
                  {items.map((p) => (
                    <button
                      key={p.id}
                      className="flex items-start gap-2 w-full text-left px-3 py-2 hover:bg-[var(--destructive-alpha-4)] transition-colors"
                      style={{
                        borderTop: "1px solid var(--border)",
                        border: "none",
                        borderTopWidth: 1,
                        borderTopStyle: "solid",
                        borderTopColor: "var(--border)",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => onProblemClick(p)}
                    >
                      <AlertCircle
                        size={12}
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: "var(--destructive)" }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span
                          style={{
                            fontSize: "var(--text-2xs)",
                            fontWeight: "var(--font-weight-medium)",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          {p.day}
                        </span>
                        <span
                          style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: "var(--font-weight-normal)",
                            color: "var(--foreground)",
                            lineHeight: 1.4,
                          }}
                        >
                          {p.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Warnings section — collapsed by default when errors present */}
            {hasWarnings && (
              <div className="flex flex-col gap-1.5">
                <button
                  className="flex items-center gap-1.5 py-1 w-full text-left"
                  onClick={() => setWarningsSectionExpanded((v) => !v)}
                  style={{
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                  }}
                >
                  {warningsSectionExpanded ? (
                    <ChevronDown size={13} style={{ color: "var(--chart-3)" }} />
                  ) : (
                    <ChevronRight size={13} style={{ color: "var(--chart-3)" }} />
                  )}
                  <AlertTriangle size={13} style={{ color: "var(--chart-3)" }} />
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--chart-3)",
                    }}
                  >
                    Попередження
                  </span>
                  <span
                    className="ml-1 px-1.5 py-px rounded-full"
                    style={{
                      fontSize: "var(--text-2xs)",
                      fontWeight: "var(--font-weight-medium)",
                      color: "var(--chart-3)",
                      backgroundColor: "var(--warning-alpha-8)",
                    }}
                  >
                    {warningProblems.length}
                  </span>
                </button>
                {warningsSectionExpanded && (
                  <WarningGroupList
                    groups={warningGroups}
                    expandedGroups={expandedWarningGroups}
                    onToggleGroup={toggleWarningGroup}
                    onProblemClick={onProblemClick}
                  />
                )}
              </div>
            )}
          </div>

          {/* ── Footer — no "Відправити все одно" when errors exist ── */}
          <div
            className="flex items-center justify-between px-5 pb-4 pt-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button
              className="px-3 py-2 rounded-[var(--radius)] hover:bg-[var(--muted)] transition-colors"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--muted-foreground)",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
              onClick={onClose}
            >
              Закрити
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] transition-opacity hover:opacity-90"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--primary-foreground)",
                backgroundColor: "var(--destructive)",
                border: "none",
                cursor: "pointer",
              }}
              onClick={onShowOnSchedule}
            >
              <Filter size={14} style={{ color: "var(--primary-foreground)" }} />
              Показати проблеми на графіку
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // State B: Warnings only — calmer tone
  // ══════════════════════════════════════════════════════════════════════

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "var(--overlay)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] mx-4 rounded-[var(--radius)] flex flex-col"
        style={{
          backgroundColor: "var(--card)",
          boxShadow: "var(--elevation-lg)",
          maxHeight: "80vh",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header — calm styling ── */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 36,
                height: 36,
                backgroundColor: "var(--warning-alpha-8)",
              }}
            >
              <AlertTriangle size={20} style={{ color: "var(--chart-3)" }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--foreground)",
                }}
              >
                Перевірка графіку
              </span>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-normal)",
                  color: "var(--muted-foreground)",
                }}
              >
                Попередження не блокують відправку графіку
              </span>
            </div>
          </div>
          <button
            className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--muted)] transition-colors flex-shrink-0"
            onClick={onClose}
            style={{ border: "none", backgroundColor: "transparent", cursor: "pointer" }}
          >
            <X size={16} style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>

        {/* ── Informational summary ── */}
        <div
          className="mx-5 mb-3 px-3 py-2.5 rounded-[var(--radius)] flex items-center gap-2"
          style={{ backgroundColor: "var(--warning-alpha-5)" }}
        >
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: "var(--chart-3)",
            }}
          >
            {warningProblems.length}{" "}
            {warningProblems.length === 1 ? "попередження" : "попереджень"}
          </span>
        </div>

        {/* ── Warning groups ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 flex flex-col gap-2" style={{ minHeight: 0 }}>
          <WarningGroupList
            groups={warningGroups}
            expandedGroups={expandedWarningGroups}
            onToggleGroup={toggleWarningGroup}
            onProblemClick={onProblemClick}
          />
        </div>

        {/* ── Footer — publish available ── */}
        <div
          className="flex items-center justify-between px-5 pb-4 pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            className="px-3 py-2 rounded-[var(--radius)] hover:bg-[var(--muted)] transition-colors"
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: "var(--muted-foreground)",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
            }}
            onClick={onClose}
          >
            Закрити
          </button>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius)] transition-colors hover:bg-[var(--muted)]"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--primary)",
                border: "1px solid var(--primary-alpha-25)",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
              onClick={onShowOnSchedule}
            >
              <Filter size={13} style={{ color: "var(--primary)" }} />
              Показати на графіку
            </button>
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] transition-opacity hover:opacity-90"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--primary-foreground)",
                backgroundColor: "var(--primary)",
                border: "none",
                cursor: "pointer",
              }}
              onClick={onPublishAnyway}
            >
              <Send size={14} style={{ color: "var(--primary-foreground)" }} />
              Відправити все одно
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// WarningGroupList — grouped warnings with expand/collapse
// ══════════════════════════════════════════════════════════════════════

interface WarningGroupListProps {
  groups: WarningGroup[];
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (type: string) => void;
  onProblemClick: (problem: ValidationProblem) => void;
}

function WarningGroupList({
  groups,
  expandedGroups,
  onToggleGroup,
  onProblemClick,
}: WarningGroupListProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {groups.map((group) => {
        const isExpanded = expandedGroups[group.type] ?? false;
        return (
          <div
            key={group.type}
            className="rounded-[var(--radius)] overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Group header — clickable toggle */}
            <button
              className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-[var(--warning-alpha-4)] transition-colors"
              style={{
                backgroundColor: "var(--warning-alpha-4)",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => onToggleGroup(group.type)}
            >
              {isExpanded ? (
                <ChevronDown size={12} style={{ color: "var(--muted-foreground)" }} />
              ) : (
                <ChevronRight size={12} style={{ color: "var(--muted-foreground)" }} />
              )}
              {group.icon}
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--foreground)",
                  flex: 1,
                }}
              >
                {group.label}
              </span>
              <span
                className="px-1.5 py-px rounded-full"
                style={{
                  fontSize: "var(--text-2xs)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--chart-3)",
                  backgroundColor: "var(--warning-alpha-8)",
                }}
              >
                {pluralCount(group.items.length)}
              </span>
            </button>

            {/* Expanded detail rows */}
            {isExpanded &&
              group.items.map((p) => (
                <button
                  key={p.id}
                  className="flex items-start gap-2 w-full text-left px-3 py-2 hover:bg-[var(--warning-alpha-4)] transition-colors"
                  style={{
                    borderTop: "1px solid var(--border)",
                    backgroundColor: "transparent",
                    border: "none",
                    borderTopWidth: 1,
                    borderTopStyle: "solid",
                    borderTopColor: "var(--border)",
                    cursor: "pointer",
                  }}
                  onClick={() => onProblemClick(p)}
                >
                  <AlertTriangle
                    size={11}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: "var(--chart-3)" }}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          fontSize: "var(--text-2xs)",
                          fontWeight: "var(--font-weight-medium)",
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {p.day}
                      </span>
                      {p.employeeName && p.employeeId !== "__open__" && !p.employeeId.startsWith("__dept") && (
                        <span
                          style={{
                            fontSize: "var(--text-2xs)",
                            fontWeight: "var(--font-weight-normal)",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          · {p.employeeName}
                        </span>
                      )}
                      {p.employeeName && (p.employeeId === "__open__" || p.employeeId.startsWith("__dept")) && (
                        <span
                          style={{
                            fontSize: "var(--text-2xs)",
                            fontWeight: "var(--font-weight-normal)",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          · {p.employeeName}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-weight-normal)",
                        color: "var(--foreground)",
                        lineHeight: 1.4,
                      }}
                    >
                      {p.description}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        );
      })}
    </div>
  );
}