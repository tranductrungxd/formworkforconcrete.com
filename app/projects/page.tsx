import { ProjectsPage } from "@/components/pages/ProjectsPage";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/projects/");

export default function Page() {
  return (
    <>
      <JsonLd data={pageJsonLd("/projects/")} />
      <ProjectsPage />
    </>
  );
}
