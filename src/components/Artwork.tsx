import { useEffect, useState } from 'react';
import { artFor, cx } from '../utils';

/* Image with generative fallback — never renders a broken frame. */

interface Props {
  src?: string;
  seed: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

export function Artwork({ src, seed, alt, className, eager }: Props) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  const finalSrc = !src || err ? artFor(seed) : src;
  return (
    <img
      src={finalSrc}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={() => setErr(true)}
      className={cx('object-cover', className)}
    />
  );
}
