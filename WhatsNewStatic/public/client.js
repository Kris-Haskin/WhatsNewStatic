const DEFAULT_DURATION_MS = 5000;
const REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes — before Notion URLs expire

let slides = [];
let currentIndex = 0;

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
            slides = fresh;
            currentIndex = currentIndex % slides.length; // stay in bounds if count changed
            console.log(`Slides refreshed: ${slides.length} loaded`);
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

        if (slides.length > 0) {
            displaySlide();
        } else {
            startBtn.textContent = 'Loading...';
            const waitForData = setInterval(() => {
                if (slides.length > 0) {
                    clearInterval(waitForData);
                    overlay.style.display = 'none';
                    displaySlide();
                }
            }, 500);
        }
    });
});

// ??? Slideshow ????????????????????????????????????????????????????????????????

function displaySlide() {
    const slideContainer = document.getElementById('slide-container');
    const currentItem = slides[currentIndex];

    slideContainer.innerHTML = '';

    if (currentItem.photo) {
        slideContainer.classList.remove('no-photo');
    } else {
        slideContainer.classList.add('no-photo');
    }

    const nameElement = document.createElement('h2');
    nameElement.textContent = currentItem.name;
    slideContainer.appendChild(nameElement);

    if (currentItem.photo) {
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'img-wrapper';
        const imageElement = document.createElement('img');
        imageElement.src = currentItem.photo;
        imageElement.alt = currentItem.name;
        imgWrapper.appendChild(imageElement);
        slideContainer.appendChild(imgWrapper);
    }

    const textElement = document.createElement('p');
    textElement.textContent = currentItem.text;
    slideContainer.appendChild(textElement);

    const slideDuration = currentItem.duration
        ? currentItem.duration * 1000
        : DEFAULT_DURATION_MS;

    currentIndex = (currentIndex + 1) % slides.length;
    setTimeout(displaySlide, slideDuration);
}

