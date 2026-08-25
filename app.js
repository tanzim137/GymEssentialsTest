/* =========================================================
   WORKOUT TRACKER — CORE APP ENGINE
   =========================================================

   Architecture:
   - Workout plans are stored as data
   - Workout sessions are stored separately
   - Exercise history is preserved
   - Exercises can be added/removed/reordered
   - User data is stored in localStorage
   - UI is generated dynamically
   - Designed for GitHub Pages / PWA
   ========================================================= */

'use strict';

/* =========================================================
   APP CONFIG
   ========================================================= */

const APP_VERSION = '1.0';
const DATA_SCHEMA_VERSION = 1;
const BACKUP_FORMAT_VERSION = 1;

const APP_CHANGELOG = [
    '1.0: Rebuilt the data foundation with a versioned schema, stable program/session/exercise identity, structured exercise metadata, migration-ready backups, and safer import normalization.',
    '3.6 beta: Fixed the Home View Workout action, improved Open Current Program, added configurable week-start day, separated New Program tools, and added the built-in 7-Day Program Builder.',
    '3.5.2 beta: Added Future Program creation, editable program names, and Showed Up status.',
    '3.5.1 beta: Added dashboard update notices, workout start/completion times, Home navigation, Secondary/Future programs, ChatGPT instructions, View Log fixes, and safer Add Weights saving.',
    '3.5 beta: Added protected exercise controls, dashboard/program management, OLED mode, Metric/Imperial measurements, body metrics, and workout image sharing.',
    '3.4.1 beta: Added Add Weights / Reps for historical dates without changing workout status.',
    '3.4 beta: Rebranded the app to GymEssentials, added Day/Night modes, preserved unfinished workouts, improved history, prior-performance guidance, and repeated-exercise progression.'
];

const NOTABLE_CHANGES = [
    { version: '3.6', title: 'Major program-building & navigation improvements', items: [
        'Fixed View Workout on the Home screen after today is finished.',
        'Open Current Program now reliably opens the active program.',
        'Program rename and archive controls are tucked into Program Options, keeping the dashboard cleaner.',
        'Choose any day as the start of your training week.',
        'New Program now has its own dedicated area.',
        'Build a simple 7-Day Program directly in the app without needing ChatGPT.'
    ]},
    { version: '3.5.2', title: 'Program naming & Showed Up status', items: [
        'Create a Future Program directly from New Program without changing the Current Program.',
        'Rename Current, Secondary, and Future programs.',
        'A workout intentionally finished with some exercises unlogged is marked “Showed Up” rather than Complete.',
    ]},
    { version: '3.5.1', title: 'Dashboard & program improvements', items: [
        'Added the dashboard update notice and simple Notable Changes button.',
        'Workout history shows start and completion times.',
        'Home is separate from the weekday tabs.',
        'Secondary and Future programs can be used alongside the Current Program.',
        'Added beginner-friendly ChatGPT program-building instructions.',
        'Fixed View Log navigation and added safer Add Weights saving.'
    ]},
    { version: '3.5', title: 'Major dashboard & workout improvements', items: [
        'Added protected exercise Done/Edit controls and safer workout completion checks.',
        'Added the dashboard as the app startup screen and program management.',
        'Added Weight, Waist, Height, BMI, and Fat % tracking with Metric/Imperial units.',
        'Fixed Day Mode and added true black OLED mode.',
        'Added the ability to share a day’s workout as an image.'
    ]},
    { version: '3.4.1', title: 'Historical workout entry', items: [
        'Added Add Weights / Reps for past dates without starting or completing that workout.',
        'Historical values remain visible while workout status stays unchanged.'
    ]}
];


const STORAGE_KEYS = {
    APP: 'workoutTrackerApp',
    SETTINGS: 'workoutTrackerSettings'
};


/* =========================================================
   DEFAULT WORKOUT PROGRAM
   ========================================================= */

const DEFAULT_PROGRAM = {

    monday: {
        id: 'monday',
        name: 'Monday',
        shortName: 'MON',
        icon: '🏋️',
        title: 'Upper A',
        subtitle: 'Incline Chest',
        type: 'strength',

        warmup: 'Treadmill: 8–10 min | Shoulder circles: 10/dir | Light external rotation: 1 × 15',

        sections: [

            {
                id: 'mon-chest',
                name: 'Chest',
                exercises: [
                    exercise('incline-chest-press', 'Incline Chest Press', '2 × 8–12', 'strength'),
                    exercise('machine-chest-press', 'Machine Chest Press', '2 × 8–12', 'strength'),
                    exercise('pec-deck', 'Pec Deck', '2 × 10–15', 'strength')
                ]
            },

            {
                id: 'mon-back',
                name: 'Back',
                exercises: [
                    exercise('seated-row', 'Seated Row', '3 × 8–12', 'strength'),
                    exercise('lat-pulldown', 'Lat Pulldown', '3 × 8–12', 'strength')
                ]
            },

            {
                id: 'mon-shoulder',
                name: 'Shoulder',
                exercises: [
                    exercise('cable-scaption', 'Cable Scaption', '2 × 12–15', 'strength'),
                    exercise('external-rotation', 'External Rotation', '2 × 15/arm', 'strength'),
                    exercise('internal-rotation', 'Internal Rotation', '2 × 15/arm', 'strength'),
                    exercise('face-pull', 'Face Pull', '2 × 12–15', 'strength')
                ]
            },

            {
                id: 'mon-arms',
                name: 'Arms',
                exercises: [
                    exercise('triceps-pushdown', 'Triceps Pushdown', '2 × 10–15', 'strength'),
                    exercise('biceps-curl', 'Biceps Curl', '2 × 10–15', 'strength')
                ]
            },

            {
                id: 'mon-core',
                name: 'Core',
                exercises: [
                    exercise('ab-crunch', 'Ab Crunch Machine', '2 × 12–15', 'strength')
                ]
            }
        ],

        checks: [
            { id: 'session-good', label: 'Good' },
            { id: 'session-hard', label: 'Hard' },
            { id: 'session-caution', label: 'Shoulder caution' }
        ]
    },


    tuesday: {
        id: 'tuesday',
        name: 'Tuesday',
        shortName: 'TUE',
        icon: '🏃',
        title: 'Run + Core',
        subtitle: 'Home / Outside',
        type: 'running',

        warmup: 'Walk 5 min',

        sections: [

            {
                id: 'tue-running',
                name: 'Run',
                description:
                    'Weeks 1–2: 1 min jog / 2 min walk × 6. Jog at conversational pace.',
                exercises: [
                    exercise('jog-interval', 'Jog Interval', '1 min jog / 2 min walk × 6', 'running'),
                    exercise('run-total-time', 'Total Time', 'Record actual time', 'measurement'),
                    exercise('run-distance', 'Distance', 'Record actual distance', 'measurement')
                ]
            },

            {
                id: 'tue-knee',
                name: 'Knee Response Afterwards',
                type: 'checks',
                checks: [
                    { id: 'knee-good', label: 'Good' },
                    { id: 'knee-mild', label: 'Mild' },
                    { id: 'knee-worsened', label: 'Worsened' }
                ]
            },

            {
                id: 'tue-core',
                name: 'Core',
                exercises: [
                    exercise('plank', 'Plank', '2–3 × 20–40 sec', 'timed'),
                    exercise('side-plank', 'Side Plank', '2 × 20–30 sec/side', 'timed'),
                    exercise('pallof-press', 'Pallof Press', '2 × 10–12/side', 'strength')
                ]
            }
        ]
    },


    wednesday: {
        id: 'wednesday',
        name: 'Wednesday',
        shortName: 'WED',
        icon: '🦵',
        title: 'Lower A',
        subtitle: 'PFPS-Conscious',
        type: 'strength',

        warmup: 'Bike: 8–10 min',

        sections: [

            {
                id: 'wed-legs',
                name: 'Legs',
                exercises: [
                    exercise('leg-press', 'Leg Press', '3 × 10–12', 'strength'),
                    exercise('hip-thrust', 'Hip Thrust / Glute Drive', '3 × 10–15', 'strength'),
                    exercise('leg-curl', 'Leg Curl', '3 × 10–15', 'strength'),
                    exercise('leg-extension', 'Leg Extension', '2 × 12–15', 'strength'),
                    exercise('hip-abductor', 'Hip Abductor', '3 × 12–15', 'strength'),
                    exercise('hip-adductor', 'Hip Adductor', '2 × 12–15', 'strength'),
                    exercise('calf-raise', 'Calf Raise', '3 × 12–15', 'strength')
                ]
            },

            {
                id: 'wed-optional',
                name: 'Optional',
                exercises: [
                    exercise('terminal-knee-extension',
                        'Terminal Knee Extension',
                        '2 × 12–15/leg',
                        'strength')
                ]
            },

            {
                id: 'wed-knee',
                name: 'Knee Check',
                type: 'checks',
                checks: [
                    { id: 'knee-good', label: 'Good' },
                    { id: 'knee-mild', label: 'Mild discomfort' },
                    { id: 'knee-regress', label: 'Regress / stop' }
                ]
            }
        ]
    },


    thursday: {
        id: 'thursday',
        name: 'Thursday',
        shortName: 'THU',
        icon: '🏋️',
        title: 'Upper B',
        subtitle: 'Chest + Back',
        type: 'strength',

        warmup: 'Treadmill: 8 min | Light shoulder mobility',

        sections: [

            {
                id: 'thu-chest',
                name: 'Chest',
                exercises: [
                    exercise('machine-chest-press', 'Machine Chest Press', '3 × 10–12', 'strength'),
                    exercise('pec-deck', 'Pec Deck', '2–3 × 10–15', 'strength')
                ]
            },

            {
                id: 'thu-back',
                name: 'Back',
                exercises: [
                    exercise('seated-row', 'Seated Row', '3 × 10–12', 'strength'),
                    exercise('neutral-lat-pulldown',
                        'Neutral-Grip Lat Pulldown',
                        '3 × 10–12',
                        'strength')
                ]
            },

            {
                id: 'thu-shoulder',
                name: 'Shoulder',
                exercises: [
                    exercise('reverse-pec-deck', 'Reverse Pec Deck', '2 × 12–15', 'strength'),
                    exercise('face-pull', 'Face Pull', '2 × 12–15', 'strength'),
                    exercise('external-rotation', 'External Rotation', '2 × 15', 'strength')
                ]
            },

            {
                id: 'thu-arms',
                name: 'Arms',
                exercises: [
                    exercise('triceps-pushdown', 'Triceps Pushdown', '2 × 10–15', 'strength'),
                    exercise('biceps-curl', 'Biceps Curl', '2 × 10–15', 'strength')
                ]
            },

            {
                id: 'thu-check',
                name: 'Shoulder Check',
                type: 'checks',
                checks: [
                    { id: 'shoulder-free', label: 'Pain-free' },
                    { id: 'shoulder-mild', label: 'Mild symptoms' },
                    { id: 'shoulder-stop', label: 'Stop / regress' }
                ]
            }
        ]
    },


    friday: {
        id: 'friday',
        name: 'Friday',
        shortName: 'FRI',
        icon: '🏃',
        title: 'Run + Core',
        subtitle: 'Home / Outside',
        type: 'running',

        progression: [
            'W1–2: 1 min jog + 2 min walk × 6',
            'W3–4: 2 min jog + 2 min walk × 5',
            'W5–6: 3 min jog + 90 sec walk × 5',
            'W7–8: 5 min jog + 2 min walk × 4'
        ],

        sections: [

            {
                id: 'fri-running',
                name: 'Running',
                exercises: [
                    exercise('run-week', 'Week', 'Current week', 'measurement'),
                    exercise('run-stage', 'Stage', 'Current progression stage', 'measurement'),
                    exercise('run-time', 'Total Time', 'Record actual time', 'measurement'),
                    exercise('run-distance', 'Distance', 'Record actual distance', 'measurement')
                ]
            },

            {
                id: 'fri-knee',
                name: 'Knee Response',
                type: 'checks',
                checks: [
                    { id: 'knee-good', label: 'Good' },
                    { id: 'knee-mild', label: 'Mild' },
                    { id: 'knee-worsened', label: 'Worsened' }
                ]
            },

            {
                id: 'fri-mobility',
                name: 'Core & Mobility',
                type: 'checks',
                checks: [
                    { id: 'plank', label: 'Plank' },
                    { id: 'side-plank', label: 'Side Plank' },
                    { id: 'pec-stretch', label: 'Doorway pec' },
                    { id: 'shoulder-stretch', label: 'Cross-body shoulder' },
                    { id: 'quad-stretch', label: 'Quad' },
                    { id: 'calf-stretch', label: 'Calf' },
                    { id: 'hamstring-stretch', label: 'Hamstring' }
                ]
            }
        ]
    },


    saturday: {
        id: 'saturday',
        name: 'Saturday',
        shortName: 'SAT',
        icon: '🏋️',
        title: 'Full Body',
        subtitle: 'Chest + Abs',
        type: 'strength',

        warmup: 'Bike / Treadmill: 8–10 min',

        sections: [

            {
                id: 'sat-full-body',
                name: 'Full Body',
                exercises: [
                    exercise('leg-press', 'Leg Press', '2 × 10–12', 'strength'),
                    exercise('machine-chest-press', 'Machine Chest Press', '2 × 10–12', 'strength'),
                    exercise('seated-row', 'Seated Row', '2 × 10–12', 'strength'),
                    exercise('leg-curl', 'Leg Curl', '2 × 12–15', 'strength'),
                    exercise('lat-pulldown', 'Lat Pulldown', '2 × 10–12', 'strength'),
                    exercise('hip-thrust', 'Hip Thrust / Glute Drive', '2 × 10–12', 'strength'),
                    exercise('hip-abductor', 'Hip Abductor', '2 × 15', 'strength'),
                    exercise('external-rotation', 'External Rotation', '2 × 15', 'strength')
                ]
            },

            {
                id: 'sat-abs',
                name: 'Abs',
                exercises: [
                    exercise('ab-crunch', 'Ab Crunch Machine', '2–3 × 12–15', 'strength')
                ]
            },

            {
                id: 'sat-walk',
                name: 'Easy Treadmill Walk',
                exercises: [
                    exercise('walk-time', 'Time', '15–20 min', 'measurement'),
                    exercise('walk-distance', 'Distance', 'Record distance', 'measurement')
                ]
            },

            {
                id: 'sat-rating',
                name: 'Overall Rating',
                type: 'checks',
                checks: [
                    { id: 'easy', label: 'Easy' },
                    { id: 'good', label: 'Good' },
                    { id: 'hard', label: 'Hard' }
                ]
            }
        ]
    },


    sunday: {
        id: 'sunday',
        name: 'Sunday',
        shortName: 'SUN',
        icon: '🚶',
        title: 'Recovery',
        subtitle: 'Rest & Mobility',
        type: 'recovery',

        sections: [

            {
                id: 'sun-activity',
                name: 'Activity',
                exercises: [
                    exercise('easy-walk', 'Easy Walk', '20–30+ min', 'measurement')
                ]
            },

            {
                id: 'sun-shoulder',
                name: 'Shoulder Protocol',
                type: 'checks',
                checks: [
                    { id: 'pendulum', label: 'Pendulum swings' },
                    { id: 'wall-slides', label: 'Wall slides' },
                    { id: 'rehab', label: 'Prescribed rehab exercises' },
                    { id: 'mobility', label: 'Gentle mobility' }
                ]
            },

            {
                id: 'sun-recovery',
                name: 'Recovery Check',
                type: 'checks',
                checks: [
                    { id: 'sleep', label: 'Good sleep' },
                    { id: 'hydration', label: 'Hydration' },
                    { id: 'movement', label: 'Normal daily movement' },
                    { id: 'no-lifting', label: 'No formal lifting' }
                ]
            }
        ]
    }
};


/* =========================================================
   HELPERS
   ========================================================= */

function exercise(id, name, target, type = 'strength') {
    const safeId = id || generateId('exercise');
    return {
        id: safeId,
        libraryId: createExerciseLibraryId(name, safeId),
        name,
        target,
        type,
        enabled: true,
        primaryMuscle: '',
        secondaryMuscles: [],
        movementPattern: '',
        equipment: [],
        difficulty: '',
        instructions: [],
        commonMistakes: [],
        media: []
    };
}


function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;
}


function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}




/* =========================================================
   APPLICATION STATE
   ========================================================= */

/* Safe during initial appState construction; updated after saved settings load. */
let configuredWeekStartDay = 'monday';

let appState = {
    version: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    program: deepClone(DEFAULT_PROGRAM),
    currentDay: getTodayKey(),
    sessions: {},
    settings: {
        dataSchemaVersion: DATA_SCHEMA_VERSION,
        activeView: 'day',
        theme: 'night',
        unitSystem: 'imperial',
        firstUseDate: getWeekStartDateKey(),
        heightFeet: '',
        heightInches: '',
        bodyFatSex: '',
        activeProgramId: 'current',
        currentProgramId: 'program-current',
        programLibrary: [],
        dashboardDismissed: false,
        weightEntryMode: false,
        weightEntryDayId: null,
        weightEntryDateKey: null,
        weightEntryBackupValues: null,
        programViewSlot: 'current',
        secondaryProgram: null,
        futureProgram: null
    }
};

let toastTimer = null;
configuredWeekStartDay = appState.settings.weekStartDay || 'monday';


/* =========================================================
   STORAGE
   ========================================================= */

function applyTheme() {
    const theme = ['day', 'night', 'oled'].includes(appState.settings.theme) ? appState.settings.theme : 'night';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === 'day' ? 'light' : 'dark';
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', theme === 'day' ? '#f4f7fb' : '#000000');
}

function getThemeLabel() {
    return appState.settings.theme === 'day' ? 'Day' : 'Night';
}

/* =========================================================
   VERSION 1.0 DATA FOUNDATION
   ========================================================= */

function slugifyExerciseName(name) {
    return String(name || '').toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'exercise';
}

function createExerciseLibraryId(name, fallbackId = '') {
    const slug = slugifyExerciseName(name);
    return slug === 'exercise' && fallbackId ? `custom-${String(fallbackId).replace(/[^a-zA-Z0-9_-]/g, '-')}` : slug;
}

function normalizeExerciseDefinition(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const name = String(source.name || 'Unnamed Exercise').trim();
    const id = String(source.id || generateId('exercise'));
    return {
        ...source,
        id,
        libraryId: String(source.libraryId || createExerciseLibraryId(name, id)),
        name,
        target: source.target ?? '',
        type: source.type || 'strength',
        enabled: source.enabled !== false,
        primaryMuscle: source.primaryMuscle || '',
        secondaryMuscles: Array.isArray(source.secondaryMuscles) ? source.secondaryMuscles : [],
        movementPattern: source.movementPattern || '',
        equipment: Array.isArray(source.equipment) ? source.equipment : [],
        difficulty: source.difficulty || '',
        instructions: Array.isArray(source.instructions) ? source.instructions : [],
        commonMistakes: Array.isArray(source.commonMistakes) ? source.commonMistakes : [],
        media: Array.isArray(source.media) ? source.media : []
    };
}

function normalizeProgramDays(days) {
    if (!days || typeof days !== 'object') return {};
    const normalized = {};
    Object.entries(days).forEach(([dayKey, rawDay]) => {
        if (!rawDay || typeof rawDay !== 'object') return;
        const day = deepClone(rawDay);
        day.id = String(day.id || dayKey);
        day.name = day.name || dayKey;
        day.shortName = day.shortName || String(day.name).slice(0, 3).toUpperCase();
        day.icon = day.icon || '🏋️';
        day.title = day.title || 'Workout';
        day.subtitle = day.subtitle || '';
        day.type = day.type || 'strength';
        day.sections = Array.isArray(day.sections) ? day.sections : [];
        day.sections.forEach(section => {
            section.id = String(section.id || generateId('section'));
            section.name = section.name || 'Workout';
            if (section.type === 'checks') section.checks = Array.isArray(section.checks) ? section.checks : [];
            else section.exercises = Array.isArray(section.exercises) ? section.exercises.map(normalizeExerciseDefinition) : [];
        });
        normalized[dayKey] = day;
    });
    return normalized;
}

function normalizeSessionRecord(raw, key) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const session = {
        ...source,
        id: String(source.id || key),
        programId: source.programId || (source.programSlot === 'secondary' ? 'secondary' : 'program-current'),
        programSlot: source.programSlot === 'secondary' ? 'secondary' : 'current',
        dayId: source.dayId || '',
        date: source.date || '',
        values: source.values && typeof source.values === 'object' ? source.values : {},
        checks: source.checks && typeof source.checks === 'object' ? source.checks : {},
        exerciseRecords: source.exerciseRecords && typeof source.exerciseRecords === 'object' ? source.exerciseRecords : {},
        notes: source.notes || '',
        started: Boolean(source.started), completed: Boolean(source.completed), partial: Boolean(source.partial), missed: Boolean(source.missed), incomplete: Boolean(source.incomplete),
        startedAt: source.startedAt || null, completedAt: source.completedAt || null, missedAt: source.missedAt || null, incompleteAt: source.incompleteAt || null,
        workoutSnapshot: source.workoutSnapshot || null, replacementDayId: source.replacementDayId || null,
        weight: source.weight ?? '', waist: source.waist ?? '',
        doneExercises: source.doneExercises && typeof source.doneExercises === 'object' ? source.doneExercises : {},
        exerciseEditBackups: source.exerciseEditBackups && typeof source.exerciseEditBackups === 'object' ? source.exerciseEditBackups : {}
    };
    Object.entries(session.values).forEach(([exerciseId, value]) => {
        const existing = session.exerciseRecords[exerciseId] || {};
        session.exerciseRecords[exerciseId] = { ...existing, exerciseId: existing.exerciseId || exerciseId, libraryId: existing.libraryId || '', value, recordedAt: existing.recordedAt || null };
    });
    return session;
}

function normalizeAppStateForV1(rawState) {
    const source = rawState && typeof rawState === 'object' ? deepClone(rawState) : {};
    const defaults = { ...appState.settings };
    const normalized = {
        ...appState,
        ...source,
        version: APP_VERSION,
        dataSchemaVersion: DATA_SCHEMA_VERSION,
        program: normalizeProgramDays(source.program || DEFAULT_PROGRAM),
        sessions: {},
        settings: { ...defaults, ...(source.settings || {}), dataSchemaVersion: DATA_SCHEMA_VERSION }
    };
    normalized.settings.currentProgramId = normalized.settings.currentProgramId || 'program-current';
    normalized.settings.programLibrary = Array.isArray(normalized.settings.programLibrary) ? normalized.settings.programLibrary.map(program => ({ ...program, id: program.id || generateId('program'), days: normalizeProgramDays(program.days || {}) })) : [];
    for (const slot of ['secondaryProgram','futureProgram']) {
        const program = normalized.settings[slot];
        normalized.settings[slot] = program && typeof program === 'object' ? { ...program, id: program.id || generateId('program'), days: normalizeProgramDays(program.days || {}) } : null;
    }
    Object.entries(source.sessions || {}).forEach(([key, session]) => normalized.sessions[key] = normalizeSessionRecord(session, key));
    normalized.currentDay = getTodayKey();
    return normalized;
}

function prepareStateForSave() {
    appState = normalizeAppStateForV1(appState);
}

function buildBackupPayload() {
    return {
        backupType: 'GymEssentials Backup',
        backupVersion: BACKUP_FORMAT_VERSION,
        appVersion: APP_VERSION,
        dataSchemaVersion: DATA_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        data: deepClone(normalizeAppStateForV1(appState))
    };
}

function parseAndNormalizeBackup(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid backup file.');
    const candidate = raw.data && typeof raw.data === 'object' ? raw.data : raw;
    if (!candidate.program && !candidate.sessions && !candidate.settings) throw new Error('This file does not contain GymEssentials data.');
    return { sourceVersion: raw.appVersion || candidate.version || 'Unknown', backupVersion: raw.backupVersion || 0, exportedAt: raw.exportedAt || null, data: normalizeAppStateForV1(candidate) };
}

function describeBackupForImport(parsed) {
    const sessions = Object.keys(parsed.data.sessions || {}).length;
    const programs = 1 + (parsed.data.settings.secondaryProgram ? 1 : 0) + (parsed.data.settings.futureProgram ? 1 : 0) + parsed.data.settings.programLibrary.length;
    const exported = parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString() : 'Unknown';
    return `GymEssentials backup\n\nSource app version: ${parsed.sourceVersion}\nBackup version: ${parsed.backupVersion}\nExported: ${exported}\nPrograms found: ${programs}\nWorkout sessions: ${sessions}\n\nImport this backup? Existing local data will be replaced.`;
}

function saveApp() {
    try {
        prepareStateForSave();
        localStorage.setItem(
            STORAGE_KEYS.APP,
            JSON.stringify(appState)
        );
    } catch (error) {
        console.error('Could not save workout data:', error);
    }
}

function loadApp() {
    const saved = localStorage.getItem(STORAGE_KEYS.APP);

    if (!saved) {
        appState.settings.firstUseDate = getWeekStartDateKey();
        appState.currentDay = getTodayKey();
        appState.settings.activeView = 'dashboard';
        appState.settings.theme = 'night';
        applyTheme();
        saveApp();
        return;
    }

    try {
        const parsed = JSON.parse(saved);

        appState = {
            ...appState,
            ...parsed,
            version: APP_VERSION,
            program: parsed.program || deepClone(DEFAULT_PROGRAM),
            sessions: parsed.sessions || {},
            settings: {
                ...appState.settings,
                ...(parsed.settings || {}),
                theme: ['day', 'night', 'oled'].includes(parsed.settings?.theme) ? parsed.settings.theme : 'night',
                editingWorkout: false,
                workoutDraft: null,
                workoutDraftDayId: null,
                weightEntryMode: false,
                weightEntryDayId: null,
                weightEntryDateKey: null,
                weightEntryBackupValues: null
            }
        };

        if (!appState.settings.firstUseDate) {
            appState.settings.firstUseDate = getWeekStartDateKey();
        }

        appState.currentDay = getTodayKey();
        appState.settings.activeView = 'dashboard';
        appState.settings.unitSystem = appState.settings.unitSystem === 'metric' ? 'metric' : 'imperial';
        appState.settings.activeProgramId = appState.settings.activeProgramId || 'current';
        appState.settings.programLibrary = Array.isArray(appState.settings.programLibrary) ? appState.settings.programLibrary : [];
        appState.settings.programViewSlot = ['current','secondary'].includes(appState.settings.programViewSlot) ? appState.settings.programViewSlot : 'current';
        appState.settings.secondaryProgram = appState.settings.secondaryProgram && typeof appState.settings.secondaryProgram === 'object' ? appState.settings.secondaryProgram : null;
        appState.settings.futureProgram = appState.settings.futureProgram && typeof appState.settings.futureProgram === 'object' ? appState.settings.futureProgram : null;
        configuredWeekStartDay = appState.settings.weekStartDay || 'monday';
        appState = normalizeAppStateForV1(appState);
        appState.settings.activeView = 'dashboard';
        applyTheme();
        reconcileMissedDays();
        saveApp();
    } catch (error) {
        console.error('Could not load saved app data:', error);
        appState = {
            ...appState,
            version: APP_VERSION,
            currentDay: getTodayKey(),
            settings: {
                ...appState.settings,
                activeView: 'dashboard',
                firstUseDate: getWeekStartDateKey(),
                theme: 'night',
                heightFeet: '',
                heightInches: '',
                bodyFatSex: ''
            }
        };
        applyTheme();
        saveApp();
    }
}

function getTodayKey() {
    const days = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
    ];

    return days[new Date().getDay()];
}

function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getWeekStartDate(date = new Date()) {
    const result = new Date(date);
    result.setHours(12, 0, 0, 0);
    const day = result.getDay();
    const names = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const configured = configuredWeekStartDay;
    const startIndex = Math.max(0, names.indexOf(configured));
    const offset = (day - startIndex + 7) % 7;
    result.setDate(result.getDate() - offset);
    return result;
}

function getWeekStartDateKey(date = new Date()) {
    return getDateKey(getWeekStartDate(date));
}

function getWeekEndDateKey(date = new Date()) {
    const result = getWeekStartDate(date);
    result.setDate(result.getDate() + 6);
    return getDateKey(result);
}

function getWeekKeyFromDateKey(dateKey) {
    return getWeekStartDateKey(parseDateKey(dateKey));
}

function formatWeekRange(startKey) {
    const start = parseDateKey(startKey);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startText = start.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const endText = end.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    return `${startText} to ${endText}`;
}

function getWeekdayDateKeys(startKey) {
    const start = parseDateKey(startKey);
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return getDateKey(date);
    });
}

function getDayIdForDate(date) {
    const days = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
    ];

    return days[date.getDay()];
}

function parseDateKey(dateKey) {
    return new Date(`${dateKey}T12:00:00`);
}

function getPreviousDateKey(dateKey) {
    const date = parseDateKey(dateKey);
    date.setDate(date.getDate() - 1);
    return getDateKey(date);
}

function getSession(dayId, dateKey = getDateKey()) {
    const key = programSessionKey(dayId, dateKey);

    if (!appState.sessions[key]) {
        appState.sessions[key] = {
            id: key,
            programId: appState.settings.programViewSlot === 'secondary' && appState.settings.secondaryProgram ? appState.settings.secondaryProgram.id : (appState.settings.currentProgramId || 'program-current'),
            programSlot: appState.settings.programViewSlot === 'secondary' ? 'secondary' : 'current',
            dayId,
            date: dateKey,
            values: {},
            checks: {},
            exerciseRecords: {},
            notes: '',
            started: false,
            completed: false,
            partial: false,
            missed: false,
            incomplete: false,
            startedAt: null,
            completedAt: null,
            missedAt: null,
            incompleteAt: null,
            workoutSnapshot: null,
            replacementDayId: null,
            weight: '',
            waist: '',
            doneExercises: {},
            exerciseEditBackups: {}
        };
        saveApp();
    } else {
        const session = appState.sessions[key];
        if (typeof session.started !== 'boolean') session.started = Boolean(session.completed || session.startedAt);
        if (typeof session.completed !== 'boolean') session.completed = Boolean(session.completed);
        if (typeof session.partial !== 'boolean') session.partial = false;
        if (typeof session.missed !== 'boolean') session.missed = false;
        if (typeof session.incomplete !== 'boolean') session.incomplete = false;
        if (!session.values) session.values = {};
        if (!session.checks) session.checks = {};
        if (!session.exerciseRecords) session.exerciseRecords = {};
        Object.entries(session.values).forEach(([exerciseId, value]) => {
            session.exerciseRecords[exerciseId] = { ...(session.exerciseRecords[exerciseId] || {}), exerciseId, value, recordedAt: session.exerciseRecords[exerciseId]?.recordedAt || null };
        });
        if (!('notes' in session)) session.notes = '';
        if (!('startedAt' in session)) session.startedAt = null;
        if (!('completedAt' in session)) session.completedAt = null;
        if (!('missedAt' in session)) session.missedAt = null;
        if (!('incompleteAt' in session)) session.incompleteAt = null;
        if (!('workoutSnapshot' in session)) session.workoutSnapshot = null;
        if (!('replacementDayId' in session)) session.replacementDayId = null;
        if (!('weight' in session)) session.weight = '';
        if (!('waist' in session)) session.waist = '';
        if (!session.doneExercises) session.doneExercises = {};
        if (!session.exerciseEditBackups) session.exerciseEditBackups = {};
    }

    return appState.sessions[key];
}

function getReferenceDateForDayId(dayId, fromDate = new Date()) {
    if (dayId === getDayIdForDate(fromDate)) return new Date(fromDate);

    const result = new Date(fromDate);
    result.setHours(12, 0, 0, 0);
    const targetDayIndex = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
    }[dayId];
    if (targetDayIndex == null) return result;

    let diff = (result.getDay() - targetDayIndex + 7) % 7;
    if (diff === 0) diff = 7;
    result.setDate(result.getDate() - diff);
    return result;
}

function getReferenceDateKeyForDayId(dayId, fromDate = new Date()) {
    return getDateKey(getReferenceDateForDayId(dayId, fromDate));
}

function hasSessionEntries(session) {
    return Boolean(session && (
        session.started ||
        session.completed ||
        session.missed ||
        session.incomplete ||
        session.notes ||
        Object.keys(session.values || {}).length ||
        Object.values(session.checks || {}).some(Boolean) ||
        session.weight !== '' ||
        session.waist !== '' ||
        session.replacementDayId
    ));
}

function reconcileMissedDays() {
    const todayKey = getDateKey();
    const firstUseDate = appState.settings.firstUseDate || todayKey;
    let cursor = parseDateKey(firstUseDate);
    const yesterday = parseDateKey(getPreviousDateKey(todayKey));

    if (cursor > yesterday) return;

    let changed = false;

    while (cursor <= yesterday) {
        const dateKey = getDateKey(cursor);
        const dayId = getDayIdForDate(cursor);

        if (appState.program[dayId]) {
            const session = getSession(dayId, dateKey);

            if (session.started && !session.completed && !session.partial && !session.incomplete) {
                session.incomplete = true;
                session.incompleteAt = new Date(`${dateKey}T23:59:59`).toISOString();
                session.missed = false;
                changed = true;
            } else if (!session.started && !session.completed && !session.partial && !session.missed && !session.incomplete) {
                session.missed = true;
                session.missedAt = new Date(`${dateKey}T23:59:59`).toISOString();
                changed = true;
            }
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    if (changed) saveApp();
}

function getTodaySession() {
    return getSession(getTodayKey(), getDateKey());
}

function getDayForSession(session) {
    if (
        session &&
        session.workoutSnapshot &&
        session.workoutSnapshot.id
    ) {
        return session.workoutSnapshot;
    }

    if (
        session &&
        session.replacementDayId &&
        getActiveProgram()[session.replacementDayId]
    ) {
        return deepClone(getActiveProgram()[session.replacementDayId]);
    }

    return session
        ? getActiveProgram()[session.dayId]
        : getActiveProgram()[getTodayKey()];
}

function getEffectiveWorkoutForToday() {
    const session = getTodaySession();

    if (session.workoutSnapshot) {
        return deepClone(session.workoutSnapshot);
    }

    if (
        session.replacementDayId &&
        getActiveProgram()[session.replacementDayId]
    ) {
        return deepClone(getActiveProgram()[session.replacementDayId]);
    }

    return deepClone(appState.program[getTodayKey()]);
}

function isTodayDay(dayId) {
    return dayId === getTodayKey();
}

function isTodaySessionStarted() {
    const session = getTodaySession();
    return Boolean(session.started);
}

function canEditToday() {
    const session = getTodaySession();
    return (
        isTodayDay(appState.currentDay) &&
        session.started &&
        !session.completed &&
        !session.partial
    );
}

function getIncompleteExercises(dayId, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    const workout = session.workoutSnapshot || getEffectiveWorkoutForToday();
    const missing = [];
    (workout?.sections || []).forEach(section => {
        (section.exercises || []).forEach(ex => {
            if (ex.enabled === false) return;
            if (!isValueFilled(getSessionValueForExercise(session, ex))) missing.push(ex.name);
        });
    });
    return missing;
}

function completeSession(dayId) {
    if (!isTodayDay(dayId)) { showToast('Only today can be completed.'); return false; }
    const session = getSession(dayId);
    if (!session.started) { showToast('Press Start Exercise first.'); return false; }
    if (session.completed || session.partial) return false;
    const missing = getIncompleteExercises(dayId);
    if (missing.length) {
        const preview = missing.slice(0, 5).join(', ');
        const more = missing.length > 5 ? ` and ${missing.length - 5} more` : '';
        openConfirmModal({
            title: 'Some exercises are still unlogged',
            message: `${missing.length} exercise${missing.length === 1 ? ' is' : 's are'} still unlogged: ${preview}${more}. You can go back and finish them, or finish the workout as “Showed Up” so you get credit for making the effort without calling it fully complete.`,
            confirmText: 'Finish as “Showed Up”',
            onConfirm: () => finalizePartialSession(session)
        });
        return false;
    }
    return finalizeCompletedSession(session);
}

function finalizeCompletedSession(session) {
    session.completed = true; session.partial = false; session.incomplete = false; session.missed = false;
    session.completedAt = new Date().toISOString();
    saveApp(); render(); showToast('Workout completed ✓');
    return true;
}

function finalizePartialSession(session) {
    session.completed = false; session.partial = true; session.incomplete = false; session.missed = false;
    session.completedAt = new Date().toISOString();
    saveApp(); render(); showToast('Workout saved as “Showed Up” 💪');
    return true;
}

function startTodaySession() {
    const dayId = getTodayKey();
    const session = getSession(dayId);

    if (session.started || session.partial) {
        showToast('Today is already active.');
        return;
    }

    openConfirmModal({
        title: 'Start workout?',
        message: 'Starting today will log this day and enable workout entry. You can still record body stats without starting.',
        confirmText: 'Start Workout',
        onConfirm: () => {
            session.started = true;
            session.startedAt = new Date().toISOString();
            session.missed = false;
            session.partial = false;
            session.incomplete = false;
            session.incompleteAt = null;

            /* Snapshot the exact workout used today. */
            session.workoutSnapshot = getEffectiveWorkoutForToday();
            session.workoutSnapshot.id = dayId;
            session.workoutSnapshot.name = getActiveProgram()[dayId].name;
            session.workoutSnapshot.shortName = getActiveProgram()[dayId].shortName;
            session.workoutSnapshot.icon = getActiveProgram()[dayId].icon;

            saveApp();
            render();
            showToast('Workout started');
        }
    });
}

function resetTodaySession() {
    const dayId = getTodayKey();
    const key = `${getDateKey()}_${dayId}`;

    if (!confirm('Reset today\'s workout entries and active workout?')) {
        return;
    }

    delete appState.sessions[key];

    saveApp();
    render();
    showToast('Today reset');
}


/* =========================================================
   WORKOUT REPLACEMENT
   ========================================================= */

function copyWorkoutContent(source, targetIdentity) {
    const copy = deepClone(source);

    copy.id = targetIdentity.id;
    copy.name = targetIdentity.name;
    copy.shortName = targetIdentity.shortName;
    copy.icon = targetIdentity.icon;

    return copy;
}

function openReplaceWorkoutMenu(dayId) {
    closeMenus();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const days = Object.values(appState.program)
        .filter(day => day.id !== dayId);

    const isToday = dayId === getTodayKey();
    const session = getSession(dayId);

    const rows = days.map(day => `
        <button
            class="replace-option"
            data-source-day="${escapeHtml(day.id)}">
            <span class="replace-option-icon">${day.icon}</span>
            <span>
                <strong>${escapeHtml(day.name)}</strong>
                <small>${escapeHtml(day.title || '')}</small>
            </span>
        </button>
    `).join('');

    overlay.innerHTML = `
        <div class="action-sheet">
            <div class="action-sheet-title">
                ${isToday
                    ? 'Replace Today\'s Workout'
                    : 'Replace Scheduled Workout'}
            </div>

            <p class="modal-description">
                ${isToday
                    ? 'Choose another day to use for today. This only changes today\'s workout and does not change future days.'
                    : 'Choose another day to copy into this scheduled day. This changes the selected day and its future plan, while completed history stays unchanged.'}
            </p>

            ${
                isToday && session.started
                    ? `
                        <div class="disabled-message">
                            Today is already active. Replacement is locked.
                        </div>
                    `
                    : rows
            }

            <button data-action="cancel" class="cancel-action">
                Cancel
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            overlay.remove();
            return;
        }

        const button = event.target.closest('button');
        if (!button) return;

        const sourceDayId = button.dataset.sourceDay;

        if (!sourceDayId) {
            overlay.remove();
            return;
        }

        if (isToday) {
            if (session.started) {
                showToast('Finish or reset today before replacing it.');
                overlay.remove();
                return;
            }

            session.replacementDayId = sourceDayId;
            session.workoutSnapshot = null;
            session.values = {};
            session.checks = {};

            saveApp();
            overlay.remove();
            render();
            showToast(`Today's workout replaced with ${getActiveProgram()[sourceDayId].name}`);
            return;
        }

        const target = getActiveProgram()[dayId];
        const source = getActiveProgram()[sourceDayId];

        if (!target || !source) {
            overlay.remove();
            return;
        }

        if (
            !confirm(
                `Replace ${target.name}'s future workout with ${source.name}?`
            )
        ) {
            return;
        }

        getActiveProgram()[dayId] = copyWorkoutContent(source, target);

        saveApp();
        overlay.remove();
        render();
        showToast(`${target.name} workout replaced`);
    });
}


/* =========================================================
   FIELD VALUE MANAGEMENT
   ========================================================= */

function getDefaultSetCount(ex) {
    if (ex.type !== 'strength') return 1;

    const match = String(ex.target || '').match(
        /^\s*(\d+)(?:[–-]\d+)?\s*[x×]/
    );

    const count = match ? Number(match[1]) : 1;

    return Math.max(1, Math.min(count, 20));
}

function normalizeStrengthValue(raw, ex) {
    const defaultCount = getDefaultSetCount(ex);

    if (
        raw &&
        typeof raw === 'object' &&
        !Array.isArray(raw)
    ) {
        return {
            weight: raw.weight ?? '',
            reps: Array.isArray(raw.reps)
                ? raw.reps.slice(0, 50)
                : Array(defaultCount).fill('')
        };
    }

    if (typeof raw === 'string' && raw.trim()) {
        const trimmed = raw.trim();

        const match = trimmed.match(
            /^(.+?)\s*(?:lb|lbs)?\s*[x×]\s*(.+)$/i
        );

        if (match) {
            return {
                weight: match[1].trim(),
                reps: match[2]
                    .split(',')
                    .map(value => value.trim())
                    .filter(Boolean)
            };
        }
    }

    return {
        weight: '',
        reps: Array(defaultCount).fill('')
    };
}

function getSessionValue(dayId, exerciseId, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    return session.values[exerciseId] ?? '';
}

function setSessionValue(dayId, exerciseId, value, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    session.values[exerciseId] = value;
    saveApp();
}

function canonicalExerciseName(name) {
    let normalized = String(name || '').toLowerCase()
        .replace(/[‐‑‒–—−-]/g, ' ')
        .replace(/\bneutral\s+grip\s+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return normalized === 'lat pulldown' ? 'lat pulldown' : normalized;
}

function getSessionValueForExercise(session, exercise) {
    if (!session || !session.values) return '';
    if (session.values[exercise.id] !== undefined) return session.values[exercise.id];

    const targetName = canonicalExerciseName(exercise.name);
    const workout = session.workoutSnapshot || getActiveProgram()[session.dayId];
    if (!workout) return '';
    for (const section of workout.sections || []) {
        for (const candidate of section.exercises || []) {
            if (canonicalExerciseName(candidate.name) === targetName) return session.values[candidate.id] ?? '';
        }
    }
    return '';
}

function isValueFilled(value) {
    if (value == null || value === '') return false;
    if (typeof value === 'object') {
        if (value.weight !== '' && value.weight != null) return true;
        return Array.isArray(value.reps) && value.reps.some(rep => rep !== '');
    }
    return String(value).trim() !== '';
}

function getExerciseHistorySeed(exercise, beforeDateKey = getDateKey()) {
    const targetId = exercise.id;
    const targetName = canonicalExerciseName(exercise.name);
    const start = parseDateKey(beforeDateKey);

    for (let i = 1; i < 3700; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() - i);
        const dateKey = getDateKey(date);
        const dayId = getDayIdForDate(date);
        const session = appState.sessions[programSessionKey(dayId, dateKey)];
        if (!session || !hasSessionEntries(session)) continue;

        const workout = session.workoutSnapshot || getActiveProgram()[dayId];
        if (!workout) continue;

        let match = null;
        for (const section of workout.sections || []) {
            match = (section.exercises || []).find(candidate =>
                candidate.id === targetId ||
                canonicalExerciseName(candidate.name) === targetName
            );
            if (match) break;
        }
        if (!match) continue;

        const raw = getSessionValueForExercise(session, match);
        if (!isValueFilled(raw)) continue;

        return { value: deepClone(raw), date: dateKey, dayId, exerciseName: match.name };
    }
    return null;
}

function formatPerformanceHint(seed, ex) {
    if (!seed) return '';
    if (ex.type === 'strength') {
        const normalized = normalizeStrengthValue(seed.value, ex);
        const weight = normalized.weight !== '' ? `${displayWeight(normalized.weight)} ${weightUnit()}` : '—';
        const reps = normalized.reps.filter(rep => rep !== '');
        return `Previous: ${weight}${reps.length ? ` • ${reps.join(' / ')}` : ''} • ${formatDate(seed.date)}`;
    }
    return `Previous: ${String(seed.value)} • ${formatDate(seed.date)}`;
}

function updateStrengthWeight(dayId, exerciseId, value, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    const exValue = getSessionValue(dayId, exerciseId, dateKey);
    session.values[exerciseId] = {
        ...normalizeStrengthValue(exValue, { type: 'strength', target: '' }),
        weight: value
    };
    saveApp();
}

function updateStrengthRep(dayId, exerciseId, index, value, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    const exValue = normalizeStrengthValue(
        getSessionValue(dayId, exerciseId, dateKey),
        { type: 'strength', target: '' }
    );
    while (exValue.reps.length <= index) exValue.reps.push('');
    exValue.reps[index] = value;
    session.values[exerciseId] = exValue;
    saveApp();
}

function addStrengthSet(dayId, exerciseId, dateKey = getDateKey()) {
    if (!(canEditToday() || isWeightEntryMode(dayId))) return;

    const session = getSession(dayId, dateKey);
    const exValue = normalizeStrengthValue(
        getSessionValue(dayId, exerciseId, dateKey),
        {
            type: 'strength',
            target: ''
        }
    );

    exValue.reps.push('');
    session.values[exerciseId] = exValue;

    saveApp();
    render();
}

function removeStrengthSet(dayId, exerciseId, index, dateKey = getDateKey()) {
    if (!(canEditToday() || isWeightEntryMode(dayId))) return;

    const session = getSession(dayId, dateKey);
    const exValue = normalizeStrengthValue(
        getSessionValue(dayId, exerciseId, dateKey),
        {
            type: 'strength',
            target: ''
        }
    );

    if (exValue.reps.length <= 1) return;

    exValue.reps.splice(index, 1);
    session.values[exerciseId] = exValue;

    saveApp();
    render();
}

function setSessionCheck(dayId, checkId, value, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    session.checks[checkId] = value;
    saveApp();
}

function getSessionCheck(dayId, checkId, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    return !!session.checks[checkId];
}

function addExercise(dayId, sectionId, exerciseData) {
    const day = getActiveProgram()[dayId];

    if (!day) return false;

    const section = day.sections.find(
        sectionItem => sectionItem.id === sectionId
    );

    if (!section) return false;

    section.exercises = section.exercises || [];

    section.exercises.push({
        id: exerciseData.id || generateId('exercise'),
        name: exerciseData.name || 'New Exercise',
        target: exerciseData.target || '',
        type: exerciseData.type || 'strength',
        enabled: true
    });

    saveApp();
    render();

    return true;
}

function addExerciseToTodaySnapshot(sectionId, exerciseData) {
    if (!canEditToday()) {
        showToast('Start today before adding exercises.');
        return false;
    }

    const session = getTodaySession();

    if (!session.workoutSnapshot) {
        session.workoutSnapshot = getEffectiveWorkoutForToday();
    }

    const section = session.workoutSnapshot.sections
        .find(sectionItem => sectionItem.id === sectionId);

    if (!section) {
        showToast('Section not found.');
        return false;
    }

    section.exercises = section.exercises || [];

    section.exercises.push({
        id: exerciseData.id || generateId('today-exercise'),
        name: exerciseData.name || 'New Exercise',
        target: exerciseData.target || '',
        type: exerciseData.type || 'strength',
        enabled: true,
        todayOnly: true
    });

    saveApp();
    render();

    return true;
}

function findWorkoutExercise(dayOrWorkout, sectionId, exerciseId) {
    if (!dayOrWorkout || !dayOrWorkout.sections) return null;

    const section = dayOrWorkout.sections.find(
        sectionItem => sectionItem.id === sectionId
    );

    if (!section || !section.exercises) return null;

    const exerciseItem = section.exercises.find(
        exerciseItem => exerciseItem.id === exerciseId
    );

    if (!exerciseItem) return null;

    return {
        section,
        exercise: exerciseItem
    };
}

function getEditableWorkout(dayId) {
    if (dayId === getTodayKey() && canEditToday()) {
        const session = getTodaySession();
        return session.workoutSnapshot;
    }

    return null;
}

function removeExercise(dayId, sectionId, exerciseId) {
    const workout = getEditableWorkout(dayId);

    if (!workout) {
        showToast('Only today\'s active workout can be edited here.');
        return false;
    }

    const found = findWorkoutExercise(
        workout,
        sectionId,
        exerciseId
    );

    if (!found) return false;

    found.section.exercises =
        found.section.exercises.filter(
            item => item.id !== exerciseId
        );

    saveApp();
    render();

    return true;
}

function moveExercise(dayId, sectionId, exerciseId, direction) {
    const workout = getEditableWorkout(dayId);

    if (!workout) {
        showToast('Only today\'s active workout can be edited here.');
        return false;
    }

    const found = findWorkoutExercise(
        workout,
        sectionId,
        exerciseId
    );

    if (!found) return false;

    const exercises = found.section.exercises;
    const index = exercises.findIndex(
        item => item.id === exerciseId
    );

    const newIndex =
        direction === 'up'
            ? index - 1
            : index + 1;

    if (
        index < 0 ||
        newIndex < 0 ||
        newIndex >= exercises.length
    ) {
        return false;
    }

    [exercises[index], exercises[newIndex]] =
        [exercises[newIndex], exercises[index]];

    saveApp();
    render();

    return true;
}

function editExercise(dayId, sectionId, exerciseId) {
    const workout = getEditableWorkout(dayId);

    if (!workout) {
        showToast('Only today\'s active workout can be edited here.');
        return;
    }

    const found = findWorkoutExercise(workout, sectionId, exerciseId);
    if (!found) return;

    openExerciseEditorModal({
        title: 'Edit Today\'s Exercise',
        exercise: found.exercise,
        onSave: values => {
            found.exercise.name = values.name;
            found.exercise.target = values.target;
            found.exercise.type = values.type;
            saveApp();
            render();
            showToast('Today\'s exercise updated');
        }
    });
}

function openExerciseEditorModal({ title, exercise, onSave }) {
    closeMenus();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="large-modal editor-modal">
            <div class="modal-header">
                <div>
                    <h2>${escapeHtml(title)}</h2>
                    <p class="modal-description">Update the exercise details below.</p>
                </div>
                <button type="button" class="modal-close" aria-label="Close">×</button>
            </div>

            <form class="modal-form" id="exercise-editor-form">
                <div class="modal-field">
                    <label for="editor-exercise-name">Exercise name</label>
                    <input id="editor-exercise-name" name="name" type="text" value="${escapeHtml(exercise.name || '')}" autocomplete="off" required>
                </div>
                <div class="modal-field">
                    <label for="editor-exercise-target">Target / instruction</label>
                    <input id="editor-exercise-target" name="target" type="text" value="${escapeHtml(exercise.target || '')}" autocomplete="off" placeholder="e.g. 3 × 10–12">
                </div>
                <div class="modal-field">
                    <label for="editor-exercise-type">Tracking type</label>
                    <select id="editor-exercise-type" name="type">
                        <option value="strength" ${exercise.type === 'strength' ? 'selected' : ''}>Weight + reps</option>
                        <option value="measurement" ${exercise.type === 'measurement' ? 'selected' : ''}>Measurement</option>
                        <option value="timed" ${exercise.type === 'timed' ? 'selected' : ''}>Time / duration</option>
                        <option value="running" ${exercise.type === 'running' ? 'selected' : ''}>Running</option>
                        <option value="custom" ${exercise.type === 'custom' ? 'selected' : ''}>Custom</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="secondary-button" data-modal-cancel>Cancel</button>
                    <button type="submit" class="primary-button">Save Changes</button>
                </div>
            </form>
        </div>`;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelector('[data-modal-cancel]').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    overlay.querySelector('#exercise-editor-form').addEventListener('submit', event => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = {
            name: form.elements.name.value.trim(),
            target: form.elements.target.value.trim(),
            type: form.elements.type.value
        };
        if (!values.name) return;
        onSave(values);
        close();
    });

    setTimeout(() => overlay.querySelector('#editor-exercise-name')?.focus(), 0);
}

function isWorkoutEditMode(dayId = appState.currentDay) {
    return Boolean(
        appState.settings.editingWorkout &&
        appState.settings.workoutDraftDayId === dayId &&
        appState.settings.workoutDraft
    );
}

function getWorkoutDraft() {
    return isWorkoutEditMode()
        ? appState.settings.workoutDraft
        : null;
}


function isWeightEntryMode(dayId = appState.currentDay) {
    return Boolean(
        appState.settings.weightEntryMode &&
        appState.settings.weightEntryDayId === dayId &&
        appState.settings.weightEntryDateKey
    );
}

function getWeightEntryDateKey(dayId = appState.currentDay) {
    if (isWeightEntryMode(dayId)) return appState.settings.weightEntryDateKey;
    return dayId === getTodayKey()
        ? getDateKey()
        : getReferenceDateKeyForDayId(dayId);
}

function enterWeightEntryMode(dayId = appState.currentDay) {
    if (!isWorkoutEditMode(dayId)) {
        showToast('Open Edit Workout first.');
        return;
    }

    const defaultDate = getWeightEntryDateKey(dayId);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="large-modal editor-modal">
            <div class="modal-header">
                <div>
                    <h2>Add Weights / Reps</h2>
                    <p class="modal-description">Enter saved exercise data for this ${escapeHtml(getActiveProgram()[dayId]?.name || dayId)} occurrence without starting or completing the workout.</p>
                </div>
                <button type="button" class="modal-close" aria-label="Close">×</button>
            </div>
            <form class="modal-form" id="weight-entry-form">
                <div class="modal-field">
                    <label for="weight-entry-date">Workout date</label>
                    <input id="weight-entry-date" name="date" type="date" value="${escapeHtml(defaultDate)}" max="${escapeHtml(getDateKey())}" required>
                    <p class="input-hint">The selected date should match this day of the week. This only saves exercise values and does not change the workout status.</p>
                </div>
                <div class="modal-actions">
                    <button type="button" class="secondary-button" data-modal-cancel>Cancel</button>
                    <button type="submit" class="primary-button">Enter Weights</button>
                </div>
            </form>
        </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelector('[data-modal-cancel]').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });

    overlay.querySelector('#weight-entry-form').addEventListener('submit', event => {
        event.preventDefault();
        const dateKey = event.currentTarget.elements.date.value;
        const date = parseDateKey(dateKey);
        if (date > parseDateKey(getDateKey())) {
            showToast('Choose today or a past date.');
            return;
        }
        if (getDayIdForDate(date) !== dayId) {
            showToast(`Choose a ${getActiveProgram()[dayId]?.name || dayId}.`);
            return;
        }

        const session = getSession(dayId, dateKey);
        if (!session.started && !session.completed && !session.missed && !session.incomplete && dateKey < getDateKey()) {
            // Historical data entry deliberately preserves the workout as missed rather than
            // converting it into a completed/started session.
            session.missed = true;
            session.missedAt = new Date(`${dateKey}T23:59:59`).toISOString();
        }

        appState.settings.weightEntryMode = true;
        appState.settings.weightEntryDayId = dayId;
        appState.settings.weightEntryDateKey = dateKey;
        appState.settings.weightEntryBackupValues = deepClone(session.values || {});
        saveApp();
        close();
        render();
        showToast(`Entering saved values for ${formatDate(dateKey)}`);
    });
}

function exitWeightEntryMode() {
    const dayId = appState.settings.weightEntryDayId;
    const dateKey = appState.settings.weightEntryDateKey;
    if (!dayId || !dateKey) {
        appState.settings.weightEntryMode = false;
        appState.settings.weightEntryBackupValues = null;
        saveApp(); render(); return;
    }
    const session = getSession(dayId, dateKey);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="action-sheet exercise-save-sheet"><div class="action-sheet-title">Save added workout data?</div><p class="modal-description">You changed saved weight/reps for this day. Keep the changes, discard them, or continue editing.</p><button data-keep class="primary-action">✓ Keep Changes</button><button data-discard>↩ Discard Changes</button><button data-cancel class="cancel-action">Keep Editing</button></div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('[data-keep]').addEventListener('click', () => {
        appState.settings.weightEntryMode = false;
        appState.settings.weightEntryDayId = null;
        appState.settings.weightEntryDateKey = null;
        appState.settings.weightEntryBackupValues = null;
        saveApp(); close(); render(); showToast('Added workout data saved');
    });
    overlay.querySelector('[data-discard]').addEventListener('click', () => {
        session.values = deepClone(appState.settings.weightEntryBackupValues || {});
        appState.settings.weightEntryMode = false;
        appState.settings.weightEntryDayId = null;
        appState.settings.weightEntryDateKey = null;
        appState.settings.weightEntryBackupValues = null;
        saveApp(); close(); render(); showToast('Added workout changes discarded');
    });
    overlay.querySelector('[data-cancel]').addEventListener('click', close);
}

function enterWorkoutEditMode(dayId = appState.currentDay) {
    const day = getActiveProgram()[dayId];
    if (!day) return;

    const existingSession = getSession(
        dayId,
        dayId === getTodayKey() ? getDateKey() : getDateKeyForDayId(dayId)
    );

    const source = existingSession.workoutSnapshot || getViewWorkout(dayId) || day;

    appState.settings.editingWorkout = true;
    appState.settings.workoutDraftDayId = dayId;
    appState.settings.workoutDraft = deepClone(source);

    saveApp();
    render();
    showToast('Workout editor opened');
}

function cancelWorkoutEdit() {
    appState.settings.weightEntryMode = false;
    appState.settings.weightEntryDayId = null;
    appState.settings.weightEntryDateKey = null;
    appState.settings.editingWorkout = false;
    appState.settings.workoutDraft = null;
    appState.settings.workoutDraftDayId = null;
    saveApp();
    render();
}

function ensureDraftDay() {
    return isWorkoutEditMode() ? appState.settings.workoutDraft : null;
}

function addExerciseToDraft(sectionId, exerciseData) {
    const draft = ensureDraftDay();
    if (!draft) return false;

    const section = (draft.sections || []).find(item => item.id === sectionId);
    if (!section) return false;

    section.exercises = section.exercises || [];
    section.exercises.push({
        id: exerciseData.id || generateId('exercise'),
        name: exerciseData.name || 'New Exercise',
        target: exerciseData.target || '',
        type: exerciseData.type || 'strength',
        enabled: true
    });
    return true;
}

function removeExerciseFromDraft(sectionId, exerciseId) {
    const draft = ensureDraftDay();
    if (!draft) return false;
    const section = (draft.sections || []).find(item => item.id === sectionId);
    if (!section) return false;
    section.exercises = (section.exercises || []).filter(item => item.id !== exerciseId);
    return true;
}

function moveExerciseInDraft(sectionId, exerciseId, direction) {
    const draft = ensureDraftDay();
    if (!draft) return false;
    const section = (draft.sections || []).find(item => item.id === sectionId);
    if (!section) return false;
    const items = section.exercises || [];
    const index = items.findIndex(item => item.id === exerciseId);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || newIndex < 0 || newIndex >= items.length) return false;
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    return true;
}

function moveSectionInDraft(sectionId, direction) {
    const draft = ensureDraftDay();
    if (!draft) return false;
    const sections = draft.sections || [];
    const index = sections.findIndex(item => item.id === sectionId);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || newIndex < 0 || newIndex >= sections.length) return false;
    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    return true;
}

function addSectionToDraft() {
    const draft = ensureDraftDay();
    if (!draft) return false;
    draft.sections = draft.sections || [];
    draft.sections.push({
        id: generateId('section'),
        name: 'New Section',
        exercises: []
    });
    return true;
}

function deleteSectionFromDraft(sectionId) {
    const draft = ensureDraftDay();
    if (!draft) return false;
    draft.sections = (draft.sections || []).filter(item => item.id !== sectionId);
    return true;
}

function openExerciseEditorForDraft(sectionId, exercise = null) {
    const draft = ensureDraftDay();
    if (!draft) return;

    const base = exercise || {
        name: '',
        target: '3 × 10–12',
        type: 'strength'
    };

    openExerciseEditorModal({
        title: exercise ? 'Edit Exercise' : 'Add Exercise',
        exercise: base,
        onSave: values => {
            if (exercise) {
                exercise.name = values.name;
                exercise.target = values.target;
                exercise.type = values.type;
            } else {
                addExerciseToDraft(sectionId, values);
            }
            saveApp();
            render();
            showToast(exercise ? 'Exercise updated' : 'Exercise added');
        }
    });
}

function openSectionEditorForDraft(section) {
    openSectionEditorModal({
        title: 'Edit Section',
        section,
        allowReorder: true,
        onSave: () => {
            saveApp();
            render();
            showToast('Section updated');
        }
    });
}

function openAddSectionEditor() {
    const draft = ensureDraftDay();
    if (!draft) return;
    openSectionEditorModal({
        title: 'Add Section',
        section: { name: '', exercises: [] },
        allowReorder: false,
        onSave: values => {
            draft.sections = draft.sections || [];
            draft.sections.push({
                id: generateId('section'),
                name: values.name,
                exercises: []
            });
            saveApp();
            render();
            showToast('Section added');
        }
    });
}

function openSectionEditorModal({ title, section, allowReorder = true, onSave }) {
    closeMenus();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const buildRows = () => (allowReorder ? (section.exercises || []).map((ex, index) => `
        <div class="reorder-row">
            <span>${escapeHtml(ex.name)}</span>
            <div class="reorder-actions">
                <button type="button" class="small-button" data-move="up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button type="button" class="small-button" data-move="down" data-index="${index}" ${(section.exercises || []).length - 1 === index ? 'disabled' : ''}>↓</button>
            </div>
        </div>`).join('') : '');

    const renderModal = () => {
        overlay.innerHTML = `
            <div class="large-modal editor-modal">
                <div class="modal-header">
                    <div>
                        <h2>${escapeHtml(title)}</h2>
                        <p class="modal-description">${allowReorder ? 'Rename the section and reorder its exercises.' : 'Create a new section for this workout.'}</p>
                    </div>
                    <button type="button" class="modal-close" aria-label="Close">×</button>
                </div>
                <form class="modal-form" id="section-editor-form">
                    <div class="modal-field">
                        <label for="editor-section-name">Section name</label>
                        <input id="editor-section-name" name="name" type="text" value="${escapeHtml(section.name || '')}" autocomplete="off" required>
                    </div>
                    ${allowReorder ? `
                        <div class="modal-subheading">Exercises in this section</div>
                        <div class="reorder-list">${buildRows() || '<div class="empty-state">No exercises yet.</div>'}</div>` : ''}
                    <div class="modal-actions">
                        <button type="button" class="secondary-button" data-modal-cancel>Cancel</button>
                        <button type="submit" class="primary-button">Save Changes</button>
                    </div>
                </form>
            </div>`;

        const close = () => overlay.remove();
        overlay.querySelector('.modal-close').addEventListener('click', close);
        overlay.querySelector('[data-modal-cancel]').addEventListener('click', close);
        overlay.querySelectorAll('[data-move]').forEach(button => {
            button.addEventListener('click', () => {
                const index = Number(button.dataset.index);
                const direction = button.dataset.move;
                const items = section.exercises || [];
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                if (newIndex < 0 || newIndex >= items.length) return;
                [items[index], items[newIndex]] = [items[newIndex], items[index]];
                renderModal();
            });
        });
        overlay.querySelector('#section-editor-form').addEventListener('submit', event => {
            event.preventDefault();
            const name = event.currentTarget.elements.name.value.trim();
            if (!name) return;
            section.name = name;
            onSave({ name });
            close();
        });
        setTimeout(() => overlay.querySelector('#editor-section-name')?.focus(), 0);
    };

    document.body.appendChild(overlay);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) overlay.remove();
    });
    renderModal();
}


/* =========================================================
   VERSION 3.5 — DASHBOARD / PROGRAM MANAGEMENT
   ========================================================= */

function getActiveProgram() {
    return appState.settings.programViewSlot === 'secondary' && appState.settings.secondaryProgram
        ? appState.settings.secondaryProgram.days
        : appState.program;
}

function getActiveProgramName() {
    return appState.settings.programViewSlot === 'secondary' && appState.settings.secondaryProgram
        ? appState.settings.secondaryProgram.name
        : getProgramName();
}

function programSessionKey(dayId, dateKey) {
    const slot = appState.settings.programViewSlot === 'secondary' ? 'secondary' : 'current';
    return slot === 'secondary' ? `secondary_${dateKey}_${dayId}` : `${dateKey}_${dayId}`;
}

function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function getProgramName() {
    return appState.settings.currentProgramName || 'Current Program';
}

function getWeekProgress() {
    const sessions = getWeekSessions(getWeekStartDateKey());
    return {
        completed: sessions.filter(s => s.completed).length,
        started: sessions.filter(s => s.started).length,
        total: sessions.length
    };
}

function buildProgramTemplate() {
    return `Create a GymEssentials workout program for me. I will paste your answer into the GymEssentials app.\n\nIMPORTANT: Return ONLY valid JSON. Do not wrap it in markdown or add explanations outside the JSON.\n\nHow to make my program (simple instructions):\n1. Tell ChatGPT your goal (for example: build muscle, get stronger, lose fat, improve running, general fitness, or a combination).\n2. Tell ChatGPT how many days per week you can train and which days you prefer.\n3. Tell ChatGPT what equipment you have and any exercises you cannot or do not want to do.\n4. Tell ChatGPT your experience level and roughly how long each workout should take.\n5. Tell ChatGPT anything else that matters, such as home vs gym, cardio preferences, or exercises you want included.\n6. Ask ChatGPT to use the GymEssentials JSON format below.\n7. Copy the JSON ChatGPT gives you and paste it into the Program JSON box in GymEssentials.\n8. GymEssentials will keep your workout history separate from the new program.\n\nExample request to ChatGPT: “Make me a 4-day beginner strength program using the GymEssentials format. I have dumbbells and machines, want 45-minute workouts, and want two cardio days.”\n\nJSON rules:\n- Keep day keys as monday, tuesday, wednesday, thursday, friday, saturday, sunday.\n- Each day needs: id, name, shortName, icon, title, subtitle, type, sections.\n- Each section needs: id, name, exercises (or type: checks with checks).\n- Each exercise needs: id, name, target, type. type can be strength, running, measurement, timed, or custom.\n- Do not include session history, completed status, or user data.\n\nTemplate:\n${JSON.stringify({name:'My Program', days:deepClone(appState.program)}, null, 2)}`;
}

function normalizeImportedProgram(raw) {
    const source = raw?.days || raw?.program || raw;
    if (!source || typeof source !== 'object') return null;
    const days = {};
    Object.keys(source).forEach(dayId => {
        const day = source[dayId];
        if (!day || !Array.isArray(day.sections)) return;
        days[dayId] = deepClone(day);
        days[dayId].id = dayId;
        days[dayId].name = days[dayId].name || dayId;
        days[dayId].shortName = days[dayId].shortName || dayId.slice(0,3).toUpperCase();
        days[dayId].icon = days[dayId].icon || '🏋️';
        days[dayId].sections.forEach(section => {
            section.id = section.id || generateId('section');
            section.exercises = section.exercises || [];
            section.exercises.forEach(ex => {
                ex.id = ex.id || generateId('exercise');
                ex.enabled = ex.enabled !== false;
            });
        });
    });
    return Object.keys(days).length ? days : null;
}

function openProgramCreator() {
    closeMenus();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="large-modal program-modal">
            <div class="modal-header">
                <div><h2>Create / Import Program</h2><p class="modal-description">Use the template with ChatGPT, then paste the JSON back here. Your existing history stays intact.</p></div>
                <button type="button" class="modal-close">×</button>
            </div>
            <form id="program-create-form" class="modal-form">
                <div class="modal-field"><label for="program-name">Program name</label><input id="program-name" required value="New Program" placeholder="e.g. 12-Week Strength Plan"></div>
                <div class="program-template-actions"><button type="button" class="secondary-button" id="copy-program-template">Copy ChatGPT Template</button><button type="button" class="secondary-button" id="load-program-template">Load Template</button></div>
                <div class="modal-field"><label for="program-json">Program JSON</label><textarea id="program-json" rows="14" placeholder="Paste the JSON generated by ChatGPT here..."></textarea></div>
                <div class="modal-actions"><button type="button" class="secondary-button" data-cancel>Cancel</button><button type="button" class="secondary-button" id="add-future-program-from-creator">Add Future Program</button><button type="submit" class="primary-button">Start New Program</button></div>
            </form>
        </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelector('[data-cancel]').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#copy-program-template').addEventListener('click', async () => {
        const text = buildProgramTemplate();
        try { await navigator.clipboard.writeText(text); showToast('ChatGPT template copied'); }
        catch { overlay.querySelector('#program-json').value = text; showToast('Template loaded below'); }
    });
    overlay.querySelector('#load-program-template').addEventListener('click', () => {
        const template = { name: 'My Program', days: deepClone(appState.program) };
        overlay.querySelector('#program-name').value = template.name;
        overlay.querySelector('#program-json').value = JSON.stringify(template, null, 2);
    });
    overlay.querySelector('#add-future-program-from-creator').addEventListener('click', () => {
        let parsed;
        try { parsed = JSON.parse(overlay.querySelector('#program-json').value); }
        catch { showToast('Add the program JSON first, then choose Add Future Program.'); return; }
        const days = normalizeImportedProgram(parsed);
        if (!days) { showToast('No valid workout days were found.'); return; }
        const name = overlay.querySelector('#program-name').value.trim() || parsed.name || 'Future Program';
        openConfirmModal({ title:'Save as a Future Program?', message:`${name} will be saved for later. Your Current Program will not be archived or changed now.`, confirmText:'Add Future Program', onConfirm:()=>{
            appState.settings.futureProgram={id:generateId('future'),name,days,createdAt:new Date().toISOString()};
            appState.settings.programViewSlot='current'; saveApp(); render(); showToast(`${name} saved as a Future Program`);
        }});
        close();
    });
    overlay.querySelector('#program-create-form').addEventListener('submit', e => {
        e.preventDefault();
        let parsed;
        try { parsed = JSON.parse(overlay.querySelector('#program-json').value); }
        catch { showToast('The program JSON is not valid.'); return; }
        const days = normalizeImportedProgram(parsed);
        if (!days) { showToast('No valid workout days were found.'); return; }
        const name = overlay.querySelector('#program-name').value.trim() || parsed.name || 'New Program';
        openConfirmModal({
            title: 'Start a new program?',
            message: 'Your current program will be archived automatically before the new program becomes active. All existing workout history remains preserved.',
            confirmText: 'Start New Program',
            onConfirm: () => {
                archiveCurrentProgram(false);
                appState.program = days;
                appState.settings.currentProgramName = name;
                appState.settings.activeProgramId = 'current'; appState.settings.currentProgramId = generateId('program');
                appState.settings.activeView = 'dashboard';
                saveApp(); render(); showToast(`${name} is now active`);
            }
        });
        close();
    });
}

function archiveCurrentProgram(showMessage = true) {
    const snapshot = {
        id: generateId('program'),
        name: getProgramName(),
        archivedAt: new Date().toISOString(),
        days: deepClone(appState.program)
    };
    appState.settings.programLibrary = Array.isArray(appState.settings.programLibrary) ? appState.settings.programLibrary : [];
    appState.settings.programLibrary.unshift(snapshot);
    if (showMessage) { saveApp(); render(); showToast('Current program archived. History was preserved.'); }
    return snapshot;
}

function restoreArchivedProgram(id) {
    const archived = (appState.settings.programLibrary || []).find(p => p.id === id);
    if (!archived) return;
    openConfirmModal({
        title: 'Restore this program?',
        message: 'The current program will be archived first. Workout history will not be deleted.',
        confirmText: 'Restore Program',
        onConfirm: () => {
            archiveCurrentProgram(false);
            appState.program = deepClone(archived.days);
            appState.settings.currentProgramName = archived.name;
            appState.settings.activeProgramId = 'current';
            saveApp(); render(); showToast(`${archived.name} restored`);
        }
    });
}

function openProgramNameEditor(slot) {
    const isCurrent = slot === 'current';
    const program = isCurrent ? {name:getProgramName()} : appState.settings[slot === 'secondary' ? 'secondaryProgram' : 'futureProgram'];
    if (!program) { showToast(`No ${slot} program to rename.`); return; }
    const overlay=document.createElement('div'); overlay.className='modal-overlay';
    overlay.innerHTML=`<div class="large-modal program-modal"><div class="modal-header"><div><h2>Rename ${slot === 'current' ? 'Current' : slot === 'secondary' ? 'Secondary' : 'Future'} Program</h2><p class="modal-description">Choose a name that helps you recognize this program.</p></div><button type="button" class="modal-close">×</button></div><div class="modal-field"><label for="program-name-edit">Program name</label><input id="program-name-edit" maxlength="80" value="${escapeHtml(program.name || '')}"></div><div class="modal-actions"><button type="button" class="secondary-button" data-cancel>Cancel</button><button type="button" class="primary-button" data-save>Save Name</button></div></div>`;
    document.body.appendChild(overlay); const close=()=>overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click',close); overlay.querySelector('[data-cancel]').addEventListener('click',close);
    overlay.querySelector('[data-save]').addEventListener('click',()=>{const name=overlay.querySelector('#program-name-edit').value.trim();if(!name){showToast('Enter a program name.');return;}if(isCurrent)appState.settings.currentProgramName=name;else program.name=name;saveApp();close();render();showToast('Program name updated');});
    overlay.addEventListener('click',e=>{if(e.target===overlay)close();}); setTimeout(()=>overlay.querySelector('#program-name-edit')?.focus(),0);
}

function renderDashboard(container) {
    const progress = getWeekProgress();
    const today = getTodaySession();
    const currentProgram = appState.program;
    const secondary = appState.settings.secondaryProgram;
    const future = appState.settings.futureProgram;
    const archived = appState.settings.programLibrary || [];
    const dashboard = document.createElement('section');
    dashboard.className = 'dashboard-view';
    dashboard.innerHTML = `
        <div class="dashboard-hero">
            <div><span class="dashboard-eyebrow">GYMESSENTIALS</span><h2>Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}.</h2><p>${escapeHtml(getProgramName())} is your active program.</p></div>
            <div class="dashboard-hero-icon">💪</div>
        </div>
        <div class="dashboard-update-note"><div><strong>GymEssentials has been updated.</strong><span>Version ${APP_VERSION} includes useful improvements and safer program management.</span></div><button type="button" class="secondary-button" id="dashboard-notable-changes">Notable Changes</button></div>
        <div class="dashboard-grid">
            <div class="dashboard-stat"><span>Completed this week</span><strong>${progress.completed}/${progress.total}</strong></div>
            <div class="dashboard-stat"><span>Current streak</span><strong>${getCurrentStreak()} day${getCurrentStreak() === 1 ? '' : 's'}</strong></div>
            <div class="dashboard-stat"><span>Today</span><strong>${today.completed ? 'Done' : today.partial ? 'Showed Up' : today.started ? 'Active' : 'Ready'}</strong></div>
            <div class="dashboard-stat"><span>Archived programs</span><strong>${archived.length}</strong></div>
        </div>
        <div class="dashboard-card dashboard-today-card">
            <div><span class="dashboard-card-label">TODAY</span><h3>${currentProgram[getTodayKey()]?.icon || '📅'} ${escapeHtml(currentProgram[getTodayKey()]?.name || 'Today')}</h3><p>${escapeHtml(currentProgram[getTodayKey()]?.title || '')} • ${escapeHtml(currentProgram[getTodayKey()]?.subtitle || '')}</p>${today.startedAt ? `<small class="dashboard-time">Started ${formatTime(today.startedAt)}${today.completedAt ? ` • Completed ${formatTime(today.completedAt)}` : ''}</small>` : ''}</div>
            <button type="button" class="primary-button" id="dashboard-today">${today.completed || today.partial ? 'View Workout' : today.started ? 'Continue Workout' : 'Start Workout'}</button>
        </div>
        <div class="dashboard-card">
            <div class="dashboard-card-header"><div><span class="dashboard-card-label">CURRENT PROGRAM</span><h3>${escapeHtml(getProgramName())}</h3><p>Your main program. Secondary and Future programs can coexist with it.</p></div></div>
            <div class="dashboard-actions dashboard-current-actions"><button type="button" class="primary-button" id="dashboard-current">Open Current Program</button><button type="button" class="secondary-button" id="dashboard-current-options">Program Options</button></div>
            <div id="current-program-submenu" class="dashboard-submenu hidden">
                <button type="button" class="secondary-button" id="dashboard-current-rename">Rename Program</button>
                <button type="button" class="secondary-button" id="dashboard-week-start">Start Week On: ${escapeHtml((appState.settings.weekStartDay || 'monday').replace(/^./, c => c.toUpperCase()))}</button>
                <button type="button" class="danger-button" id="dashboard-archive">Archive Program</button>
            </div>
        </div>
        <div class="dashboard-card">
            <div class="dashboard-card-header"><div><span class="dashboard-card-label">SECONDARY PROGRAM</span><h3>${secondary ? escapeHtml(secondary.name) : 'No secondary program'}</h3><p>${secondary ? 'Use this alongside your Current Program without archiving it.' : 'Add an optional second program for concurrent training.'}</p></div></div>
            <div class="dashboard-actions"><button type="button" class="secondary-button" id="dashboard-secondary-open" ${secondary ? '' : 'disabled'}>${secondary ? 'Open Secondary' : 'No Secondary Yet'}</button>${secondary ? '<button type="button" class="secondary-button" id="dashboard-secondary-options">Program Options</button>' : ''}<button type="button" class="primary-button" id="dashboard-secondary-add">${secondary ? 'Replace Secondary' : '＋ Add Secondary'}</button></div>
            ${secondary ? `<div id="secondary-program-submenu" class="dashboard-submenu hidden"><button type="button" class="secondary-button" id="dashboard-secondary-rename">Rename Program</button><button type="button" class="danger-button" id="dashboard-secondary-remove">Remove Secondary</button></div>` : ''}
            <div class="program-slot-note">${future ? `Future program: <strong>${escapeHtml(future.name)}</strong>` : 'No future program scheduled.'}</div>
            <div class="dashboard-actions">${future ? `<button type="button" class="secondary-button" id="dashboard-future-options">Future Program Options</button><button type="button" class="primary-button future-program-button" id="dashboard-secondary-future">Activate ${escapeHtml(future.name)}</button>` : '<button type="button" class="secondary-button future-program-button" id="dashboard-secondary-future">＋ Add Future Program</button>'}</div>
            ${future ? `<div id="future-program-submenu" class="dashboard-submenu hidden"><button type="button" class="secondary-button" id="dashboard-future-rename">Rename Future Program</button></div>` : ''}
        </div>
        <div class="dashboard-card">
            <div class="dashboard-card-header"><div><span class="dashboard-card-label">NEW PROGRAM</span><h3>Start something new</h3><p>Create a full program yourself, build a simple 7-day starter, or use ChatGPT.</p></div></div>
            <div class="dashboard-actions"><button type="button" class="primary-button" id="dashboard-new">＋ New Program</button><button type="button" class="secondary-button" id="dashboard-builder">Build 7-Day Program</button><button type="button" class="secondary-button" id="dashboard-chat-instructions">How to use ChatGPT</button></div>
        </div>
        ${archived.length ? `<div class="dashboard-card"><div class="dashboard-card-header"><div><span class="dashboard-card-label">ARCHIVED PROGRAMS</span><h3>Program history</h3></div></div><div class="archived-program-list">${archived.slice(0,8).map(p => `<div class="archived-program-row"><div><strong>${escapeHtml(p.name)}</strong><span>Archived ${escapeHtml(formatDate(p.archivedAt?.slice(0,10) || getDateKey()))}</span></div><button type="button" class="secondary-button" data-restore-program="${escapeHtml(p.id)}">Restore</button></div>`).join('')}</div></div>` : ''}
    `;
    const goToday = () => {
        appState.currentDay = getTodayKey();
        appState.settings.programViewSlot = 'current';
        appState.settings.activeView = 'day';
        saveApp(); render();
    };
    dashboard.querySelector('#dashboard-today').addEventListener('click', goToday);
    dashboard.querySelector('#dashboard-notable-changes').addEventListener('click', () => {
        const html = NOTABLE_CHANGES.map(group => `<div class="notable-version"><h3>${escapeHtml(group.version)} — ${escapeHtml(group.title)}</h3><ul class="notable-changes-list">${group.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`).join('');
        openSimpleInfoModal('Notable Changes', html);
    });
    dashboard.querySelector('#dashboard-current').addEventListener('click', () => { appState.settings.programViewSlot='current'; appState.currentDay=getTodayKey(); appState.settings.activeView='day'; saveApp(); render(); });
    dashboard.querySelector('#dashboard-current-options').addEventListener('click', () => dashboard.querySelector('#current-program-submenu').classList.toggle('hidden'));
    dashboard.querySelector('#dashboard-current-rename').addEventListener('click', () => openProgramNameEditor('current'));
    dashboard.querySelector('#dashboard-week-start').addEventListener('click', () => openWeekStartPicker());
    dashboard.querySelector('#dashboard-archive').addEventListener('click', () => openConfirmModal({ title:'Archive current program?', message:'The complete program will be saved in Program History. Workout and body-stat history will remain untouched.', confirmText:'Archive Program', onConfirm:() => archiveCurrentProgram(true) }));
    dashboard.querySelector('#dashboard-new').addEventListener('click', openProgramCreator);
    dashboard.querySelector('#dashboard-builder').addEventListener('click', openSevenDayBuilder);
    dashboard.querySelector('#dashboard-secondary-add').addEventListener('click', () => openProgramSlotCreator('secondary'));
    dashboard.querySelector('#dashboard-secondary-open')?.addEventListener('click', () => { appState.settings.programViewSlot='secondary'; appState.currentDay=getTodayKey(); appState.settings.activeView='day'; saveApp(); render(); });
    dashboard.querySelector('#dashboard-secondary-options')?.addEventListener('click', () => dashboard.querySelector('#secondary-program-submenu').classList.toggle('hidden'));
    dashboard.querySelector('#dashboard-secondary-rename')?.addEventListener('click', () => openProgramNameEditor('secondary'));
    dashboard.querySelector('#dashboard-secondary-remove')?.addEventListener('click', () => openConfirmModal({title:'Remove secondary program?',message:'This removes the secondary program from your active dashboard. Its workout history will remain stored.',confirmText:'Remove Secondary',onConfirm:()=>{appState.settings.secondaryProgram=null;appState.settings.programViewSlot='current';saveApp();render();}}));
    dashboard.querySelector('#dashboard-future-options')?.addEventListener('click', () => dashboard.querySelector('#future-program-submenu').classList.toggle('hidden'));
    dashboard.querySelector('#dashboard-future-rename')?.addEventListener('click', () => openProgramNameEditor('future'));
    dashboard.querySelector('#dashboard-secondary-future')?.addEventListener('click', () => {
        if (future) {
            openConfirmModal({title:'Activate future program?',message:`Activating “${future.name}” will archive your Current Program and make the Future Program your new Current Program. Your workout history will be preserved. Do you want to replace the Current Program?`,confirmText:'Yes, Replace Current Program',onConfirm:()=>{archiveCurrentProgram(false);appState.program=deepClone(future.days);appState.settings.currentProgramName=future.name;appState.settings.activeProgramId='current';appState.settings.currentProgramId=generateId('program');appState.settings.secondaryProgram=null;appState.settings.futureProgram=null;appState.settings.programViewSlot='current';saveApp();render();showToast(`${future.name} is now the Current Program`);}});
        } else openProgramSlotCreator('future');
    });
    dashboard.querySelector('#dashboard-chat-instructions').addEventListener('click', openChatGPTInstructions);
    dashboard.querySelectorAll('[data-restore-program]').forEach(btn => btn.addEventListener('click', () => restoreArchivedProgram(btn.dataset.restoreProgram)));
    container.appendChild(dashboard);
}

function openWeekStartPicker() {
    const names = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const overlay=document.createElement('div'); overlay.className='modal-overlay';
    overlay.innerHTML=`<div class="large-modal"><div class="modal-header"><div><h2>Choose Week Start Day</h2><p class="modal-description">This changes how GymEssentials groups your weekly progress. Your workout history is not changed.</p></div><button class="modal-close" type="button">×</button></div><div class="week-start-options">${names.map(day=>`<button type="button" class="secondary-button ${appState.settings.weekStartDay===day?'active':''}" data-week-start="${day}">${day[0].toUpperCase()+day.slice(1)}${appState.settings.weekStartDay===day?' ✓':''}</button>`).join('')}</div></div>`;
    document.body.appendChild(overlay); const close=()=>overlay.remove(); overlay.querySelector('.modal-close').addEventListener('click',close); overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    overlay.querySelectorAll('[data-week-start]').forEach(btn=>btn.addEventListener('click',()=>{appState.settings.weekStartDay=btn.dataset.weekStart; saveApp(); close(); render(); showToast(`Week now starts on ${btn.dataset.weekStart[0].toUpperCase()+btn.dataset.weekStart.slice(1)}`);}));
}

function openSevenDayBuilder() {
    const names=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const labels=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const overlay=document.createElement('div'); overlay.className='modal-overlay';
    overlay.innerHTML=`<div class="large-modal program-modal"><div class="modal-header"><div><h2>Build a 7-Day Program</h2><p class="modal-description">Start with a simple week. You can edit each day later using Edit Workout.</p></div><button class="modal-close" type="button">×</button></div><form id="seven-day-form" class="modal-form"><div class="modal-field"><label for="seven-day-name">Program name</label><input id="seven-day-name" value="My 7-Day Program" required></div><div class="seven-day-builder">${names.map((day,i)=>`<div class="seven-day-row"><div><strong>${labels[i]}</strong><span>Day ${i+1}</span></div><input data-seven-title="${day}" placeholder="Workout title (e.g. Upper Body)"><input data-seven-exercises="${day}" placeholder="Exercises separated by commas (optional)"></div>`).join('')}</div><div class="modal-actions"><button type="button" class="secondary-button" data-cancel>Cancel</button><button type="submit" class="primary-button">Create 7-Day Program</button></div></form></div>`;
    document.body.appendChild(overlay); const close=()=>overlay.remove(); overlay.querySelector('.modal-close').addEventListener('click',close); overlay.querySelector('[data-cancel]').addEventListener('click',close); overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    overlay.querySelector('#seven-day-form').addEventListener('submit',e=>{e.preventDefault(); const name=overlay.querySelector('#seven-day-name').value.trim()||'My 7-Day Program'; const days={}; names.forEach((day,i)=>{const title=overlay.querySelector(`[data-seven-title="${day}"]`).value.trim(); const exText=overlay.querySelector(`[data-seven-exercises="${day}"]`).value.trim(); const exercises=exText?exText.split(',').map((x,j)=>exercise(generateId('exercise'),x.trim(), '2 × 8–12','strength')).filter(x=>x.name):[]; days[day]={id:day,name:labels[i],shortName:labels[i].slice(0,3).toUpperCase(),icon:title?'🏋️':'🛌',title:title||'Rest / Recovery',subtitle:title?'Custom workout':'Easy recovery or rest',type:title?'strength':'recovery',sections:exercises.length?[{id:generateId('section'),name:'Main Workout',exercises}]:[{id:generateId('section'),name:'Workout',exercises:[]} ]};}); openConfirmModal({title:'Start this 7-day program?',message:'Your Current Program will be archived automatically. Your existing workout history will remain safe.',confirmText:'Start 7-Day Program',onConfirm:()=>{archiveCurrentProgram(false);appState.program=days;appState.settings.currentProgramName=name;appState.settings.activeProgramId='current';appState.settings.activeView='dashboard';appState.settings.programViewSlot='current';saveApp();render();showToast(`${name} is now active`);}}); close(); });
}

function openNotableChanges() {
    openSimpleInfoModal('Notable Changes', `<ul class="notable-changes-list"><li>Dashboard now has update notes and quick program controls.</li><li>Workout history can show when you started and finished each day.</li><li>Home is now separate from the weekday tabs.</li><li>You can run a Secondary Program alongside your Current Program.</li><li>You can prepare a Future Program for later activation.</li><li>ChatGPT program creation now includes simple step-by-step instructions.</li><li>View Log navigation and Add Weights saving are safer and clearer.</li></ul>`);
}

function openChatGPTInstructions() {
    openSimpleInfoModal('Making a Program with ChatGPT', `<div class="chatgpt-help"><p><strong>1. Start with your goal.</strong> Tell ChatGPT what you want: strength, muscle, running, general fitness, or a mix.</p><p><strong>2. Tell it your schedule.</strong> Say how many days you can train and which days work best.</p><p><strong>3. Tell it your equipment.</strong> Mention gym machines, barbells, dumbbells, home equipment, or no equipment.</p><p><strong>4. Tell it your experience.</strong> Beginner, intermediate, or advanced, plus how long you want each workout to take.</p><p><strong>5. Mention restrictions and preferences.</strong> Include exercises you like, dislike, or cannot perform.</p><p><strong>6. Ask for GymEssentials format.</strong> Use the Copy ChatGPT Program Template button so ChatGPT knows exactly what the app expects.</p><p><strong>7. Copy only the JSON answer.</strong> Paste it into the Program JSON box in GymEssentials.</p><p><strong>8. Review before starting.</strong> Make sure the days and exercises look sensible. GymEssentials will preserve your existing workout history.</p><div class="chatgpt-example"><strong>Example:</strong> “Make me a 4-day beginner strength plan using GymEssentials format. I have machines and dumbbells, want 45-minute workouts, and want two easy cardio days.”</div></div>`);
}

function openSimpleInfoModal(title, html) {
    const overlay=document.createElement('div'); overlay.className='modal-overlay';
    overlay.innerHTML=`<div class="large-modal"><div class="modal-header"><h2>${escapeHtml(title)}</h2><button type="button" class="modal-close">×</button></div><div class="modal-description info-modal-content">${html}</div><button type="button" class="secondary-button info-modal-close">Done</button></div>`;
    document.body.appendChild(overlay); const close=()=>overlay.remove(); overlay.querySelector('.modal-close').addEventListener('click',close); overlay.querySelector('.info-modal-close').addEventListener('click',close); overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
}

function openProgramSlotCreator(slot) {
    const overlay=document.createElement('div'); overlay.className='modal-overlay';
    overlay.innerHTML=`<div class="large-modal program-modal"><div class="modal-header"><div><h2>${slot==='future'?'Add Future Program':'Add Secondary Program'}</h2><p class="modal-description">Use ChatGPT to make a program, or paste an existing GymEssentials JSON program.</p></div><button type="button" class="modal-close">×</button></div><form id="slot-program-form" class="modal-form"><div class="modal-field"><label for="slot-program-name">Program name</label><input id="slot-program-name" required value="${slot==='future'?'Future Program':'Secondary Program'}"></div><div class="program-template-actions"><button type="button" class="secondary-button" id="slot-help">How to use ChatGPT</button><button type="button" class="secondary-button" id="slot-template">Copy Template</button></div><div class="modal-field"><label for="slot-program-json">Program JSON</label><textarea id="slot-program-json" rows="14" placeholder="Paste ChatGPT JSON here..."></textarea></div><div class="modal-actions"><button type="button" class="secondary-button" data-cancel>Cancel</button><button type="submit" class="primary-button">Save Program</button></div></form></div>`;
    document.body.appendChild(overlay); const close=()=>overlay.remove(); overlay.querySelector('.modal-close').addEventListener('click',close); overlay.querySelector('[data-cancel]').addEventListener('click',close); overlay.querySelector('#slot-help').addEventListener('click',openChatGPTInstructions); overlay.querySelector('#slot-template').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(buildProgramTemplate());showToast('Template copied');}catch{overlay.querySelector('#slot-program-json').value=buildProgramTemplate();}});
    overlay.querySelector('#slot-program-form').addEventListener('submit',e=>{e.preventDefault();let parsed;try{parsed=JSON.parse(overlay.querySelector('#slot-program-json').value);}catch{showToast('The program JSON is not valid.');return;}const days=normalizeImportedProgram(parsed);if(!days){showToast('No valid workout days were found.');return;}const name=overlay.querySelector('#slot-program-name').value.trim()||parsed.name||'Program';const payload={id:generateId(slot),name,days,createdAt:new Date().toISOString()};if(slot==='secondary'){appState.settings.secondaryProgram=payload;}else{appState.settings.futureProgram=payload;}appState.settings.programViewSlot='current';saveApp();close();render();showToast(`${name} saved as ${slot==='secondary'?'Secondary':'Future'} Program`);});
}

function getCurrentStreak() {
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 3700; i++) {
        const dateKey = getDateKey(cursor);
        const dayId = getDayIdForDate(cursor);
        const session = appState.sessions[programSessionKey(dayId, dateKey)];
        if (!session || !session.completed) break;
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

/* =========================================================
   RENDERING
   ========================================================= */

function render() {
    const app = document.getElementById('app');

    if (!app) {
        console.error('No #app element found in index.html');
        return;
    }

    app.innerHTML = '';
    applyTheme();

    renderHeader(app);

    renderDayNavigation(app);

    const content = document.createElement('main');
    content.className = 'app-content';

    if (appState.settings.activeView === 'log') {
        renderWeeklyLog(content);
    } else if (appState.settings.activeView === 'dashboard') {
        renderDashboard(content);
    } else {
        const scheduledDay = getActiveProgram()[appState.currentDay];
        if (scheduledDay) renderDay(scheduledDay, content);
    }

    app.appendChild(content);

    renderBottomNavigation(app);

    reconcileMissedDays();
    updateDocumentTitle();
}

function renderHeader(container) {
    const header = document.createElement('header');
    header.className = 'app-header';

    header.innerHTML = `
        <div class="header-top">
            <button
                class="icon-button"
                id="menuButton"
                aria-label="Open menu">
                ☰
            </button>

            <div class="header-title">
                <h1>GymEssentials</h1>
                <p>Strength • Running • Recovery</p>
            </div>

            <button
                class="icon-button"
                id="todayButton"
                aria-label="Go to today">
                📅
            </button>
        </div>
    `;

    container.appendChild(header);

    header
        .querySelector('#todayButton')
        .addEventListener('click', () => {
            appState.currentDay = getTodayKey();
            appState.settings.activeView = 'day';

            saveApp();
            render();
        });

    header
        .querySelector('#menuButton')
        .addEventListener('click', openDayMenu);
}

function renderDayNavigation(container) {
    const navigationWrap = document.createElement('div');
    navigationWrap.className = 'day-navigation-wrap';

    const nav = document.createElement('nav');
    nav.className = 'day-navigation';
    nav.setAttribute('aria-label', 'Workout navigation');

    const homeButton = document.createElement('button');
    homeButton.type = 'button';
    homeButton.className = `home-navigation-button ${appState.settings.activeView === 'dashboard' ? 'active' : ''}`;
    homeButton.innerHTML = '<span>⌂</span><strong>HOME</strong>';
    homeButton.addEventListener('click', () => { appState.settings.programViewSlot='current'; appState.settings.activeView = 'dashboard'; saveApp(); render(); });
    navigationWrap.appendChild(homeButton);

    Object.values(getActiveProgram()).forEach(day => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `day-tab ${
            day.id === appState.currentDay && appState.settings.activeView === 'day' ? 'active' : ''
        }`;

        const sessionDateKey = day.id === getTodayKey() ? getDateKey() : getReferenceDateKeyForDayId(day.id);
        const session = getSession(day.id, sessionDateKey);
        const status = session.completed
            ? '<span class="day-tab-status">✓</span>'
            : session.partial
                ? '<span class="day-tab-status partial">♥</span>'
                : session.incomplete
                ? '<span class="day-tab-status incomplete">~</span>'
                : session.missed
                    ? '<span class="day-tab-status missed">!</span>'
                    : '';

        button.innerHTML = `<span class="day-tab-icon">${day.icon}</span><span>${day.shortName}</span>${status}`;
        button.addEventListener('click', () => {
            appState.currentDay = day.id;
            appState.settings.activeView = 'day';
            saveApp();
            render();
        });
        nav.appendChild(button);
    });

    navigationWrap.appendChild(nav);

    const logButton = document.createElement('button');
    logButton.type = 'button';
    logButton.className = `log-navigation-button ${appState.settings.activeView === 'log' ? 'active' : ''}`;
    logButton.innerHTML = `<span>📈</span><strong>LOG</strong>`;
    logButton.addEventListener('click', () => {
        appState.settings.activeView = 'log';
        saveApp();
        render();
    });

    navigationWrap.appendChild(logButton);
    container.appendChild(navigationWrap);
}

function getViewWorkout(dayId) {
    const selectedDateKey = getReferenceDateKeyForDayId(dayId);
    const session = getSession(dayId, selectedDateKey);

    if (session.workoutSnapshot) return session.workoutSnapshot;
    if (session.replacementDayId && getActiveProgram()[session.replacementDayId]) {
        return getActiveProgram()[session.replacementDayId];
    }
    return getActiveProgram()[dayId];
}

function getViewMode(dayId) {
    if (dayId !== getTodayKey()) {
        return 'view-only';
    }

    const session = getTodaySession();

    if (session.completed) {
        return 'completed';
    }

    if (session.partial) {
        return 'partial';
    }

    if (session.started) {
        return 'active';
    }

    return 'not-started';
}

async function shareDayWorkoutImage(dayId, dateKey = getDateKey()) {
    const day = getActiveProgram()[dayId];
    const session = getSession(dayId, dateKey);
    if (!day) return;
    const workout = session.workoutSnapshot || getViewWorkout(dayId) || day;
    const canvas = document.createElement('canvas');
    const width = 1080;
    const lines = [];
    lines.push('GymEssentials');
    lines.push(`${day.icon || '📅'} ${day.name} • ${formatDate(dateKey)}`);
    lines.push(`${workout.title || ''}${workout.subtitle ? ` • ${workout.subtitle}` : ''}`);
    lines.push('');
    (workout.sections || []).forEach(section => {
        if (section.type === 'checks') return;
        lines.push(`— ${section.name} —`);
        (section.exercises || []).forEach(ex => {
            if (ex.enabled === false) return;
            const raw = getSessionValueForExercise(session, ex);
            let value = '';
            if (ex.type === 'strength') {
                const v = normalizeStrengthValue(raw, ex);
                value = `${v.weight || '—'} ${appState.settings.unitSystem === 'metric' ? 'kg' : 'lb'} • ${v.reps.filter(Boolean).join(' / ') || '—'} reps`;
            } else value = String(raw || '—');
            lines.push(`${ex.name}: ${value}`);
        });
        lines.push('');
    });
    if (session.weight || session.waist) lines.push(`Body: ${session.weight || '—'} lb • ${session.waist || '—'} in`);
    const lineHeight = 42;
    canvas.height = Math.max(720, 120 + lines.length * lineHeight);
    canvas.width = width;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, width, canvas.height);
    ctx.fillStyle = '#38bdf8'; ctx.font = '700 42px Arial'; ctx.fillText('GymEssentials', 60, 70);
    ctx.fillStyle = '#f8fafc'; ctx.font = '700 30px Arial';
    let y = 125;
    lines.slice(1).forEach((line, idx) => {
        ctx.fillStyle = line.startsWith('—') ? '#38bdf8' : '#f8fafc';
        ctx.font = line.startsWith('—') ? '700 25px Arial' : '500 24px Arial';
        const wrapped = String(line).match(/.{1,72}(?:\s|$)/g) || [line];
        wrapped.forEach(part => { ctx.fillText(part.trim(), 60, y); y += lineHeight; });
    });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) { showToast('Could not create workout image.'); return; }
    const file = new File([blob], `GymEssentials-${day.name}-${dateKey}.png`, { type: 'image/png' });
    try {
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
            await navigator.share({ title: `GymEssentials — ${day.name}`, text: `${day.name} workout • ${formatDate(dateKey)}`, files: [file] });
            return;
        }
    } catch (error) { if (error?.name === 'AbortError') return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Workout image created');
}

function renderDay(day, container) {
    const selectedDateKey = isWeightEntryMode(day.id) ? getWeightEntryDateKey(day.id) : (day.id === getTodayKey() ? getDateKey() : getReferenceDateKeyForDayId(day.id));
    const session = getSession(day.id, selectedDateKey);
    const editing = isWorkoutEditMode(day.id);
    const workout = editing ? getWorkoutDraft() : (getViewWorkout(day.id) || day);
    const mode = getViewMode(day.id);
    const isToday = day.id === getTodayKey();

    const card = document.createElement('section');
    card.className = `day-card day-mode-${mode}`;

    const replacementDay = session.replacementDayId && getActiveProgram()[session.replacementDayId]
        ? getActiveProgram()[session.replacementDayId]
        : null;

    const replacementLabel = replacementDay ? ` • Replaced with ${replacementDay.name}` : '';

    card.innerHTML = `
        <div class="day-card-header">
            <div>
                <div class="day-card-title">${day.icon} ${escapeHtml(day.name)}</div>
                <div class="day-card-subtitle">
                    ${escapeHtml(workout.title || day.title || '')} •
                    ${escapeHtml(workout.subtitle || day.subtitle || '')}
                    ${escapeHtml(replacementLabel)}
                </div>
            </div>
            <div class="completion-indicator ${
                session.completed ? 'completed'
                    : session.partial ? 'partial'
                    : session.incomplete ? 'incomplete'
                    : session.missed ? 'missed'
                    : session.started ? 'active' : ''
            }">${
                session.completed ? '✓'
                    : session.partial ? '♥'
                    : session.incomplete ? '~'
                    : session.missed ? '!'
                    : session.started ? '●' : '○'
            }</div>
        </div>
    `;

    const editBar = document.createElement('div');
    editBar.className = `workout-edit-bar ${editing ? 'editing' : ''}`;
    editBar.innerHTML = editing ? `
        <div><strong>${isWeightEntryMode(day.id) ? 'Adding saved workout data' : 'Editing workout plan'}</strong><span>${isWeightEntryMode(day.id) ? `Entering values for ${escapeHtml(formatDate(getWeightEntryDateKey(day.id)))}. Workout status is unchanged.` : 'Use the section and exercise ⋮ menus below, then confirm your changes.'}</span></div>
        <div class="workout-edit-bar-actions">
            ${isWeightEntryMode(day.id) ? '<button type="button" class="secondary-button" data-finish-weight-entry>Done</button>' : '<button type="button" class="secondary-button" data-add-past-weights>＋ Add Weights</button><button type="button" class="secondary-button" data-cancel-workout-edit>Cancel</button>'}
        </div>
    ` : `
        <div><strong>Workout plan</strong><span>Viewing and logging are separate from workout-plan editing.</span></div>
        <button type="button" class="secondary-button" data-start-workout-edit>Edit Workout</button>
    `;
    card.appendChild(editBar);
    editBar.querySelector('[data-start-workout-edit]')?.addEventListener('click', () => enterWorkoutEditMode(day.id));
    editBar.querySelector('[data-cancel-workout-edit]')?.addEventListener('click', cancelWorkoutEdit);
    editBar.querySelector('[data-add-past-weights]')?.addEventListener('click', () => enterWeightEntryMode(day.id));
    editBar.querySelector('[data-finish-weight-entry]')?.addEventListener('click', exitWeightEntryMode);

    if (isToday) {
        const status = document.createElement('div');
        status.className = `today-status-banner ${mode}`;
        if (mode === 'not-started') {
            status.innerHTML = `<strong>Workout not started</strong><span>Viewing today does not log the day. Press Start Exercise to make today active.</span>`;
        } else if (mode === 'active') {
            status.innerHTML = `<strong>Today is active</strong><span>Your entries are now editable and today counts as logged.</span>`;
        } else if (mode === 'completed') {
            status.innerHTML = `<strong>Workout completed</strong><span>Today is logged. Your workout history is preserved.</span>`;
        } else if (mode === 'partial') {
            status.innerHTML = `<strong>Showed Up 💪</strong><span>You completed what you could today. Your logged work is preserved, even though some exercises were left unlogged.</span>`;
        }
        card.appendChild(status);
    } else if (session.incomplete || session.missed) {
        const banner = document.createElement('div');
        banner.className = `today-status-banner ${session.incomplete ? 'incomplete' : 'missed'}`;
        banner.innerHTML = session.incomplete
            ? `<strong>Workout incomplete</strong><span>You started this workout but it was not completed before midnight. All entered data was preserved.</span>`
            : `<strong>Workout missed</strong><span>The Start Exercise button was not pressed before the end of that day.</span>`;
        card.appendChild(banner);
    } else {
        const info = document.createElement('div');
        info.className = 'today-status-banner view-history-banner';
        const logged = hasSessionEntries(session);
        info.innerHTML = `
            <strong>View only</strong>
            <span>${logged
                ? `Showing the most recent ${day.name} occurrence: ${formatDate(selectedDateKey)}.`
                : `No logged ${day.name} workout found yet.`
            } You can only start a workout when ${day.name} is Today.</span>
        `;
        card.appendChild(info);
    }

    if (workout.warmup) {
        const warmup = document.createElement('div');
        warmup.className = 'warmup-card';
        warmup.innerHTML = `<strong>Warm-up</strong><span>${escapeHtml(workout.warmup)}</span>`;
        card.appendChild(warmup);
    }

    if (workout.progression) {
        const progression = document.createElement('div');
        progression.className = 'progression-card';
        progression.innerHTML = `<strong>Run Progression</strong><ul>${workout.progression.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
        card.appendChild(progression);
    }

    (workout.sections || []).forEach((section, sectionIndex) => {
        card.appendChild(renderSection(day, section, workout, mode, editing, sectionIndex, selectedDateKey));
    });

    if (editing) {
        const editActions = document.createElement('div');
        editActions.className = 'workout-edit-actions';
        editActions.innerHTML = `
            <button type="button" class="secondary-button" data-add-section>＋ Add Section</button>
            <button type="button" class="primary-button" data-confirm-workout-changes>Confirm Changes</button>
        `;
        editActions.querySelector('[data-add-section]').addEventListener('click', openAddSectionEditor);
        editActions.querySelector('[data-confirm-workout-changes]').addEventListener('click', confirmWorkoutDraftChanges);
        card.appendChild(editActions);
    }

    renderDailyStatsEditor(card, day.id, selectedDateKey);

    const notesSection = document.createElement('div');
    notesSection.className = 'notes-section';
    notesSection.innerHTML = `
        <label for="session-notes-input">Session Notes</label>
        <textarea id="session-notes-input" class="session-notes" placeholder="How did the workout feel?" ${mode !== 'active' ? 'disabled' : ''}>${escapeHtml(session.notes || '')}</textarea>
    `;
    const notes = notesSection.querySelector('textarea');
    notes.addEventListener('input', () => {
        if (!canEditToday()) return;
        session.notes = notes.value;
        saveApp();
    });
    card.appendChild(notesSection);

    const actions = document.createElement('div');
    actions.className = 'session-actions';

    if (isToday) {
        if (mode === 'not-started') {
            actions.innerHTML = `<button class="secondary-button" id="replaceTodayWorkout">Replace Workout</button><button class="secondary-button" id="shareWorkout">Share Image</button><button class="primary-button" id="startExercise">Start Exercise</button>`;
            actions.querySelector('#replaceTodayWorkout').addEventListener('click', () => openReplaceWorkoutMenu(day.id));
            actions.querySelector('#shareWorkout').addEventListener('click', () => shareDayWorkoutImage(day.id, selectedDateKey));
            actions.querySelector('#startExercise').addEventListener('click', startTodaySession);
        } else if (mode === 'active') {
            actions.innerHTML = `<button class="secondary-button" id="resetSession">Reset Today</button><button class="secondary-button" id="shareWorkout">Share Image</button><button class="primary-button" id="completeSession">Complete Workout</button>`;
            actions.querySelector('#resetSession').addEventListener('click', resetTodaySession);
            actions.querySelector('#shareWorkout').addEventListener('click', () => shareDayWorkoutImage(day.id, selectedDateKey));
            actions.querySelector('#completeSession').addEventListener('click', () => completeSession(day.id));
        } else {
            actions.innerHTML = `<button class="secondary-button" id="resetSession">Reset Today</button><button class="secondary-button" id="shareWorkout">Share Image</button><button class="primary-button" disabled>✓ Completed</button>`;
            actions.querySelector('#resetSession').addEventListener('click', resetTodaySession);
            actions.querySelector('#shareWorkout').addEventListener('click', () => shareDayWorkoutImage(day.id, selectedDateKey));
        }
    } else {
        actions.innerHTML = `<button type="button" class="secondary-button" id="shareWorkout">Share Image</button><div class="view-only-label">View only — only Today can be started, edited, and completed.</div>`;
        actions.querySelector('#shareWorkout').addEventListener('click', () => shareDayWorkoutImage(day.id, selectedDateKey));
    }

    card.appendChild(actions);
    container.appendChild(card);
}

function renderSection(day, section, workout, mode, editing = false, sectionIndex = 0, dateKey = getDateKey()) {
    const wrapper = document.createElement('section');
    wrapper.className = 'workout-section';

    const canEdit =
        (mode === 'active' && day.id === getTodayKey()) ||
        isWeightEntryMode(day.id);
    const manageMode = editing && isWorkoutEditMode(day.id);

    const header = document.createElement('div');
    header.className = 'section-header';

    header.innerHTML = `
        <div class="section-heading-content"><h2>${escapeHtml(section.name)}</h2></div>
        ${manageMode ? `
            <div class="section-edit-controls">
                <button type="button" class="section-reorder-button" data-section-move="up" ${sectionIndex === 0 ? 'disabled' : ''} aria-label="Move section up">↑</button>
                <button type="button" class="section-reorder-button" data-section-move="down" ${sectionIndex === (workout.sections || []).length - 1 ? 'disabled' : ''} aria-label="Move section down">↓</button>
                <button type="button" class="section-menu-button" aria-label="Section options">⋮</button>
            </div>
        ` : ''}
    `;
    wrapper.appendChild(header);
    const sectionMenuButton = header.querySelector('.section-menu-button');
    if (sectionMenuButton) {
        sectionMenuButton.addEventListener('click', () => openSectionMenu(section.id));
    }
    header.querySelectorAll('[data-section-move]').forEach(button => {
        button.addEventListener('click', () => {
            if (moveSectionInDraft(section.id, button.dataset.sectionMove)) { saveApp(); render(); }
        });
    });

    if (section.description) {
        const description = document.createElement('p');
        description.className = 'section-description';
        description.textContent = section.description;
        wrapper.appendChild(description);
    }

    if (section.type === 'checks') {
        const checks = document.createElement('div');
        checks.className = 'check-grid';

        (section.checks || []).forEach(check => {
            const label = document.createElement('label');
            const canEditCheck = mode === 'active' && day.id === getTodayKey();
            label.className =
                `check-item ${!canEditCheck ? 'disabled-item' : ''}`;

            const input = document.createElement('input');
            input.type = 'checkbox';

            input.checked =
                getSessionCheck(
                    day.id,
                    `${section.id}_${check.id}`,
                    dateKey
                );

            input.disabled = !canEditCheck;

            input.addEventListener('change', () => {
                if (!canEditCheck) return;

                setSessionCheck(
                    day.id,
                    `${section.id}_${check.id}`,
                    input.checked,
                    dateKey
                );
            });

            label.appendChild(input);

            const text = document.createElement('span');
            text.textContent = check.label;

            label.appendChild(text);
            checks.appendChild(label);
        });

        wrapper.appendChild(checks);
        return wrapper;
    }

    const exercises = section.exercises || [];

    exercises.forEach((ex, index) => {
        if (ex.enabled === false) return;

        const row =
            renderExercise(
                day,
                section,
                ex,
                index,
                mode,
                editing,
                dateKey
            );

        wrapper.appendChild(row);
    });

    /*
     * "Add Exercise" is deliberately session-local and available
     * only inside today's active workout.
     */

    return wrapper;
}


/* =========================================================
   EXERCISE UI
   ========================================================= */

function isExerciseDone(dayId, exerciseId, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    return Boolean(session.doneExercises?.[exerciseId]);
}

function setExerciseDone(dayId, exerciseId, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    const value = getSessionValue(dayId, exerciseId, dateKey);
    if (!isValueFilled(value)) {
        showToast('Enter the exercise values before marking it done.');
        return;
    }
    session.doneExercises[exerciseId] = true;
    delete session.exerciseEditBackups[exerciseId];
    saveApp(); render();
}

function beginExerciseEdit(dayId, exerciseId, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    session.exerciseEditBackups[exerciseId] = deepClone(getSessionValue(dayId, exerciseId, dateKey));
    session.doneExercises[exerciseId] = false;
    saveApp(); render();
}

function openExerciseChangePrompt(dayId, exerciseId, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="action-sheet exercise-save-sheet"><div class="action-sheet-title">Save weight / rep changes?</div><p class="modal-description">You changed a previously completed exercise. Save the new values or discard them and restore the previous entry.</p><button data-save class="primary-action">✓ Save Changes</button><button data-discard>↩ Discard Changes</button><button data-cancel class="cancel-action">Keep Editing</button></div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('[data-save]').addEventListener('click', () => {
        session.doneExercises[exerciseId] = true;
        delete session.exerciseEditBackups[exerciseId];
        saveApp(); close(); render(); showToast('Exercise changes saved');
    });
    overlay.querySelector('[data-discard]').addEventListener('click', () => {
        if (Object.prototype.hasOwnProperty.call(session.exerciseEditBackups, exerciseId)) session.values[exerciseId] = deepClone(session.exerciseEditBackups[exerciseId]);
        session.doneExercises[exerciseId] = true;
        delete session.exerciseEditBackups[exerciseId];
        saveApp(); close(); render(); showToast('Changes discarded');
    });
    overlay.querySelector('[data-cancel]').addEventListener('click', close);
}

function finishExerciseEdit(dayId, exerciseId, dateKey = getDateKey()) {
    const session = getSession(dayId, dateKey);
    if (!isValueFilled(getSessionValue(dayId, exerciseId, dateKey))) { showToast('Enter the exercise values before saving.'); return; }
    if (Object.prototype.hasOwnProperty.call(session.exerciseEditBackups, exerciseId)) {
        openExerciseChangePrompt(dayId, exerciseId, dateKey);
    } else {
        setExerciseDone(dayId, exerciseId, dateKey);
    }
}

function renderExercise(day, section, ex, index, mode, editing = false, dateKey = getDateKey()) {
    const row = document.createElement('div');
    row.className = 'exercise-card';

    const activeToday = mode === 'active' && day.id === getTodayKey();
    const historicalEntry = isWeightEntryMode(day.id);
    const done = activeToday && isExerciseDone(day.id, ex.id, dateKey);
    const session = getSession(day.id, dateKey);
    const editingValues = activeToday && Object.prototype.hasOwnProperty.call(session.exerciseEditBackups || {}, ex.id);
    const canEdit = historicalEntry || (activeToday && (!done || editingValues));
    const manageMode = editing && isWorkoutEditMode(day.id);
    const value = getSessionValue(day.id, ex.id, dateKey);
    const historySeed = dateKey === getDateKey() && !isValueFilled(value) ? getExerciseHistorySeed(ex, dateKey) : null;

    const header = document.createElement('div');
    header.className = 'exercise-card-header';
    header.innerHTML = `
        <div class="exercise-info">
            <h3>${escapeHtml(ex.name)}</h3>
            <span>${escapeHtml(ex.target || '')}</span>
        </div>
        <div class="exercise-header-actions">
            ${done ? '<span class="exercise-done-badge">✓ Done</span>' : ''}
            ${manageMode ? '<button class="exercise-menu-button" aria-label="Exercise options">⋮</button>' : ''}
        </div>`;
    row.appendChild(header);

    const inputContainer = document.createElement('div');
    inputContainer.className = `exercise-inputs ${done && !editingValues ? 'exercise-inputs-locked' : ''}`;
    if (ex.type === 'strength') renderStrengthInputs(day, ex, value, canEdit, inputContainer, dateKey, historySeed);
    else renderSingleExerciseInput(day, ex, value, canEdit, inputContainer, dateKey, historySeed);
    row.appendChild(inputContainer);

    if (activeToday && !historicalEntry) {
        const controls = document.createElement('div');
        controls.className = 'exercise-done-controls';
        if (done && !editingValues) {
            controls.innerHTML = '<button type="button" class="secondary-button exercise-edit-values">Edit</button>';
            controls.querySelector('.exercise-edit-values').addEventListener('click', () => beginExerciseEdit(day.id, ex.id, dateKey));
        } else {
            controls.innerHTML = `<button type="button" class="${editingValues ? 'primary-button' : 'secondary-button'} exercise-finish-values">${editingValues ? 'Save / Finish' : '✓ Mark Exercise Done'}</button>`;
            controls.querySelector('.exercise-finish-values').addEventListener('click', () => finishExerciseEdit(day.id, ex.id, dateKey));
        }
        row.appendChild(controls);
    }

    if (manageMode) header.querySelector('.exercise-menu-button')?.addEventListener('click', () => openExerciseMenu(section.id, ex.id));
    return row;
}

function renderStrengthInputs(day, ex, rawValue, canEdit, container, dateKey = getDateKey(), historySeed = null) {
    const value = normalizeStrengthValue(rawValue, ex);
    const showSeed = historySeed && !isValueFilled(rawValue);
    const previous = showSeed ? normalizeStrengthValue(historySeed.value, ex) : null;

    const weightField = document.createElement('div');
    weightField.className = 'strength-weight-field';
    weightField.innerHTML = `
        <label>Weight (${weightUnit()})
            <input type="number" step="0.1" min="0" inputmode="decimal" autocomplete="off"
                value="${escapeHtml(displayWeight(value.weight))}"
                placeholder="${previous?.weight ? `Last ${escapeHtml(displayWeight(previous.weight))}` : '0'}"
                ${canEdit ? '' : 'disabled'}>
        </label>
    `;
    const weightInput = weightField.querySelector('input');
    if (canEdit) weightInput.addEventListener('input', () => updateStrengthWeight(day.id, ex.id, isMetric() ? (kgToLb(weightInput.value) ?? '') : weightInput.value, dateKey));

    const repsWrap = document.createElement('div');
    repsWrap.className = 'strength-reps';
    const repsHeader = document.createElement('div');
    repsHeader.className = 'strength-reps-header';
    repsHeader.innerHTML = `<span>Reps</span>${canEdit ? '<button type="button" class="add-set-button">+ Set</button>' : ''}`;
    repsWrap.appendChild(repsHeader);

    const repsGrid = document.createElement('div');
    repsGrid.className = 'rep-fields-grid';

    value.reps.forEach((rep, index) => {
        const previousRep = previous?.reps?.[index] ?? '';
        const field = document.createElement('div');
        field.className = 'rep-field';
        field.innerHTML = `
            <label>${index + 1}
                <input type="number" min="0" step="1" inputmode="numeric" autocomplete="off"
                    value="${escapeHtml(rep)}" placeholder="${escapeHtml(previousRep || '0')}"
                    ${canEdit ? '' : 'disabled'}>
            </label>
            ${canEdit && value.reps.length > 1 ? '<button type="button" class="remove-set-button" aria-label="Remove set">×</button>' : ''}
        `;
        const input = field.querySelector('input');
        if (canEdit) input.addEventListener('input', () => updateStrengthRep(day.id, ex.id, index, input.value, dateKey));
        field.querySelector('.remove-set-button')?.addEventListener('click', () => removeStrengthSet(day.id, ex.id, index, dateKey));
        repsGrid.appendChild(field);
    });

    repsWrap.appendChild(repsGrid);
    const hint = document.createElement('p');
    hint.className = 'input-hint';
    hint.textContent = `${value.reps.length} set${value.reps.length === 1 ? '' : 's'}${canEdit ? ' — tap + Set to add another' : ''}`;
    repsWrap.appendChild(hint);

    if (showSeed) {
        const previousHint = document.createElement('p');
        previousHint.className = 'previous-performance-hint';
        previousHint.textContent = formatPerformanceHint(historySeed, ex);
        repsWrap.appendChild(previousHint);
    }

    container.appendChild(weightField);
    container.appendChild(repsWrap);
    repsHeader.querySelector('.add-set-button')?.addEventListener('click', () => addStrengthSet(day.id, ex.id, dateKey));
}

function renderSingleExerciseInput(day, ex, value, canEdit, container, dateKey = getDateKey(), historySeed = null) {
    const field = document.createElement('div');
    field.className = 'input-field';
    const previousValue = historySeed && !isValueFilled(value) ? String(historySeed.value ?? '') : '';

    field.innerHTML = `
        <label>${ex.type === 'measurement' ? 'Value' : ex.type === 'timed' ? 'Time / Duration' : 'Value'}</label>
        <input
            type="${ex.type === 'measurement' || ex.type === 'timed' ? 'number' : 'text'}"
            ${ex.type === 'measurement' || ex.type === 'timed' ? 'inputmode="decimal"' : ''}
            value="${escapeHtml(value)}"
            placeholder="${escapeHtml(previousValue || (ex.type === 'timed' ? 'Minutes / seconds' : 'Enter result'))}"
            autocomplete="off"
            ${canEdit ? '' : 'disabled'}>
    `;

    const input = field.querySelector('input');
    if (canEdit) input.addEventListener('input', () => setSessionValue(day.id, ex.id, input.value, dateKey));

    if (historySeed && !isValueFilled(value)) {
        const hint = document.createElement('p');
        hint.className = 'previous-performance-hint';
        hint.textContent = formatPerformanceHint(historySeed, ex);
        field.appendChild(hint);
    }
    container.appendChild(field);
}

function openExerciseMenu(sectionId, exerciseId) {
    if (!isWorkoutEditMode()) return;
    const draft = getWorkoutDraft();
    const section = draft?.sections?.find(item => item.id === sectionId);
    const exercise = section?.exercises?.find(item => item.id === exerciseId);
    if (!section || !exercise) return;

    closeMenus();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="action-sheet">
            <div class="action-sheet-title">Exercise Options</div>
            <button data-action="edit">✏️ Edit Exercise</button>
            <button data-action="remove" class="danger-action">🗑 Remove Exercise</button>
            <button data-action="cancel" class="cancel-action">Cancel</button>
        </div>`;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', event => {
        if (event.target === overlay) return overlay.remove();
        const action = event.target.closest('button')?.dataset.action;
        if (!action) return;
        if (action === 'edit') {
            overlay.remove();
            openExerciseEditorForDraft(sectionId, exercise);
            return;
        }
        if (action === 'remove') {
            overlay.remove();
            openConfirmModal({
                title: 'Remove exercise?',
                message: `Remove “${exercise.name}” from this workout draft?`,
                confirmText: 'Remove Exercise',
                danger: true,
                onConfirm: () => {
                    removeExerciseFromDraft(sectionId, exerciseId);
                    saveApp();
                    render();
                    showToast('Exercise removed');
                }
            });
            return;
        }
        overlay.remove();
    });
}

function openSectionMenu(sectionId) {
    if (!isWorkoutEditMode()) return;
    const draft = getWorkoutDraft();
    const section = draft?.sections?.find(item => item.id === sectionId);
    if (!section) return;

    closeMenus();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="action-sheet">
            <div class="action-sheet-title">Section Options</div>
            <button data-action="add-exercise">＋ Add Exercise</button>
            <button data-action="edit-section">✏️ Edit Section</button>
            <button data-action="delete-section" class="danger-action">🗑 Delete Section</button>
            <button data-action="cancel" class="cancel-action">Cancel</button>
        </div>`;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', event => {
        if (event.target === overlay) return overlay.remove();
        const action = event.target.closest('button')?.dataset.action;
        if (!action) return;
        if (action === 'add-exercise') {
            overlay.remove();
            openExerciseEditorForDraft(sectionId);
            return;
        }
        if (action === 'edit-section') {
            overlay.remove();
            openSectionEditorForDraft(section);
            return;
        }
        if (action === 'delete-section') {
            overlay.remove();
            openConfirmModal({
                title: 'Delete section?',
                message: `Delete “${section.name}” and all exercises inside it from this workout draft?`,
                confirmText: 'Delete Section',
                danger: true,
                onConfirm: () => {
                    deleteSectionFromDraft(sectionId);
                    saveApp();
                    render();
                    showToast('Section deleted');
                }
            });
            return;
        }
        overlay.remove();
    });
}

function confirmWorkoutDraftChanges() {
    if (!isWorkoutEditMode()) return;
    const dayId = appState.settings.workoutDraftDayId;
    const day = getActiveProgram()[dayId];
    if (!day) return;

    const isToday = dayId === getTodayKey();
    const session = getSession(dayId, isToday ? getDateKey() : getDateKeyForDayId(dayId));
    const futureDisabled = isToday && session.started;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="confirm-modal scope-confirm-modal">
            <div class="modal-header">
                <div>
                    <h2>Confirm workout changes</h2>
                    <p class="modal-description">Choose how far these workout-plan changes should apply.</p>
                </div>
                <button type="button" class="modal-close" aria-label="Close">×</button>
            </div>
            <div class="scope-options">
                ${isToday ? `
                    <button type="button" class="scope-option" data-scope="today">
                        <strong>Today only</strong>
                        <span>Change today's workout without changing the recurring future plan.</span>
                    </button>
                    <button type="button" class="scope-option ${futureDisabled ? 'disabled' : ''}" data-scope="future" ${futureDisabled ? 'disabled' : ''}>
                        <strong>Today + future weeks</strong>
                        <span>${futureDisabled ? 'Unavailable after today has been started.' : "Change today's workout and the recurring future plan."}</span>
                    </button>
                ` : `
                    <button type="button" class="scope-option" data-scope="day">
                        <strong>This scheduled day only</strong>
                        <span>Change this week's occurrence without changing future weeks.</span>
                    </button>
                    <button type="button" class="scope-option" data-scope="future">
                        <strong>This day + future weeks</strong>
                        <span>Change the recurring plan starting with this scheduled day.</span>
                    </button>
                `}
            </div>
            <button type="button" class="secondary-button scope-cancel">Cancel</button>
        </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelector('.scope-cancel').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    overlay.querySelectorAll('[data-scope]').forEach(button => {
        button.addEventListener('click', () => {
            const scope = button.dataset.scope;
            const draft = deepClone(appState.settings.workoutDraft);
            applyWorkoutDraft(dayId, draft, scope);
            close();
        });
    });
}

function applyWorkoutDraft(dayId, draft, scope) {
    const day = getActiveProgram()[dayId];
    if (!day) return;
    const isToday = dayId === getTodayKey();
    const dateKey = isToday ? getDateKey() : getDateKeyForDayId(dayId);
    const session = getSession(dayId, dateKey);

    if (scope === 'future') {
        getActiveProgram()[dayId] = copyWorkoutContent(draft, day);
        if (isToday && !session.started) {
            session.workoutSnapshot = deepClone(getActiveProgram()[dayId]);
            session.replacementDayId = null;
        }
        showToast('Workout changes saved for today and future weeks');
    } else if (scope === 'today' && isToday) {
        session.workoutSnapshot = deepClone(draft);
        session.replacementDayId = null;
        showToast('Workout changes saved for today only');
    } else if (scope === 'day') {
        session.workoutSnapshot = deepClone(draft);
        session.replacementDayId = null;
        showToast('Workout changes saved for this scheduled day only');
    }

    appState.settings.weightEntryMode = false;
    appState.settings.weightEntryDayId = null;
    appState.settings.weightEntryDateKey = null;
    appState.settings.editingWorkout = false;
    appState.settings.workoutDraft = null;
    appState.settings.workoutDraftDayId = null;
    saveApp();
    render();
}

/* =========================================================
   DAY MENU
   ========================================================= */

function openDayMenu() {
    closeMenus();

    const dayId = appState.currentDay;
    const isToday = dayId === getTodayKey();
    const session = getSession(dayId);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
        <div class="action-sheet">
            <div class="action-sheet-title">
                Workout Menu
            </div>

            ${
                !isToday || !session.started
                    ? `
                        <button data-action="replace-day">
                            🔄 Replace This Day's Workout
                        </button>
                    `
                    : `
                        <button
                            data-action="replace-day"
                            ${session.started ? 'disabled' : ''}>
                            🔄 Replace This Day's Workout
                        </button>
                    `
            }

            <button data-action="manage">
                ✏️ Edit Workout
            </button>

            <button data-action="settings">
                ⚙️ Settings
            </button>

            <button
                data-action="cancel"
                class="cancel-action">
                Cancel
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            overlay.remove();
            return;
        }

        const button =
            event.target.closest('button');

        if (!button || button.disabled) return;

        const action =
            button.dataset.action;

        if (action === 'replace-day') {
            openReplaceWorkoutMenu(dayId);
        } else if (action === 'manage') {
            enterWorkoutEditMode(dayId);
        } else if (action === 'settings') {
            openSettings();
        }

        overlay.remove();
    });
}


/* =========================================================
   WORKOUT MANAGER
   ========================================================= */

function openWorkoutManager() {
    enterWorkoutEditMode(appState.currentDay);
}



/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

function renderBottomNavigation(container) {
    const footer = document.createElement('footer');
    footer.className = 'bottom-bar';

    const isToday =
        appState.currentDay === getTodayKey() &&
        appState.settings.activeView === 'day';

    const session = getTodaySession();

    footer.innerHTML = `
        <button
            class="secondary-button"
            id="bottomToday">
            Today
        </button>

        ${
            isToday && !session.started
                ? `
                    <button
                        class="primary-button"
                        id="bottomStart">
                        Start Exercise
                    </button>
                `
                : isToday && session.started && !session.completed && !session.partial
                    ? `
                        <button
                            class="primary-button"
                            id="bottomComplete">
                            Complete Workout
                        </button>
                    `
                    : `
                        <button
                            class="primary-button"
                            id="bottomLog"
>
                            ${
                                session.completed
                                    ? '✓ Completed'
                                    : session.partial
                                        ? '♥ Showed Up'
                                        : 'View Log'
                            }
                        </button>
                    `
        }
    `;

    footer
        .querySelector('#bottomToday')
        .addEventListener('click', () => {
            appState.currentDay = getTodayKey();
            appState.settings.activeView = 'day';
            saveApp();
            render();
        });

    const startButton =
        footer.querySelector('#bottomStart');

    if (startButton) {
        startButton.addEventListener(
            'click',
            startTodaySession
        );
    }

    const completeButton =
        footer.querySelector('#bottomComplete');

    if (completeButton) {
        completeButton.addEventListener(
            'click',
            () => completeSession(
                getTodayKey()
            )
        );
    }

    const logButton =
        footer.querySelector('#bottomLog');

    if (
        logButton &&
        appState.settings.activeView === 'day'
    ) {
        logButton.addEventListener('click', () => {
            appState.settings.activeView = 'log';
            saveApp();
            render();
        });
    }

    container.appendChild(footer);
}


/* =========================================================
   WEEKLY LOG
   ========================================================= */

function getSessionForDate(dateKey) {
    const dayId = getDayIdForDate(parseDateKey(dateKey));
    return getSession(dayId, dateKey);
}

function getBodyStatForDate(dateKey, field) {
    const current = getSessionForDate(dateKey);
    if (current && current[field] !== '' && current[field] != null) {
        return { value: current[field], inherited: false, sourceDate: dateKey };
    }

    const start = parseDateKey(dateKey);
    for (let i = 1; i < 3700; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() - i);
        const key = getDateKey(date);
        const session = appState.sessions[`${key}_${getDayIdForDate(date)}`];
        if (session && session[field] !== '' && session[field] != null) {
            return { value: session[field], inherited: true, sourceDate: key };
        }
    }
    return { value: '', inherited: false, sourceDate: null };
}

function getHeightInches() {
    const feet = Number(appState.settings.heightFeet);
    const inches = Number(appState.settings.heightInches);
    if (!Number.isFinite(feet) || !Number.isFinite(inches) || feet <= 0 || inches < 0 || inches >= 12) return 0;
    return feet * 12 + inches;
}

function calculateBMI(weightLb) {
    const heightIn = getHeightInches();
    const weight = Number(weightLb);
    if (!heightIn || !weight || weight <= 0) return null;
    return (weight / (heightIn * heightIn)) * 703;
}

function calculateRFM(weightLb, waistIn) {
    const heightIn = getHeightInches();
    const waist = Number(waistIn);
    if (!heightIn || !waist || waist <= 0) return null;
    const heightCm = heightIn * 2.54;
    const waistCm = waist * 2.54;
    if (!appState.settings.bodyFatSex) return null;
    const estimate = appState.settings.bodyFatSex === 'male'
        ? 64 - 20 * (heightCm / waistCm)
        : 76 - 20 * (heightCm / waistCm);
    return Math.max(3, Math.min(60, estimate));
}

function isMetric() { return appState.settings.unitSystem === 'metric'; }
function lbToKg(value) { const n = Number(value); return Number.isFinite(n) ? n * 0.45359237 : null; }
function kgToLb(value) { const n = Number(value); return Number.isFinite(n) ? n / 0.45359237 : null; }
function inchToCm(value) { const n = Number(value); return Number.isFinite(n) ? n * 2.54 : null; }
function cmToInch(value) { const n = Number(value); return Number.isFinite(n) ? n / 2.54 : null; }
function displayNumber(value, decimals = 1) { const n = Number(value); return Number.isFinite(n) ? n.toFixed(decimals).replace(/\.0+$/, '') : ''; }
function displayWeight(value) { if (value === '' || value == null) return ''; const n = isMetric() ? lbToKg(value) : Number(value); return displayNumber(n, 1); }
function displayWaist(value) { if (value === '' || value == null) return ''; const n = isMetric() ? inchToCm(value) : Number(value); return displayNumber(n, 1); }
function weightUnit() { return isMetric() ? 'kg' : 'lb'; }
function waistUnit() { return isMetric() ? 'cm' : 'in'; }
function heightDisplay() { const inches = getHeightInches(); return inches ? displayNumber(isMetric() ? inchToCm(inches) : inches, 1) : ''; }
function heightUnit() { return isMetric() ? 'cm' : 'in'; }

function getWeekSessions(weekStartKey) {
    return getWeekdayDateKeys(weekStartKey).map(dateKey => {
        const session = getSessionForDate(dateKey);
        return session;
    });
}

function renderWeekGroup(weekStartKey, expanded = true) {
    const sessions = getWeekSessions(weekStartKey);
    const currentWeek = weekStartKey === getWeekStartDateKey();
    return `
        <section class="week-group" data-week="${weekStartKey}">
            <div class="week-group-header">
                <div>
                    <h4>Week of ${escapeHtml(formatWeekRange(weekStartKey))}</h4>
                    <span>${currentWeek ? 'Current week' : 'Previous week'}</span>
                </div>
                <strong>${sessions.filter(s => s.completed).length}/${sessions.length} completed</strong>
            </div>
            ${expanded ? `
                <div class="history-list week-history-list">
                    ${sessions.map(renderHistoryItem).join('')}
                </div>` : ''}
        </section>`;
}

function renderDailyStatsEditor(container, dayId, selectedDate = null) {
    const selectedDateKey = selectedDate || (dayId === getTodayKey() ? getDateKey() : getReferenceDateKeyForDayId(dayId));
    const session = getSession(dayId, selectedDateKey);
    const weight = session.weight !== '' ? session.weight : '';
    const waist = session.waist !== '' ? session.waist : '';
    const inheritedWeight = getBodyStatForDate(selectedDateKey, 'weight');
    const inheritedWaist = getBodyStatForDate(selectedDateKey, 'waist');
    const displayWeightRaw = weight !== '' ? weight : inheritedWeight.value;
    const displayWaistRaw = waist !== '' ? waist : inheritedWaist.value;

    const card = document.createElement('div');
    card.className = 'daily-stats-card';
    card.innerHTML = `
        <div class="daily-stats-header">
            <div>
                <h3>Body stats for ${escapeHtml(formatDate(selectedDateKey))}</h3>
                <p class="muted">These stats do not require starting the workout.</p>
            </div>
            <span class="daily-stats-status">${weight !== '' || waist !== '' ? 'Logged' : 'Using previous'}</span>
        </div>
        <div class="daily-stat-values">
            <div><span>Weight</span><strong>${displayWeightRaw !== '' ? `${escapeHtml(displayWeight(displayWeightRaw))} ${weightUnit()}` : '—'}</strong></div>
            <div><span>Waist</span><strong>${displayWaistRaw !== '' ? `${escapeHtml(displayWaist(displayWaistRaw))} ${waistUnit()}` : '—'}</strong></div>
        </div>
        <button type="button" class="secondary-button daily-stats-edit">${weight !== '' || waist !== '' ? 'Edit Stats' : 'Record Stats'}</button>
    `;
    card.querySelector('.daily-stats-edit').addEventListener('click', () => openDailyStatsModal(dayId, selectedDateKey));
    container.appendChild(card);
}

function getDateKeyForDayId(dayId) {
    const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const target = dayMap[dayId];
    if (target == null) return getDateKey();
    const date = parseDateKey(getWeekStartDateKey());
    const offset = target === 0 ? 6 : target - 1;
    date.setDate(date.getDate() + offset);
    return getDateKey(date);
}

function openDailyStatsModal(dayId, dateKey) {
    const session = getSession(dayId, dateKey);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="large-modal editor-modal">
            <div class="modal-header">
                <div>
                    <h2>Body Stats</h2>
                    <p class="modal-description">Record weight and waist for ${escapeHtml(formatDate(dateKey))}.</p>
                </div>
                <button type="button" class="modal-close">×</button>
            </div>
            <form class="modal-form" id="daily-stats-form">
                <div class="modal-field"><label for="daily-weight">Weight (${weightUnit()})</label><input id="daily-weight" name="weight" type="number" step="0.1" inputmode="decimal" value="${escapeHtml(session.weight !== '' ? displayWeight(session.weight) : '')}"></div>
                <div class="modal-field"><label for="daily-waist">Waist (${waistUnit()})</label><input id="daily-waist" name="waist" type="number" step="0.1" inputmode="decimal" value="${escapeHtml(session.waist !== '' ? displayWaist(session.waist) : '')}"></div>
                <div class="modal-actions"><button type="button" class="secondary-button" data-cancel>Cancel</button><button type="submit" class="primary-button">Confirm</button></div>
            </form>
        </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelector('[data-cancel]').addEventListener('click', close);
    overlay.querySelector('#daily-stats-form').addEventListener('submit', event => {
        event.preventDefault();
        const form = event.currentTarget;
        session.weight = isMetric() ? displayNumber(kgToLb(form.elements.weight.value) || '', 1) : form.elements.weight.value.trim();
        session.waist = isMetric() ? displayNumber(cmToInch(form.elements.waist.value) || '', 1) : form.elements.waist.value.trim();
        saveApp();
        close();
        render();
        showToast('Body stats saved');
    });
    setTimeout(() => overlay.querySelector('#daily-weight')?.focus(), 0);
}

function renderBodyStatsSection(container) {
    const settings = appState.settings;
    const heightKnown = getHeightInches() > 0;
    const latest = getBodyStatForDate(getDateKey(), 'weight');
    const latestWaist = getBodyStatForDate(getDateKey(), 'waist');
    const weight = latest.value;
    const waist = latestWaist.value;
    const bmi = calculateBMI(weight);
    const fat = calculateRFM(weight, waist);
    const bodyCard = document.createElement('div');
    bodyCard.className = 'log-section';
    bodyCard.innerHTML = `
        <h3>Body Stats</h3>
        <div class="unit-toggle-row"><div><strong>Measurements</strong><span>Switch how GymEssentials displays weight, waist, and height.</span></div><div class="unit-toggle-group"><button type="button" class="unit-choice ${!isMetric() ? 'active' : ''}" data-unit="imperial">lb / in</button><button type="button" class="unit-choice ${isMetric() ? 'active' : ''}" data-unit="metric">kg / cm</button></div></div>
        <div class="height-form">
            ${isMetric() ? `<div class="height-field"><label for="height-cm">Height (cm)</label><input id="height-cm" type="number" min="50" max="250" step="0.1" value="${escapeHtml(heightDisplay())}" ${heightKnown ? 'disabled' : ''}></div>` : `<div class="height-field"><label for="height-feet">Height (ft)</label><input id="height-feet" type="number" min="1" max="8" inputmode="numeric" value="${escapeHtml(settings.heightFeet || '')}" ${heightKnown ? 'disabled' : ''}></div><div class="height-field"><label for="height-inches">Height (in)</label><input id="height-inches" type="number" min="0" max="11" inputmode="numeric" value="${escapeHtml(settings.heightInches || '')}" ${heightKnown ? 'disabled' : ''}></div>`}
            <div class="modal-field compact-field"><label for="body-fat-sex">Body-fat estimate</label><select id="body-fat-sex"><option value="">Select</option><option value="male" ${settings.bodyFatSex === 'male' ? 'selected' : ''}>Male</option><option value="female" ${settings.bodyFatSex === 'female' ? 'selected' : ''}>Female</option></select></div>
        </div>
        ${heightKnown ? `<div class="confirmed-stat"><strong>${escapeHtml(heightDisplay())} ${heightUnit()}</strong><span>Height confirmed</span></div><div class="body-stat-actions"><button type="button" class="secondary-button" id="save-body-fat-setting">Save Estimate Setting</button><button type="button" class="secondary-button" id="edit-height">Edit Height</button><button type="button" class="primary-button" id="view-metrics">View Logged Workout Weeks</button></div>` : `<button type="button" class="primary-button" id="confirm-height">Confirm Height</button>`}
        <div class="current-metrics-card"><div><span>Current</span><strong>${weight !== '' ? `${escapeHtml(displayWeight(weight))} ${weightUnit()}` : '—'}</strong><small>Weight</small></div><div><span>Waist</span><strong>${waist !== '' ? `${escapeHtml(displayWaist(waist))} ${waistUnit()}` : '—'}</strong><small>Waist</small></div><div><span>Height</span><strong>${heightKnown ? `${escapeHtml(heightDisplay())} ${heightUnit()}` : '—'}</strong><small>Height</small></div><div><span>BMI</span><strong>${bmi != null ? bmi.toFixed(1) : '—'}</strong><small>BMI</small></div><div><span>Fat %</span><strong>${fat != null ? `${fat.toFixed(1)}%` : '—'}</strong><small>RFM estimate</small></div></div>
        <p class="input-hint">BMI uses weight and height. Fat % is an RFM estimate and requires the selected sex. Stored history remains unchanged when switching units.</p>
    `;
    container.appendChild(bodyCard);
    bodyCard.querySelectorAll('[data-unit]').forEach(btn => btn.addEventListener('click', () => { appState.settings.unitSystem = btn.dataset.unit === 'metric' ? 'metric' : 'imperial'; saveApp(); render(); }));
    bodyCard.querySelector('#save-body-fat-setting')?.addEventListener('click', () => { settings.bodyFatSex = bodyCard.querySelector('#body-fat-sex').value; saveApp(); render(); showToast('Body-fat estimate setting saved'); });
    bodyCard.querySelector('#confirm-height')?.addEventListener('click', () => {
        if (isMetric()) {
            const cm = Number(bodyCard.querySelector('#height-cm').value);
            if (!Number.isFinite(cm) || cm < 50 || cm > 250) { showToast('Enter a valid height.'); return; }
            const totalIn = cmToInch(cm); settings.heightFeet = Math.floor(totalIn / 12); settings.heightInches = Math.round((totalIn % 12) * 10) / 10;
        } else {
            const feet = bodyCard.querySelector('#height-feet').value; const inches = bodyCard.querySelector('#height-inches').value;
            if (!feet || inches === '' || Number(inches) < 0 || Number(inches) >= 12) { showToast('Enter a valid height.'); return; }
            settings.heightFeet = feet; settings.heightInches = inches;
        }
        settings.bodyFatSex = bodyCard.querySelector('#body-fat-sex').value; saveApp(); render(); showToast('Height confirmed');
    });
    bodyCard.querySelector('#edit-height')?.addEventListener('click', () => openConfirmModal({ title:'Change height?', message:'Are you sure you want to change your height? Existing workout history will remain intact.', confirmText:'Change Height', onConfirm:() => { settings.heightFeet=''; settings.heightInches=''; render(); } }));
    bodyCard.querySelector('#view-metrics')?.addEventListener('click', () => openLoggedWeeksMetrics());
}

function openLoggedWeeksMetrics() {
    const weekKeys = [...new Set(
        Object.values(appState.sessions)
            .filter(hasSessionEntries)
            .map(session => getWeekKeyFromDateKey(session.date))
    )].sort((a, b) => b.localeCompare(a));

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'large-modal metrics-modal';
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();

    function statusLabel(session) {
        if (session.completed) return 'Completed';
        if (session.partial) return 'Showed Up';
        if (session.incomplete) return 'Incomplete';
        if (session.missed) return 'Missed';
        if (session.started) return 'Active';
        return 'Logged';
    }

    function shell(title, description, body, backLabel = null) {
        modal.innerHTML = `
            <div class="modal-header">
                <div><h2>${escapeHtml(title)}</h2><p class="modal-description">${escapeHtml(description)}</p></div>
                <button type="button" class="modal-close">×</button>
            </div>
            ${backLabel ? `<button type="button" class="secondary-button history-back-button" data-back>${escapeHtml(backLabel)}</button>` : ''}
            <div class="metrics-weeks">${body}</div>
        `;
        modal.querySelector('.modal-close').addEventListener('click', close);
    }

    function renderWeeks() {
        const body = weekKeys.length ? weekKeys.map(week => {
            const sessions = getWeekSessions(week).filter(hasSessionEntries);
            const completed = sessions.filter(s => s.completed).length;
            return `
                <button type="button" class="history-drilldown-row" data-week="${escapeHtml(week)}">
                    <div><strong>${escapeHtml(formatWeekRange(week))}</strong><span>${sessions.length} logged day${sessions.length === 1 ? '' : 's'} • ${completed} completed</span></div>
                    <span class="history-chevron">›</span>
                </button>
            `;
        }).join('') : '<div class="empty-state">No logged workout weeks yet.</div>';

        shell('Logged Workout Weeks', 'Tap a week, then a day, to inspect the complete saved workout record.', body);
        modal.querySelectorAll('[data-week]').forEach(button => button.addEventListener('click', () => renderDays(button.dataset.week)));
    }

    function renderDays(week) {
        const body = getWeekSessions(week).map(session => {
            const day = getActiveProgram()[session.dayId] || {};
            return `
                <button type="button" class="history-drilldown-row" data-day-id="${escapeHtml(session.dayId)}" data-day-date="${escapeHtml(session.date)}">
                    <div><strong>${day.icon || '📅'} ${escapeHtml(day.name || session.dayId)}</strong><span>${escapeHtml(formatDate(session.date))} • ${escapeHtml(statusLabel(session))}</span></div>
                    <span class="history-chevron">›</span>
                </button>
            `;
        }).join('');

        shell('Logged Week', formatWeekRange(week), body, '← Weeks');
        modal.querySelector('[data-back]').addEventListener('click', renderWeeks);
        modal.querySelectorAll('[data-day-id]').forEach(button => button.addEventListener('click', () => renderDayDetail(button.dataset.dayId, button.dataset.dayDate, week)));
    }

    function detailValue(ex, raw) {
        if (!isValueFilled(raw)) return '<span class="history-empty">No entry</span>';
        if (ex.type === 'strength') {
            const normalized = normalizeStrengthValue(raw, ex);
            const reps = normalized.reps.filter(rep => rep !== '');
            return `<span>${escapeHtml(normalized.weight || '—')} lb${reps.length ? ` • ${escapeHtml(reps.join(' / '))} reps` : ''}</span>`;
        }
        return `<span>${escapeHtml(String(raw))}</span>`;
    }

    function renderDayDetail(dayId, dateKey, week) {
        const session = getSession(dayId, dateKey);
        const workout = session.workoutSnapshot || getActiveProgram()[dayId];
        const day = getActiveProgram()[dayId] || {};
        const replacement = session.replacementDayId && getActiveProgram()[session.replacementDayId]
            ? getActiveProgram()[session.replacementDayId].name
            : null;

        const sections = (workout?.sections || []).map(section => {
            const exercises = (section.exercises || []).map(ex => {
                const raw = getSessionValueForExercise(session, ex);
                const extra = ex.todayOnly ? '<em class="history-extra-badge">Extra / Today only</em>' : '';
                return `
                    <div class="history-detail-exercise">
                        <div><strong>${escapeHtml(ex.name)}</strong><span>${escapeHtml(ex.target || '')} ${extra}</span></div>
                        <div>${detailValue(ex, raw)}</div>
                    </div>
                `;
            }).join('');

            const checks = (section.checks || []).map(check => {
                const checked = !!session.checks?.[`${section.id}_${check.id}`];
                return `<span class="history-check-pill ${checked ? 'checked' : ''}">${checked ? '✓' : '○'} ${escapeHtml(check.label)}</span>`;
            }).join('');

            return `<section class="history-detail-section"><h3>${escapeHtml(section.name || 'Section')}</h3>${exercises || '<div class="history-empty">No exercises.</div>'}${checks ? `<div class="history-checks">${checks}</div>` : ''}</section>`;
        }).join('');

        const detailBMI = calculateBMI(session.weight);
        const detailFat = calculateRFM(session.weight, session.waist);
        const bodyStats = [
            session.weight !== '' ? `Weight ${escapeHtml(displayWeight(session.weight))} ${weightUnit()}` : '',
            session.waist !== '' ? `Waist ${escapeHtml(displayWaist(session.waist))} ${waistUnit()}` : '',
            detailBMI != null ? `BMI ${detailBMI.toFixed(1)}` : '',
            detailFat != null ? `Fat ${detailFat.toFixed(1)}%` : ''
        ].filter(Boolean).join(' • ');

        shell(
            `${day.icon || '📅'} ${day.name || dayId}`,
            `${formatDate(dateKey)} • ${statusLabel(session)}`,
            `
                <div class="history-detail-summary">
                    ${replacement ? `<div><strong>Replacement:</strong> ${escapeHtml(replacement)}</div>` : ''}
                    ${session.startedAt ? `<div><strong>Time:</strong> Started ${formatTime(session.startedAt)}${session.completedAt ? ` • Completed ${formatTime(session.completedAt)}` : ''}</div>` : ''}${session.incomplete ? '<div><strong>Incomplete:</strong> Started before midnight; saved entries were preserved.</div>' : ''}
                    ${bodyStats ? `<div><strong>Body stats:</strong> ${bodyStats}</div>` : ''}
                    ${session.notes ? `<div><strong>Notes:</strong> ${escapeHtml(session.notes)}</div>` : ''}
                </div>
                ${sections || '<div class="empty-state">No workout detail was saved for this day.</div>'}
            `,
            '← Days'
        );
        modal.querySelector('[data-back]').addEventListener('click', () => renderDays(week));
    }

    renderWeeks();
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
}

function renderWeeklyLog(container) {
    reconcileMissedDays();
    const allSessions = Object.values(appState.sessions).sort((a,b) => b.date.localeCompare(a.date));
    const currentWeekKey = getWeekStartDateKey();
    const olderWeeks = [...new Set(allSessions.map(s => getWeekKeyFromDateKey(s.date)).filter(w => w < currentWeekKey))].sort((a,b) => b.localeCompare(a));
    const loggedSessions = allSessions.filter(s => s.started);
    const completedSessions = allSessions.filter(s => s.completed);
    const missedSessions = allSessions.filter(s => s.missed);
    const incompleteSessions = allSessions.filter(s => s.incomplete);

    const card = document.createElement('section');
    card.className = 'log-card';
    card.innerHTML = `
        <div class="page-title"><span>📈</span><div><h2>Weekly Progress</h2><p>Workout history is grouped by Monday–Sunday weeks.</p></div></div>
        <div class="stats-grid"><div class="stat-card"><span>Completed</span><strong>${completedSessions.length}</strong></div><div class="stat-card"><span>Total Days Logged</span><strong>${loggedSessions.length}</strong></div><div class="stat-card"><span>Incomplete</span><strong>${incompleteSessions.length}</strong></div><div class="stat-card"><span>Missed</span><strong>${missedSessions.length}</strong></div></div>
        <div class="log-section"><h3>Recent Days</h3>${renderWeekGroup(currentWeekKey, true)}</div>
        ${olderWeeks.length ? `<div class="log-section previous-weeks-section"><button type="button" class="secondary-button" id="show-previous-weeks">Show previous weeks</button><div id="previous-weeks" class="previous-weeks hidden">${olderWeeks.map(week => renderWeekGroup(week, true)).join('')}</div></div>` : ''}
    `;

    if (olderWeeks.length) {
        card.querySelector('#show-previous-weeks').addEventListener('click', event => {
            const holder = card.querySelector('#previous-weeks');
            const hidden = holder.classList.toggle('hidden');
            event.currentTarget.textContent = hidden ? 'Show previous weeks' : 'Hide previous weeks';
        });
    }

    renderBodyStatsSection(card);
    const programSection = document.createElement('div');
    programSection.className = 'log-section';
    programSection.innerHTML = `<h3>Program</h3><div class="program-log-card"><div><strong>${escapeHtml(getProgramName())}</strong><span>Archive this completed program without deleting any workout history.</span></div><div class="program-log-actions"><button type="button" class="secondary-button" id="log-new-program">＋ New Program</button><button type="button" class="secondary-button" id="log-archive-program">Archive Program</button></div></div>`;
    programSection.querySelector('#log-new-program').addEventListener('click', openProgramCreator);
    programSection.querySelector('#log-archive-program').addEventListener('click', () => openConfirmModal({ title:'Archive current program?', message:'The program will be saved in Program History. All workout and body-stat history remains intact.', confirmText:'Archive Program', onConfirm:() => archiveCurrentProgram(true) }));
    card.appendChild(programSection);
    const data = document.createElement('div');
    data.className = 'log-section';
    data.innerHTML = `<h3>Data Management</h3><div class="data-actions"><button class="secondary-button" id="exportButton">Export Backup</button><button class="secondary-button" id="importButton">Import Backup</button><button class="danger-button" id="clearButton">Clear All Data</button></div><input type="file" id="importFile" accept=".json" hidden>`;
    data.querySelector('#exportButton').addEventListener('click', exportData);
    const importFile = data.querySelector('#importFile');
    data.querySelector('#importButton').addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', handleImport);
    data.querySelector('#clearButton').addEventListener('click', clearAllData);

    card.appendChild(data);
    container.appendChild(card);
}

function renderHistoryItem(session) {
    const day = getActiveProgram()[session.dayId];
    if (!day) return '';
    let status = 'Scheduled';
    if (session.completed) status = '✓ Completed';
    else if (session.partial) status = '♥ Showed Up';
    else if (session.incomplete) status = '↺ Incomplete';
    else if (session.started) status = '● Active';
    else if (session.missed) status = '✕ Missed';
    const weight = session.weight !== '' && session.weight != null ? session.weight : getBodyStatForDate(session.date, 'weight').value;
    const waist = session.waist !== '' && session.waist != null ? session.waist : getBodyStatForDate(session.date, 'waist').value;
    const bmi = calculateBMI(weight);
    const fat = calculateRFM(weight, waist);
    return `<div class="history-item"><div><strong>${day.icon} ${escapeHtml(day.name)}</strong><span>${escapeHtml(formatDate(session.date))}${session.replacementDayId && getActiveProgram()[session.replacementDayId] ? ` • Replacement: ${escapeHtml(getActiveProgram()[session.replacementDayId].name)}` : ''}</span><span class="history-times">${session.startedAt ? `Started ${formatTime(session.startedAt)}` : ''}${session.completedAt ? ` • Completed ${formatTime(session.completedAt)}` : ''}</span></div><div class="history-metrics-mini"><span>${weight !== '' ? `${escapeHtml(displayWeight(weight))} ${weightUnit()}` : '—'}</span><span>${waist !== '' ? `${escapeHtml(displayWaist(waist))} ${waistUnit()}` : '—'}</span><span>${bmi != null ? `BMI ${bmi.toFixed(1)}` : 'BMI —'}</span><span>${fat != null ? `Fat ${fat.toFixed(1)}%` : 'Fat —'}</span><strong class="history-status ${session.missed || session.incomplete ? 'history-missed' : ''}">${status}</strong></div></div>`;
}

/* =========================================================
   SETTINGS
   ========================================================= */

function openSettings() {
    closeMenus();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="large-modal settings-modal">
            <div class="modal-header">
                <div><h2>Settings</h2><p class="modal-description">Customize GymEssentials and learn about version ${APP_VERSION}.</p></div>
                <button class="modal-close" type="button">×</button>
            </div>
            <div class="settings-list">
                <div class="setting-row settings-theme-row">
                    <div><strong>Display Mode</strong><span>Choose Day, Night, or true-black OLED mode.</span></div>
                    <div class="theme-toggle-group theme-three">
                        <button type="button" class="theme-choice ${appState.settings.theme === 'day' ? 'active' : ''}" data-theme-choice="day">☀️ Day</button>
                        <button type="button" class="theme-choice ${appState.settings.theme === 'night' ? 'active' : ''}" data-theme-choice="night">🌙 Night</button>
                        <button type="button" class="theme-choice ${appState.settings.theme === 'oled' ? 'active' : ''}" data-theme-choice="oled">⬛ OLED</button>
                    </div>
                </div>
                <div class="setting-row"><span>Measurement units</span><strong>${isMetric() ? 'Metric (kg / cm)' : 'Imperial (lb / in)'}</strong></div><div class="setting-row"><span>PWA launch behavior</span><strong>Opens Dashboard</strong></div>
                <div class="setting-row"><span>Logging rule</span><strong>Start Exercise logs the day</strong></div>
                <button type="button" class="setting-action-row" id="open-about">
                    <div><strong>About GymEssentials</strong><span>Version ${APP_VERSION} • View changelog</span></div><span>›</span>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });

    overlay.querySelectorAll('[data-theme-choice]').forEach(button => {
        button.addEventListener('click', () => {
            appState.settings.theme = ['day', 'night', 'oled'].includes(button.dataset.themeChoice) ? button.dataset.themeChoice : 'night';
            applyTheme();
            saveApp();
            close();
            showToast(`${getThemeLabel()} mode enabled`);
        });
    });

    overlay.querySelector('#open-about').addEventListener('click', () => {
        close();
        openAbout();
    });
}

function openAbout() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="large-modal about-modal">
            <div class="modal-header">
                <div><h2>About GymEssentials</h2><p class="modal-description">Version ${APP_VERSION}</p></div>
                <button class="modal-close" type="button">×</button>
            </div>
            <div class="about-content">
                <div class="about-brand">GymEssentials</div>
                <p class="about-description">Personal workout, running, recovery, progression, and exercise-history tracker.</p>
                <div class="about-version">Current version: ${APP_VERSION}</div>
                <div class="about-changelog">
                    <h3>Changelog — ${APP_VERSION}</h3>
                    <ul>${APP_CHANGELOG.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                </div>
            </div>
            <button type="button" class="secondary-button about-back">Back to Settings</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelector('.about-back').addEventListener('click', () => { close(); openSettings(); });
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
}

function exportData() {
    try {
        const backup = buildBackupPayload();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `gymessentials-backup-${getDateKey()}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('Backup exported');
    } catch (error) {
        console.error('GymEssentials export failed:', error);
        alert('Could not create the backup file.');
    }
}

function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const raw = JSON.parse(reader.result);
            const parsed = parseAndNormalizeBackup(raw);
            if (!confirm(describeBackupForImport(parsed))) return;
            appState = parsed.data;
            appState.version = APP_VERSION;
            appState.dataSchemaVersion = DATA_SCHEMA_VERSION;
            appState.currentDay = getTodayKey();
            appState.settings.activeView = 'dashboard';
            appState.settings.weightEntryMode = false;
            appState.settings.weightEntryDayId = null;
            appState.settings.weightEntryDateKey = null;
            appState.settings.weightEntryBackupValues = null;
            reconcileMissedDays();
            saveApp();
            render();
            showToast('Backup imported');
        } catch (error) {
            alert(`Could not import this backup file.\n\n${error.message || 'Invalid backup.'}\n\nYour existing data was not changed.`);
            console.error('GymEssentials import failed:', error);
        } finally {
            if (event?.target) event.target.value = '';
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (
        !confirm(
            'This will permanently delete all workout history and customizations. Continue?'
        )
    ) {
        return;
    }

    localStorage.removeItem(
        STORAGE_KEYS.APP
    );

    location.reload();
}


/* =========================================================
   UTILITIES
   ========================================================= */

function formatDate(dateString) {
    const date =
        new Date(
            `${dateString}T12:00:00`
        );

    return date.toLocaleDateString(
        undefined,
        {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }
    );
}

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function openConfirmModal({ title, message, confirmText = 'Confirm', danger = false, onConfirm }) {
    closeMenus();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="confirm-modal">
            <div class="modal-header">
                <h2>${escapeHtml(title)}</h2>
                <button type="button" class="modal-close" aria-label="Close">×</button>
            </div>
            <p class="modal-message">${escapeHtml(message)}</p>
            <div class="modal-actions">
                <button type="button" class="secondary-button" data-confirm-cancel>Cancel</button>
                <button type="button" class="${danger ? 'danger-button' : 'primary-button'}" data-confirm-ok>${escapeHtml(confirmText)}</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelector('[data-confirm-cancel]').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    overlay.querySelector('[data-confirm-ok]').addEventListener('click', () => { close(); onConfirm?.(); });
}

function closeMenus() {
    document
        .querySelectorAll(
            '.modal-overlay'
        )
        .forEach(element =>
            element.remove()
        );
}

function showToast(message) {
    let toast =
        document.getElementById(
            'toast'
        );

    if (!toast) {
        toast =
            document.createElement(
                'div'
            );

        toast.id = 'toast';
        toast.className = 'toast';

        document.body.appendChild(toast);
    }

    toast.textContent =
        message;

    toast.classList.add(
        'show'
    );

    clearTimeout(toastTimer);

    toastTimer = setTimeout(
        () => {
            toast.classList.remove(
                'show'
            );
        },
        1800
    );
}

function updateDocumentTitle() {
    if (appState.settings.activeView === 'dashboard') { document.title = 'GymEssentials — Dashboard'; return; }
    const day = getActiveProgram()[getTodayKey()];
    document.title = day ? `GymEssentials — ${day.name}` : 'GymEssentials';
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
        const registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
        await registration.update();
        if (registration.waiting && navigator.serviceWorker.controller) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    } catch (error) {
        console.warn('Service worker registration failed:', error);
    }
}

function resetTransientUi() {
    closeMenus();

    appState.settings.weightEntryMode = false;
    appState.settings.weightEntryDayId = null;
    appState.settings.weightEntryDateKey = null;
    appState.settings.weightEntryBackupValues = null;
    appState.currentDay = getTodayKey();
    appState.settings.activeView = 'day';
    applyTheme();

    reconcileMissedDays();
    render();
}


/* =========================================================
   KEYBOARD / ESCAPE HANDLING
   ========================================================= */

document.addEventListener(
    'keydown',
    event => {
        if (event.key === 'Escape') {
            closeMenus();
        }
    }
);

/* Prevent common mobile pinch / double-tap zoom gestures in the app UI. */
document.addEventListener('gesturestart', event => event.preventDefault(), { passive: false });
document.addEventListener('gesturechange', event => event.preventDefault(), { passive: false });
document.addEventListener('gestureend', event => event.preventDefault(), { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', event => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });


/* =========================================================
   PAGE / PWA VISIBILITY
   ========================================================= */

window.addEventListener(
    'pageshow',
    event => {
        /*
         * iOS may restore a PWA from the back-forward cache.
         * A real reload gives it the same clean launch behavior
         * as a cold start.
         */
        if (event.persisted) {
            location.reload();
            return;
        }

        reconcileMissedDays();
    }
);

window.addEventListener(
    'pagehide',
    () => {
        closeMenus();
    }
);

document.addEventListener(
    'visibilitychange',
    () => {
        if (
            document.visibilityState === 'visible'
        ) {
            reconcileMissedDays();

            /*
             * A date change while the app was backgrounded should
             * move the visible day back to the new Today tab.
             */
            if (
                appState.currentDay !== getTodayKey() &&
                appState.settings.activeView === 'day'
            ) {
                appState.currentDay = getTodayKey();
                saveApp();
                render();
            }
        }
    }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {
        loadApp();
        render();
        registerServiceWorker();

        console.log(
            `GymEssentials ${APP_VERSION}`
        );
    }
);
