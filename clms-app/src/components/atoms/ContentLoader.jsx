import { useEffect, useRef, useState } from 'react';

const FADE_MS = 350;

/**
 * Cross-fades between skeleton and real content.
 * Both layers share the same grid cell during the overlap
 * so the taller one determines height — no layout jump.
 * Pure opacity crossfade, no translateY.
 */
export default function ContentLoader({ loading, skeleton, children, className = '', childClassName = '' }) {
  const [phase, setPhase] = useState(loading ? 'loading' : 'done');
  const prevLoading = useRef(loading);

  useEffect(() => {
    // loading flipped from true → false: start exit transition
    if (prevLoading.current && !loading) {
      setPhase('exiting');
      const t = setTimeout(() => setPhase('done'), FADE_MS + 30);
      prevLoading.current = false;
      return () => clearTimeout(t);
    }
    // loading flipped from false → true (re-fetch)
    if (!prevLoading.current && loading) {
      setPhase('loading');
    }
    prevLoading.current = loading;
  }, [loading]);

  const showSkeleton = phase === 'loading' || phase === 'exiting';
  const overlapping = phase === 'exiting';

  return (
    <div
      className={`${overlapping ? 'grid [&>*]:col-start-1 [&>*]:row-start-1' : ''} ${className}`}
    >
      {showSkeleton && (
        <div
          style={{ transition: `opacity ${FADE_MS}ms ease-out` }}
          className={phase === 'exiting' ? 'pointer-events-none opacity-0' : 'opacity-100'}
        >
          {skeleton}
        </div>
      )}
      {!loading && (
        <div
          className={childClassName}
          style={{ animation: `fade-only ${FADE_MS}ms ease-out` }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
