import os
import cv2
import numpy as np
import mediapipe as mp
import pandas as pd
from tqdm import tqdm

# Input and output paths (use raw strings or forward slashes)
input_dir = r"C:\Users\alwal\OneDrive\Desktop\model\Dataset\train"
output_csv = r"C:\Users\alwal\OneDrive\Desktop\model\Data\landmarks.csv"

# Initialize MediaPipe face mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True)

# Prepare list for rows
all_data = []

# List all emotion folders
emotion_classes = os.listdir(input_dir)

for emotion in tqdm(emotion_classes, desc="Processing emotions"):
    emotion_path = os.path.join(input_dir, emotion)
    for img_name in os.listdir(emotion_path):
        if not img_name.lower().endswith(".jpg"):
            continue

        img_path = os.path.join(emotion_path, img_name)
        image = cv2.imread(img_path)
        if image is None:
            continue

        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb)

        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            row = [img_name, emotion]
            for lm in landmarks:
                row.extend([lm.x, lm.y, lm.z])
            all_data.append(row)

# Create DataFrame
num_landmarks = 468
columns = ['filename', 'emotion'] + [f'{axis}{i}' for i in range(1, num_landmarks+1) for axis in ['x', 'y', 'z']]
df = pd.DataFrame(all_data, columns=columns)

# Save to CSV
os.makedirs(os.path.dirname(output_csv), exist_ok=True)
df.to_csv(output_csv, index=False)

print("✅ All landmarks saved to:", output_csv)
