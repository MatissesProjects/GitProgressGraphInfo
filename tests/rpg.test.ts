import { describe, it, expect } from 'vitest';
import { getAvatar, getCombo, getPersona } from '../src/modules/rpg';
import { TodayActions } from '../src/modules/rpg';

describe('RPG Module', () => {
  describe('getAvatar', () => {
    it('should return a level 0 character by default', () => {
      const actions: TodayActions = { commits: 0, prs: 0, issues: 0, reviews: 0, stars: 0 };
      const avatar = getAvatar(0, 0, 0, actions, 0);
      expect(avatar.base).toBe('🧙');
      expect(avatar.headgear).toBe('');
      expect(avatar.weapon).toBe('');
      expect(avatar.shield).toBe('');
      expect(avatar.companion).toBe('');
    });

    it('should return a high level character with gear', () => {
      const actions: TodayActions = { commits: 10, prs: 2, issues: 1, reviews: 1, stars: 20 };
      const avatar = getAvatar(10, 14, 50, actions, 10);
      expect(avatar.base).toBe('🧛‍♂️'); // level 10 % 12 is index 10
      expect(avatar.headgear).toBe('⛑️'); // level 10 / 5 is index 2
      expect(avatar.weapon).toBe('⚒️'); // stars 50 / 10 is index 5
      expect(avatar.shield).toBe('🧼'); // streak 14 / 7 is index 2
      expect(avatar.companion).toBe('🦊'); // prs 2 % companions.length
    });
  });

  describe('getCombo', () => {
    it('should return 1.0x combo for no activity', () => {
      const actions: TodayActions = { commits: 0, prs: 0, issues: 0, reviews: 0, stars: 0 };
      const combo = getCombo(0, actions);
      expect(combo.multiplier).toBe(1);
    });

    it('should return higher combo for high activity', () => {
      const actions: TodayActions = { commits: 10, prs: 1, issues: 1, reviews: 0, stars: 0 };
      const combo = getCombo(10, actions);
      expect(combo.multiplier).toBe(2); // 1 + 0.5 (commits >= 5) + 0.3 (prs > 0) + 0.2 (issues > 0)
    });
  });

  describe('getPersona', () => {
    it('should return High-Volume Architect for high velocity and consistency', () => {
      const persona = getPersona(0.2, '95', '20', 80, 50);
      expect(persona).toBe('High-Volume Architect');
    });

    it('should return Weekend Warrior for high weekend volume share', () => {
      const persona = getPersona(0.5, '80', '5', 90, 10);
      expect(persona).toBe('Weekend Warrior');
    });

    it('should return Steady Developer by default', () => {
      const persona = getPersona(0.2, '80', '5', 50, 10);
      expect(persona).toBe('Steady Developer');
    });
  });
});
