import torch
import torch.nn as nn
import numpy as np

class PositionalEncoding(nn.Module):
    def __init__(self, dim, max_len=500):
        super().__init__()
        pe = torch.zeros(max_len, dim)
        position = torch.arange(0, max_len).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, dim, 2) * -(np.log(10000.0) / dim))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x):
        return x + self.pe[:, :x.size(1)]

class FaceEmotionTransformer(nn.Module):
    def __init__(self, dim=128, num_heads=4, ff_dim=256, num_layers=4, dropout=0.1, num_classes=7):
        super().__init__()
        self.proj = nn.Linear(3, dim)
        self.pos_enc = PositionalEncoding(dim, max_len=468)
        encoder_layer = nn.TransformerEncoderLayer(d_model=dim, nhead=num_heads,
                                                   dim_feedforward=ff_dim, dropout=dropout,
                                                   batch_first=True)
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.norm = nn.LayerNorm(dim)
        self.fc = nn.Linear(dim, num_classes)

    def forward(self, x):
        x = self.proj(x)                   # (B, 468, 128)
        x = self.pos_enc(x)                # (B, 468, 128)
        x = self.encoder(x)                # (B, 468, 128)
        x = self.norm(x)                   # LayerNorm for stability
        x = x.mean(dim=1)                  # Global average pooling
        out = self.fc(x)                   # (B, num_classes)
        return out
