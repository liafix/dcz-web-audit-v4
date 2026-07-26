import Image from 'next/image';
import { cn } from '@/lib/cn';

export function BrandMark({
  compact = false,
  priority = false,
  decorative = false,
}: {
  compact?: boolean;
  priority?: boolean;
  decorative?: boolean;
}) {
  return (
    <span className={cn('brand-lockup', compact && 'brand-lockup--compact')}>
      <Image
        src="/brand/dcz-webaudit-lockup.png"
        width={890}
        height={203}
        sizes={compact ? '48px' : '(max-width: 390px) 166px, 220px'}
        priority={priority}
        alt={decorative ? '' : 'DCZ WebAudit — predbežná diagnostika'}
        className="brand-lockup__image"
      />
    </span>
  );
}
