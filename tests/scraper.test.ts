import { describe, it, expect, beforeEach } from 'vitest';
import { parseSocials, parsePinnedProjects, parseContributionGraph, parseAvailableYears } from '../src/modules/scraper';

describe('Scraper Module', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('parseSocials', () => {
    it('should parse followers, following, and orgs', () => {
      document.body.innerHTML = `
        <a href="?tab=followers"><span>1,234</span></a>
        <a href="?tab=following"><span>500</span></a>
        <div class="avatar-group-item"></div>
        <div class="avatar-group-item"></div>
      `;
      const stats = parseSocials();
      expect(stats.followers).toBe(1234);
      expect(stats.following).toBe(500);
      expect(stats.organizations).toBe(2);
    });

    it('should handle abbreviated k notation', () => {
      document.body.innerHTML = `
        <a href="?tab=followers"><span>1.5k</span></a>
      `;
      const stats = parseSocials();
      expect(stats.followers).toBe(1500);
    });
  });

  describe('parseAvailableYears', () => {
    it('should parse years from sidebar links', () => {
      document.body.innerHTML = `
        <a class="js-year-link">2024</a>
        <a class="js-year-link">2023</a>
        <a class="js-year-link">2022</a>
      `;
      const years = parseAvailableYears();
      expect(years).toEqual([2024, 2023, 2022]);
    });
  });

  describe('parsePinnedProjects', () => {
    it('should parse pinned repositories', () => {
      document.body.innerHTML = `
        <div class="pinned-item-list-item-content">
          <a class="Link">MyRepo</a>
          <span itemprop="programmingLanguage">TypeScript</span>
          <span class="repo-language-color" style="background-color: blue;"></span>
          <a class="pinned-item-meta" href="/stargazers">10</a>
          <a class="pinned-item-meta" href="/forks">5</a>
        </div>
      `;
      const pinned = parsePinnedProjects();
      expect(pinned.length).toBe(1);
      expect(pinned[0].name).toBe('MyRepo');
      expect(pinned[0].stars).toBe(10);
      expect(pinned[0].forks).toBe(5);
      expect(pinned[0].language).toBe('TypeScript');
    });
  });

  describe('parseContributionGraph', () => {
    it('should parse days and levels', () => {
      document.body.innerHTML = `
        <table>
          <tr>
            <td class="ContributionCalendar-day" data-date="2024-01-01" data-level="1" id="day-1"></td>
            <td class="ContributionCalendar-day" data-date="2024-01-02" data-level="4" id="day-2"></td>
          </tr>
        </table>
        <tool-tip for="day-1">1 contribution on January 1, 2024</tool-tip>
        <tool-tip for="day-2">12 contributions on January 2, 2024</tool-tip>
      `;
      const graph = parseContributionGraph();
      expect(graph).not.toBeNull();
      expect(graph!.length).toBe(2);
      expect(graph![0].date).toBe('2024-01-01');
      expect(graph![0].count).toBe(1);
      expect(graph![1].level).toBe(4);
      expect(graph![1].count).toBe(12);
    });
  });
});
