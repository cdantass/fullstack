import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return "-";
  try {
    // Handles ISO strings and date parts
    const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
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