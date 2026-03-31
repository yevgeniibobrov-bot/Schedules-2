import React, { useEffect, useRef } from "react";
import {
  Pencil,
  Copy,
  Clipboard,
  Trash2,
  ArrowRightLeft,
  UserPlus,
  UserCheck,
  ArrowLeftRight,
  Undo2,
} from "lucide-react";
import { Card } from "@fzwp/ui-kit/card";
import { Button } from "@fzwp/ui-kit/button";
import { Divider } from "@fzwp/ui-kit/divider";

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  dividerBefore?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onAction: (actionId: string) => void;
  onClose: () => void;
  /** "employee" for assigned shift, "open-shift" for plain open, "on-exchange" for exchange */
  variant?: "employee" | "open-shift" | "on-exchange";
  /** Whether there's a shift in the clipboard to paste */
  hasClipboard?: boolean;
}

function buildEmployeeActions(hasClipboard: boolean): ContextMenuAction[] {
  return [
    { id: "edit", label: "Редагувати зміну", icon: <Pencil size={14} /> },
    { id: "copy", label: "Копіювати", icon: <Copy size={14} />, shortcut: "Ctrl+C" },
    { id: "paste", label: "Вставити", icon: <Clipboard size={14} />, shortcut: "Ctrl+V", disabled: !hasClipboard },
    {
      id: "exchange",
      label: "Відправити на біржу",
      icon: <ArrowRightLeft size={14} />,
      dividerBefore: true,
    },
    {
      id: "open-shift",
      label: "Перетворити на відкриту зміну",
      icon: <UserPlus size={14} />,
    },
    {
      id: "delete",
      label: "Видалити",
      icon: <Trash2 size={14} />,
      danger: true,
      dividerBefore: true,
    },
  ];
}

function buildOpenShiftActions(hasClipboard: boolean): ContextMenuAction[] {
  return [
    { id: "edit", label: "Редагувати зміну", icon: <Pencil size={14} /> },
    { id: "copy", label: "Копіювати", icon: <Copy size={14} />, shortcut: "Ctrl+C" },
    { id: "paste", label: "Вставити", icon: <Clipboard size={14} />, shortcut: "Ctrl+V", disabled: !hasClipboard },
    {
      id: "exchange",
      label: "Відправити на біржу",
      icon: <ArrowLeftRight size={14} />,
      dividerBefore: true,
    },
    {
      id: "convert-to-assigned",
      label: "Призначити працівнику",
      icon: <UserCheck size={14} />,
    },
    {
      id: "delete",
      label: "Видалити",
      icon: <Trash2 size={14} />,
      danger: true,
      dividerBefore: true,
    },
  ];
}

function buildOnExchangeActions(hasClipboard: boolean): ContextMenuAction[] {
  return [
    { id: "edit", label: "Редагувати зміну", icon: <Pencil size={14} /> },
    { id: "copy", label: "Копіювати", icon: <Copy size={14} />, shortcut: "Ctrl+C" },
    { id: "paste", label: "Вставити", icon: <Clipboard size={14} />, shortcut: "Ctrl+V", disabled: !hasClipboard },
    {
      id: "remove-exchange",
      label: "Зняти з біржі",
      icon: <Undo2 size={14} />,
      dividerBefore: true,
    },
    {
      id: "convert-to-assigned",
      label: "Призначити працівнику",
      icon: <UserCheck size={14} />,
    },
    {
      id: "delete",
      label: "Видалити",
      icon: <Trash2 size={14} />,
      danger: true,
      dividerBefore: true,
    },
  ];
}

export function ShiftContextMenu({
  x,
  y,
  onAction,
  onClose,
  variant = "employee",
  hasClipboard = false,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const actions =
    variant === "on-exchange"
      ? buildOnExchangeActions(hasClipboard)
      : variant === "open-shift"
        ? buildOpenShiftActions(hasClipboard)
        : buildEmployeeActions(hasClipboard);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would overflow viewport
  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw) {
      ref.current.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > vh) {
      ref.current.style.top = `${y - rect.height}px`;
    }
  }, [x, y]);

  return (
    <Card
      ref={ref}
      className="fixed z-50 min-w-[220px] overflow-hidden p-0"
      style={{
        left: x,
        top: y,
      }}
    >
      {actions.map((action) => (
        <div key={action.id}>
          {action.dividerBefore && <Divider />}
          <Button
            variant="light"
            size="sm"
            className="w-full justify-start"
            isDisabled={action.disabled}
            onPress={() => {
              if (action.disabled) return;
              onAction(action.id);
              onClose();
            }}
            startContent={
              <span
                className="flex-shrink-0"
                style={{
                  color: action.danger
                    ? "var(--destructive)"
                    : "var(--muted-foreground)",
                }}
              >
                {action.icon}
              </span>
            }
          >
            <span
              className="flex-1 text-left"
              style={{
                color: action.danger
                  ? "var(--destructive)"
                  : "var(--foreground)",
              }}
            >
              {action.label}
            </span>
            {action.shortcut && (
              <span
                style={{
                  fontSize: "var(--text-2xs)",
                  fontWeight: "var(--font-weight-normal)",
                  color: "var(--muted-foreground)",
                }}
              >
                {action.shortcut}
              </span>
            )}
          </Button>
        </div>
      ))}
    </Card>
  );
}
