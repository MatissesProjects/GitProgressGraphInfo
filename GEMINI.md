## 🛠 Environment & Tooling

### Shell & Commands (Windows PowerShell)
- **Command Chaining:** When running multiple commands in a single `run_shell_command` call, use the semicolon `;` as a separator instead of `&&`. 
    - *Correct:* `git status; git log`
    - *Incorrect:* `git status && git log` (Causes a ParserError in PowerShell).
- **File Operations:** Prefer PowerShell syntax for operations like copying files during builds:
    - `powershell -Command "Copy-Item -Path 'src/manifest.json', 'src/styles.css', 'src/popup.html' -Destination 'dist' -Force"`

## 🧠 Project Knowledge: GitHeat (GitHub Extension)

### Data Extraction Strategy
- **Contribution Graph:** Extracted from `.ContributionCalendar-day` elements. Counts are parsed from `tool-tip` elements or fallback `aria-labels`. This is the **Source of Truth** for commit counts.
- **Timeline Parsing (`parseActivityTimeline`):**
    - **Today's Actions:** Targeted via `relative-time` elements and date header detection (localized to user's timezone).
    - **Active Repos:** Top 3 limited.
    - **Created Repos:** Top 3 limited.
    - **PRs & Issues:** Parsed from timeline text.
- **Pinned Projects:** Scraped from `.pinned-item-list-item-content`.

### 🎮 RPG & Gamification System
- **Level Curve:** `XP = Commits + Bonuses`. Threshold for Level `L` is `25 * L^2`.
- **Bonuses:**
    - **Multi-Commit:** +2 XP for every 5 contributions in a day.
    - **Reviewer:** +3 XP per Code Review.
    - **Velocity:** +2 XP if today's commits > average daily velocity.
- **Combo System:** Fibonacci-scaled multiplier (`1, 2, 3, 5, 8, 13...`).
    - **Points:** Commit (1), Review (2), Repo (3), Streak Bonus (Streak/3), Velocity Bonus (2).
    - **Reasoning:** Dynamic titles (Multi-Tasker, Guardian of Code, Commit Frenzy, etc.) based on today's action mix.
- **Header UI:** Bold Level badge, Title, Progress Bar (level-relative scale), and 2-line animated Combo badge.

### 📊 Advanced Analytics
- **Smart Scoring:** Best Month/Week calculated as `Commits * Consistency * Streak`.
- **Island Algorithm:** BFS-based contiguous cluster search.
    - **Biggest Island (L2+):** Level 2 or higher days.
    - **Worst Island (0-1):** 0 or 1 commit days (triggers "sad" shrinking blue highlight).
    - **Constraints:** Restricted to past/present data to avoid future-day bias.
- **Heatmap Scaling:** 12-level scale using 11 percentile markers (20th-99th). Level 0 is strictly 0 commits; Level 1 starts at exactly 1 commit.

### 🎨 UI & UX Standards
- **Grid Layout:** 200px minimum column width to prevent label overflow. Reorderable via drag-and-drop in popup.
- **Interaction:** Hovering over stat cards (Streak, Month, Week, Island) triggers persistent highlighting on the GitHub contribution graph.
- **Tooltips:** Every score, percentage, or legend square must have a `title` attribute providing the raw math or data breakdown (e.g., `45 / 60 days active`, `15 to 22 commits`).

### ⚙️ State Management
- **Chrome Storage:** All toggles (`showX`), theme settings, and `gridOrder` (array of IDs) are stored in `chrome.storage.local`.
- **Live Updates:** `applyVisibility` and `runAnalysis` are triggered by `chrome.storage.onChanged` to ensure instant UI feedback.

### 🚀 Build Process
- **Command:** `npm run build` runs `tsc` and then uses PowerShell to copy manifest, styles, and HTML to `dist/`.
