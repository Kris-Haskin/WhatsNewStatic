const DEFAULT_DURATION_MS = 5000;
const REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes — before Notion URLs expire

let slides = [];
let currentIndex = 0;

// ??? Data fetching ????????????????????????????????????????????????????????????

async function fetchAllSources() {
    const [notionResult /*, igResult */] = await Promise.allSettled([
        fetch('/.netlify/functions/fetchNotion').then(r => r.json()),
        // fetch('/.netlify/functions/fetchInstagram').then(r => r.json()),  // ? uncomment when ready
    ]);

    const notionSlides = notionResult.status === 'fulfilled' ? notionResult.value : [];
    // const igSlides = igResult.status === 'fulfilled' ? igResult.value : [];

    return [
        ...notionSlides,
        // ...interleave(notionSlides, igSlides),  // ? swap in when Instagram is ready
    ];
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

//const DEFAULT_DURATION_MS = 5000;

//let slideshowData = null;

//async function prefetchData() {
//    try {
//        const response = await fetch('/.netlify/functions/fetchNotion');
//        slideshowData = await response.json();
//        console.log('Fetched data:', slideshowData);
//    } catch (error) {
//        console.error('Error fetching data:', error);
//    }
//}

//function requestFullscreen() {
//    const el = document.documentElement;
//    if (el.requestFullscreen) {
//        el.requestFullscreen();
//    } else if (el.webkitRequestFullscreen) {
//        el.webkitRequestFullscreen();
//    } else if (el.mozRequestFullScreen) {
//        el.mozRequestFullScreen();
//    } else if (el.msRequestFullscreen) {
//        el.msRequestFullscreen();
//    }
//}

//document.addEventListener('DOMContentLoaded', () => {
//    prefetchData();

//    const overlay = document.getElementById('start-overlay');
//    const startBtn = document.getElementById('start-btn');

//    overlay.addEventListener('click', () => {
//        requestFullscreen();
//        overlay.style.display = 'none';

//        if (slideshowData && slideshowData.length > 0) {
//            displaySlideshow(slideshowData);
//        } else {
//            overlay.style.display = 'flex';
//            startBtn.textContent = 'Loading...';
//            const waitForData = setInterval(() => {
//                if (slideshowData && slideshowData.length > 0) {
//                    clearInterval(waitForData);
//                    overlay.style.display = 'none';
//                    displaySlideshow(slideshowData);
//                }
//            }, 500);
//        }
//    });
//});

//function displaySlideshow(data) {
//    const slideContainer = document.getElementById('slide-container');
//    let currentIndex = 0;

//    const displaySlide = () => {
//        const currentItem = data[currentIndex];
//        slideContainer.innerHTML = '';

//        // Toggle layout mode based on whether a photo exists
//        if (currentItem.photo) {
//            slideContainer.classList.remove('no-photo');
//        } else {
//            slideContainer.classList.add('no-photo');
//        }

//        // Title — top (or centered when no photo)
//        const nameElement = document.createElement('h2');
//        nameElement.textContent = currentItem.name;
//        slideContainer.appendChild(nameElement);

//        // Image — fills middle (skipped when no photo)
//        if (currentItem.photo) {
//            const imgWrapper = document.createElement('div');
//            imgWrapper.className = 'img-wrapper';

//            const imageElement = document.createElement('img');
//            imageElement.src = currentItem.photo;
//            imageElement.alt = currentItem.name;

//            imgWrapper.appendChild(imageElement);
//            slideContainer.appendChild(imgWrapper);
//        }

//        // Text — bottom (or centered when no photo)
//        const textElement = document.createElement('p');
//        textElement.textContent = currentItem.text;
//        slideContainer.appendChild(textElement);

//        const slideDuration = currentItem.duration
//            ? currentItem.duration * 1000
//            : DEFAULT_DURATION_MS;

//        currentIndex = (currentIndex + 1) % data.length;
//        setTimeout(displaySlide, slideDuration);
//    };

//    displaySlide();
//}