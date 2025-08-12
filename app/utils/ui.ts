/**
 * Returns CSS classes for status badges
 */
export const getStatusClasses = (status: string | null | undefined): string => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
    case "rejected":
      return "bg-red-100 text-red-800 border border-red-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
    case "pending":
      return "bg-amber-100 text-amber-800 border border-amber-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
    case "cancelled":
      return "bg-slate-100 text-slate-800 border border-slate-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
    case "withdrawn":
      return "bg-slate-100 text-slate-800 border border-slate-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
  }
};

/**
 * Returns CSS classes for status-based card styling
 */
export const getCardStatusClasses = (status: string | null | undefined): string => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-green-50/60 border-green-100";
    case "rejected":
      return "bg-red-50/60 border-red-100";
    case "pending":
      return "bg-yellow-50/60 border-orange-100";
    case "cancelled":
      return "bg-gray-50/60 border-gray-100";
    case "withdrawn":
      return "bg-gray-50/60 border-gray-100";
    default:
      return "bg-gray-50/40 border-gray-100";
  }
};

/**
 * Returns appropriate icon for regularization types
 */
export const getRegularizationTypeIcon = (type: string | null | undefined): string => {
  switch (type?.toLowerCase()) {
    case "late_arrival":
      return "i-heroicons-clock";
    case "missed_swipe":
      return "i-heroicons-finger-print";
    case "outdoor_client_visit":
      return "i-heroicons-map-pin";
    case "other":
      return "i-heroicons-exclamation-triangle";
    default:
      return "i-heroicons-clock";
  }
};