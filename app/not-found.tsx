// Served as out/404.html (Amplify answers unknown URLs with it and a 404 status).
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Column } from "@/components/ui/Frame";

export const metadata: Metadata = {
  title: { absolute: "Page not found - Formwork for concrete" },
  description: "The page you are looking for does not exist.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Column className="px-[10px] py-[100px]">
      <p className="text-[16px] text-ink">
        <span aria-hidden="true" className="mr-1 text-accent">/</span>
        404
      </p>
      <h1 className="mt-3">Page not found</h1>
      <p className="mt-6 max-w-[520px] text-[16px] text-ink">The page you are looking for does not exist or has moved.</p>
      <div className="mt-10 flex flex-wrap gap-6">
        <Button href="/">Home</Button>
        <Button href="/projects/" variant="link">
          Projects
        </Button>
      </div>
    </Column>
  );
}
