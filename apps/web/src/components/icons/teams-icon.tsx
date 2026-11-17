import type { SVGProps } from "react";

// lucide-react dropped its brand icons, so the Teams mark lives here.
export function TeamsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      <rect width="24" height="24" rx="5" fill="#5B5FC7" />
      <path fill="#fff" d="M6.6 6.4h10.8v2.15h-4.25V17.6H10.9V8.55H6.6V6.4z" />
    </svg>
  );
}
