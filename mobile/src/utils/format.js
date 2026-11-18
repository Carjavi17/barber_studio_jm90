// 20000 -> "$20.000 ARS"
export function formatPrice(price) {
  const withDots = String(price).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${withDots} ARS`;
}

export function formatDuration(minutes) {
  return `${minutes} min`;
}

// 4.6 -> "4,6"
export function formatRating(value) {
  return value.toFixed(1).replace('.', ',');
}