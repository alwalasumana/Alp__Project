import torch
import numpy as np
import cv2
import mediapipe as mp
from model import FaceEmotionTransformer  # Make sure this matches your model definition
import time


# Set constants
NUM_LANDMARKS = 468  # Assuming full face mesh (adjust if needed)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Emotion labels for FER dataset (7 classes)
emotion_labels = {
    0: "angry",
    1: "disgust",
    2: "fear",
    3: "happy",
    4: "sad",
    5: "surprise",
    6: "neutral"
}

# Load FER-only trained model
model = FaceEmotionTransformer(num_classes=7)
model.load_state_dict(torch.load("face_transformer_model.pt", map_location=device))
model.to(device)
model.eval()
print("✅ Loaded FER-only model for inference")

# Initialize MediaPipe FaceMesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False)

# Start webcam
cap = cv2.VideoCapture(0)
print("📷 Starting webcam... Press 'q' to quit.")

last_update_time = 0
current_emotion = ""

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(frame_rgb)

    current_time = time.time()
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            coords = []
            for lm in face_landmarks.landmark:
                x = lm.x
                y = lm.y
                z = getattr(lm, 'z', 0.0)
                coords.append([x, y, z])

            if len(coords) == NUM_LANDMARKS:
                coords = np.array(coords)
                coords = coords - coords[1]  # anchor on nose tip (same as training)
                coords = coords / np.linalg.norm(coords, axis=1).max()  # scale (same as training)
                input_tensor = torch.tensor([coords], dtype=torch.float32).to(device)

                with torch.no_grad():
                    outputs = model(input_tensor)
                    outputs = outputs.cpu().numpy()
                    outputs[0, 4] += 1.0  # Boost 'sad' class (try different values if needed)
                    probs = np.exp(outputs) / np.sum(np.exp(outputs), axis=1, keepdims=True)
                    top2 = probs[0].argsort()[-2:][::-1]
                    if top2[0] == 4 or (top2[1] == 4 and probs[0, 4] > 0.2):
                        predicted_class = 4
                    else:
                        predicted_class = top2[0]
                    current_emotion = emotion_labels[predicted_class]
                    last_update_time = current_time

    if current_emotion:
        cv2.putText(frame, f"Emotion: {current_emotion}", (30, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("FER Inference", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

