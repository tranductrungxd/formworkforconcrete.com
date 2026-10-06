import { ContactPage } from "@/components/pages/ContactPage";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/contact-us/");

export default function Page() {
  return (
    <>
      <JsonLd data={pageJsonLd("/contact-us/")} />
      <ContactPage />
    </>
  );
}
