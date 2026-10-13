import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export default function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const dialog = ref.current!;
    dialog.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const listener = () => closeRef.current();
    dialog.addEventListener("close", listener);
    return () => {
      dialog.removeEventListener("close", listener);
      dialog.close();
      document.body.style.overflow = old;
      if (before?.isConnected) before.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar janela"
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
