import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import torch
import numpy as np
from model import FaceEmotionTransformer

# Constants
NUM_LANDMARKS = 468
EMOTION_LABELS = {
    0: "angry",
    1: "disgust",
    2: "fear",
    3: "happy",
    4: "sad",
    5: "surprise",
    6: "neutral"
}

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load model
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "face_transformer_model.pt"))
try:
    model = FaceEmotionTransformer(num_classes=7)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.to(device)
    model.eval()
    print("✅ Loaded FER model")
except Exception as e:
    print("❌ Error loading model:", e)
    raise

app = FastAPI()

class LandmarksRequest(BaseModel):
    landmarks: List[List[float]]  # 468 points, each [x, y, z]

class EmotionResponse(BaseModel):
    emotion: str

@app.post("/predict", response_model=EmotionResponse)
def predict_emotion(req: LandmarksRequest):
    landmarks = req.landmarks
    if len(landmarks) != NUM_LANDMARKS:
        raise HTTPException(status_code=400, detail="Invalid landmark count: Expected 468.")

    try:
        coords = np.array(landmarks)
        coords = coords - coords[1]  # Anchor on nose tip
        coords = coords / np.linalg.norm(coords, axis=1).max()  # Normalize

        input_tensor = torch.tensor([coords], dtype=torch.float32).to(device)
        with torch.no_grad():
            outputs = model(input_tensor).cpu().numpy()

        # Softmax
        outputs[0, 4] += 1.0  # Boost 'sad'
        probs = np.exp(outputs) / np.sum(np.exp(outputs), axis=1, keepdims=True)

        top2 = probs[0].argsort()[-2:][::-1]
        predicted_class = 4 if top2[0] == 4 or (top2[1] == 4 and probs[0][4] > 0.2) else top2[0]
        emotion = EMOTION_LABELS[predicted_class]

        return {"emotion": emotion}

    except Exception as e:
        print("❌ Inference error:", e)
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")

@app.get("/")
def root():
    return {"message": "✅ FastAPI backend is running!"}
