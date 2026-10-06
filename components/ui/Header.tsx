"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { company, logo, mobileNav, nav, sidePanel, type MegaMenu } from "@/content/site";
import { contactPage } from "@/content/pages";
import { Img } from "./Img";
import { DotsIcon, EnvelopeIcon } from "./Icons";

const mailto = `mailto:${company.email}?subject=${encodeURIComponent(contactPage.mailSubject)}`;
const navItem = "group flex h-[88px] items-center px-[14px] text-[14px] font-bold uppercase tracking-[0.14em] text-ink";
// The indicator is an orange underline under the label: on hover and keyboard focus, for the current page and for an open mega menu.
const navLabel = (on: boolean) => `border-b-2 pb-1 transition-colors ${on ? "border-accent" : "border-transparent group-hover:border-accent group-focus-visible:border-accent"}`;

function Mega({ menu }: { menu: MegaMenu }) {
  return (
    <div className="absolute inset-x-0 top-full z-50 border-y border-line bg-white shadow-[0_20px_30px_-20px_rgba(0,0,0,0.15)]">
      <div className="mx-auto grid max-w-[1060px] grid-cols-[1fr_1fr_1.1fr] gap-0 px-6 py-7">
        <div className="flex flex-col items-start justify-center gap-5 pr-8">
          <p className="text-[20px] font-bold uppercase leading-[1.2] text-ink">{menu.title}</p>
          <Link href={menu.viewAll.href} className="inline-flex items-center gap-2 border-b-2 border-accent pb-0.5 text-[14px] font-bold uppercase tracking-[0.14em] text-ink">
            {menu.viewAll.label}
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
          </Link>
        </div>
        <ul className="flex flex-col justify-center gap-3 border-l border-line pl-6 pr-6 text-[16px] text-ink">
          {menu.items.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="hover:underline hover:decoration-accent hover:underline-offset-4">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="relative aspect-[478/248] w-full overflow-hidden">
          <Img src={menu.image} alt={menu.imageAlt} fill sizes="480px" className="object-cover" />
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mega, setMega] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // Close everything when the page changes (a hash link on the same page counts as a click too, see onNavigate).
  // State is reset while rendering, the pattern React recommends over an effect for "reset on prop change".
  const [shownPath, setShownPath] = useState(pathname);
  if (shownPath !== pathname) {
    setShownPath(pathname);
    setMega(null);
    setOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMega(null);
      if (open) {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) closeButton.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]) && !href.includes("#"));
  const onNavigate = () => {
    setMega(null);
    setOpen(false);
  };

  return (
    <header className="relative z-40 border-b border-line bg-white" onMouseLeave={() => setMega(null)}>
      <div className="flex h-[70px] items-stretch justify-between lg:h-[88px]">
        <Link href="/" className="flex items-center pl-5 lg:pl-9" aria-label="Formwork for Concrete, home" onClick={onNavigate}>
          <Img src={logo} alt="Formwork for Concrete" priority sizes="230px" className="h-auto w-[192px] lg:w-[230px]" />
        </Link>

        <nav aria-label="Primary" className="hidden flex-1 items-stretch justify-center lg:flex">
          <ul className="flex items-stretch">
            {nav.map((item) => (
              <li key={item.label} className="flex" onMouseEnter={() => setMega(item.mega ? item.label : null)} onFocus={() => setMega(item.mega ? item.label : null)}>
                {item.label === "Solutions" ? (
                  <button
                    type="button"
                    aria-expanded={mega === item.label}
                    aria-controls="mega-solutions"
                    onClick={() => setMega(mega === item.label ? null : item.label)}
                    className={navItem}
                  >
                    <span className={navLabel(mega === item.label)}>{item.label}</span>
                  </button>
                ) : (
                  <Link href={item.href} aria-current={active(item.href) ? "page" : undefined} onClick={onNavigate} className={navItem}>
                    <span className={navLabel(active(item.href))}>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={trigger}
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen(!open)}
          className="flex w-[70px] items-center justify-center text-ink lg:w-[88px] lg:bg-accent lg:text-white lg:hover:bg-ink"
        >
          {open ? <X aria-hidden="true" size={28} strokeWidth={1} className="text-accent lg:hidden" /> : null}
          <DotsIcon className={open ? "hidden lg:block" : ""} />
        </button>
      </div>

      {/* Desktop mega menus. Always in the HTML (hidden until hovered) so their photos are part of the build and get warmed. */}
      {nav.map(
        (item) =>
          item.mega && (
            <div key={item.label} id={item.label === "Solutions" ? "mega-solutions" : "mega-projects"} hidden={mega !== item.label} className="max-lg:hidden" onClick={onNavigate}>
              <Mega menu={item.mega} />
            </div>
          ),
      )}

      {/* Below 1024px: the menu of the old mobile header (Home, Projects, Contact Us, News) */}
      {open && (
        <nav id="site-menu" aria-label="Mobile" className="absolute inset-x-0 top-full z-50 border-b border-line bg-white lg:hidden">
          <ul className="px-5">
            {mobileNav.map((item) => (
              <li key={item.label} className="border-b border-line last:border-b-0">
                <Link href={item.href} onClick={onNavigate} aria-current={active(item.href) ? "page" : undefined} className="block py-[18px] text-[14px] font-bold uppercase tracking-[0.18em] text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/*
        Desktop side panel. Always in the DOM so it can animate in and out like the old Elementor panel (slideInRight,
        0.6 s): the panel slides from the right while the backdrop fades. When closed it is `inert` and hidden once the
        slide-out has finished (visibility is delayed by the same 600 ms).
      */}
      <div className={`fixed inset-0 z-50 max-lg:hidden ${open ? "visible" : "invisible delay-[600ms] [transition-property:visibility]"}`}>
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className={`absolute inset-0 cursor-default bg-black/55 transition-opacity duration-[600ms] ease-out motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          id="site-menu-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Contact"
          aria-hidden={!open}
          inert={!open}
          className={`absolute right-0 top-0 flex h-full w-full max-w-[570px] flex-col bg-white shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.25)] transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <button ref={closeButton} type="button" aria-label="Close menu" onClick={() => { setOpen(false); trigger.current?.focus(); }} className="absolute right-9 top-8 p-2 text-ink">
            <X aria-hidden="true" size={32} strokeWidth={1} />
          </button>
          <div className="flex flex-1 flex-col justify-center px-20">
            <Img src={logo} alt="Formwork for Concrete" sizes="380px" className="mb-9 h-auto w-[380px] max-w-full" />
            <p className="text-[16px] font-normal text-ink">
              <span aria-hidden="true" className="mr-1 text-accent">/</span>
              {sidePanel.label}
            </p>
            <p className="mt-3 text-[24px] font-bold uppercase leading-[1.2] text-text">
              {sidePanel.lines[0]}
              <br />
              {sidePanel.lines[1]}
            </p>
            <p className="mt-8 text-[16px] text-ink">{sidePanel.memberOf}</p>
            <a href={mailto} className="mt-6 inline-flex items-center gap-2 text-[16px] text-ink">
              <EnvelopeIcon width={18} height={15} className="shrink-0" style={{ color: "#4a4a4a" }} stroke="none" />
              {company.email}
            </a>
          </div>
          <Link href={sidePanel.cta.href} onClick={onNavigate} className="mr-[114px] flex items-center justify-center bg-ink py-[26px] text-white hover:bg-charcoal">
            <span className="inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.14em]">
              {sidePanel.cta.label}
              <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
            </span>
          </Link>
        </aside>
      </div>
    </header>
  );
}
