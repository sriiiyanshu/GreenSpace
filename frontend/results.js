// results.js (Updated)

document.addEventListener('DOMContentLoaded', () => {
    const result = JSON.parse(sessionStorage.getItem('analysisResult'));
    const imageUrl = sessionStorage.getItem('analyzedImageUrl');
    
    const loader = document.getElementById('results-loader');
    const content = document.getElementById('result-content');

    if (!result || !imageUrl) {
        // ... (this part remains the same)
        return;
    }

    loader.style.display = 'none';
    content.style.display = 'block';

    // Populate general info
    document.getElementById('analyzed-image').src = imageUrl;
    document.getElementById('status').textContent = result.status;
    document.getElementById('score').textContent = result.greenery_score;
    document.getElementById('justification').textContent = result.justification;

    // Handle recommendations and markers
    if (result.status === 'Underserved' && result.recommendations) {
        const recommendationsContainer = document.getElementById('recommendations-container');
        const recommendationsList = document.getElementById('recommendations-list');
        const imageContainer = document.getElementById('image-container');
        
        recommendationsList.innerHTML = ''; // Clear previous content

        result.recommendations.forEach((rec, index) => {
            const markerId = `marker-${index}`;

            // --- 1. Create the visual marker on the image ---
            const marker = document.createElement('div');
            marker.id = markerId;
            marker.className = `marker marker-${rec.location_on_image}`;
            marker.textContent = index + 1;
            marker.dataset.index = index; // Link to the card
            imageContainer.appendChild(marker);

            // --- 2. Create the recommendation text card ---
            const card = document.createElement('div');
            card.className = 'recommendation-card';
            card.dataset.index = index; // Link to the marker
            card.innerHTML = `
                <h3><span class="rec-number">${index + 1}</span> ${rec.name}</h3>
                <p>${rec.reason}</p>
            `;
            recommendationsList.appendChild(card);
            
            // --- 3. Add interactivity ---
            card.addEventListener('mouseover', () => highlight(index, true));
            card.addEventListener('mouseout', () => highlight(index, false));
            marker.addEventListener('mouseover', () => highlight(index, true));
            marker.addEventListener('mouseout', () => highlight(index, false));
        });

        recommendationsContainer.style.display = 'block';
    }
});

// Helper function for highlighting
function highlight(index, shouldHighlight) {
    const marker = document.querySelector(`.marker[data-index="${index}"]`);
    const card = document.querySelector(`.recommendation-card[data-index="${index}"]`);
    if (marker && card) {
        if (shouldHighlight) {
            marker.classList.add('highlight');
            card.classList.add('highlight');
        } else {
            marker.classList.remove('highlight');
            card.classList.remove('highlight');
        }
    }
}