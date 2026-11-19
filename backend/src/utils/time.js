import config from '../config.js';

// Converts a Date to the shop's local date string (YYYY-MM-DD)
export function toShopDate(date, timeZone = config.SHOP_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
}
