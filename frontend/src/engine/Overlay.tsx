import { useCallback, useLayoutEffect, useId, useRef, type ReactNode } from "react";

/** Nonmodal information window: the world and run controls remain interactive. */
export function Overlay({
  title,
  open,
  close,
  layout,
  children,
}: {
  title: string;
  open: boolean;
  close: () => void;
  layout: "standard" | "wide";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  const returnFocus = useRef<Element | null>(null);
  const dismiss = useCallback(() => {
    if (returnFocus.current instanceof HTMLElement) returnFocus.current.focus();
    close();
  }, [close]);
  useLayoutEffect(() => {
    if (!open) return;
    const dialog = ref.current!;
    if (document.activeElement !== document.body) returnFocus.current = document.activeElement;
    const content = dialog.querySelector<HTMLElement>(".window-content");
    if (content) content.scrollTop = 0;
    dialog.querySelector<HTMLButtonElement>(".window-close")?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("keydown", escape);
    };
  }, [open, dismiss, title]);
  return (
    <dialog
      ref={ref}
      open={open}
      className={`observation-window window-${layout}`}
      aria-labelledby={titleId}
    >
      <header className="window-heading">
        <div>
          <span className="eyebrow">Observation</span>
          <h2 id={titleId}>{title}</h2>
        </div>
        <button className="window-close" onClick={dismiss} aria-label={`Close ${title}`}>
          Close <kbd>Esc</kbd>
        </button>
      </header>
      <div className="window-content">{children}</div>
    </dialog>
  );
}
