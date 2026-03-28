document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/.netlify/functions/fetchNotion');
        const data = await response.json();
        console.log('Fetched data:', data); // confirm data looks right
        displaySlideshow(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

function displaySlideshow(data) {
    if (!data || data.length === 0) {
        console.warn('No slide data received.');
        return;
    }

    const slideContainer = document.getElementById('slide-container');
    let currentIndex = 0;

    const displaySlide = () => {
        const currentItem = data[currentIndex];
        slideContainer.innerHTML = '';

        const nameElement = document.createElement('h2');
        nameElement.textContent = currentItem.name;

        const textElement = document.createElement('p');
        textElement.textContent = currentItem.text;

        slideContainer.appendChild(nameElement);
        slideContainer.appendChild(textElement);

        // Only add image if photo URL actually exists
        if (currentItem.photo) {
            const imageElement = document.createElement('img');
            imageElement.src = currentItem.photo;
            imageElement.alt = currentItem.name;
            slideContainer.appendChild(imageElement);
        }
    };

    const nextSlide = () => {
        currentIndex = (currentIndex + 1) % data.length;
        displaySlide();
    };

    displaySlide();
    setInterval(nextSlide, 5000);
}
