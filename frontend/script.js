let map;
let API_KEY;

// Define map styles
const styles = {
  default: [
    { elementType: "labels", featureType: "all", stylers: [{ visibility: "on" }] },
    { featureType: "road", stylers: [{ visibility: "on" }] },
  ],
  hideLabels: [
    { elementType: "labels", featureType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "road", stylers: [{ visibility: "off" }] },
  ],
};

function initMap() {
  const scriptTag = document.querySelector('script[src*="maps.googleapis.com"]');
  const scriptSrc = scriptTag.src;
  API_KEY = new URLSearchParams(scriptSrc.split("?")[1]).get("key");

  const mapOptions = {
    center: { lat: 28.6188330349765, lng: 77.3679098161358 },
    zoom: 12,
    mapTypeId: "satellite",
    disableDefaultUI: true, // Clean map
    streetViewControl: true, // Enable Street View
    styles: styles.hideLabels
  };

  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
    drawingControl: false, // We have our own controls
    rectangleOptions: {
      fillColor: "#4CAF50",
      fillOpacity: 0.2,
      strokeWeight: 2,
      strokeColor: "#FFFFFF",
      clickable: false,
      editable: true,
      zIndex: 1,
    },
  });
  drawingManager.setMap(map);

  google.maps.event.addListener(drawingManager, "rectanglecomplete", (rectangle) => {
    drawingManager.setDrawingMode(null);
    const bounds = rectangle.getBounds();
    generateStaticMapImage(bounds);
    rectangle.setMap(null); // Remove the drawn rectangle from the map

    // Hide the usage tip
    document.getElementById('usage-tip').classList.add('hidden');
    // Deactivate rectangle tool
    document.getElementById('rectangle-tool').classList.remove('active');
    document.getElementById('pan-tool').classList.add('active');
  });

  // --- Map Tools Logic ---
  const rectangleTool = document.getElementById('rectangle-tool');
  const panTool = document.getElementById('pan-tool');

  rectangleTool.addEventListener('click', () => {
    drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
    rectangleTool.classList.add('active');
    panTool.classList.remove('active');
  });

  panTool.addEventListener('click', () => {
    drawingManager.setDrawingMode(null);
    panTool.classList.add('active');
    rectangleTool.classList.remove('active');
  });


  // --- Settings Dropdown Logic ---
  const settingsIcon = document.getElementById('settings-icon');
  const settingsDropdown = document.getElementById('settings-dropdown');
  const labelsToggle = document.getElementById('labels-toggle');

  settingsIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle('visible');
  });

  labelsToggle.addEventListener('change', () => {
    if (labelsToggle.checked) {
      map.setOptions({ styles: styles.default });
    } else {
      map.setOptions({ styles: styles.hideLabels });
    }
  });

  // Close dropdown if clicking outside
  document.addEventListener('click', (e) => {
    if (!settingsDropdown.contains(e.target) && settingsDropdown.classList.contains('visible')) {
      settingsDropdown.classList.remove('visible');
    }
  });
}

function generateStaticMapImage(bounds) {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const visibleArea = `${sw.lat()},${sw.lng()}|${ne.lat()},${ne.lng()}`;
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=640x480&maptype=satellite&visible=${visibleArea}&key=${API_KEY}`;

  const outputContainer = document.getElementById("output-container");
  const imageElement = document.getElementById("static-map-image");
  const analyzeBtn = document.getElementById("analyze-btn");

  imageElement.src = staticMapUrl;
  outputContainer.classList.add("visible");

  analyzeBtn.onclick = () => analyzeArea(staticMapUrl);
}

async function analyzeArea(imageUrl) {
  const analyzeBtn = document.getElementById("analyze-btn");
  const loader = document.getElementById("loader");
  const errorMessage = document.getElementById("error-message");

  loader.style.display = "block";
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analyzing...";
  errorMessage.textContent = "";

  try {
    const response = await fetch("https://urban-infra-backend-637815989971.us-central1.run.app/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: imageUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }

    const analysisResult = await response.json();

    sessionStorage.setItem("analysisResult", JSON.stringify(analysisResult));
    sessionStorage.setItem("analyzedImageUrl", imageUrl);

    // Fade out and redirect
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = "results.html";
    }, 500); // Match CSS transition time

  } catch (error) {
    console.error("Analysis failed:", error);
    errorMessage.textContent = `Analysis failed: ${error.message}`;
    loader.style.display = "none";
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze Area";
  }
}
