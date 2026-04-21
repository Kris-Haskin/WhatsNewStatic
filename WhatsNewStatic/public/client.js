const DEFAULT_DURATION_MS = 5000;
const REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes — before Notion URLs expire

let rotationSlides = [];
let scheduledSlides = [];
let currentIndex = 0;
let rotationTimeoutId = null;
let isShowingScheduled = false;
let firedToday = {};
let firedDate = "";
// ??? Data fetching ????????????????????????????????????????????????????????????

async function fetchAllSources() {
    const [notionResult, igResult] = await Promise.allSettled([ /*, igResult */ // ? uncomment when ready
        fetch('/.netlify/functions/fetchNotion').then(r => r.json()),
        fetch('/.netlify/functions/fetchInstagram').then(r => r.json()),  // ? uncomment when ready
    ]);

    const notionSlides = notionResult.status === 'fulfilled' ? notionResult.value : [];
    const igSlides = igResult.status === 'fulfilled' ? igResult.value : []; // ? uncomment when ready


    return interleave(notionSlides, igSlides)  // ? swap in when Instagram is ready
    
    }
function interleave(notionSlides, igSlides) {
    if (igSlides.length === 0) return notionSlides;

    const result = [];
    let igIndex = 0;

    notionSlides.forEach((slide, i) => {
        result.push(slide);
        // Insert an Instagram slide every 4 Notion slides
        if ((i + 1) % 4 === 0 && igIndex < igSlides.length) {
            result.push(igSlides[igIndex++]);
        }
    });

    return result;
}
async function refreshSlides() {
    try {
        const fresh = await fetchAllSources();
        if (fresh.length > 0) {
            rotationSlides = fresh.filter(s => !s.scheduledTime);
            scheduledSlides = fresh.filter(s => s.scheduledTime);
            if (rotationSlides.length > 0) {
                currentIndex = currentIndex % rotationSlides.length;
            }
            console.log(`Slides refreshed: ${rotationSlides.length} rotation, ${scheduledSlides.length} scheduled`);
        }
    } catch (err) {
        console.error('Slide refresh failed:', err);
    }
}

// ??? Fullscreen ???????????????????????????????????????????????????????????????

function requestFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
}

// ??? Startup ??????????????????????????????????????????????????????????????????

document.addEventListener('DOMContentLoaded', () => {
    refreshSlides(); // initial load

    // Re-fetch on a timer to keep photo URLs fresh
    setInterval(refreshSlides, REFRESH_INTERVAL_MS);

    const overlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-btn');

    overlay.addEventListener('click', () => {
        requestFullscreen();
        overlay.style.display = 'none';

        if (rotationSlides.length > 0) {
            displaySlide();
        } else {
            startBtn.textContent = 'Loading...';
            const waitForData = setInterval(() => {
                if (rotationSlides.length > 0) {
                    clearInterval(waitForData);
                    overlay.style.display = 'none';
                    displaySlide();
                }
            }, 500);
        }
    });
});

// ??? Slideshow ????????????????????????????????????????????????????????????????

// REMOVE the entire existing displaySlide function and REPLACE with all of this:

// ??? Helpers ??????????????????????????????????????????????????????????????????

function getCurrentHHMM() {
    const now = new Date();
    return now.getHours().toString().padStart(2, "0") + ":" +
        now.getMinutes().toString().padStart(2, "0");
}

function getTodayName() {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    [new Date().getDay()];
}

function getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
}

function getDurationMs(slide) {
    return slide.duration ? slide.duration * 1000 : DEFAULT_DURATION_MS;
}

// ??? Slide rendering ??????????????????????????????????????????????????????????

function renderSlide(item) {
    const slideContainer = document.getElementById('slide-container');
    slideContainer.innerHTML = '';

    if (item.photo) {
        slideContainer.classList.remove('no-photo');
    } else {
        slideContainer.classList.add('no-photo');
    }

    const nameElement = document.createElement('h2');
    nameElement.textContent = item.name;
    slideContainer.appendChild(nameElement);

    if (item.photo) {
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'img-wrapper';
        const imageElement = document.createElement('img');
        imageElement.src = item.photo;
        imageElement.alt = item.name;
        imgWrapper.appendChild(imageElement);
        slideContainer.appendChild(imgWrapper);
    }

    const textElement = document.createElement('p');
    textElement.textContent = item.text;
    slideContainer.appendChild(textElement);
}

// ??? Rotation loop ????????????????????????????????????????????????????????????

function displaySlide() {
    if (isShowingScheduled || rotationSlides.length === 0) return;

    const slide = rotationSlides[currentIndex];
    renderSlide(slide);

    rotationTimeoutId = setTimeout(() => {
        currentIndex = (currentIndex + 1) % rotationSlides.length;
        displaySlide();
    }, getDurationMs(slide));
}

// ??? Scheduled slide playback ?????????????????????????????????????????????????

function playScheduledQueue(queue, index, onAllDone) {
    if (index >= queue.length) {
        onAllDone();
        return;
    }
    const slide = queue[index];
    renderSlide(slide);
    setTimeout(() => {
        playScheduledQueue(queue, index + 1, onAllDone);
    }, getDurationMs(slide));
}

// ??? Scheduled slide check (every 30 seconds) ?????????????????????????????????

setInterval(() => {
    const today = getTodayDateString();
    if (today !== firedDate) {
        firedDate = today;
        firedToday = {};
    }

    const now = getCurrentHHMM();
    const todayName = getTodayName();

    const toFire = scheduledSlides.filter(slide => {
        if (slide.scheduledTime !== now) return false;
        const dayMatches = !slide.scheduledDay ||
            slide.scheduledDay === "Everyday" ||
            slide.scheduledDay === todayName;
        if (!dayMatches) return false;
        const key = slide.scheduledTime + "_" + slide.name;
        if (firedToday[key]) return false;
        return true;
    });

    if (toFire.length === 0) return;

    toFire.forEach(s => { firedToday[s.scheduledTime + "_" + s.name] = true; });

    isShowingScheduled = true;
    clearTimeout(rotationTimeoutId);

    playScheduledQueue(toFire, 0, () => {
        isShowingScheduled = false;
        displaySlide(); // resumes from currentIndex — no reset
    });

}, 30000);
