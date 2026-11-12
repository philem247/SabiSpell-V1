const pad = (n: number) => String(n).padStart(2, '0');

export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isRealDate = (iso: string): boolean => {
  if (!ISO_DATE.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

const dayNumber = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};

export function nextStreak(streak: number, lastPlayed: string, today: string): number {
  // A missing or malformed date restarts the streak.
  if (!isRealDate(lastPlayed) || !isRealDate(today)) return 1;
  const gap = dayNumber(today) - dayNumber(lastPlayed);
  if (gap <= 0) return streak;
  return gap === 1 ? streak + 1 : 1;
}
