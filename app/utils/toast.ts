import { toast } from "sonner-native";

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      style: {
        backgroundColor: "#18181b",
        borderWidth: 1,
        borderColor: "#16a34a",
      },
    });
  },

  error: (message: string) => {
    toast.error(message, {
      style: {
        backgroundColor: "#18181b",
        borderWidth: 1,
        borderColor: "#dc2626",
      },
    });
  },

  warning: (message: string) => {
    toast.warning(message, {
      style: {
        backgroundColor: "#18181b",
        borderWidth: 1,
        borderColor: "#d97706",
      },
    });
  },

  info: (message: string) => {
    toast.info(message, {
      style: {
        backgroundColor: "#18181b",
        borderWidth: 1,
        borderColor: "#2563eb",
      },
    });
  },

  default: (message: string) => {
    toast(message, {
      style: {
        backgroundColor: "#18181b",
        borderWidth: 1,
        borderColor: "#27272a",
      },
    });
  },
};
