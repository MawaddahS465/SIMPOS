/* ==========================================================================
   DISMISS MODAL — perilaku standar untuk semua overlay/drawer.
   - Escape menutup modal.
   - Halaman di belakang tidak ikut ter-scroll (dikunci selama modal terbuka).
   - Tab tetap berputar di dalam modal (focus trap).
   - Fokus dikembalikan ke elemen pemicu setelah modal ditutup.

   Dipakai sekali per modal:
     useModalDismiss(open, () => setOpen(false));
   ========================================================================== */

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

let lockCount = 0;
let previousOverflow = "";

const DIALOG = '[role="dialog"], [role="alertdialog"]';

function lockScroll(): void {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = previousOverflow;
}

/** Modal terakhir di DOM = yang paling atas, jadi itu yang dikunci fokusnya. */
function topDialog(): HTMLElement | null {
  const dialogs = document.querySelectorAll<HTMLElement>(DIALOG);
  return dialogs.length > 0 ? dialogs[dialogs.length - 1] : null;
}

export function useModalDismiss(open: boolean, onClose: () => void): void {
  const closeRef = useRef(onClose);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Dibaca saat render: React belum menulis DOM, jadi fokus masih ada di
  // tombol pemicu. Kalau dibaca di effect, autoFocus di dalam modal sudah
  // lebih dulu merebut fokus dan elemen pemicu tidak tercatat.
  if (open && previousFocusRef.current === null && document.activeElement instanceof HTMLElement) {
    previousFocusRef.current = document.activeElement;
  }

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const previousFocus = previousFocusRef.current;
    lockScroll();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = topDialog();
      if (dialog === null) return;

      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    // Pindahkan fokus ke dalam modal (kolom isian pertama bila ada) supaya
    // pengguna keyboard/screen reader tidak tertinggal di halaman belakang.
    const dialog = topDialog();
    if (dialog !== null && !dialog.contains(document.activeElement)) {
      const target =
        dialog.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled]), textarea:not([disabled])") ??
        dialog.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus({ preventScroll: true });
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      unlockScroll();
      if (previousFocus?.isConnected) previousFocus.focus();
      previousFocusRef.current = null;
    };
  }, [open]);
}
