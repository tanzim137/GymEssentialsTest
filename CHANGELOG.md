# GymEssentials Changelog

## Current Version — 1.0

### Core Platform Release

GymEssentials 1.0 is the first release designed as a general workout platform rather than an app built around one specific workout routine.

### 1.0 Highlights

- **Program-first architecture** — programs are independent objects instead of the app being defined by one permanent workout plan.
- **Original Program preserved** — the workout program that originally inspired GymEssentials is retained as the **Original Program**, marked as the historical/legacy program, and remains usable as the active program.
- **Clean 1.0 data namespace** — 1.0 starts with fresh app data instead of automatically carrying beta 3.6 localStorage into the new architecture.
- **Versioned data schema** — app version and data schema version are tracked separately.
- **Stable exercise library IDs** — every exercise has a permanent `libraryId` foundation for the future Exercise Library.
- **Future-ready exercise metadata** — exercises can now hold primary/secondary muscles, movement pattern, equipment, difficulty, instructions, common mistakes, and media references.
- **Program identities** — programs have their own IDs, source information, descriptions, creation dates, and archive state.
- **Workout sessions remain separate from programs** — workout history can remain tied to the session that actually occurred instead of changing when a program is edited later.
- **New navigation model** — Home, Today, Programs, Library, and More replace the old mixture of Home/Log/top/day controls.
- **Today becomes the workout destination** — the Today tab is where the user actually performs today's workout.
- **Programs becomes the program-management destination** — create, activate, rename, archive, restore, and build programs from one place.
- **Library foundation** — exercises used by the active program are already browsable by their stable library identity; the full illustrated library is planned for 4.0.
- **7-Day Builder retained and promoted** — the built-in builder now creates a real independent program object.
- **Backup & Restore 1.0 format** — exports include backup version, app version, data schema version, export date, programs, sessions, and settings.
- **Beta separation** — 3.0–3.6 remain historical beta releases and are not silently rewritten as 1.0.
- **Existing 3.6 workout engine preserved underneath** — exercise logging, protected Done/Edit behavior, historical Add Weights, workout snapshots, Showed Up status, replacement workouts, body metrics, sharing, and workout editing remain available while the application shell is reorganized.

### What 1.0 intentionally does NOT do

- Guided/Up Next workouts are reserved for 2.0.
- Pre-built program templates are reserved for 3.0.
- The full illustrated Exercise Library is reserved for 4.0.
- Apple Health / Apple Watch is reserved for 4.2.
- Cloud accounts/backup are reserved for 4.3.
- Workout partners/social sharing are reserved for 4.4.

---

## 3.6 — Beta: Major Program & Navigation Update

- Fixed Home → View Workout after today's workout was finished.
- Improved Open Current Program.
- Moved rename/archive controls into Program Options.
- Added configurable week-start day.
- Separated New Program tools from Current Program controls.
- Added the built-in 7-Day Program Builder.
- Preserved the corrected startup behavior of the v3.6 beta build.

## 3.5.2 — Beta: Program Naming & Showed Up

- Added Future Program creation.
- Added program renaming for Current, Secondary, and Future programs.
- Added the positive **Showed Up** workout status when a workout is intentionally finished with some exercises unlogged.

## 3.5.1 — Beta: Dashboard & Program Improvements

- Added dashboard update notices.
- Added workout start and completion times.
- Separated Home from weekday navigation.
- Added Secondary and Future programs.
- Added beginner-friendly ChatGPT program-building instructions.
- Improved View Log navigation and Add Weights saving.

## 3.5 — Beta: Dashboard & Workout Management

- Added protected exercise Done/Edit controls.
- Added safer workout completion checks.
- Added the dashboard as the startup screen.
- Added program management and archived programs.
- Added Weight, Waist, Height, BMI, and Fat % tracking.
- Added Metric/Imperial units.
- Added true-black OLED mode.
- Added workout image sharing.

## 3.4.1 — Beta: Historical Weight Entry

- Added Add Weights / Reps for past dates.
- Historical entry does not start, complete, or otherwise alter workout status.
- Past entries remain visible in workout history.

## 3.4 — Beta: GymEssentials Rebrand & History

- Rebranded the app to GymEssentials.
- Added Day/Night modes.
- Improved weekly history drill-down.
- Preserved unfinished workouts.
- Added historical read-only workout views.
- Added previous-performance guidance.
- Improved repeated-exercise progression and exercise matching.

## 3.3 — Beta

- Preserved the workout-management, logging, history, and UI systems that became the foundation for later releases.

## 3.2 — Beta

- Continued the evolving workout-management and exercise-editing system that preceded the GymEssentials rebrand.

## 3.1 — Beta

- Continued refinement of workout logging, history, and program editing.

## 3.0 — Beta Foundation

- Established the early workout-tracking architecture from which GymEssentials evolved.

---

## Versioning Note

Versions **3.0 through 3.6 are intentionally retained as historical beta versions** for documenting the development of GymEssentials.

**1.0 is the first product/platform release.** Future roadmap releases build from 1.0 rather than continuing the beta numbering.
