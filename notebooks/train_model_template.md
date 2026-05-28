# CatVision AI — Google Colab Training Notebook

Copy the cells below into a new Google Colab notebook.
Set Runtime → Change runtime type → **T4 GPU**.

---

## Cell 1 — Install Dependencies

```python
!pip install torch torchvision matplotlib tqdm
```

## Cell 2 — Mount Google Drive (optional, to save model)

```python
from google.colab import drive
drive.mount('/content/drive')
```

## Cell 3 — Download Dataset

```python
# Option A: Oxford-IIIT Pet Dataset
import torchvision

dataset = torchvision.datasets.OxfordIIITPet(
    root="./data",
    split="trainval",
    target_types="category",
    download=True,
)

print(f"Total images: {len(dataset)}")
print(f"Classes: {dataset.classes}")
```

## Cell 4 — Filter Cat Breeds Only

```python
# In the Oxford-IIIT dataset, classes are sorted alphabetically.
# The 12 cat breeds use spaces instead of underscores in raw_dataset.classes.
CAT_BREED_NAMES = [
    "Abyssinian", "Bengal", "Birman", "Bombay", "British Shorthair",
    "Egyptian Mau", "Maine Coon", "Persian", "Ragdoll", "Russian Blue",
    "Siamese", "Sphynx"
]

# Find indices of the cat breeds in the original dataset classes list
cat_indices = [dataset.classes.index(name) for name in CAT_BREED_NAMES]
print(f"Cat breed indices in dataset: {cat_indices}")
```

## Cell 5 — Custom Dataset Wrapper & Preprocessing

```python
from torchvision import transforms
from torch.utils.data import DataLoader, random_split

class CatBreedsDataset(torch.utils.data.Dataset):
    def __init__(self, raw_ds, cat_indices, transform=None):
        self.raw_ds = raw_ds
        self.transform = transform
        
        # Filter out dog samples
        self.indices = []
        # Map original class index -> [0..11]
        self.label_map = {orig_idx: i for i, orig_idx in enumerate(cat_indices)}
        
        for idx in range(len(raw_ds)):
            _, label = raw_ds[idx]
            if label in self.label_map:
                self.indices.append(idx)
                
    def __len__(self):
        return len(self.indices)
        
    def __getitem__(self, idx):
        orig_idx = self.indices[idx]
        img, label = self.raw_ds[orig_idx]
        
        if self.transform:
            img = self.transform(img)
            
        return img, self.label_map[label]

# Define training and validation data augmentations
train_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Create full cat dataset
cat_dataset = CatBreedsDataset(dataset, cat_indices)
print(f"Total filtered cat images: {len(cat_dataset)}")

# Split into train (85%) and validation (15%)
train_size = int(0.85 * len(cat_dataset))
val_size = len(cat_dataset) - train_size
train_split, val_split = random_split(cat_dataset, [train_size, val_size])

# Apply transforms to splits
train_split.dataset.transform = train_transform
val_split.dataset.transform = val_transform

# Create DataLoaders
train_loader = DataLoader(train_split, batch_size=32, shuffle=True, num_workers=2)
val_loader = DataLoader(val_split, batch_size=32, shuffle=False, num_workers=2)
```

## Cell 6 — Create Model (ResNet-50 Transfer Learning)

```python
import torch
import torch.nn as nn
from torchvision import models

model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)

# Freeze early layers
for param in model.parameters():
    param.requires_grad = False

# Replace classifier head
model.fc = nn.Sequential(
    nn.Dropout(0.3),
    nn.Linear(model.fc.in_features, len(CAT_BREED_NAMES)),
)

# Unfreeze layer4 for fine-tuning
for param in model.layer4.parameters():
    param.requires_grad = True
for param in model.fc.parameters():
    param.requires_grad = True

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)
print(f"Using device: {device}")
```

## Cell 7 — Training Loop

```python
from tqdm import tqdm

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr=0.001,
)

EPOCHS = 20

for epoch in range(EPOCHS):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS}"):
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    train_acc = 100.0 * correct / total
    print(f"  Train Loss: {running_loss/len(train_loader):.4f} | Acc: {train_acc:.1f}%")

    # Validation
    model.eval()
    val_correct = 0
    val_total = 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = outputs.max(1)
            val_total += labels.size(0)
            val_correct += predicted.eq(labels).sum().item()

    val_acc = 100.0 * val_correct / val_total
    print(f"  Val Acc: {val_acc:.1f}%")
```

## Cell 8 — Save Model

```python
# Save locally
torch.save(model.state_dict(), "catvision_model.pth")

# Save to Google Drive (optional)
# torch.save(model.state_dict(), "/content/drive/MyDrive/catvision_model.pth")

print("Model saved!")
```

## Cell 9 — Download Model

```python
from google.colab import files
files.download("catvision_model.pth")
```

---

## Next Steps
1. Download the `.pth` file
2. Place it in `backend/model/model.pth`
3. Uncomment the PyTorch imports in `backend/app/services/classifier.py`
4. (Optional) Run `model/export_onnx.py` to convert to ONNX for faster inference
