import React, { useState } from "react";
import svgPaths from "../../imports/svg-jfnxlebcsy";
import imgImage from "../../assets/88041e830143e9dc2f636f1b7864b368e1816471.png";
import imgSilpoLogo from "../../assets/d67ff0d1c512da8a24b5df3159e4e6886bbfd634.png";

import { Avatar } from '@fzwp/ui-kit/avatar';
import { Button } from '@fzwp/ui-kit/button';
import { Divider } from '@fzwp/ui-kit/divider';
import { Tooltip } from '@fzwp/ui-kit/tooltip';
import { User } from '@fzwp/ui-kit/user';

// ── Sidebar nav item icons ──────────────────────────────────────────

const navItems = [
  { id: "home", name: "Головна", path: svgPaths.p308b2180, viewBox: "0 0 18.1667 15.1186", inset: "15.24% 8.33% 16.67% 8.33%", outerInset: "-5.51% -4.5%" },
  { id: "schedule", name: "Графік", path: svgPaths.p2f744080, viewBox: "0 0 14.8333 16.5", inset: "12.5% 16.67%", outerInset: "-5% -5.63% -5% -5.62%", active: true },
  { id: "delivery", name: "Доставка", path: svgPaths.p3d1c100, viewBox: "0 0 17.3333 14.0001", inset: "18.75% 10.42%", outerInset: "-6% -4.74%", fill: true },
  { id: "move", name: "Переміщення", path: svgPaths.p2d6d9a00, viewBox: "0 0 16.5 16.5", inset: "12.5%", outerInset: "-5%" },
  { id: "checklist", name: "Чеклист", path: svgPaths.p1589ddc0, viewBox: "0 0 14.8334 12.3334", inset: "20.83% 16.67% 25% 16.67%", outerInset: "-6.92% -5.63%" },
  { id: "exchange", name: "Обмін", path: svgPaths.p3ad15980, viewBox: "0 0 13.1667 13.1667", inset: "20.83%", outerInset: "-6.43%" },
  { id: "receipt", name: "Накладна", path: svgPaths.p6807900, viewBox: "0 0 17.75 16.5", inset: "12.5% 9.38%", outerInset: "-5% -4.62%", fill: true },
] as const;

interface NavIconProps {
  item: typeof navItems[number];
}

function NavIcon({ item }: NavIconProps) {
  return (
    <div className="overflow-clip relative shrink-0" style={{ width: 20, height: 20 }}>
      <div className="absolute" style={{ inset: item.inset }}>
        <div className="absolute" style={{ inset: item.outerInset }}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox={item.viewBox}>
            {item.fill ? (
              <path d={item.path} fill="var(--foreground)" />
            ) : (
              <path d={item.path} stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Headphones icon (support) ───────────────────────────────────────

function HeadphonesIcon() {
  return (
    <div className="overflow-clip relative shrink-0" style={{ width: 20, height: 20 }}>
      <div className="absolute" style={{ inset: "16.67% 12.5% 20.83% 12.5%" }}>
        <div className="absolute" style={{ inset: "-6% -5%" }}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.5001 14.0003">
            <path d={svgPaths.p1029a578} stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Bell icon ───────────────────────────────────────────────────────

function BellIcon() {
  return (
    <div className="overflow-clip relative shrink-0" style={{ width: 20, height: 20 }}>
      <div className="absolute" style={{ inset: "12.5% 16.67%" }}>
        <div className="absolute" style={{ inset: "-5% -5.63%" }}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8337 16.5">
            <path d={svgPaths.p3bc9980} stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── House breadcrumb icon ───────────────────────────────────────────

function HouseBreadcrumbIcon() {
  return (
    <div className="overflow-clip relative shrink-0" style={{ width: 16, height: 16 }}>
      <div className="absolute" style={{ inset: "15.24% 8.33% 16.67% 8.33%" }}>
        <div className="absolute" style={{ inset: "-5.97% -4.87%" }}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6333 12.1949">
            <path d={svgPaths.p2d7d5400} stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Caret down icon ─────────────────────────────────────────────────

function CaretDownIcon() {
  return (
    <div className="overflow-clip relative shrink-0" style={{ width: 20, height: 20 }}>
      <div className="absolute" style={{ inset: "41.67% 33.33%" }}>
        <div className="absolute" style={{ inset: "-22.5% -11.25%" }}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.16667 4.83333">
            <path d={svgPaths.p35021480} stroke="var(--muted-foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Collapse sidebar icon ───────────────────────────────────────────

function CollapseIcon() {
  return (
    <div className="overflow-clip relative shrink-0" style={{ width: 20, height: 20 }}>
      <div className="absolute" style={{ left: "16.67%", right: "16.67%", top: 3.33, height: 13.333 }}>
        <div className="absolute" style={{ inset: "-5.63%" }}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8333 14.8333">
            <path d={svgPaths.p1b81ef04} stroke="var(--muted-foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── CRM Shell ───────────────────────────────────────────────────────

interface CrmShellProps {
  children: React.ReactNode;
  isFocusMode?: boolean;
}

export function CrmShell({ children, isFocusMode = false }: CrmShellProps) {
  const [activeNav, setActiveNav] = useState("schedule");

  return (
    <div className="flex flex-row items-start h-screen w-screen overflow-hidden" style={{ backgroundColor: "var(--sidebar)", isolation: "isolate" }}>
      {/* ── Left sidebar ──────────────────────────────────────────── */}
      <div
        className="h-full relative shrink-0 overflow-hidden"
        style={{
          width: isFocusMode ? 0 : 76,
          maxWidth: isFocusMode ? 0 : 76,
          minWidth: isFocusMode ? 0 : 76,
          backgroundColor: "var(--sidebar)",
          zIndex: 2,
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1), max-width 0.25s cubic-bezier(0.4,0,0.2,1)",
          opacity: isFocusMode ? 0 : 1,
        }}
      >
        {/* Right border (transparent) - decorative only */}

        <div className="flex flex-col items-center size-full">
          <div className="flex flex-col items-center size-full" style={{ gap: 8, padding: "8px 16px 16px" }}>
            {/* App switcher / Silpo logo */}
            <div className="flex items-center shrink-0" style={{ padding: "2px 0" }}>
              <div className="shrink-0" style={{ borderRadius: "var(--radius)" }}>
                <div className="flex flex-row items-center size-full">
                  <div className="flex items-center" style={{ padding: 8, gap: 8 }}>
                    <div className="flex items-center overflow-clip shrink-0" style={{ borderRadius: "var(--radius-md)" }}>
                      <div className="overflow-clip relative shrink-0" style={{ width: 28, height: 28 }}>
                        <img alt="Silpo" className="absolute block size-full" style={{ maxWidth: "none" }} src={imgSilpoLogo} width={28} height={28} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <div className="flex flex-col items-center w-full" style={{ flex: "1 0 0", minHeight: 1, minWidth: 1, gap: 16 }}>
              <div className="flex flex-col items-start w-full" style={{ flex: "1 0 0", minHeight: 1, minWidth: 1, gap: 2 }}>
                {/* Home */}
                <NavButton
                  icon={<NavIcon item={navItems[0]} />}
                  isActive={activeNav === "home"}
                  onClick={() => setActiveNav("home")}
                />

                {/* Divider after home */}
                <div className="w-full" style={{ height: 32, minHeight: 32 }}>
                  <div className="flex flex-row items-center size-full">
                    <div className="flex items-center w-full" style={{ paddingLeft: 12, paddingRight: 12 }}>
                      <Divider />
                    </div>
                  </div>
                </div>

                {/* Schedule (active) */}
                <NavButton
                  icon={<NavIcon item={navItems[1]} />}
                  isActive={activeNav === "schedule"}
                  onClick={() => setActiveNav("schedule")}
                />

                {/* Rest of nav items */}
                {navItems.slice(2).map((item) => (
                  <NavButton
                    key={item.id}
                    icon={<NavIcon item={item} />}
                    isActive={activeNav === item.id}
                    onClick={() => setActiveNav(item.id)}
                  />
                ))}
              </div>
            </div>

            {/* Bottom section */}
            <div className="flex flex-col items-center justify-end shrink-0 w-full" style={{ backgroundColor: "var(--sidebar)" }}>
              <div className="w-full" style={{ height: 32, minHeight: 32 }}>
                <div className="flex flex-row items-center size-full">
                  <div className="flex items-center w-full" style={{ paddingLeft: 12, paddingRight: 12 }}>
                    <Divider />
                  </div>
                </div>
              </div>
              <NavButton
                icon={<HeadphonesIcon />}
                isActive={false}
                onClick={() => {}}
              />
            </div>

            {/* Collapse button */}
            <div className="absolute" style={{ right: -12, top: 20, borderRadius: "var(--radius-md)" }}>
              <Button isIconOnly variant="light">
                <CollapseIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Header + Content ───────────────────────────────── */}
      <div className="flex flex-col h-full items-start" style={{ flex: "1 0 0", minHeight: 1, minWidth: 1, zIndex: 1 }}>
        {/* Header bar */}
        <div
          className="relative shrink-0 w-full overflow-hidden"
          style={{
            height: isFocusMode ? 0 : 64,
            maxHeight: isFocusMode ? 0 : 64,
            minHeight: isFocusMode ? 0 : 64,
            backgroundColor: "var(--sidebar)",
            transition: "height 0.25s cubic-bezier(0.4,0,0.2,1), min-height 0.25s cubic-bezier(0.4,0,0.2,1), max-height 0.25s cubic-bezier(0.4,0,0.2,1)",
            opacity: isFocusMode ? 0 : 1,
          }}
        >
          {/* Bottom border (transparent) - decorative only */}

          <div className="flex flex-row items-center size-full">
            <div className="flex items-center relative size-full" style={{ gap: 16, paddingLeft: 40, paddingRight: 16 }}>
              {/* Breadcrumb */}
              <div className="relative" style={{ flex: "1 0 0", minHeight: 1, minWidth: 1 }}>
                <div className="flex flex-row items-center size-full">
                  <div className="flex items-center relative w-full">
                    <div className="relative shrink-0">
                      <div className="flex flex-row items-center overflow-clip size-full">
                        <div className="flex items-center relative">
                          <div className="relative shrink-0" style={{ height: 24 }}>
                            <div className="flex flex-row items-center size-full">
                              <div className="flex items-center h-full" style={{ gap: 4, paddingLeft: 4, paddingRight: 4 }}>
                                <HouseBreadcrumbIcon />
                                <p style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-medium)", lineHeight: "18px", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  1998 С КИЇВ Володимира Івасюка пр-т, 46
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: bell + user */}
              <div className="flex items-center shrink-0" style={{ gap: 8 }}>
                <div className="flex items-center shrink-0" style={{ gap: 16 }}>
                  {/* Bell button */}
                  <div className="flex items-center shrink-0" style={{ gap: 8 }}>
                    <Button isIconOnly variant="light">
                      <BellIcon />
                    </Button>
                  </div>

                  {/* Vertical divider */}
                  <div className="flex flex-row items-center self-stretch" style={{ padding: "4px 0" }}>
                    <Divider orientation="vertical" />
                  </div>
                </div>

                {/* User button */}
                <div className="relative shrink-0" style={{ borderRadius: "var(--radius)" }}>
                  <div className="flex flex-row items-center size-full overflow-clip" style={{ borderRadius: "inherit", padding: 8, gap: 8 }}>
                    <User
                      name="Валентин Острозький"
                      description="v.ostrozkyi@silpo.ua"
                      avatarProps={{ src: imgImage }}
                    />

                    {/* Caret */}
                    <CaretDownIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── White content area ──────────────────────────────────── */}
        <div
          className="w-full overflow-auto"
          style={{
            flex: "1 1 0",
            minHeight: 0,
            minWidth: 0,
            backgroundColor: "var(--background)",
            borderTopLeftRadius: isFocusMode ? 0 : "var(--radius-card)",
            transition: "border-radius 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Nav button helper ───────────────────────────────────────────────

interface NavButtonProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ icon, isActive, onClick }: NavButtonProps) {
  return (
    <Button
      isIconOnly
      variant="light"
      onPress={onClick}
      className="shrink-0 w-full"
      style={{
        height: 32,
        minHeight: 32,
        borderRadius: "var(--radius)",
        backgroundColor: isActive ? "var(--background)" : "transparent",
        transition: "background-color 0.15s",
      }}
    >
      {icon}
    </Button>
  );
}
