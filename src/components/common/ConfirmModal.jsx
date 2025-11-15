import React from "react";
import "../../styles/ConfirmModal.css";

/**
 * Custom Confirmation Modal Component
 * Thay thế SweetAlert2 với modal tùy chỉnh
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "OK",
  cancelText = "Hủy",
  type = "question", // question, warning, error, success, info
  showInput = false,
  inputLabel = "",
  inputPlaceholder = "",
  inputValue = "",
  onInputChange = null,
  inputError = "",
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "success":
        return "✓";
      case "info":
        return "ℹ️";
      case "question":
      default:
        return "?";
    }
  };

  const getIconClass = () => {
    switch (type) {
      case "warning":
        return "icon-warning";
      case "error":
        return "icon-error";
      case "success":
        return "icon-success";
      case "info":
        return "icon-info";
      case "question":
      default:
        return "icon-question";
    }
  };

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div
        className="confirm-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`confirm-modal-icon ${getIconClass()}`}>
          {getIcon()}
        </div>

        <h2 className="confirm-modal-title">{title}</h2>

        {message && <p className="confirm-modal-message">{message}</p>}

        {showInput && (
          <div className="confirm-modal-input-group">
            {inputLabel && (
              <label className="confirm-modal-label">{inputLabel}</label>
            )}
            <input
              type="text"
              className="confirm-modal-input"
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => onInputChange && onInputChange(e.target.value)}
              autoFocus
            />
            {inputError && (
              <span className="confirm-modal-error">{inputError}</span>
            )}
          </div>
        )}

        <div className="confirm-modal-buttons">
          <button className="confirm-modal-btn confirm-btn" onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="confirm-modal-btn cancel-btn" onClick={onClose}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
