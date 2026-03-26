import clsx from "clsx";
import svgPaths from "./svg-jfnxlebcsy";
import imgImage from "figma:asset/88041e830143e9dc2f636f1b7864b368e1816471.png";
import imgSilpoLogo from "figma:asset/d67ff0d1c512da8a24b5df3159e4e6886bbfd634.png";
type Wrapper2Props = {
  additionalClassNames?: string;
};

function Wrapper2({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper2Props>) {
  return (
    <div className={clsx("flex flex-row items-center size-full", additionalClassNames)}>
      <div className="content-stretch flex gap-[8px] items-center p-[8px] relative">{children}</div>
    </div>
  );
}

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center justify-center size-full">
      <div className="content-stretch flex items-center justify-center overflow-clip relative">{children}</div>
    </div>
  );
}

function Vector1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="absolute inset-[12.5%]">
      <div className="absolute inset-[-5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.5 16.5">
          {children}
        </svg>
      </div>
    </div>
  );
}
type CapNavigationPanelButtonProps = {
  additionalClassNames?: string;
};

function CapNavigationPanelButton({ children, additionalClassNames = "" }: React.PropsWithChildren<CapNavigationPanelButtonProps>) {
  return (
    <div className={clsx("flex-[1_0_0] min-h-[32px] min-w-px relative rounded-[8px] self-stretch", additionalClassNames)}>
      <div className="flex flex-row items-center justify-center min-h-[inherit] overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center justify-center min-h-[inherit] px-[12px] relative size-full">{children}</div>
      </div>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="content-stretch flex h-[32px] items-start min-h-[32px] overflow-clip relative shrink-0 w-full">
      <CapNavigationPanelButton>{children}</CapNavigationPanelButton>
    </div>
  );
}

function Helper() {
  return (
    <div className="content-stretch flex items-center min-h-[inherit] px-[12px] relative w-full">
      <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="divider">
        <div className="flex flex-col items-center size-full">
          <div className="content-stretch flex flex-col items-center relative w-full">
            <div className="h-0 relative shrink-0 w-full" data-name="Line">
              <div className="absolute inset-[-1px_0_0_0]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 1">
                  <line id="Line" stroke="var(--stroke-0, #75717E)" strokeOpacity="0.25" x2="20" y1="0.5" y2="0.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Vector() {
  return (
    <div className="absolute inset-[11.22%_9.05%_10.69%_9.06%]">
      <div className="absolute inset-[-4.8%_-4.58%_-4.82%_-4.58%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.8794 17.1199">
          <path d={svgPaths.p152f7700} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}

function AvatarHelper2() {
  return (
    <Wrapper1>
      <AvatarContent className="relative shrink-0" size="lg" />
    </Wrapper1>
  );
}

function AvatarHelper1() {
  return (
    <Wrapper1>
      <AvatarContent className="relative shrink-0" size="md" />
    </Wrapper1>
  );
}

function AvatarHelper() {
  return (
    <Wrapper1>
      <AvatarContent className="relative shrink-0" />
    </Wrapper1>
  );
}
type AvatarContentProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  style?: "image" | "name" | "icon";
};

function AvatarContent({ className, size = "sm", style = "image" }: AvatarContentProps) {
  const isIconAndIsSmOrMdOrLg = style === "icon" && ["sm", "md", "lg"].includes(size);
  const isIconAndLg = style === "icon" && size === "lg";
  const isIconAndMd = style === "icon" && size === "md";
  const isIconAndSm = style === "icon" && size === "sm";
  const isLg = size === "lg";
  const isNameAndIsSmOrMdOrLg = style === "name" && ["sm", "md", "lg"].includes(size);
  return (
    <div className={className || `relative ${size === "lg" && ["name", "icon"].includes(style) ? "size-[56px]" : size === "md" && ["name", "icon"].includes(style) ? "size-[40px]" : size === "sm" && ["name", "icon"].includes(style) ? "size-[32px]" : ""}`}>
      <div className={`flex ${isIconAndIsSmOrMdOrLg ? "flex-row items-center justify-center size-full" : isNameAndIsSmOrMdOrLg ? "flex-col items-center justify-center size-full" : "content-stretch items-start relative"}`}>
        {((style === "name" && size === "sm") || (style === "name" && size === "md") || (style === "name" && size === "lg") || isIconAndSm || isIconAndMd || isIconAndLg) && (
          <div className={`content-stretch flex items-center justify-center relative size-full ${isIconAndIsSmOrMdOrLg ? "" : "flex-col"}`}>
            {isNameAndIsSmOrMdOrLg && (
              <div className={`flex flex-col font-["Inter:Regular",sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#17151a] whitespace-nowrap ${isLg ? "text-[14px]" : "text-[12px]"}`}>
                <p className={isLg ? "leading-[18px]" : "leading-[16px]"}>JG</p>
              </div>
            )}
            {isIconAndSm && (
              <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / User / User_Circle">
                <Vector1>
                  <path d={svgPaths.p2350d000} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </Vector1>
              </div>
            )}
            {isIconAndMd && (
              <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Large / User / User_Circle">
                <div className="absolute inset-[12.5%]" data-name="Vector">
                  <div className="absolute inset-[-4.72%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.7 19.7">
                      <path d={svgPaths.p1eebe500} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            {isIconAndLg && (
              <div className="overflow-clip relative shrink-0 size-[30px]" data-name="X-large / User / User_Circle">
                <div className="absolute inset-[12.5%]" data-name="Vector">
                  <div className="absolute inset-[-5.56%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                      <path d={svgPaths.p324cb280} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {style === "image" && ["sm", "md", "lg"].includes(size) && (
          <div className={`relative shrink-0 ${isLg ? "size-[56px]" : size === "md" ? "size-[40px]" : "size-[32px]"}`} data-name="Image">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img alt="" className="absolute h-[150%] left-0 max-w-none top-[-1.85%] w-full" src={imgImage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
type AvatarProps = {
  className?: string;
  bordered?: boolean;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
};

function Avatar({ className, bordered = false, color = "default", disabled = false, size = "sm" }: AvatarProps) {
  if (size === "sm" && !bordered && color === "default" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px]"} data-name="size=sm, bordered=false, color=default, disabled=true">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "primary" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#17151a]"} data-name="size=sm, bordered=true, color=primary, disabled=false">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "primary" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#17151a]"} data-name="size=sm, bordered=true, color=primary, disabled=true">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "secondary" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#5887dd]"} data-name="size=sm, bordered=true, color=secondary, disabled=false">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "secondary" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#5887dd]"} data-name="size=sm, bordered=true, color=secondary, disabled=true">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "success" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#45a248]"} data-name="size=sm, bordered=true, color=success, disabled=false">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "success" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#45a248]"} data-name="size=sm, bordered=true, color=success, disabled=true">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "warning" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#dc7d13]"} data-name="size=sm, bordered=true, color=warning, disabled=false">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "warning" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#dc7d13]"} data-name="size=sm, bordered=true, color=warning, disabled=true">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "danger" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#eb4b59]"} data-name="size=sm, bordered=true, color=danger, disabled=false">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "danger" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#eb4b59]"} data-name="size=sm, bordered=true, color=danger, disabled=true">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "default" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#888491]"} data-name="size=sm, bordered=true, color=default, disabled=false">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "sm" && bordered && color === "default" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#888491]"} data-name="size=sm, bordered=true, color=default, disabled=true">
        <AvatarHelper />
      </div>
    );
  }
  if (size === "md" && !bordered && color === "default" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px]"} data-name="size=md, bordered=false, color=default, disabled=false">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && !bordered && color === "default" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px]"} data-name="size=md, bordered=false, color=default, disabled=true">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "primary" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#17151a]"} data-name="size=md, bordered=true, color=primary, disabled=false">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "primary" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#17151a]"} data-name="size=md, bordered=true, color=primary, disabled=true">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "secondary" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#5887dd]"} data-name="size=md, bordered=true, color=secondary, disabled=false">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "secondary" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#5887dd]"} data-name="size=md, bordered=true, color=secondary, disabled=true">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "success" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#45a248]"} data-name="size=md, bordered=true, color=success, disabled=false">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "success" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#45a248]"} data-name="size=md, bordered=true, color=success, disabled=true">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "warning" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#dc7d13]"} data-name="size=md, bordered=true, color=warning, disabled=false">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "warning" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#dc7d13]"} data-name="size=md, bordered=true, color=warning, disabled=true">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "danger" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#eb4b59]"} data-name="size=md, bordered=true, color=danger, disabled=false">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "danger" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#eb4b59]"} data-name="size=md, bordered=true, color=danger, disabled=true">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "default" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#888491]"} data-name="size=md, bordered=true, color=default, disabled=false">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "md" && bordered && color === "default" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#888491]"} data-name="size=md, bordered=true, color=default, disabled=true">
        <AvatarHelper1 />
      </div>
    );
  }
  if (size === "lg" && !bordered && color === "default" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px]"} data-name="size=lg, bordered=false, color=default, disabled=false">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && !bordered && color === "default" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px]"} data-name="size=lg, bordered=false, color=default, disabled=true">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "primary" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#17151a]"} data-name="size=lg, bordered=true, color=primary, disabled=false">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "primary" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#17151a]"} data-name="size=lg, bordered=true, color=primary, disabled=true">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "secondary" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#5887dd]"} data-name="size=lg, bordered=true, color=secondary, disabled=false">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "secondary" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#5887dd]"} data-name="size=lg, bordered=true, color=secondary, disabled=true">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "success" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#45a248]"} data-name="size=lg, bordered=true, color=success, disabled=false">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "success" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#45a248]"} data-name="size=lg, bordered=true, color=success, disabled=true">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "warning" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#dc7d13]"} data-name="size=lg, bordered=true, color=warning, disabled=false">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "warning" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#dc7d13]"} data-name="size=lg, bordered=true, color=warning, disabled=true">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "danger" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#eb4b59]"} data-name="size=lg, bordered=true, color=danger, disabled=false">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "danger" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#eb4b59]"} data-name="size=lg, bordered=true, color=danger, disabled=true">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "default" && !disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#888491]"} data-name="size=lg, bordered=true, color=default, disabled=false">
        <AvatarHelper2 />
      </div>
    );
  }
  if (size === "lg" && bordered && color === "default" && disabled) {
    return (
      <div className={className || "bg-[rgba(62,113,206,0.1)] opacity-50 relative rounded-[1000px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#888491]"} data-name="size=lg, bordered=true, color=default, disabled=true">
        <AvatarHelper2 />
      </div>
    );
  }
  return (
    <div className={className || "bg-[rgba(62,113,206,0.1)] relative rounded-[1000px]"} data-name="size=sm, bordered=false, color=default, disabled=false">
      <AvatarHelper />
    </div>
  );
}
type DividerProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
  style?: "horisontal" | "vertical";
};

function Divider({ className, size = "sm", style = "horisontal" }: DividerProps) {
  const isHorisontalAndIsFullOrLgOrMdOrSm = style === "horisontal" && ["full", "lg", "md", "sm"].includes(size);
  const isLg = size === "lg";
  const isLgOrMd = ["lg", "md"].includes(size);
  const isMd = size === "md";
  const isSm = size === "sm";
  return (
    <div className={className || `relative ${isHorisontalAndIsFullOrLgOrMdOrSm ? "w-[40px]" : "h-[40px]"}`}>
      <div className={`flex items-center size-full ${isHorisontalAndIsFullOrLgOrMdOrSm ? "flex-col" : "flex-row"}`}>
        <div className={`content-stretch flex items-center relative ${style === "horisontal" && size === "sm" ? "flex-col px-[16px] w-full" : style === "vertical" && size === "sm" ? "h-full py-[16px]" : style === "horisontal" && size === "md" ? "flex-col px-[8px] w-full" : style === "vertical" && size === "md" ? "h-full py-[8px]" : style === "horisontal" && size === "lg" ? "flex-col px-[4px] w-full" : style === "vertical" && size === "lg" ? "h-full py-[4px]" : style === "horisontal" && size === "full" ? "flex-col w-full" : "h-full"}`}>
          {style === "vertical" && ["full", "lg", "md", "sm"].includes(size) && (
            <div className="flex h-0 items-center justify-center relative self-center shrink-0 w-0" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "19" } as React.CSSProperties}>
              <div className="-rotate-90 flex-none h-full">
                <div className={`h-full relative ${isSm ? "w-[8px]" : isMd ? "w-[24px]" : isLg ? "w-[32px]" : "w-[40px]"}`} data-name="Line">
                  <div className="absolute inset-[-1px_0_0_0]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox={isSm ? "0 0 8 1" : isLgOrMd ? "0 0 24 1" : "0 0 40 1"}>
                      <line id="Line" stroke="var(--stroke-0, #75717E)" strokeOpacity="0.25" x2={isSm ? "8" : isLgOrMd ? "24" : "40"} y1="0.5" y2="0.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
          {isHorisontalAndIsFullOrLgOrMdOrSm && (
            <div className="h-0 relative shrink-0 w-full" data-name="Line">
              <div className="absolute inset-[-1px_0_0_0]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox={isSm ? "0 0 8 1" : isMd ? "0 0 20 1" : isLg ? "0 0 32 1" : "0 0 40 1"}>
                  <line id="Line" stroke="var(--stroke-0, #75717E)" strokeOpacity="0.25" x2={isSm ? "8" : isMd ? "20" : isLg ? "32" : "40"} y1="0.5" y2="0.5" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
type CapNavigationPanelItemProps = {
  className?: string;
  condensed?: boolean;
  title?: string;
  variant?: "item" | "divider" | "title";
};

function CapNavigationPanelItem({ className, condensed = false, title = "title", variant = "item" }: CapNavigationPanelItemProps) {
  const isItemAndIsTrueOrFalse = variant === "item" && [true, false].includes(condensed);
  const isNotCondensed = !condensed;
  const isTitleAndNotCondensed = variant === "title" && !condensed;
  return (
    <div className={className || `min-h-[32px] relative ${variant === "item" && !condensed ? "h-[32px] w-[264px]" : !condensed && ["title", "divider"].includes(variant) ? "w-[264px]" : variant === "item" && condensed ? "h-[32px] w-[44px]" : "w-[44px]"}`}>
      <div className={`flex min-h-[inherit] ${isTitleAndNotCondensed ? "content-stretch items-start pb-[4px] pt-[16px] px-[12px] relative w-full" : isItemAndIsTrueOrFalse ? "content-stretch items-start relative size-full" : "flex-row items-center size-full"}`}>
        {((variant === "title" && condensed) || (variant === "divider" && condensed) || (variant === "divider" && !condensed)) && <Helper />}
        {isItemAndIsTrueOrFalse && (
          <div className="flex-[1_0_0] min-h-[32px] min-w-px relative rounded-[8px] self-stretch" data-name="cap_navigation_panel_button">
            <div className={`flex flex-row items-center min-h-[inherit] overflow-clip rounded-[inherit] size-full ${isNotCondensed ? "" : "justify-center"}`}>
              <div className={`content-stretch flex items-center min-h-[inherit] relative size-full ${isNotCondensed ? "gap-[8px] pl-[12px] pr-[4px] py-[6px]" : "justify-center px-[12px]"}`}>
                {condensed && (
                  <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / Interface / Star">
                    <Vector />
                  </div>
                )}
                {isNotCondensed && (
                  <>
                    <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / Interface / Star">
                      <Vector />
                    </div>
                    <div className="flex flex-[1_0_0] flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#17151a] text-[14px] text-ellipsis">
                      <p className="leading-[18px]">Label</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {isTitleAndNotCondensed && <p className="flex-[1_0_0] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[12px] min-h-px min-w-px not-italic relative text-[#5e5a66] text-[10px] uppercase">{title}</p>}
      </div>
    </div>
  );
}

export default function SchedulingWorkforceDashboard() {
  return (
    <div className="bg-[#eceaef] content-stretch flex isolate items-start relative size-full" data-name="Scheduling / Workforce Dashboard">
      <div className="bg-[#eceaef] h-full relative shrink-0 w-[76px] z-[2]" data-name="cap_navigation_panel">
        <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0)] border-r border-solid inset-0 pointer-events-none" />
        <div className="flex flex-col items-center size-full">
          <div className="content-stretch flex flex-col gap-[8px] items-center pb-[16px] pt-[8px] px-[16px] relative size-full">
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-name="_navigationPanel_appSwitcher">
              <div className="bg-[rgba(255,255,255,0)] relative rounded-[8px] shrink-0" data-name="_appSwitcherButton">
                <Wrapper2>
                  <div className="content-stretch flex items-center overflow-clip relative rounded-[6px] shrink-0" data-name="Logo container">
                    <div className="overflow-clip relative shrink-0 size-[28px]" data-name="silpo logo">
                      <img alt="" className="absolute block max-w-none size-full" height="28" src={imgSilpoLogo} width="28" />
                    </div>
                  </div>
                </Wrapper2>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-h-px min-w-px relative w-full" data-name="content">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-h-px min-w-px relative w-full" data-name="cap_navigation_panel_items">
                <Wrapper>
                  <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / Navigation / House_03">
                    <div className="absolute inset-[15.24%_8.33%_16.67%_8.33%]" data-name="Vector">
                      <div className="absolute inset-[-5.51%_-4.5%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.1667 15.1186">
                          <path d={svgPaths.p308b2180} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Wrapper>
                <div className="min-h-[32px] relative shrink-0 w-full" data-name="cap_navigation_panel_item">
                  <div className="flex flex-row items-center min-h-[inherit] overflow-clip rounded-[inherit] size-full">
                    <Helper />
                  </div>
                </div>
                <div className="content-stretch flex h-[32px] items-start min-h-[32px] overflow-clip relative shrink-0 w-full" data-name="cap_navigation_panel_item">
                  <CapNavigationPanelButton additionalClassNames="bg-white">
                    <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Small / Interface / Chart_Bar_Horizontal_01">
                      <div className="absolute inset-[12.5%_16.67%]" data-name="Vector">
                        <div className="absolute inset-[-5%_-5.63%_-5%_-5.62%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8333 16.5">
                            <path d={svgPaths.p2f744080} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </CapNavigationPanelButton>
                </div>
                <Wrapper>
                  <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / Navigation / Truck_Return">
                    <div className="absolute inset-[18.75%_10.42%]" data-name="Vector">
                      <div className="absolute inset-[-6%_-4.74%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 14.0001">
                          <path d={svgPaths.p3d1c100} fill="var(--stroke-0, #17151A)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Wrapper>
                <Wrapper>
                  <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / Edit / Move">
                    <Vector1>
                      <path d={svgPaths.p2d6d9a00} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </Vector1>
                  </div>
                </Wrapper>
                <Wrapper>
                  <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / Edit / List_Checklist">
                    <div className="absolute bottom-1/4 left-[16.67%] right-[16.67%] top-[20.83%]" data-name="Vector">
                      <div className="absolute inset-[-6.92%_-5.63%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8334 12.3334">
                          <path d={svgPaths.p1589ddc0} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Wrapper>
                <Wrapper>
                  <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / Arrow / Arrow_Left_Right">
                    <div className="absolute inset-[20.83%]" data-name="Vector">
                      <div className="absolute inset-[-6.43%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.1667 13.1667">
                          <path d={svgPaths.p3ad15980} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Wrapper>
                <Wrapper>
                  <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / Navigation / Receipt">
                    <div className="absolute inset-[12.5%_9.38%]" data-name="Vector">
                      <div className="absolute inset-[-5%_-4.62%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.75 16.5">
                          <path d={svgPaths.p6807900} fill="var(--stroke-0, #17151A)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Wrapper>
              </div>
            </div>
            <div className="bg-[#eceaef] content-stretch flex flex-col items-center justify-end relative shrink-0 w-full" data-name="bottom">
              <CapNavigationPanelItem className="min-h-[32px] relative shrink-0 w-full" condensed variant="divider" />
              <div className="h-[32px] min-h-[32px] relative shrink-0 w-full" data-name="cap_navigation_panel_item">
                <div className="min-h-[inherit] overflow-clip rounded-[inherit] size-full">
                  <div className="content-stretch flex items-start min-h-[inherit] relative size-full">
                    <CapNavigationPanelButton>
                      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / Media / Headphones">
                        <div className="absolute inset-[16.67%_12.5%_20.83%_12.5%]" data-name="Vector">
                          <div className="absolute inset-[-6%_-5%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.5001 14.0003">
                              <path d={svgPaths.p1029a578} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </CapNavigationPanelButton>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute right-[-12px] rounded-[6px] top-[20px]" data-name="button">
              <div className="flex flex-row items-center justify-center size-full">
                <div className="content-stretch flex items-center justify-center p-[2px] relative">
                  <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / System / Bar_Left<">
                    <div className="absolute h-[13.333px] left-[16.67%] right-[16.67%] top-[3.33px]" data-name="Vector">
                      <div className="absolute inset-[-5.63%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8333 14.8333">
                          <path d={svgPaths.p1b81ef04} id="Vector" stroke="var(--stroke-0, #5E5A66)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start min-h-px min-w-px relative z-[1]" data-name="Layout">
        <div className="bg-[#eceaef] h-[64px] relative shrink-0 w-full" data-name="header">
          <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0)] border-b border-solid inset-0 pointer-events-none" />
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex gap-[16px] items-center pl-[40px] pr-[16px] relative size-full">
              <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="headerContent">
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex items-center relative w-full">
                    <div className="relative shrink-0" data-name="cap_breadcrumbs">
                      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                        <div className="content-stretch flex items-center relative">
                          <div className="h-[24px] relative shrink-0" data-name="_cap_breadcrumbLink">
                            <div className="flex flex-row items-center size-full">
                              <div className="content-stretch flex gap-[4px] h-full items-center px-[4px] relative">
                                <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Small / Navigation / House_03">
                                  <div className="absolute inset-[15.24%_8.33%_16.67%_8.33%]" data-name="Vector">
                                    <div className="absolute inset-[-5.97%_-4.87%]">
                                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6333 12.1949">
                                        <path d={svgPaths.p2d7d5400} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                                <p className="font-['Inter:Medium',sans-serif] font-medium leading-[18px] not-italic overflow-hidden relative shrink-0 text-[#17151a] text-[14px] text-ellipsis whitespace-nowrap">1998 С КИЇВ Володимира Івасюка пр-т, 46</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Right">
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Buttons & divider">
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Button group">
                    <div className="bg-[rgba(117,113,126,0.1)] relative rounded-[8px] shrink-0" data-name="button">
                      <div className="flex flex-row items-center justify-center size-full">
                        <div className="content-stretch flex items-center justify-center p-[6px] relative">
                          <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / Communication / Bell">
                            <div className="absolute inset-[12.5%_16.67%]" data-name="Vector">
                              <div className="absolute inset-[-5%_-5.63%]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8337 16.5">
                                  <path d={svgPaths.p3bc9980} id="Vector" stroke="var(--stroke-0, #17151A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row items-center self-stretch">
                    <Divider className="h-full relative shrink-0" size="lg" style="vertical" />
                  </div>
                </div>
                <div className="bg-[rgba(255,255,255,0)] relative rounded-[8px] shrink-0" data-name="user button">
                  <Wrapper2 additionalClassNames="overflow-clip rounded-[inherit]">
                    <div className="relative shrink-0" data-name="user">
                      <div className="flex flex-row items-center size-full">
                        <div className="content-stretch flex gap-[8px] isolate items-center relative">
                          <Avatar className="bg-[rgba(62,113,206,0.1)] relative rounded-[1000px] shrink-0 z-[2]" />
                          <div className="content-stretch flex flex-col items-start leading-[0] not-italic relative shrink-0 whitespace-nowrap z-[1]" data-name="div.inline-flex">
                            <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center relative shrink-0 text-[#17151a] text-[12px]">
                              <p className="leading-[14px]">Валентин Острозький</p>
                            </div>
                            <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#5e5a66] text-[10px]">
                              <p className="leading-[12px]">v.ostrozkyi@silpo.ua</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Medium / Arrow / Caret_Down_MD">
                      <div className="absolute inset-[41.67%_33.33%]" data-name="Vector">
                        <div className="absolute inset-[-22.5%_-11.25%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.16667 4.83333">
                            <path d={svgPaths.p35021480} id="Vector" stroke="var(--stroke-0, #5E5A66)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Wrapper2>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white flex-[1_0_0] min-h-px min-w-px rounded-tl-[24px] w-full" data-name="content" />
      </div>
    </div>
  );
}