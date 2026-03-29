interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

import { useEffect } from "react";

export function HelpModal({ open, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog">
      <div>Select</div>
      <div>Add Node</div>
      <div>Add Edge</div>
      <div>Simulate</div>
      <div>Delete</div>
      <div>S</div>
      <div>N</div>
      <div>E</div>
      <div>R</div>
      <div>D</div>
      <div>Ctrl+Z</div>
      <button title="Close" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
