## Environment & Tooling

### Shell & Commands (Windows PowerShell)
- **Command Chaining:** When running multiple commands in a single `run_shell_command` call, use the semicolon `;` as a separator instead of `&&`. 
    - *Correct:* `git status; git log`
    - *Incorrect:* `git status && git log` (Causes a ParserError in PowerShell).
- **File Operations:** Prefer PowerShell syntax for operations like copying files during builds:
    - `powershell -Command "Copy-Item -Path 'src/manifest.json', 'src/styles.css', 'src/popup.html' -Destination 'dist' -Force"`

## Project Knowledge: GitHeat (GitHub Extension)

### Data Extraction Strategy
- **Contribution Graph:** Extracted from `.ContributionCalendar-day` elements. Counts are parsed from `tool-tip` elements or fallback `aria-labels`. This is the **Source of Truth** for commit counts.
- **Timeline Parsing (`parseActivityTimeline`):**
    - **Today's Actions:** Targeted via `relative-time` elements and date header detection (localized to user's timezone).
    - **Active Repos:** Top 3 limited.
    - **Created Repos:** Top 3 limited.
    - **PRs & Issues:** Parsed from timeline text.
- **Pinned Projects:** Scraped from `.pinned-item-list-item-content`.

### ⚙️ State Management
- **Chrome Storage:** All toggles (`showX`), theme settings, and `gridOrder` (array of IDs) are stored in `chrome.storage.local`.
- **Live Updates:** `applyVisibility` and `runAnalysis` are triggered by `chrome.storage.onChanged` to ensure instant UI feedback.

### 🚀 Build Process
- **Command:** `npm run build` runs `tsc` and then uses PowerShell to copy manifest, styles, and HTML to `dist/`.
