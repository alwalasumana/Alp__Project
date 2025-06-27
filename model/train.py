# import numpy as np
# import torch
# import torch.nn as nn
# from torch.utils.data import DataLoader, TensorDataset, random_split
# from sklearn.metrics import accuracy_score
# from model import FaceEmotionTransformer

# # === Load Your Real Data ===
# X = np.load("data/X_real.npy")  # shape: (N, 468, 3)
# y = np.load("data/y_real.npy")  # shape: (N,)
# print(f"✅ Loaded data: X={X.shape}, y={y.shape}")

# # === Convert to PyTorch tensors ===
# X_tensor = torch.tensor(X, dtype=torch.float32)
# y_tensor = torch.tensor(y, dtype=torch.long)

# # === Train/Val split ===
# dataset = TensorDataset(X_tensor, y_tensor)
# train_size = int(0.8 * len(dataset))
# val_size = len(dataset) - train_size
# train_ds, val_ds = random_split(dataset, [train_size, val_size])

# train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
# val_loader = DataLoader(val_ds, batch_size=32)

# # === Initialize model ===
# model = FaceEmotionTransformer()
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# model.to(device)

# # === Loss and optimizer ===
# criterion = nn.CrossEntropyLoss()
# optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)

# # === Training loop ===
# num_epochs = 20
# for epoch in range(num_epochs):
#     model.train()
#     total_loss = 0

#     for batch_x, batch_y in train_loader:
#         batch_x = batch_x.to(device)
#         batch_y = batch_y.to(device)

#         optimizer.zero_grad()
#         outputs = model(batch_x)
#         loss = criterion(outputs, batch_y)
#         loss.backward()
#         optimizer.step()
#         total_loss += loss.item()

#     # === Validation ===
#     model.eval()
#     all_preds, all_labels = [], []

#     with torch.no_grad():
#         for val_x, val_y in val_loader:
#             val_x = val_x.to(device)
#             val_y = val_y.to(device)
#             outputs = model(val_x)
#             preds = outputs.argmax(dim=1)
#             all_preds.extend(preds.cpu().numpy())
#             all_labels.extend(val_y.cpu().numpy())

#     acc = accuracy_score(all_labels, all_preds)
#     print(f"Epoch {epoch+1}/{num_epochs} - Loss: {total_loss:.4f} - Val Acc: {acc*100:.2f}%")

# # === Save the model ===
# torch.save(model.state_dict(), "face_transformer_model.pt")
# print("✅ Model saved as face_transformer_model.pt")
