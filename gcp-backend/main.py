import os
import json
import requests
import google.generativeai as genai
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- Configuration ---
app = Flask(__name__)
# Allow requests from your Vercel frontend, including preview deployments
CORS(app, resources={r"/*": {"origins": ["https://urban-infra.vercel.app", "https://*.vercel.app"]}})

# --- Gemini API Configuration ---
# This will be provided by the Cloud Run environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found as an environment variable.")
genai.configure(api_key=GEMINI_API_KEY)

# --- Gemini Prompt Engineering ---
PROMPT = """
You are "UrbanInfra", an AI agent specializing in urban planning and green space development.
Your task is to analyze a satellite image of an urban or suburban area.

Based on the image, determine if the area is underserved with greenery.

Respond in a strict JSON format. Do not include any text or markdown formatting before or after the JSON object.

1. If the area is UNDERSERVED:
- Set "status" to "Underserved".
- Provide a "greenery_score" from 1 (very poor) to 10 (excellent).
- Provide a single, concise paragraph for "justification".
- Identify 1 to 3 potential locations for new parks. Focus on barren land, unused plots, or large concrete areas.
- For each location, provide:
  - "name": A descriptive name (e.g., "Empty Lot by Elm Street").
  - "reason": A justification for choosing this spot.
  - "location_on_image": The approximate location on the image. Choose one from: "top-left", "top-center", "top-right", "center-left", "center", "center-right", "bottom-left", "bottom-center", "bottom-right".

- Example of an underserved JSON response:
{
  "status": "Underserved",
  "greenery_score": 3,
  "justification": "The area is densely packed with residential buildings with very few public parks visible. The existing greenery is limited to small, private yards.",
  "recommendations": [
    {
      "name": "Barren Plot near Residential Complex",
      "reason": "A significant, undeveloped patch of land is situated next to a dense residential area, making it an ideal candidate for a community park.",
      "location_on_image": "center-left"
    },
    {
      "name": "Unused Space by the Canal",
      "reason": "The large, empty space along the canal could be transformed into a linear park, providing recreational opportunities.",
      "location_on_image": "top-right"
    },
    {
  "name": "Vacant Lot Behind Market",
  "reason": "An open, unused parcel of land behind the local market could be converted into a green space with shaded seating, benefiting both shoppers and nearby residents.",
  "location_on_image": "bottom-center"
}
  ]
}

2. If the area has ADEQUATE greenery:
- Set "status" to "Adequate".
- Provide a "greenery_score" from 1 to 10.
- Provide a single, concise "justification" paragraph explaining why new parks are not a high priority (e.g., presence of large parks, tree-lined streets, community gardens).
- The output for this case should look like this:
{
  "status": "Adequate",
  "greenery_score": 8,
  "justification": "This neighborhood demonstrates a healthy distribution of green spaces, including a large central park, several smaller community gardens, and abundant tree cover along the streets. Resources might be better allocated to other civic improvements."
}
"""

@app.route("/")
def index():
    """Provides a simple health check endpoint."""
    return jsonify({"status": "Backend is running"}), 200


@app.route('/analyze', methods=['POST'])
def analyze_image():
    """Analyzes the image URL provided in the request body."""
    data = request.get_json()
    if not data or 'imageUrl' not in data:
        return jsonify({"error": "imageUrl not provided"}), 400
    
    image_url = data['imageUrl']
    
    try:
        # Download the image
        response = requests.get(image_url)
        response.raise_for_status()

        # Prepare the image for the Gemini API
        image_content = response.content
        mime_type = response.headers.get('Content-Type', 'image/png')
        if not mime_type.startswith('image/'):
            mime_type = 'image/png'
        image_part = {"mime_type": mime_type, "data": image_content}

        # Call the Gemini API
        model = genai.GenerativeModel('gemini-1.5-flash')
        api_response = model.generate_content([PROMPT, image_part])

        # Clean and parse the response
        response_text = api_response.text.strip().removeprefix("```json").removesuffix("```")
        analysis_result = json.loads(response_text)
        
        return jsonify(analysis_result)
    
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to download image. {e}")
        return jsonify({"error": f"Failed to download image from URL: {image_url}"}), 500
    
    except Exception as e:
        # This provides detailed error logging in Google Cloud's logs
        print(f"ERROR: An unexpected error occurred: {type(e).__name__}")
        traceback.print_exc()
        return jsonify({"error": "An internal server error occurred during analysis."}), 500

# Note: The `if __name__ == '__main__':` block is not needed.
# Gunicorn, specified in the Dockerfile, will run the application.