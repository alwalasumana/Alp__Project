import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
from tqdm import tqdm
from model import FaceEmotionTransformer
from sklearn.utils.class_weight import compute_class_weight

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class FERDataset(Dataset):
    def __init__(self, csv_file):
        self.df = pd.read_csv(csv_file)
        self.emotion_map = {
            "angry": 0, "disgust": 1, "fear": 2, "happy": 3,
            "sad": 4, "surprise": 5, "neutral": 6
        }
        
        # Convert emotion labels to numeric
        self.labels = np.array([self.emotion_map[emotion] for emotion in self.df['emotion']], dtype=int)
        
        # Compute class weights for imbalanced dataset
        classes = np.unique(self.labels)
        if len(classes) > 0:
            self.class_weights = compute_class_weight(class_weight='balanced', classes=classes, y=self.labels)
        else:
            self.class_weights = None

        print(f"📦 Loaded {len(self.df)} samples | Classes: {classes}")

    def __len__(self): 
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        
        # Extract landmark coordinates - columns are: filename, emotion, x1, y1, z1, x2, y2, z2, ..., x468, y468, z468
        coords = []
        for i in range(1, 469):  # 468 landmarks
            try:
                x = row[f'x{i}']
                y = row[f'y{i}']
                z = row[f'z{i}']
                coords.append([x, y, z])
            except KeyError as e:
                print(f"❌ Error: Column {e} not found. Check your CSV structure.")
                print(f"Available columns: {self.df.columns.tolist()[:10]}...")
                raise
        
        coords = np.array(coords)
        coords = coords - coords[1]  # anchor on nose tip
        coords = coords / np.linalg.norm(coords, axis=1).max()  # scale
        coords = torch.tensor(coords, dtype=torch.float32)
        label = torch.tensor(self.labels[idx], dtype=torch.long)
        return coords, label

class LabelSmoothingLoss(nn.Module):
    def __init__(self, classes, smoothing=0.1):
        super().__init__()
        self.confidence = 1.0 - smoothing
        self.smoothing = smoothing
        self.cls = classes
        self.log_softmax = nn.LogSoftmax(dim=-1)

    def forward(self, x, target):
        logprobs = self.log_softmax(x)
        with torch.no_grad():
            true_dist = torch.zeros_like(logprobs)
            true_dist.fill_(self.smoothing / (self.cls - 1))
            true_dist.scatter_(1, target.unsqueeze(1), self.confidence)
        return torch.mean(torch.sum(-true_dist * logprobs, dim=-1))

# Load dataset from single CSV file
csv_file = "Data/landmarks.csv"

# Check if CSV file exists
if not os.path.exists(csv_file):
    print(f"❌ Error: CSV file not found at {csv_file}")
    print("Please run Landmarks.py first to extract landmarks from your images.")
    exit(1)

dataset = FERDataset(csv_file)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

model = FaceEmotionTransformer(num_classes=7).to(device)
if os.path.exists("face_transformer_model.pt"):
   # model.load_state_dict(torch.load("face_transformer_model.pt"))
    print("✅ Loaded pretrained model")

criterion = LabelSmoothingLoss(classes=7)
optimizer = optim.Adam(model.parameters(), lr=1e-4)
epochs = 20

for epoch in range(1, epochs + 1):
    model.train()
    total_loss, correct, total = 0, 0, 0
    loop = tqdm(dataloader, desc=f"Epoch {epoch}/{epochs}")

    for coords, labels in loop:
        coords, labels = coords.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(coords)
        loss = criterion(outputs, labels)

        if torch.isnan(loss): continue
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()

        total_loss += loss.item()
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

        loop.set_postfix(loss=loss.item(), acc=100. * correct / total)

    print(f"✅ Epoch {epoch}: Accuracy = {100. * correct / total:.2f}%")
    torch.save(model.state_dict(), "face_transformer_model.pt")
