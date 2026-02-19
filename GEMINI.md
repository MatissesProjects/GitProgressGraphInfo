## 🛠 Environment & Tooling

### Shell & Commands (Windows PowerShell)
- **Command Chaining:** When running multiple commands in a single `run_shell_command` call, use the semicolon `;` as a separator instead of `&&`. 
    - *Correct:* `git status; git log`
    - *Incorrect:* `git status && git log` (Causes a ParserError in PowerShell).
- **File Operations:** Prefer PowerShell syntax for operations like copying files during builds:
    - `powershell -Command "Copy-Item -Path 'public/*' -Destination 'dist' -Recurse -Force"`

## 🧠 Project Knowledge: GitHeat (GitHub Extension)

### Data Extraction Strategy
- **Contribution Graph:** Extracted from `.ContributionCalendar-day` elements. Counts are parsed from `tool-tip` elements or fallback `aria-labels`.
- **Timeline Parsing (`parseActivityTimeline`):**
    - **Active Repos:** Identified by looking for "commits in" text within `.TimelineItem-body`. This section contains commit counts.
    - **Created Repos:** Identified by looking for "Created" and "repository" (but NOT "commits in"). This section contains new repo names and languages.
    - **PRs & Issues:** Parsed via regex from timeline text (e.g., "Opened 5 pull requests").
- **Pinned Projects:** Scraped from `.pinned-item-list-item-content` to get stars, forks, and primary languages.

### UI & Injection
- **Injection Point:** The main stats panel is prepended to `.js-yearly-contributions`.
- **Granular Toggles:** 
    - Visibility is managed via `chrome.storage.local`.
    - `applyVisibility()` function in `content.ts` toggles display of specific IDs (e.g., `#gh-grid-stats`, `#gh-active-repos`, `#gh-persona`).
    - The popup has granular checkboxes for both high-level sections and individual grid items.

### Build Process
- **Command:** `npm run build` runs `tsc` and then uses PowerShell to copy `manifest.json`, `styles.css`, and `popup.html` to the `dist/` folder.


