import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Filter,
  Send,
  ChevronDown,
  ChevronRight,
  User,
  Layers,
  X,
} from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@fzwp/ui-kit/modal';
import { Button } from '@fzwp/ui-kit/button';
import { Badge } from '@fzwp/ui-kit/badge';
import { Divider } from '@fzwp/ui-kit/divider';
import { Tooltip } from '@fzwp/ui-kit/tooltip';
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
      <Modal isOpen={true} onClose={onClose} size="2xl" hideCloseButton>
        <ModalContent
          style={{
            border: "1px solid var(--destructive-alpha-15)",
          }}
        >
          {/* ── Header ── */}
          <ModalHeader className="flex items-start justify-between px-5 pt-5 pb-3">
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
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={onClose}
              className="flex-shrink-0"
            >
              <X size={16} style={{ color: "var(--muted-foreground)" }} />
            </Button>
          </ModalHeader>

          {/* ── Body ── */}
          <ModalBody className="px-5 pb-3 flex flex-col gap-4">
            {/* ── Summary bar ── */}
            <div
              className="px-3 py-2.5 rounded-[var(--radius)] flex items-center gap-3"
              style={{ backgroundColor: "var(--destructive-alpha-6)" }}
            >
              <Badge
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--destructive)",
                  backgroundColor: "transparent",
                }}
              >
                {errorProblems.length}{" "}
                {errorProblems.length === 1
                  ? "критична помилка"
                  : errorProblems.length < 5
                  ? "критичні помилки"
                  : "критичних помилок"}
              </Badge>
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
                    <Badge
                      className="ml-auto"
                      style={{
                        fontSize: "var(--text-2xs)",
                        fontWeight: "var(--font-weight-medium)",
                        color: "var(--destructive)",
                        backgroundColor: "transparent",
                      }}
                    >
                      {items.length}
                    </Badge>
                  </div>
                  {items.map((p) => (
                    <Button
                      key={p.id}
                      variant="light"
                      className="flex items-start gap-2 w-full justify-start px-3 py-2 hover:bg-[var(--destructive-alpha-4)] transition-colors"
                      style={{
                        borderTop: "1px solid var(--border)",
                        borderRadius: 0,
                        height: "auto",
                        minHeight: "unset",
                      }}
                      onPress={() => onProblemClick(p)}
                    >
                      <AlertCircle
                        size={12}
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: "var(--destructive)" }}
                      />
                      <div className="flex flex-col min-w-0 text-left">
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
                    </Button>
                  ))}
                </div>
              ))}
            </div>

            {/* Warnings section — collapsed by default when errors present */}
            {hasWarnings && (
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="light"
                  className="w-full justify-start"
                  size="sm"
                  onPress={() => setWarningsSectionExpanded((v) => !v)}
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
                  <Badge
                    className="ml-1"
                    style={{
                      fontSize: "var(--text-2xs)",
                      fontWeight: "var(--font-weight-medium)",
                      color: "var(--chart-3)",
                      backgroundColor: "var(--warning-alpha-8)",
                    }}
                  >
                    {warningProblems.length}
                  </Badge>
                </Button>
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
          </ModalBody>

          {/* ── Footer — no "Відправити все одно" when errors exist ── */}
          <Divider />
          <ModalFooter className="flex items-center justify-between px-5 pb-4 pt-3">
            <Button
              variant="light"
              onPress={onClose}
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--muted-foreground)",
              }}
            >
              Закрити
            </Button>
            <Button
              color="danger"
              onPress={onShowOnSchedule}
              className="flex items-center gap-2"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              <Filter size={14} style={{ color: "var(--primary-foreground)" }} />
              Показати проблеми на графіку
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // State B: Warnings only — calmer tone
  // ══════════════════════════════════════════════════════════════════════

  return (
    <Modal isOpen={true} onClose={onClose} size="2xl">
      <ModalContent
        style={{
          border: "1px solid var(--border)",
        }}
      >
        {/* ── Header — calm styling ── */}
        <ModalHeader className="flex items-start justify-between px-5 pt-5 pb-3">
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
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={onClose}
            className="flex-shrink-0"
          >
            <X size={16} style={{ color: "var(--muted-foreground)" }} />
          </Button>
        </ModalHeader>

        {/* ── Body ── */}
        <ModalBody className="px-5 pb-3 flex flex-col gap-2">
          {/* ── Informational summary ── */}
          <div
            className="px-3 py-2.5 rounded-[var(--radius)] flex items-center gap-2"
            style={{ backgroundColor: "var(--warning-alpha-5)" }}
          >
            <Badge
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--chart-3)",
                backgroundColor: "transparent",
              }}
            >
              {warningProblems.length}{" "}
              {warningProblems.length === 1 ? "попередження" : "попереджень"}
            </Badge>
          </div>

          {/* ── Warning groups ── */}
          <WarningGroupList
            groups={warningGroups}
            expandedGroups={expandedWarningGroups}
            onToggleGroup={toggleWarningGroup}
            onProblemClick={onProblemClick}
          />
        </ModalBody>

        {/* ── Footer — publish available ── */}
        <Divider />
        <ModalFooter className="flex items-center justify-between px-5 pb-4 pt-3">
          <Button
            variant="light"
            onPress={onClose}
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: "var(--muted-foreground)",
            }}
          >
            Закрити
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="bordered"
              onPress={onShowOnSchedule}
              className="flex items-center gap-1.5"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--primary)",
                borderColor: "var(--primary-alpha-25)",
              }}
            >
              <Filter size={13} style={{ color: "var(--primary)" }} />
              Показати на графіку
            </Button>
            <Button
              color="primary"
              onPress={onPublishAnyway}
              className="flex items-center gap-1.5"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              <Send size={14} style={{ color: "var(--primary-foreground)" }} />
              Відправити все одно
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
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
            <Button
              variant="light"
              className="w-full justify-start"
              size="sm"
              onPress={() => onToggleGroup(group.type)}
              style={{
                backgroundColor: "var(--warning-alpha-4)",
                borderRadius: 0,
              }}
            >
              <div className="flex items-center gap-2 w-full">
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
                    textAlign: "left",
                  }}
                >
                  {group.label}
                </span>
                <Badge
                  style={{
                    fontSize: "var(--text-2xs)",
                    fontWeight: "var(--font-weight-medium)",
                    color: "var(--chart-3)",
                    backgroundColor: "var(--warning-alpha-8)",
                  }}
                >
                  {pluralCount(group.items.length)}
                </Badge>
              </div>
            </Button>

            {/* Expanded detail rows */}
            {isExpanded &&
              group.items.map((p) => (
                <Button
                  key={p.id}
                  variant="light"
                  className="w-full justify-start px-3 py-2 hover:bg-[var(--warning-alpha-4)] transition-colors"
                  style={{
                    borderTop: "1px solid var(--border)",
                    borderRadius: 0,
                    height: "auto",
                    minHeight: "unset",
                  }}
                  onPress={() => onProblemClick(p)}
                >
                  <div className="flex items-start gap-2 w-full text-left">
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
                  </div>
                </Button>
              ))}
          </div>
        );
      })}
    </div>
  );
}
