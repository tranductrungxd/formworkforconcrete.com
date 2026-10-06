/** Renders JSON-LD blocks. "<" is escaped so the data can never close the script tag. */
export function JsonLd({ data }: { data: unknown[] }) {
  return (
    <>
      {data.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, "\\u003c") }} />
      ))}
    </>
  );
}
