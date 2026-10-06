import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import { Button } from "./Button";
import { Img } from "./Img";

const components: Components = {
  a({ href = "", title, children }) {
    // `[Contact us](/contact-us/#contact-form "button")` renders as a button (the old posts had a Contact us button).
    if (title === "button") return <Button href={href} className="not-prose mt-1">{children}</Button>;
    if (/^https?:/.test(href)) {
      return (
        <a href={href} target="_blank" rel="noopener">
          {children}
        </a>
      );
    }
    return <Link href={href}>{children}</Link>;
  },
  img({ src, alt }) {
    if (typeof src !== "string") return null;
    return <Img src={src} alt={alt ?? ""} sizes="(min-width: 1024px) 830px, 100vw" className="block h-auto w-full" />;
  },
};

/** Markdown copy of the project and post files, styled by .prose-ffc (app/globals.css). Images come from Cloudinary. */
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`prose-ffc ${className}`}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
