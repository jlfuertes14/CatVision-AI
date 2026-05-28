"""
CatVision AI — Model Training Script
======================================
Standalone training script for the cat breed classifier.
This mirrors the logic used in the Google Colab notebook.

Usage:
    python train.py --data_dir ../dataset --epochs 20 --batch_size 32

Environment:
    Designed to run on Google Colab with GPU, but works locally on CPU too.
"""

import argparse
import os
import time

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
OXFORD_CLASSES = [
    "abyssinian", "bengal", "birman", "bombay", "british_shorthair",
    "egyptian_mau", "maine_coon", "persian", "ragdoll", "russian_blue",
    "siamese", "sphynx",
]

GANO_CLASSES = [
    "abyssinian", "american_bobtail", "american_shorthair", "bengal",
    "birman", "bombay", "british_shorthair", "egyptian_mau", "maine_coon",
    "persian", "ragdoll", "russian_blue", "siamese", "sphynx", "tuxedo",
]


def get_transforms():
    """Define training and validation image transforms."""
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])

    return train_transform, val_transform


def create_model(num_classes: int):
    """Create a ResNet-50 model with transfer learning."""
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)

    # Freeze early layers for transfer learning
    for param in model.parameters():
        param.requires_grad = False

    # Replace the final classification layer
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(model.fc.in_features, num_classes),
    )

    # Unfreeze the last residual block + fc for fine-tuning
    for param in model.layer4.parameters():
        param.requires_grad = True
    for param in model.fc.parameters():
        param.requires_grad = True

    return model


def train_one_epoch(model, dataloader, criterion, optimizer, device):
    """Train the model for one epoch."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in dataloader:
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

    accuracy = 100.0 * correct / total
    avg_loss = running_loss / len(dataloader)
    return avg_loss, accuracy


def validate(model, dataloader, criterion, device):
    """Validate the model on the validation set."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

    accuracy = 100.0 * correct / total
    avg_loss = running_loss / len(dataloader)
    return avg_loss, accuracy


def main():
    parser = argparse.ArgumentParser(description="Train CatVision AI model")
    parser.add_argument("--data_dir", type=str, default="../dataset")
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=0.001)
    parser.add_argument("--output", type=str, default="./model.pth")
    parser.add_argument(
        "--variant", type=str, default="oxford",
        choices=["oxford", "gano"],
        help="Which class list to use (oxford=12 breeds, gano=15 breeds)",
    )
    args = parser.parse_args()

    # Select class list and device
    class_names = OXFORD_CLASSES if args.variant == "oxford" else GANO_CLASSES
    num_classes = len(class_names)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print(f"Training config: variant={args.variant}, classes={num_classes}, device={device}")
    print(f"  epochs={args.epochs}, batch_size={args.batch_size}, lr={args.lr}")
    print(f"  data_dir={args.data_dir}, output={args.output}")

    # Prepare datasets
    train_transform, val_transform = get_transforms()
    train_dir = os.path.join(args.data_dir, "train")
    val_dir = os.path.join(args.data_dir, "val")

    if not os.path.isdir(train_dir):
        print(f"Error: Training directory not found at {train_dir}")
        print("Organize your dataset as: dataset/train/<breed_name>/image.jpg")
        return

    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_transform)

    train_loader = DataLoader(
        train_dataset, batch_size=args.batch_size, shuffle=True,
        num_workers=2, pin_memory=True,
    )
    val_loader = DataLoader(
        val_dataset, batch_size=args.batch_size, shuffle=False,
        num_workers=2, pin_memory=True,
    )

    print(f"  train_samples={len(train_dataset)}, val_samples={len(val_dataset)}")
    print(f"  class_to_idx: {train_dataset.class_to_idx}")

    # Build model
    model = create_model(num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr,
    )
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

    # Training loop
    best_val_acc = 0.0
    start_time = time.time()

    for epoch in range(1, args.epochs + 1):
        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, device,
        )
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        scheduler.step()

        print(
            f"Epoch {epoch:>3}/{args.epochs}  "
            f"train_loss={train_loss:.4f}  train_acc={train_acc:.1f}%  "
            f"val_loss={val_loss:.4f}  val_acc={val_acc:.1f}%"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), args.output)
            print(f"  -> Saved best model ({val_acc:.1f}% val accuracy)")

    elapsed = time.time() - start_time
    print(f"\nTraining complete in {elapsed / 60:.1f} minutes.")
    print(f"Best validation accuracy: {best_val_acc:.1f}%")
    print(f"Model saved to: {args.output}")


if __name__ == "__main__":
    main()
