# GymEssentials Changelog

## Current Version — 1.0

### Current Version Highlights

- **Foundation release:** 1.0 is the first production-style GymEssentials release; 3.0–3.6 remain the historical beta versions.
- **Versioned data schema:** App version and data schema version are tracked separately for future migrations.
- **Stable exercise identity:** Exercises now carry a persistent `libraryId` and structured fields for future library content.
- **Stable program/session identity:** Programs and sessions now have explicit identifiers for future cloud, statistics, sharing, and Apple Health work.
- **Structured session records:** Logged values are normalized into `exerciseRecords` while the current workout UI remains familiar.
- **Migration-ready backups:** Exports include backup format/version, app version, schema version, export date, and normalized data.
- **Safer imports:** Imports validate and normalize older data, show a restore summary, and refuse malformed files without changing existing data.
- **Future-proof exercise model:** The app is ready for the planned Exercise Library without another fundamental workout-data rewrite.

### Intentionally not in 1.0

Guided workouts, pre-built programs, Exercise Library content, Apple Health/Watch, cloud accounts, and Workout Partners are deliberately separate future releases.

## 3.6 — Historical Beta
- Fixed Home → View Workout.
- Improved Open Current Program.
- Added Program Options for rename/archive.
- Added configurable week-start day.
- Separated New Program tools.
- Added the built-in 7-Day Program Builder.

## 3.5.2 — Historical Beta
- Added Future Program creation.
- Added program renaming.
- Added Showed Up status.

## 3.5.1 — Historical Beta
- Added dashboard notices, workout timestamps, Home navigation, Secondary/Future programs, ChatGPT instructions, View Log fixes, and safer Add Weights.

## 3.5 — Historical Beta
- Added protected exercise controls, dashboard/program management, body metrics, Metric/Imperial support, OLED mode, and workout image sharing.

## 3.4.1 — Historical Beta
- Added historical Add Weights / Reps without changing workout status.

## 3.4 — Historical Beta
- Rebranded the app to GymEssentials.
- Added Day/Night modes, unfinished workout preservation, historical views, prior-performance guidance, and repeated-exercise progression.

## Roadmap after 1.0
- **2.0:** Guided / Up Next workouts and smaller gym-use improvements.
- **3.0:** Pre-built customizable workout programs.
- **4.0:** Exercise Library.
- **4.1:** Exercise Library ↔ workout integration.
- **4.2:** Apple Health / Apple Watch.
- **4.3:** Optional cloud accounts and backup.
- **4.4:** Workout Partners / check-ins / controlled sharing.
