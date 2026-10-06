"use client";

import Script from "next/script";
import { GA_ID, SMARTSUPP_KEY } from "@/content/site";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * GA4 (gtag.js, same property as the old site) and the Smartsupp live chat. gtag.js and the chat load when the browser is idle after the load event (`lazyOnload`);
 * the inline init runs earlier and queues its commands, so no event is lost. Neither competes with the first paint.
 * There is no cookie banner, as on the old site.
 */
export function Analytics() {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
      {SMARTSUPP_KEY && (
        <Script id="smartsupp" strategy="lazyOnload">
          {`var _smartsupp=_smartsupp||{};_smartsupp.key='${SMARTSUPP_KEY}';window.smartsupp||(function(d){var s,c,o=smartsupp=function(){o._.push(arguments)};o._=[];s=d.getElementsByTagName('script')[0];c=d.createElement('script');c.type='text/javascript';c.charset='utf-8';c.async=true;c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);})(document);`}
        </Script>
      )}
    </>
  );
}
