import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return "-";
  try {
    let d: Date;

    // Check if dateStr is a full ISO string (e.g. 2025-12-10T08:58:56.760321-03:00)
    if (dateStr.includes("T")) {
      d = new Date(dateStr);
    } else {
      // Legacy behavior: combining date part and time part
      d = new Date(`${dateStr}T${timeStr || "00:00"}`);
    }

    if (isNaN(d.getTime())) return `${dateStr} ${timeStr || ""}`.trim();

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return `${dateStr} ${timeStr || ""}`.trim();
  }
};

export const formatStatusLabel = (status: string): string => {
  if (!status) return "-";
  // Replace underscores with spaces and capitalize each word
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
