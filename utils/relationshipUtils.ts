export function formatMarriageDuration(
  startYear: number,
  startWeek: number | undefined,
  currentYear: number,
  currentWeek: number
): string {
  const sWeek = startWeek || 1;
  const totalWeeks = Math.max(1, (currentYear * 52 + currentWeek) - (startYear * 52 + sWeek));

  if (totalWeeks < 4) {
    return `${totalWeeks} week${totalWeeks === 1 ? '' : 's'}`;
  } else if (totalWeeks < 52) {
    const months = Math.floor(totalWeeks / 4);
    return `${months} month${months === 1 ? '' : 's'}`;
  } else {
    const years = Math.floor(totalWeeks / 52);
    const remMonths = Math.floor((totalWeeks % 52) / 4);
    if (remMonths > 0) {
      return `${years} year${years === 1 ? '' : 's'} and ${remMonths} month${remMonths === 1 ? '' : 's'}`;
    }
    return `${years} year${years === 1 ? '' : 's'}`;
  }
}
