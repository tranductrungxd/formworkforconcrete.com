import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "dark" | "link" | "block" | "light" | "accent";

// Uppercase 14px bold with wide tracking and an orange underline under label and arrow, as on the old site.
const label = "inline-flex items-center gap-3 border-b-2 border-accent pb-0.5 text-[14px] font-bold uppercase tracking-[0.14em] leading-none";
const variants: Record<Variant, string> = {
  dark: "inline-flex bg-ink px-[30px] py-[25px] text-white hover:bg-charcoal",
  link: "inline-flex py-3 text-ink hover:text-ink",
  block: "flex w-full items-center justify-center bg-ink px-[30px] py-[25px] text-white hover:bg-charcoal",
  light: "flex w-full items-center justify-center bg-white px-[30px] py-[25px] text-ink hover:bg-paper",
  accent: "inline-flex bg-accent px-[30px] py-[25px] text-ink hover:bg-white",
};

/** Internal links use next/link; http(s) and mailto links are plain anchors (http(s) open in a new tab). */
export function Button({
  href,
  variant = "dark",
  icon = "right",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  icon?: "right" | "down" | "none";
  className?: string;
  children: ReactNode;
}) {
  const Icon = icon === "down" ? ArrowDownRight : ArrowRight;
  const inner = (
    <span className={label}>
      <span>{children}</span>
      {icon !== "none" && <Icon aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0" />}
    </span>
  );
  const cls = `transition-colors ${variants[variant]} ${className}`;
  if (/^(https?:|mailto:)/.test(href)) {
    return (
      <a href={href} className={cls} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
