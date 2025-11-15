import { DynamicIcon } from "lucide-react/dynamic";
import { useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: React.ReactNode;
  onClose?: () => void;
};

const Modal: React.FC<Props> = ({ children, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return null;

  return createPortal(
    <div className="h-100vh fixed inset-0 z-50 flex w-full items-center justify-center bg-black/40 backdrop-blur-[4px]">
      <div className="text-light relative rounded-3xl shadow-lg p-6 max-h-[90vh] overflow-y-auto backdrop-blur-sm min-w-[50%]">
        <button
          className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 z-10"
          onClick={onClose}
          aria-label="Fermer">
          <DynamicIcon name="x" onClick={onClose} />
        </button>
        {children}
      </div>
    </div>,
    modalRoot,
  );
};

export default Modal;
