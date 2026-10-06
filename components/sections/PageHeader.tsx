import { Button } from "@/components/ui/Button";
import { Frame, Label } from "@/components/ui/Frame";
import { Img } from "@/components/ui/Img";

/**
 * Top of an inner page: "/ Label" and the H1 in the hairline frame, then (optionally) a full-width photo with the
 * "find out more" block in its top right corner that jumps to #content.
 */
export function PageHeader({
  label,
  h1,
  image,
  imageAlt,
  findOutMore,
}: {
  label: string;
  h1: string;
  image?: string;
  imageAlt?: string;
  findOutMore?: string;
}) {
  return (
    <>
      <Frame className="grid md:grid-cols-3 md:divide-x md:divide-line">
        <div className="px-[30px] pb-[24px] pt-[40px] md:col-span-2 md:pb-[34px]">
          <Label>{label}</Label>
          <h1 className="mt-3 max-w-[560px] !text-[36px] !leading-[1.2] max-md:!text-[25px]">{h1}</h1>
        </div>
      </Frame>
      {image && (
        <div className="relative h-[320px] w-full overflow-hidden md:h-[410px]">
          <Img src={image} alt={imageAlt ?? ""} fill priority sizes="100vw" className="object-cover" />
          {findOutMore && (
            <div className="absolute right-0 top-0 w-[calc(100%-20px)] bg-white md:w-[34%] min-[1360px]:w-[calc(50%-213px)]">
              <Button href="#content" variant="light" icon="down">
                {findOutMore}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
