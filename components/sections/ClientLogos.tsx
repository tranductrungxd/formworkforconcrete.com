import { Frame, Label } from "@/components/ui/Frame";
import { Img } from "@/components/ui/Img";
import { home } from "@/content/home";
import { media } from "@/lib/media";

// Logos have very different shapes (a 17:1 wordmark next to a near-square badge). Giving each the same area, rather
// than the same box, makes them look equally heavy: width = K * sqrt(ratio), height = K / sqrt(ratio).
const K = 72;
const MAX_W = 220;

/** "Trusted by Concrete Contractors": a row of client logos in grey, in colour on hover. */
export function ClientLogos() {
  const c = home.clients;
  return (
    <section aria-labelledby="clients-heading">
      <Frame className="grid border-t border-line md:grid-cols-3 md:divide-x md:divide-line">
        <div className="px-[30px] pb-[10px] pt-[50px] md:pb-[50px]">
          <Label>{c.label}</Label>
          <h2 id="clients-heading" className="mt-3">
            {c.heading}
          </h2>
        </div>
        <div className="px-[30px] pb-[30px] text-[16px] leading-[1.45] text-ink md:col-span-2 md:flex md:items-end md:pb-[50px]">
          <p>{c.text}</p>
        </div>
      </Frame>
      <Frame className="border-y border-line">
        <ul className="flex flex-wrap items-center justify-center gap-x-[56px] gap-y-[36px] px-[30px] py-[50px] md:justify-between md:px-[60px]">
          {c.logos.map((logo) => {
            const { w, h } = media(logo.image);
            const ratio = w / h;
            const width = Math.min(MAX_W, Math.round(K * Math.sqrt(ratio)));
            const height = Math.round(width / ratio);
            return (
              <li key={logo.name} className="group relative shrink-0" style={{ width, height }}>
                <Img
                  src={logo.image}
                  alt={`${logo.name} logo`}
                  fill
                  sizes={`${width}px`}
                  className="object-contain opacity-70 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                />
              </li>
            );
          })}
        </ul>
      </Frame>
    </section>
  );
}
