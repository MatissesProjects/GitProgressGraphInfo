import { describe, it, expect } from 'vitest';
import { calculateBattleStats } from '../src/modules/rpg';

describe('Battle Logic', () => {
  describe('calculateBattleStats', () => {
    it('should calculate base stats correctly for level 0', () => {
      const stats = calculateBattleStats(0, '0', '0', 0);
      expect(stats.maxHp).toBe(100);
      expect(stats.attack).toBe(10);
      expect(stats.defense).toBe(5);
      expect(stats.speed).toBe(5);
    });

    it('should scale stats with level, velocity, and consistency', () => {
      // Level 10, Velocity 5, Consistency 80%, 100 Stars
      const stats = calculateBattleStats(10, '5', '80', 100);
      
      // maxHp = 100 + (10 * 20) + (80 * 2) = 100 + 200 + 160 = 460
      expect(stats.maxHp).toBe(460);
      
      // attack = 10 + (5 * 5) + (10 * 2) = 10 + 25 + 20 = 55
      expect(stats.attack).toBe(55);
      
      // defense = 5 + (10 * 1.5) + (sqrt(100) * 2) = 5 + 15 + 20 = 40
      expect(stats.defense).toBe(40);
      
      // speed = 5 + (5 * 2) + (80 / 10) = 5 + 10 + 8 = 23
      expect(stats.speed).toBe(23);
    });
  });
});
