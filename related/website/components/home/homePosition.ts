import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type ReadingPosition = { element: HTMLElement; top: number };

// GSAP exposes these lifecycle APIs at runtime but omits them from its bundled types.
const mediaEvents = gsap as typeof gsap & {
  addEventListener(event: "matchMediaInit", listener: () => void): void;
  removeEventListener(event: "matchMediaInit", listener: () => void): void;
};
const scrollState = ScrollTrigger as typeof ScrollTrigger & { isRefreshing?: boolean };

/** Preserve the reading location across pin teardown/rebuild, not its old pixel offset. */
export function mountHomePosition(root: HTMLElement) {
  const sections = [...root.querySelectorAll<HTMLElement>("[data-home-section]")];
  const navTop = () => document.querySelector(".site-nav")?.getBoundingClientRect().height ?? 86;
  const hashTarget = () => {
    const target = document.getElementById(location.hash.slice(1));
    return target && root.contains(target) && target !== root && !target.closest(".lh-opening") ? target : null;
  };
  let target = hashTarget();
  let reading: ReadingPosition | null = null;
  let restoring: ReadingPosition | null = null;
  let changingLayout = false;
  let aligned = false;
  let alive = true;
  let frame = 0;
  let captureFrame = 0;

  const capture = () => {
    if (changingLayout || scrollState.isRefreshing) return;
    const landing = navTop();
    const visible = sections.find(section => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= landing + 160 && bounds.bottom > landing;
    });
    reading = visible && !visible.closest(".lh-opening")
      ? { element: visible, top: visible.getBoundingClientRect().top }
      : null;
  };
  const settle = () => {
    frame = 0;
    const position = target ? { element: target, top: navTop() } : restoring;
    if (position?.element.isConnected) {
      const delta = position.element.getBoundingClientRect().top - position.top;
      if (Math.abs(delta) > 1) window.scrollTo({ top: scrollY + delta, behavior: "instant" });
      ScrollTrigger.update();
      aligned = true;
    }
    restoring = null;
    changingLayout = false;
    capture();
  };
  const schedule = () => { if (alive && !frame) frame = requestAnimationFrame(settle); };
  const resize = () => {
    restoring ??= reading;
    changingLayout = true;
    schedule();
  };
  const refresh = () => { if (target || restoring) schedule(); };
  const navigate = () => { target = hashTarget(); aligned = false; schedule(); };
  const input = () => { target = null; restoring = null; };
  const key = (event: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) input();
  };
  const scroll = () => {
    if (changingLayout || scrollState.isRefreshing || frame || captureFrame) return;
    captureFrame = requestAnimationFrame(() => {
      captureFrame = 0;
      if (target && aligned) {
        const drift = Math.abs(target.getBoundingClientRect().top - navTop());
        // WebKit may restore its previous scroll offset after pageshow. Real
        // gestures already release the target; correct only a small late drift.
        if (drift > 200) target = null;
        else if (drift > 1) schedule();
      }
      capture();
    });
  };

  // matchMedia can reset scroll before the DOM reports the resize. Use the
  // last settled section snapshot, and restore only after the new pins exist.
  mediaEvents.addEventListener("matchMediaInit", resize);
  ScrollTrigger.addEventListener("refresh", refresh);
  window.addEventListener("resize", resize);
  window.addEventListener("hashchange", navigate);
  window.addEventListener("popstate", navigate);
  window.addEventListener("pageshow", navigate);
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("wheel", input, { passive: true });
  window.addEventListener("touchstart", input, { passive: true });
  window.addEventListener("pointerdown", input, { passive: true });
  window.addEventListener("keydown", key);
  document.fonts.ready.then(schedule);
  capture();
  schedule();

  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(captureFrame);
    mediaEvents.removeEventListener("matchMediaInit", resize);
    ScrollTrigger.removeEventListener("refresh", refresh);
    window.removeEventListener("resize", resize);
    window.removeEventListener("hashchange", navigate);
    window.removeEventListener("popstate", navigate);
    window.removeEventListener("pageshow", navigate);
    window.removeEventListener("scroll", scroll);
    window.removeEventListener("wheel", input);
    window.removeEventListener("touchstart", input);
    window.removeEventListener("pointerdown", input);
    window.removeEventListener("keydown", key);
  };
}
