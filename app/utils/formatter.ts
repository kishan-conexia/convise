/**
 * Formats status strings with proper capitalization
 */
export const formatStatus = (status: string | null | undefined): string => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Formats timestamptz data preserving timezone information
 */
export const formatDateTime = (dateTime: string | null | undefined): string => {
  if (!dateTime) return "N/A";
  try {
    // Normalize to an ISO-like string: replace first space with 'T'
    // Ensures consistent parsing across browsers
    const iso = String(dateTime).replace(' ', 'T');

    // Parse; +00 (or any offset) keeps it absolute UTC
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(dateTime); // fallback to raw

    // Extract UTC parts (no local TZ conversion)
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth(); // 0-11
    const day = d.getUTCDate();
    const hour = d.getUTCHours();
    const minute = d.getUTCMinutes();

    // Recreate a UTC date object at minute precision
    const utcDate = new Date(Date.UTC(year, month, day, hour, minute));

    // Format in en-IN with UTC to avoid local TZ shifts
    return utcDate.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  } catch {
    return "Invalid date";
  }
};

/**
 * Formats date values using UTC to preserve original timezone
 */
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "N/A";
  try {
    // Normalize to ISO-like for consistent parsing
    const iso = String(value).replace(' ', 'T');
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(value);

    // Format using UTC so no local TZ is applied
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return "Invalid date";
  }
};

/**
 * Formats time values using UTC to preserve original timezone
 */
export const formatTime = (value: string | null | undefined): string => {
  if (!value) return "N/A";
  try {
    const iso = String(value).replace(' ', 'T');
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(value);

    // Use UTC to avoid local timezone conversion
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "Invalid time";
  }
};

/**
 * Formats regularization type with proper display names
 */
export const formatRegularizationType = (type: string | null | undefined): string => {
  if (!type) return "N/A";

  const types: Record<string, string> = {
    late_arrival: "Late Arrival",
    missed_swipe: "Missed Swipe",
    outdoor_client_visit: "Outdoor/Client Visit",
    other: "Other",
  };

  return (
    types[type] ||
    type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

/**
 * Gets initials from a full name
 */
export const getInitials = (fullName: string | null | undefined): string => {
  if (!fullName) return "?";
  const names = fullName.split(" ");
  return names.length > 1 ? names[0][0] + names[1][0] : names[0][0];
};

export const formatDateForSQL = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
