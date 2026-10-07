"use client";

import Script from "next/script";
import { GA_ID } from "@/content/site";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * GA4 (gtag.js, same property as the old site). gtag.js loads when the browser is idle after the load event (`lazyOnload`);
 * the inline init runs earlier and queues its commands, so no event is lost. It does not compete with the first paint.
 * There is no cookie banner, as on the old site. The old site's Smartsupp live chat is removed (owner decision 2026-10-07).
 */
export function Analytics() {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
