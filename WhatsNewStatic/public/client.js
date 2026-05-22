const DEFAULT_DURATION_MS = 5000;
const REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 min — before Notion S3 URLs expire

// ─── App Config (defaults; overwritten by Notion App Config on load) ──────────
let appConfig = {
    notionActive:      true,
    notionFrequency:   1,
    instagramActive:   true,
    instagramDuration: 8,
    instagramFrequency: 2,
    folderActive:      false,
    folderFrequency:   6,
    folderDuration:    5,
};

// ─── Source Arrays (each loops independently) ─────────────────────────────────
let notionSlides    = [];
let igSlides        = [];
let folderSlides    = [];
let scheduledSlides = [];

// ─── Playback State ───────────────────────────────────────────────────────────
let pattern      = [];   // e.g. ['notion','folder','folder','ig','folder','folder','notion',...]
let patternIndex = 0;    // current position in the repeating pattern
let notionIndex  = 0;    // cycles independently through notionSlides
let igIndex      = 0;    // cycles independently through igSlides
let folderIndex  = 0;    // cycles independently through folderSlides

let rotationTimeoutId  = null;
let isShowingScheduled = false;
let firedToday = {};
let firedDate  = "";

// ─── Shuffle (Fisher-Yates) ───────────────────────────────────────────────────
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ─── Pattern Builder ──────────────────────────────────────────────────────────
// Uses a Bresenham-style error accumulation so slots are distributed as evenly
// as possible across the cycle, regardless of frequency ratios.
//
// Example — Notion:1, Instagram:2, Folder:6  →  9-slot cycle:
//   folder › ig › folder › folder › notion › folder › ig › folder › folder
//
// To disable a source entirely set its frequency to 0 in App Config.
function buildPattern() {
    const sources = [];
    if (appConfig.notionActive    && notionSlides.length > 0 && appConfig.notionFrequency    > 0)
        sources.push({ key: 'notion', count: appConfig.notionFrequency });
    if (appConfig.instagramActive && igSlides.length     > 0 && appConfig.instagramFrequency > 0)
        sources.push({ key: 'ig',     count: appConfig.instagramFrequency });
    if (appConfig.folderActive    && folderSlides.length  > 0 && appConfig.folderFrequency    > 0)
        sources.push({ key: 'folder', count: appConfig.folderFrequency });

    if (sources.length === 0) return [];
    if (sources.length === 1) return Array(sources[0].count).fill(sources[0].key);

    const total  = sources.reduce((sum, s) => sum + s.count, 0);
    const result = [];
    const errors = new Array(sources.length).fill(0);

    for (let i = 0; i < total; i++) {
        sources.forEach((s, idx) => { errors[idx] += s.count; });
        let maxIdx = 0;
        for (let j = 1; j < errors.length; j++) {
            if (errors[j] > errors[maxIdx]) maxIdx = j;
        }
        result.push(sources[maxIdx].key);
        errors[maxIdx] -= total;
    }

    return result;
}

// ─── Data Fetching ────────────────────────────────────────────────────────────
async function fetchAllSources() {
    // Config is fetched in the same allSettled call so a single failure never
    // crashes the show. Config is applied first so source filtering uses
    // up-to-date settings.
    const [notionResult, configResult, igResult, folderResult] = await Promise.allSettled([
        fetch('/.netlify/functions/fetchNotion').then(r => r.json()),
        fetch('/.netlify/functions/fetchConfig').then(r => r.json()),
        fetch('/.netlify/functions/fetchInstagram').then(r => r.json()),
        fetch('/.netlify/functions/fetchDocumentFolder').then(r => r.json()),
    ]);

    if (configResult.status === 'fulfilled') {
        const cfg = configResult.value;
        appConfig.notionActive      = cfg['Notion Active']      !== 'false';
        appConfig.notionFrequency   = Math.max(0, parseInt(cfg['Notion Frequency'])    || 1);
        appConfig.instagramActive   = cfg['Instagram Active']   !== 'false';
        appConfig.instagramDuration = parseInt(cfg['Instagram Duration'])  || 8;
        appConfig.instagramFrequency= Math.max(0, parseInt(cfg['Instagram Frequency'])|| 2);
        appConfig.folderActive      = cfg['Folder Active']      === 'true';
        appConfig.folderFrequency   = Math.max(0, parseInt(cfg['Folder Frequency'])   || 6);
        appConfig.folderDuration    = parseInt(cfg['Folder Duration'])     || 5;
    }

    const notion = notionResult.status === 'fulfilled' && Array.isArray(notionResult.value)
        ? notionResult.value
        : [];

    const ig = igResult.status === 'fulfilled'
            && appConfig.instagramActive
            && Array.isArray(igResult.value)
        ? igResult.value.map(s => ({ ...s, duration: appConfig.instagramDuration, source: 'instagram' }))
        : [];

    const folder = folderResult.status === 'fulfilled'
                && appConfig.folderActive
                && Array.isArray(folderResult.value)
        ? folderResult.value.map(s => ({ ...s, duration: appConfig.folderDuration, source: 'folder' }))
        : [];

    return { notion, ig, folder };
}

async function refreshSlides() {
    try {
        const { notion, ig, folder } = await fetchAllSources();

        const rotation  = notion.filter(s => !s.scheduledTime);
        const scheduled = notion.filter(s =>  s.scheduledTime);

        // Only update if at least one source has content
        if (rotation.length > 0 || ig.length > 0 || folder.length > 0) {
            notionSlides    = rotation;
            igSlides        = ig;
            folderSlides    = shuffle(folder);
            scheduledSlides = scheduled;

            // Keep per-source cursors in range after a refresh
            if (notionSlides.length  > 0) notionIndex  = notionIndex  % notionSlides.length;
            if (igSlides.length      > 0) igIndex      = igIndex      % igSlides.length;
            if (folderSlides.length  > 0) folderIndex  = folderIndex  % folderSlides.length;

            // Rebuild pattern; preserve approximate position across refreshes
            const newPattern = buildPattern();
            if (newPattern.length > 0) {
                patternIndex = pattern.length > 0
                    ? Math.round((patternIndex / pattern.length) * newPattern.length) % newPattern.length
                    : 0;
            }
            pattern = newPattern;

            console.log(
                `Slides refreshed — notion:${notionSlides.length} ` +
                `ig:${igSlides.length} folder:${folderSlides.length} ` +
                `scheduled:${scheduledSlides.length}`
            );
            console.log('Pattern:', pattern.join(' › '));
        }
    } catch (err) {
        console.error('Slide refresh failed:', err);
    }
}

// ─── Fullscreen ───────────────────────────────────────────────────────────────
function requestFullscreen() {
    const el = document.documentElement;
    if      (el.requestFullscreen)       el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();
    else if (el.msRequestFullscreen)     el.msRequestFullscreen();
}

// ─── Startup ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    refreshSlides();
    setInterval(refreshSlides, REFRESH_INTERVAL_MS);

    const overlay  = document.getElementById('start-overlay');

    overlay.addEventListener('click', () => {
        requestFullscreen();
        overlay.style.display = 'none';

        if (pattern.length > 0) {
            displaySlide();
        } else {
            const waitForData = setInterval(() => {
                if (pattern.length > 0) {
                    clearInterval(waitForData);
                    displaySlide();
                }
            }, 500);
        }
    });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCurrentHHMM() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' +
           now.getMinutes().toString().padStart(2, '0');
}

function getTodayName() {
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        [new Date().getDay()];
}

function getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
}

function getDurationMs(slide) {
    return slide.duration ? slide.duration * 1000 : DEFAULT_DURATION_MS;
}

// ─── Slide Rendering ──────────────────────────────────────────────────────────
function renderSlide(item) {
    const container = document.getElementById('slide-container');
    container.innerHTML = '';

    // Document Folder slides — pure full-screen image, no text overlay
    if (item.source === 'folder') {
        container.className = 'folder-slide';
        const img = document.createElement('img');
        img.src = item.photo;
        img.alt = '';
        img.onload  = () => { img.style.opacity = '1'; };
        img.onerror = () => {
            console.warn('Folder image failed to load, skipping:', item.photo);
            clearTimeout(rotationTimeoutId);
            displaySlide();
        };
        container.appendChild(img);
        return;
    }

    // Notion / Instagram slides — standard title + image + caption layout
    container.className = item.photo ? '' : 'no-photo';

    const nameEl = document.createElement('h2');
    nameEl.textContent = item.name || '';
    container.appendChild(nameEl);

    if (item.photo) {
        const wrapper = document.createElement('div');
        wrapper.className = 'img-wrapper';
        const img = document.createElement('img');
        img.src    = item.photo;
        img.alt    = item.name || '';
        wrapper.appendChild(img);
        container.appendChild(wrapper);
    }

    const textEl = document.createElement('p');
    textEl.textContent = item.text || '';
    container.appendChild(textEl);
}

// ─── Rotation Loop ────────────────────────────────────────────────────────────
// Reads the next slot from the repeating pattern and pulls the next slide from
// that source's independent cycling array. Loop boundaries are seamless because
// every index uses modulo — the pattern never "runs out."
function displaySlide() {
    if (isShowingScheduled || pattern.length === 0) return;

    const source = pattern[patternIndex % pattern.length];
    patternIndex++;

    let slide;
    if (source === 'ig' && igSlides.length > 0) {
        slide = igSlides[igIndex % igSlides.length];
        igIndex++;
    } else if (source === 'folder' && folderSlides.length > 0) {
        slide = folderSlides[folderIndex % folderSlides.length];
        folderIndex++;
    } else if (notionSlides.length > 0) {
        // Fallback: if the pattern slot's source has no slides, show Notion
        slide = notionSlides[notionIndex % notionSlides.length];
        notionIndex++;
    } else {
        return; // nothing at all to show
    }

    renderSlide(slide);
    rotationTimeoutId = setTimeout(() => displaySlide(), getDurationMs(slide));
}

// ─── Scheduled Slide Playback ─────────────────────────────────────────────────
function playScheduledQueue(queue, index, onAllDone) {
    if (index >= queue.length) { onAllDone(); return; }
    const slide = queue[index];
    renderSlide(slide);
    setTimeout(() => playScheduledQueue(queue, index + 1, onAllDone), getDurationMs(slide));
}

// ─── Scheduled Slide Check (every 30 s) ──────────────────────────────────────
setInterval(() => {
    const today = getTodayDateString();
    if (today !== firedDate) { firedDate = today; firedToday = {}; }

    const now       = getCurrentHHMM();
    const todayName = getTodayName();

    const toFire = scheduledSlides.filter(slide => {
        if (slide.scheduledTime !== now) return false;
        const dayMatches = !slide.scheduledDay ||
            slide.scheduledDay === 'Everyday'  ||
            slide.scheduledDay === todayName;
        if (!dayMatches) return false;
        const key = slide.scheduledTime + '_' + slide.name;
        return !firedToday[key];
    });

    if (toFire.length === 0) return;

    toFire.forEach(s => { firedToday[s.scheduledTime + '_' + s.name] = true; });
    isShowingScheduled = true;
    clearTimeout(rotationTimeoutId);

    playScheduledQueue(toFire, 0, () => {
        isShowingScheduled = false;
        displaySlide(); // resumes from where we left off — no reset
    });
}, 30000);
