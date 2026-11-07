import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scroll halaman baru selalu mulai dari atas.
 * Saat back/forward, posisi scroll halaman sebelumnya dipulihkan.
 */
export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const lastKey = useRef(location.key);

  useLayoutEffect(() => {
    const scroller = document.querySelector<HTMLElement>(".main-content");
    const isWindowScroll = !scroller || scroller.scrollHeight <= scroller.clientHeight + 1;
    const currentTop = isWindowScroll ? window.scrollY : scroller.scrollTop;

    if (lastKey.current !== location.key) {
      positions.current.set(lastKey.current, currentTop);
    }

    const nextTop = navigationType === "POP" ? positions.current.get(location.key) ?? 0 : 0;

    if (scroller) {
      scroller.scrollTo({ top: nextTop, left: 0, behavior: "auto" });
    }
    window.scrollTo({ top: isWindowScroll ? nextTop : 0, left: 0, behavior: "auto" });

    lastKey.current = location.key;
  }, [location.key, navigationType]);

  return null;
}
