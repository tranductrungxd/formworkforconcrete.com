import type { SVGProps } from "react";

const base = { "aria-hidden": true, focusable: false, fill: "currentColor" } as const;

/** Nine-dot menu glyph of the header. */
export function DotsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...base} {...props}>
      {[3, 10, 17].flatMap((y) => [3, 10, 17].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" />))}
    </svg>
  );
}

export function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21h-4V9.5Z" />
    </svg>
  );
}

export function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...base} {...props}>
      <path fillRule="evenodd" d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.3 5 12 5 12 5s-6.3 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2C2 8.76 2 12 2 12s0 3.24.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.7 19 12 19 12 19s6.3 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77C22 15.24 22 12 22 12s0-3.24-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...base} {...props}>
      <path fillRule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1.2 17.9v-6.2h2.1l.4-2.6h-2.5V9.5c0-.75.35-1.4 1.45-1.4h1.1V5.9s-1-.17-2-.17c-2.05 0-3.4 1.24-3.4 3.5v1.87H8.2v2.6h2.15v6.2h2.85Z" />
    </svg>
  );
}

/** Solid white envelope with the flap in the background colour, as in the footer of the old site. */
export function EnvelopeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" {...base} {...props}>
      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h17A1.5 1.5 0 0 1 21 2.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 1 15.5v-13Z" />
      <path d="m2 3 9 7 9-7" fill="none" stroke="#000" strokeWidth="1.6" />
    </svg>
  );
}
