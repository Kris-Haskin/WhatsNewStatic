

//document.addEventListener('DOMContentLoaded', async () => {
//    try {
//        const response = await fetch('/.netlify/functions/fetchNotion');
//        const data = await response.json();
//        //console.log(data);
//        processData(data); // Call a function to process and render the data in the DOM
//    } catch (error) {
//        console.error('Error fetching data:', error);
//    }
//});

//function processData(data) {
//    const slideContainer = document.getElementById('slide-container');

//    // Clear any existing content in the slide container
//    slideContainer.innerHTML = '';

//    // Loop through the data and create HTML elements to display it
//    data.forEach(item => {
//        const slideDiv = document.createElement('div');
//        slideDiv.classList.add('slide');

//        // Create elements for displaying the data
//        const nameElement = document.createElement('h2');
//        nameElement.textContent = item.name;

//        const textElement = document.createElement('p');
//        textElement.textContent = item.text;

//        // Append name and text elements to the slide container
//        slideDiv.appendChild(nameElement);
//        slideDiv.appendChild(textElement);

//        // Append the slide to the slide container
//        slideContainer.appendChild(slideDiv);
//    });
//}


document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/.netlify/functions/fetchNotion');
        const data = await response.json();
        displaySlideshow(data); // Call a function to display the slideshow
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

function displaySlideshow(data) {
    const slideContainer = document.getElementById('slide-container');
    let currentIndex = 0;

    // Function to display the current slide
    const displaySlide = () => {
        const currentItem = data[currentIndex];

        // Clear the slide container
        slideContainer.innerHTML = '';

        // Create elements for displaying the current slide
        const nameElement = document.createElement('h2');
        nameElement.textContent = currentItem.name;

        const textElement = document.createElement('p');
        textElement.textContent = currentItem.text;

        const imageElement = document.createElement('img');
        imageElement.src = currentItem.photo;
        imageElement.alt = currentItem.name;

        // Append elements to the slide container
        slideContainer.appendChild(nameElement);
        slideContainer.appendChild(textElement);
        slideContainer.appendChild(imageElement);
    };

    // Function to switch to the next slide
    const nextSlide = () => {
        currentIndex = (currentIndex + 1) % data.length; // Increment index and loop back to the beginning if necessary
        displaySlide(); // Display the new slide
    };

    // Display the first slide
    displaySlide();

    // Set interval to switch to the next slide every 5 seconds
    setInterval(nextSlide, 5000);
}

