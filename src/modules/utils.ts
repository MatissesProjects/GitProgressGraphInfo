/**
 * Formats a streak duration into a readable string with weeks/months if applicable.
 */
export function formatStreakTooltip(days: number): string {
  if (days < 7) return `${days} days`;

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;

  if (days < 30) {
    let tooltip = `${days} days (${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    if (remainingDays > 0) {
      tooltip += `, ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
    }
    return tooltip + ')';
  }

  // Use 30.44 as average month length
  const months = Math.floor(days / 30.44);
  const remainingAfterMonths = Math.round(days - (months * 30.44));
  const remainingWeeks = Math.floor(remainingAfterMonths / 7);
  const finalDays = remainingAfterMonths % 7;

  let parts = [];
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (remainingWeeks > 0) parts.push(`${remainingWeeks} ${remainingWeeks === 1 ? 'week' : 'weeks'}`);
  if (finalDays > 0 && months < 2) parts.push(`${finalDays} ${finalDays === 1 ? 'day' : 'days'}`);

  return `${days} days (${parts.join(', ')})`;
}
