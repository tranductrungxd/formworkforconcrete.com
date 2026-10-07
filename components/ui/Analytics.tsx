"use client";

import Script from "next/script";
import { useEffect } from "react";
import { CLARITY_ID, GA_ID } from "@/content/site";
import { rememberCtaPage, rememberLanding, track } from "@/lib/track";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const QUOTE_LINK = /\/contact-us\/?(#contact-form)?$/;

/** Text of a link for the event, without line breaks and capped (GA4 parameter values are limited to 100 characters). */
const linkText = (a: HTMLAnchorElement) => (a.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 100);

/**
 * GA4 (gtag.js, same property as the old site) and, when CLARITY_ID is set, Microsoft Clarity. Both load when the browser
 * is idle after the load event (`lazyOnload`); the inline GA4 init runs earlier and queues its commands, so no event is
 * lost. There is no cookie banner, as on the old site. The old site's Smartsupp live chat is removed (owner decision 2026-10-07).
 *
 * Conversion events (one listener for the whole site, so no button needs its own code):
 *   cta_click     a link to the contact page or its form (link_text, page_path)
 *   email_click   a mailto: link (page_path)
 * The form adds quote_form_start, file_upload and generate_lead (components/ui/ContactForm.tsx).
 */
export function Analytics() {
  useEffect(() => {
    rememberLanding();
    function onClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (href.startsWith("mailto:")) {
        track("email_click", { link_text: linkText(a) });
      } else if (QUOTE_LINK.test(href.replace(/^https:\/\/formworkforconcrete\.com/, ""))) {
        track("cta_click", { link_text: linkText(a) });
        rememberCtaPage(window.location.pathname);
      }
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
      {CLARITY_ID && (
        <Script id="clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}
    </>
  );
}
