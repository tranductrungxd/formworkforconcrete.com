import { HomePage } from "@/components/pages/HomePage";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/");

export default function Page() {
  return (
    <>
      <JsonLd data={pageJsonLd("/")} />
      <HomePage />
    </>
  );
}
