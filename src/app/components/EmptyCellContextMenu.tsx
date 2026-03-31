import React, { useEffect, useRef } from "react";
import {
  Plus,
  Clipboard,
  Copy,
} from "lucide-react";
import { Card } from "@fzwp/ui-kit/card";
import { Button } from "@fzwp/ui-kit/button";
import { Divider } from "@fzwp/ui-kit/divider";

interface EmptyCellContextMenuProps {
  x: number;
  y: number;
  onAction: (actionId: string) => void;
  onClose: () => void;
  hasClipboard?: boolean;
  hasShiftsInWeek?: boolean;
}

interface MenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  shortcut?: string;
  dividerBefore?: boolean;
}

export function EmptyCellContextMenu({
  x,
  y,
  onAction,
  onClose,
  hasClipboard = false,
  hasShiftsInWeek = false,
}: EmptyCellContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  const actions: MenuAction[] = [
    { id: "create", label: "Створити зміну", icon: <Plus size={14} /> },
    { id: "paste", label: "Вставити", icon: <Clipboard size={14} />, disabled: !hasClipboard, shortcut: "Ctrl+V" },
    { id: "copy-week", label: "Копіювати тиждень", icon: <Copy size={14} />, disabled: !hasShiftsInWeek, dividerBefore: true },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
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

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw) ref.current.style.left = `${x - rect.width}px`;
    if (rect.bottom > vh) ref.current.style.top = `${y - rect.height}px`;
  }, [x, y]);

  return (
    <Card
      ref={ref}
      className="fixed z-50 min-w-[200px] overflow-hidden p-0"
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
              <span className="flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                {action.icon}
              </span>
            }
          >
            <span className="flex-1 text-left">
              {action.label}
            </span>
            {action.shortcut && (
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>
                {action.shortcut}
              </span>
            )}
          </Button>
        </div>
      ))}
    </Card>
  );
}
