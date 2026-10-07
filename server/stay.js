const DAY = 86400000;
function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const ms = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? ms : NaN;
}
function validateStay(start, end, guests, capacity) {
  const checkIn = dateOnly(start), checkOut = dateOnly(end);
  if (!Number.isFinite(checkIn) || !Number.isFinite(checkOut)) return { error: 'Use valid dates in YYYY-MM-DD format' };
  if (checkOut <= checkIn) return { error: 'Check-out must be after check-in' };
  if (!Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > capacity) return { error: 'Guest count exceeds room capacity or is invalid' };
  return { nights: (checkOut - checkIn) / DAY };
}
module.exports = { validateStay };
