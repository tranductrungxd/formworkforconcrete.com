import type { ElementType, ReactNode } from "react";

/**
 * The 1280px content frame of the design: centred, with a hairline on each side (a "grid line" look that runs through
 * the whole site). On small screens it keeps a 20px margin like the old site.
 */
export function Frame({ as: Tag = "div", className = "", children, ...rest }: { as?: ElementType; className?: string; children: ReactNode; [key: string]: unknown }) {
  return (
    <Tag className={`mx-5 border-x border-line min-[1360px]:mx-auto min-[1360px]:max-w-site ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/** Frame without the side hairlines, for plain text blocks. */
export function Column({ as: Tag = "div", className = "", children, ...rest }: { as?: ElementType; className?: string; children: ReactNode; [key: string]: unknown }) {
  return (
    <Tag className={`mx-5 min-[1360px]:mx-auto min-[1360px]:max-w-site ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/** "/ Label" above a heading. */
export function Label({ children, invert = false, className = "" }: { children: ReactNode; invert?: boolean; className?: string }) {
  return (
    <p className={`text-[16px] font-normal ${invert ? "text-white" : "text-ink"} ${className}`}>
      <span aria-hidden="true" className="mr-1 text-accent">/</span>
      {children}
    </p>
  );
}
