import React, { useState } from "react";
import "./inputModa.css";
import SVGIcon from "../SVGIcon";

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  icon: string;
  placeholder?: string;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  icon,
  placeholder = "Enter a value...",
}) => {
  const [url, setUrl] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setUrl("");
      onClose();
    }
  };

  return (
    <div className="custom-overlay" onClick={onClose}>
      <div
        className="input-modal"
        style={{ transformOrigin: "top center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <SVGIcon name={icon} />
          <input
            className="modal-input"
            type="text"
            placeholder={placeholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default InputModal;
