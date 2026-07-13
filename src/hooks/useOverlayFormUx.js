import { useEffect } from "react";

const FOCUSABLE_SELECTOR = [
  ".ant-modal:not([aria-hidden='true']) input:not([disabled]):not([readonly])",
  ".ant-modal:not([aria-hidden='true']) textarea:not([disabled]):not([readonly])",
  ".ant-modal:not([aria-hidden='true']) .ant-select-selector",
  ".ant-drawer-open input:not([disabled]):not([readonly])",
  ".ant-drawer-open textarea:not([disabled]):not([readonly])",
  ".ant-drawer-open .ant-select-selector",
].join(",");

function isDropdownControl(target) {
  return Boolean(
    target.closest(".ant-select") ||
      target.closest(".ant-select-dropdown") ||
      target.closest(".ant-picker") ||
      target.closest(".ant-picker-dropdown") ||
      target.closest(".ant-input-number"),
  );
}

function focusFirstOverlayField() {
  window.setTimeout(() => {
    const field = document.querySelector(FOCUSABLE_SELECTOR);
    if (!field) return;

    if (field.classList.contains("ant-select-selector")) {
      field.focus();
      return;
    }

    field.focus();
    field.select?.();
  }, 80);
}

function useOverlayFormUx() {
  useEffect(() => {
    let lastOverlayCount = 0;
    const observer = new MutationObserver(() => {
      const overlayCount = document.querySelectorAll(".ant-modal-wrap:not([style*='display: none']), .ant-drawer-open").length;
      if (overlayCount > lastOverlayCount) {
        focusFirstOverlayField();
      }
      lastOverlayCount = overlayCount;
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    const handleKeyDown = (event) => {
      if (event.key !== "Enter" || !isDropdownControl(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);
}

export default useOverlayFormUx;
