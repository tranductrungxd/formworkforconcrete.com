import { Minus, Plus } from "lucide-react";

/** Native <details> toggles (no JavaScript): the "Dimensioned for the crew…" list of the scaffolding band. */
export function Accordion({ items }: { items: readonly { title: string; text: string }[] }) {
  return (
    <div className="border-b border-white/25">
      {items.map((item) => (
        <details key={item.title} className="group border-t border-white/25">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 px-[10px] py-[30px] text-[24px] font-bold uppercase leading-[1.2] text-white [&::-webkit-details-marker]:hidden">
            <span className="max-w-[340px]">{item.title}</span>
            <Plus aria-hidden="true" size={20} strokeWidth={1.25} className="mt-1 shrink-0 group-open:hidden" />
            <Minus aria-hidden="true" size={20} strokeWidth={1.25} className="mt-1 hidden shrink-0 group-open:block" />
          </summary>
          <p className="px-[10px] pb-[30px] pr-12 text-[16px] leading-[1.5] text-white/85">{item.text}</p>
        </details>
      ))}
    </div>
  );
}
