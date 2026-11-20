import type { Variants } from 'framer-motion';

// Curvas compartidas: entradas rapidas que frenan suave, salidas mas cortas.
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];

// Fondo oscuro de modales y drawers.
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
};

// Drawer lateral: desliza desde la derecha.
export const drawerVariants: Variants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { duration: 0.32, ease: EASE_OUT } },
  exit: { x: '100%', transition: { duration: 0.22, ease: EASE_IN } },
};

// Panel lateral dentro de un lienzo (inspector): desliza corto + fade.
export const sidePanelVariants: Variants = {
  initial: { x: 340, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.28, ease: EASE_OUT } },
  exit: { x: 340, opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
};

// Dialogo chico (formularios): leve zoom desde el centro.
export const popVariants: Variants = {
  initial: { opacity: 0, scale: 0.94, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.96, y: 4, transition: { duration: 0.15, ease: EASE_IN } },
};

// Cambio de pantalla. custom: 1 = entrar (zoom in), -1 = volver (zoom out).
export const viewVariants: Variants = {
  initial: (dir: number) => ({ opacity: 0, scale: dir > 0 ? 0.97 : 1.03 }),
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: (dir: number) => ({
    opacity: 0,
    scale: dir > 0 ? 1.02 : 0.98,
    transition: { duration: 0.15, ease: EASE_IN },
  }),
};

// ---- Zoom desde el punto del click ----
let lastPointer: { x: number; y: number; t: number } | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => { lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() }; },
    true
  );
}

// Ultimo click, solo si fue reciente (si se abrio con teclado, devuelve null = zoom desde el centro).
export function getClickOrigin(maxAgeMs = 800): { x: number; y: number } | null {
  if (!lastPointer || performance.now() - lastPointer.t > maxAgeMs) return null;
  return { x: lastPointer.x, y: lastPointer.y };
}

// El elemento crece desde el punto clickeado y al cerrar vuelve hacia el mismo punto.
export function zoomFromPoint(origin: { x: number; y: number } | null) {
  const dx = origin ? origin.x - window.innerWidth / 2 : 0;
  const dy = origin ? origin.y - window.innerHeight / 2 : 8;
  const hidden = { opacity: 0, scale: origin ? 0.35 : 0.92, x: dx, y: dy };
  return {
    initial: hidden,
    animate: {
      opacity: 1, scale: 1, x: 0, y: 0,
      transition: { duration: 0.34, ease: EASE_OUT, opacity: { duration: 0.2 } },
    },
    exit: {
      ...hidden,
      transition: { duration: 0.24, ease: EASE_IN, opacity: { duration: 0.2, delay: 0.04 } },
    },
  };
}
