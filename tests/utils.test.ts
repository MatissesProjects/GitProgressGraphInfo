import { describe, it, expect } from 'vitest';
import { formatStreakTooltip } from '../src/modules/utils';

describe('formatStreakTooltip', () => {
  it('formats short streaks correctly', () => {
    expect(formatStreakTooltip(1)).toBe('1 days');
    expect(formatStreakTooltip(6)).toBe('6 days');
  });

  it('formats week-long streaks correctly', () => {
    expect(formatStreakTooltip(7)).toBe('7 days (1 week)');
    expect(formatStreakTooltip(8)).toBe('8 days (1 week, 1 day)');
    expect(formatStreakTooltip(13)).toBe('13 days (1 week, 6 days)');
    expect(formatStreakTooltip(14)).toBe('14 days (2 weeks)');
  });

  it('formats month-long streaks correctly', () => {
    // 30 days is < 30.44, so it might still be weeks depending on logic
    // But formatStreakTooltip has a special case for < 30
    expect(formatStreakTooltip(29)).toBe('29 days (4 weeks, 1 day)');
    
    // 31 days should be 1 month
    expect(formatStreakTooltip(31)).toBe('31 days (1 month, 1 day)');
    
    // 60 days
    expect(formatStreakTooltip(60)).toBe('60 days (1 month, 4 weeks, 2 days)');
    // Wait, 60 / 30.44 = 1.97. 
    // Let's check the logic:
    // months = Math.floor(60 / 30.44) = 1
    // remainingAfterMonths = Math.round(60 - (1 * 30.44)) = Math.round(29.56) = 30
    // remainingWeeks = Math.floor(30 / 7) = 4
    // finalDays = 30 % 7 = 2
    // parts = ["1 month", "4 weeks", "2 days"] (days shown because months < 2)
  });

  it('formats long streaks with months and weeks', () => {
    // 100 days
    // months = Math.floor(100 / 30.44) = 3
    // remainingAfterMonths = Math.round(100 - (3 * 30.44)) = Math.round(100 - 91.32) = Math.round(8.68) = 9
    // remainingWeeks = Math.floor(9 / 7) = 1
    // finalDays = 9 % 7 = 2
    // parts = ["3 months", "1 week"] (days NOT shown because months >= 2)
    expect(formatStreakTooltip(100)).toBe('100 days (3 months, 1 week)');
  });

  it('handles exact multiples of months', () => {
    // 61 days (approx 2 months)
    // months = Math.floor(61 / 30.44) = 2
    // remainingAfterMonths = Math.round(61 - (2 * 30.44)) = Math.round(61 - 60.88) = 0
    expect(formatStreakTooltip(61)).toBe('61 days (2 months)');
  });
});
