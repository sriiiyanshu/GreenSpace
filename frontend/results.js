
document.addEventListener('DOMContentLoaded', () => {
    const result = JSON.parse(sessionStorage.getItem('analysisResult'));
    const imageUrl = sessionStorage.getItem('analyzedImageUrl');
    
    const loader = document.getElementById('results-loader');
    const content = document.getElementById('result-content');
    const backLink = document.querySelector('.navbar-title');

    backLink.style.cursor = 'pointer';
    backLink.addEventListener('click', () => {
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    });

    if (!result || !imageUrl) {
        loader.innerHTML = '<p>No analysis data found. <a href="index.html">Go back</a>.</p>';
        return;
    }

    loader.style.display = 'none';
    content.style.display = 'flex';

    document.getElementById('analyzed-image').src = imageUrl;
    const statusEl = document.getElementById('status');
    statusEl.textContent = result.status;
    statusEl.style.backgroundColor = getStatusColor(result.status);

    document.getElementById('score').textContent = result.greenery_score;
    document.getElementById('justification').textContent = result.justification;

    if (result.status === 'Underserved' && result.recommendations) {
        const recommendationsContainer = document.getElementById('recommendations-container');
        const recommendationsList = document.getElementById('recommendations-list');
        const imageContainer = document.getElementById('image-container');
        
        recommendationsList.innerHTML = '';

        result.recommendations.forEach((rec, index) => {
            const markerId = `marker-${index}`;

            const marker = document.createElement('div');
            marker.id = markerId;
            marker.className = `marker marker-${rec.location_on_image}`;
            marker.textContent = index + 1;
            marker.dataset.index = index;
            imageContainer.appendChild(marker);

            const card = document.createElement('div');
            card.className = 'recommendation-card';
            card.dataset.index = index;
            card.innerHTML = `
                <h3><span class="rec-number">${index + 1}</span> ${rec.name}</h3>
                <p>${rec.reason}</p>
            `;
            recommendationsList.appendChild(card);
            
            card.addEventListener('mouseover', () => highlight(index, true));
            card.addEventListener('mouseout', () => highlight(index, false));
            marker.addEventListener('mouseover', () => highlight(index, true));
            marker.addEventListener('mouseout', () => highlight(index, false));
        });

        recommendationsContainer.style.display = 'block';
    }
});

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

function getStatusColor(status) {
    switch (status) {
        case 'Underserved':
            return '#d9534f';
        case 'Adequate':
            return '#5cb85c';
        case 'Well-Served':
            return '#28a745';
        default:
            return '#777';
    }
}
