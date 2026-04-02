import React, { useState, useMemo } from "react";
import { Button } from "@fzwp/ui-kit/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@fzwp/ui-kit/modal";
import {
  CloseMD,
  CircleWarning,
  TriangleWarning,
  Filter,
  PaperPlane,
  ChevronDown,
  ChevronRight,
  User01,
  Layers,
} from "@fzwp/ui-kit/icons";
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
          <TriangleWarning size={13} style={{ color: "var(--chart-3)" }} />
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
      <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }} size="lg">
        <ModalContent style={{ border: "1px solid var(--destructive-alpha-15)" }}>
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
                <CircleWarning size={20} style={{ color: "var(--destructive)" }} />
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
              <CloseMD size={16} style={{ color: "var(--muted-foreground)" }} />
            </Button>
          </ModalHeader>

          <ModalBody className="px-5 pb-3 flex flex-col gap-4" style={{ minHeight: 0 }}>
            {/* ── Summary bar ── */}
            <div
              className="px-3 py-2.5 rounded-[var(--radius)] flex items-center gap-3"
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

            {/* Errors section — always expanded */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 py-0.5">
                <CircleWarning size={13} style={{ color: "var(--destructive)" }} />
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
                    <User01 size={12} style={{ color: "var(--destructive)" }} />
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
                    <Button
                      key={p.id}
                      variant="light"
                      className="flex items-start gap-2 w-full text-left px-3 py-2 hover:bg-[var(--destructive-alpha-4)] transition-colors justify-start rounded-none"
                      style={{
                        borderTop: "1px solid var(--border)",
                      }}
                      onPress={() => onProblemClick(p)}
                    >
                      <CircleWarning
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
                  className="flex items-center gap-1.5 py-1 w-full text-left justify-start"
                  onPress={() => setWarningsSectionExpanded((v) => !v)}
                >
                  {warningsSectionExpanded ? (
                    <ChevronDown size={13} style={{ color: "var(--chart-3)" }} />
                  ) : (
                    <ChevronRight size={13} style={{ color: "var(--chart-3)" }} />
                  )}
                  <TriangleWarning size={13} style={{ color: "var(--chart-3)" }} />
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
              startContent={<Filter size={14} />}
            >
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
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }} size="md">
      <ModalContent>
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
              <TriangleWarning size={20} style={{ color: "var(--chart-3)" }} />
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
            <CloseMD size={16} style={{ color: "var(--muted-foreground)" }} />
          </Button>
        </ModalHeader>

        <ModalBody className="px-5 pb-3 flex flex-col gap-2" style={{ minHeight: 0 }}>
          {/* ── Informational summary ── */}
          <div
            className="px-3 py-2.5 rounded-[var(--radius)] flex items-center gap-2"
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
          <WarningGroupList
            groups={warningGroups}
            expandedGroups={expandedWarningGroups}
            onToggleGroup={toggleWarningGroup}
            onProblemClick={onProblemClick}
          />
        </ModalBody>

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
              startContent={<Filter size={13} style={{ color: "var(--primary)" }} />}
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--primary)",
              }}
            >
              Показати на графіку
            </Button>
            <Button
              color="primary"
              onPress={onPublishAnyway}
              startContent={<PaperPlane size={14} />}
            >
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
              className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-[var(--warning-alpha-4)] transition-colors justify-start rounded-none"
              style={{
                backgroundColor: "var(--warning-alpha-4)",
              }}
              onPress={() => onToggleGroup(group.type)}
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
            </Button>

            {/* Expanded detail rows */}
            {isExpanded &&
              group.items.map((p) => (
                <Button
                  key={p.id}
                  variant="light"
                  className="flex items-start gap-2 w-full text-left px-3 py-2 hover:bg-[var(--warning-alpha-4)] transition-colors justify-start rounded-none"
                  style={{
                    borderTop: "1px solid var(--border)",
                  }}
                  onPress={() => onProblemClick(p)}
                >
                  <TriangleWarning
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
                </Button>
              ))}
          </div>
        );
      })}
    </div>
  );
}