import { NewsPage } from "@/components/pages/NewsPage";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/news/");

export default function Page() {
  return (
    <>
      <JsonLd data={pageJsonLd("/news/")} />
      <NewsPage />
    </>
  );
}
