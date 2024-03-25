
(async () => {
    try {
        const response = await fetch('/.netlify/functions/fetchNotion'); // Fetch data from the serverless function endpoint
        const data = await response.json();
        processData(data); // Call a function to process and render the data in the DOM
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})();

function processData(data) {
    const slideContainer = document.getElementById('slide-container');

    // Clear any existing content in the slide container
    slideContainer.innerHTML = '';

    // Loop through the data and create HTML elements to display it
    data.forEach(item => {
        const slideDiv = document.createElement('div');
        slideDiv.classList.add('slide');

        // Create elements for displaying the data
        const nameElement = document.createElement('h2');
        nameElement.textContent = item.name;

        const textElement = document.createElement('p');
        textElement.textContent = item.text;

        // Append name and text elements to the slide container
        slideDiv.appendChild(nameElement);
        slideDiv.appendChild(textElement);

        // Append the slide to the slide container
        slideContainer.appendChild(slideDiv);
    });
}



