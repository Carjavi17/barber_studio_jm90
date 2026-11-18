const pad = (n) => String(n).padStart(2, '0');

// Next N days as { value: 'YYYY-MM-DD', weekday: 'lun', day: 17 }
export function getNextDays(count = 14) {
  const today = new Date();

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    return {
      value: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      weekday: d.toLocaleDateString('es', { weekday: 'short' }),
      day: d.getDate(),
      month: d.toLocaleDateString('es', { month: 'short' }),
    };
  });
}

export function formatShortDate(date) {
  return new Date(date).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Human-readable description of a block, e.g. "mié, 25 nov, 12:00 – 14:00"
export function describeBlock({ startsAt, endsAt }) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const isMidnight = (d) => d.getHours() === 0 && d.getMinutes() === 0;

  if (isMidnight(start) && isMidnight(end)) {
    const first = formatShortDate(start);
    const last = formatShortDate(new Date(end.getTime() - 60000));
    return first === last ? `${first} (todo el día)` : `${first} – ${last}`;
  }
  if (start.toDateString() === end.toDateString()) {
    return `${formatShortDate(start)}, ${formatTime(startsAt)} – ${formatTime(endsAt)}`;
  }
  return `${formatDateTime(startsAt)} – ${formatDateTime(endsAt)}`;
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('es', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
}

export function formatDay(iso) {
  return new Date(iso).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
}