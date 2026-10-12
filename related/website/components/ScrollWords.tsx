"use client";
import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

/** Paint-only reveal: never split text, change kerning or alter CJK line breaks. */
export default function ScrollWords() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.querySelector("main");
    if (!root || reduced.matches) return;
    const seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        const animation = element.animate([{ opacity: .35 }, { opacity: 1 }], {
          duration: 240, easing: "cubic-bezier(.16,1,.3,1)",
        });
        animations.add(animation);
        void animation.finished.catch(() => {}).then(() => animations.delete(animation));
      }
    }, { threshold: .05 });
    const scan = () => root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p").forEach(element => {
      if (seen.has(element) || !element.textContent?.trim() || element.closest("button,a,form,[aria-live],.lh-loading,.glass-sample-content,[data-no-word-reveal],.lh-opening") || element.querySelector("a,button,input")) return;
      seen.add(element); observer.observe(element);
    });
    const mutation = new MutationObserver(scan);
    mutation.observe(root, { childList: true, subtree: true });
    scan();
    const stop = () => {
      observer.disconnect(); mutation.disconnect();
      animations.forEach(animation => animation.cancel()); animations.clear();
    };
    reduced.addEventListener("change", stop, { once: true });
    return () => { reduced.removeEventListener("change", stop); stop(); };
  }, [pathname]);
  return null;
}
