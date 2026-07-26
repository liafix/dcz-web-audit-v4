import Image from 'next/image';
import { cn } from '@/lib/cn';

export type BrandMarkVariant = 'header' | 'footer' | 'admin' | 'compact';

const variants = {
  header: {
    src: '/brand/dcz-webaudit-lockup-dark-v2.png',
    width: 923,
    height: 202,
    sizes: '(max-width: 374px) 160px, (max-width: 767px) 181px, 250px',
  },
  footer: {
    src: '/brand/dcz-webaudit-lockup-dark-v2.png',
    width: 923,
    height: 202,
    sizes: '(max-width: 767px) 248px, 286px',
  },
  admin: {
    src: '/brand/dcz-webaudit-lockup-dark-v2.png',
    width: 923,
    height: 202,
    sizes: '(max-width: 480px) 190px, 210px',
  },
  compact: {
    src: '/brand/dcz-webaudit-icon-v2.png',
    width: 204,
    height: 202,
    sizes: '46px',
  },
} as const satisfies Record<BrandMarkVariant, {
  src: string;
  width: number;
  height: number;
  sizes: string;
}>;

export function BrandMark({
  variant = 'admin',
  priority = false,
  decorative = false,
}: {
  variant?: BrandMarkVariant;
  priority?: boolean;
  decorative?: boolean;
}) {
  const asset = variants[variant];

  return (
    <span className={cn('brand-mark', `brand-mark--${variant}`)}>
      <Image
        src={asset.src}
        width={asset.width}
        height={asset.height}
        sizes={asset.sizes}
        priority={priority}
        alt={decorative ? '' : 'DCZ WebAudit'}
        className="brand-mark__image"
      />
    </span>
  );
}
