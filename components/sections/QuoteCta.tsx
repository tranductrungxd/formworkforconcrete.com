import { Button } from "@/components/ui/Button";
import { Frame, Label } from "@/components/ui/Frame";
import { CONTACT_FORM_HREF } from "@/content/site";
import { projectTemplate } from "@/content/pages";

/** "Become a Customer / CONTACT US FOR FREE QUOTATION" (shared by every project page). */
export function QuoteCta() {
  const { cta } = projectTemplate;
  return (
    <Frame className="grid md:grid-cols-2 md:divide-x md:divide-line">
      <div className="px-[30px] py-[90px] md:px-[95px] md:py-[120px]">
        <Label>{cta.label}</Label>
        <h2 className="mt-4 max-w-[430px]">{cta.heading}</h2>
        <p className="mt-6 max-w-[440px] text-[16px] leading-[1.45] text-ink">{cta.text}</p>
        <div className="mt-8">
          <Button href={CONTACT_FORM_HREF} variant="link">
            {cta.button}
          </Button>
        </div>
      </div>
      {/* The right half is empty on the old site as well (its background photo is missing on the server). */}
      <div className="hidden md:block" />
    </Frame>
  );
}
