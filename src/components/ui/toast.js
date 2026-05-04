const TOAST_EVENT = "app-toast";

export const toast = ({ type = "info", message }) => {
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { type, message, id: crypto.randomUUID() },
    })
  );
};

export const toastSuccess = (message) => toast({ type: "success", message });
export const toastError = (message) => toast({ type: "error", message });

export { TOAST_EVENT };
