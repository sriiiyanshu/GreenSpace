let map;
let API_KEY;

function initMap() {
  const scriptTag = document.querySelector('script[src*="maps.googleapis.com"]');
  const scriptSrc = scriptTag.src;
  API_KEY = new URLSearchParams(scriptSrc.split("?")[1]).get("key");

  const mapOptions = {
    center: { lat: 40.7128, lng: -74.006 },
    zoom: 12,
    mapTypeId: "satellite",
  };

  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [google.maps.drawing.OverlayType.RECTANGLE],
    },
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
  outputContainer.style.display = "block";
  outputContainer.scrollIntoView({ behavior: "smooth" });

  // Add event listener to the analyze button ONLY after the image is ready
  analyzeBtn.onclick = () => analyzeArea(staticMapUrl);
}

async function analyzeArea(imageUrl) {
  const analyzeBtn = document.getElementById("analyze-btn");
  const loader = document.getElementById("loader");
  const errorMessage = document.getElementById("error-message");

  // Show loader and disable button
  loader.style.display = "block";
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analyzing...";
  errorMessage.textContent = "";

  try {
    // Call our backend API
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

    // Store results in sessionStorage to pass to the next page
    sessionStorage.setItem("analysisResult", JSON.stringify(analysisResult));
    sessionStorage.setItem("analyzedImageUrl", imageUrl);

    // Redirect to the results page
    window.location.href = "results.html";
  } catch (error) {
    console.error("Analysis failed:", error);
    errorMessage.textContent = `Analysis failed: ${error.message}`;
    // Hide loader and re-enable button
    loader.style.display = "none";
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze Area";
  }
}
