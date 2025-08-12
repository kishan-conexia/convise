/**
 * Opens location in maps (coordinates or address)
 */
export const openLocation = (location: string | null | undefined): void => {
  if (!location) return;

  // Check if it's coordinates (lat,lng format)
  if (location.includes(",")) {
    const [lat, lng] = location.split(",").map((coord) => coord.trim());
    if (!isNaN(Number(lat)) && !isNaN(Number(lng))) {
      // Open coordinates in maps
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, "_blank");
      return;
    }
  }
  
  // Treat as address
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  window.open(url, "_blank");
};