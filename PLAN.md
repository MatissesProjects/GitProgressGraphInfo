# Project Plan: GitHub Contribution Deep-Dive Extension

## 1. Project Overview
**Name:** GitHeat (or GitHub Pulse)
**Type:** Google Chrome Extension (Manifest V3)
**Goal:** To reveal the hidden metrics behind a user's GitHub contribution graph, specifically reverse-engineering the contribution count thresholds for "Low" vs "High" activity days and visualizing productivity spikes.

## 2. Core Features (MVP)
1.  **Threshold Decoder:** Automatically calculate and display the exact number of commits required to reach Level 1, 2, 3, and 4 for the current profile.
2.  **Heatmap Injection:** Inject a "Stats Panel" above the contribution graph containing:
    * Total contributions (Year).
    * Busiest Day (Date + Count).
    * The "Level 4" Cutoff (e.g., "You need 12 commits to get a dark green square").
3.  **Interactive Tooltips:** Enhance the default hover behavior to show more detailed stats (e.g., "This day is in the top 5% of your year").

## 3. Technical Architecture

### A. Manifest V3 Configuration
* **Permissions:**
    * `activeTab` (To run scripts on the current page).
    * `storage` (To save user preferences/cached stats).
* **Host Permissions:** `https://github.com/*`

### B. Data Extraction Strategy (DOM Scraping)
We will target the SVG/Table elements in the GitHub UI.
* **Selector for Days:** `.ContributionCalendar-day`
* **Attribute for Intensity:** `data-level="0"` through `data-level="4"`
* **Attribute for Date:** `data-date="YYYY-MM-DD"`
* **Source for Count:** Parse the `tool-tip` ID associated with the day or the `sr-only` span text (e.g., "14 contributions on...").

### C. Data Logic (The "Decoder")
* Create an array of objects: `[{ date: "2024-01-01", level: 1, count: 3 }, ...]`
* **Algorithm:**
    1.  Iterate through all days.
    2.  Filter valid contribution days (count > 0).
    3.  Group by `data-level`.
    4.  Find `Math.min` and `Math.max` for each group.
    5.  *Output:* A dynamic range map (e.g., Level 4 = 15+ contributions).

## 4. UI/UX Design
* **Injection Point:** The `.js-yearly-contributions` container div (the main graph wrapper).
* **Visual Style:**
    * Use GitHub's native design system (Primer CSS) to make the tool look built-in.
    * Use the existing color palette (Gray text, white backgrounds, standard borders).
* **Components:**
    * **The "Legend" Extender:** Currently, GitHub just shows "Less" and "More" squares. We will append the calculated numbers next to these squares (e.g., "Less (1-3)", "More (12+)").

## 5. Development Roadmap

### Phase 1: Setup & Scraping (Days 1-2)
- [x] Initialize `manifest.json`.
- [x] Write `content.js` to log the `data-level` and contribution counts to the console.
- [x] successfully parse "X contributions" string into an Integer.

### Phase 2: Logic & Calculation (Day 3)
- [x] Implement the grouping algorithm.
- [x] accurate determine the ranges for Levels 1-4.
- [x] Handle edge cases (users with 0 contributions, users with massive 100+ commit days).

### Phase 3: DOM Injection (Days 4-5)
- [x] Create the HTML structure for the "Stats Panel".
- [x] Inject the panel into the GitHub DOM.
- [x] Style it using GitHub's CSS variables to match Dark/Light mode automatically.
- [x] Implement Legend Extender to show numbers next to legend squares.

### Phase 4: Refinement & Publish (Day 6+)
- [ ] Add error handling (if GitHub UI changes).
- [ ] Create extension icons.
- [ ] Test on different sized profiles (very active vs. inactive).

## 6. Future Expansion Ideas
* **Streak Analysis:** Calculate longest current and all-time streaks.
* **Weekend Filter:** Toggle to see only weekend contributions.
* **Year Comparison:** Compare "Level 4" thresholds between 2023 and 2024.