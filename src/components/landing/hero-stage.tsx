'use client';

import { useEffect, useRef, type PointerEvent, type PropsWithChildren } from 'react';

export function HeroStage({ children }: PropsWithChildren) {
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateVisibility = () => {
      stage.dataset.paused = document.hidden ? 'true' : 'false';
    };

    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    event.currentTarget.style.setProperty('--premium-pointer-x', `${x}%`);
    event.currentTarget.style.setProperty('--premium-pointer-y', `${y}%`);
  }

  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty('--premium-pointer-x', '50%');
    event.currentTarget.style.setProperty('--premium-pointer-y', '32%');
  }

  return (
    <div
      ref={stageRef}
      className="premium-hero-stage"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="premium-hero-stage__grid" aria-hidden="true" />
      <div className="premium-hero-stage__ambient" aria-hidden="true" />
      <div className="premium-hero-stage__spotlight" aria-hidden="true" />
      <div className="premium-hero-stage__horizon" aria-hidden="true" />
      <div className="premium-hero-stage__content">{children}</div>
    </div>
  );
}
