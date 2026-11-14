import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function svgProps(props: IconProps) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function OverviewIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M3 10.75 12 3l9 7.75" />
      <path d="M5.25 9.5V21h13.5V9.5" />
      <path d="M9.75 21v-6h4.5v6" />
    </svg>
  );
}

export function GuestsIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="9" cy="7.5" r="3.75" />
      <path d="M2.75 20.25v-1.5a4.5 4.5 0 0 1 4.5-4.5h3.5a4.5 4.5 0 0 1 4.5 4.5v1.5" />
      <path d="M16.5 4.2a3.75 3.75 0 0 1 0 7.1" />
      <path d="M18 14.4a4.5 4.5 0 0 1 3.25 4.33v1.52" />
    </svg>
  );
}

export function VendorsIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M3.5 9.5 5 3.75h14l1.5 5.75" />
      <path d="M4.25 9.5V20.25a.75.75 0 0 0 .75.75h14a.75.75 0 0 0 .75-.75V9.5" />
      <path d="M3 9.5h18" />
      <path d="M9.5 21v-5.5h5V21" />
    </svg>
  );
}

export function BudgetIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M20.25 12V7.5a2.25 2.25 0 0 0-2.25-2.25H5.25a2.25 2.25 0 0 0 0 4.5h15V18a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V6.75" />
      <path d="M16.5 13.5h1.5" />
    </svg>
  );
}

export function SeatingIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

export function CastleIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M3 21h18" />
      <path d="M4.5 21V9.75l7.5-5.5 7.5 5.5V21" />
      <path d="M4.5 9.75h15" />
      <path d="M9.75 21v-5.25a2.25 2.25 0 0 1 4.5 0V21" />
      <path d="M8.25 6.75V4.5M15.75 6.75V4.5" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="5.25" width="18" height="15.75" rx="2.25" />
      <path d="M8 3v4.5M16 3v4.5M3 10.5h18" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="m5 12.75 4.5 4.5L19 6.75" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 3.5l1.9 5.35L19.25 10.75l-5.35 1.9L12 18l-1.9-5.35L4.75 10.75l5.35-1.9L12 3.5Z" />
      <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.25" />
      <path d="M8.25 10.5V7.5a3.75 3.75 0 0 1 7.5 0v3" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4.5 7h15" />
      <path d="M9 7V4.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75V7" />
      <path d="M6.75 7 7.5 20a.75.75 0 0 0 .75.75h7.5a.75.75 0 0 0 .75-.75l.75-13" />
      <path d="M10 11v5.5M14 11v5.5" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="10.75" cy="10.75" r="6.75" />
      <path d="m15.75 15.75 4.5 4.5" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M20.25 11.25a8.25 8.25 0 1 0-2.4 5.83" />
      <path d="M20.25 4.5v6.75h-6.75" />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M14.25 8.25V5.25a1.5 1.5 0 0 0-1.5-1.5H4.5a1.5 1.5 0 0 0-1.5 1.5v13.5a1.5 1.5 0 0 0 1.5 1.5h8.25a1.5 1.5 0 0 0 1.5-1.5v-3" />
      <path d="M9.75 12h10.5" />
      <path d="m17.25 8.25 3.75 3.75-3.75 3.75" />
    </svg>
  );
}

export function GripIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="9" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
