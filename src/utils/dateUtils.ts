/**
 * Returns YYYY-MM-DD formatted date string based on LOCAL calendar time (not UTC).
 */
export function getLocalDateString(dateInput?: Date | string | number): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns HH:mm formatted time string in local time.
 */
export function getLocalTimeString(dateInput?: Date): string {
  const d = dateInput || new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats a YYYY-MM-DD date into natural Spanish date label (e.g., "Miércoles, 4 de Noviembre").
 */
export function formatSpanishDate(dateStr?: string): string {
  let date: Date;
  if (dateStr && dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date();
  }

  const formatted = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
