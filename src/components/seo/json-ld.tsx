import { isIndexingPrevented } from '@/lib/seo/config';
import { serializeJsonLd } from '@/lib/seo/schema';

export function JsonLd({ data }: { data: unknown }) {
  if (isIndexingPrevented()) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
