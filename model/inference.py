"""
CatVision AI — Inference Utility
==================================
Local inference script for testing the trained model outside the API.

Usage:
    python inference.py --model ./model.pth --image ../test_cat.jpg
    python inference.py --model ./model.pth --image ../test_cat.jpg --variant gano
"""

import argparse

import torch
from PIL import Image
from torchvision import models, transforms

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


def load_model(model_path: str, num_classes: int):
    """Load the trained model from a .pth file."""
    model = models.resnet50(weights=None)
    model.fc = torch.nn.Sequential(
        torch.nn.Dropout(0.3),
        torch.nn.Linear(model.fc.in_features, num_classes),
    )
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()
    return model


def predict_image(model, image_path: str, class_names: list, top_k: int = 3):
    """Run inference on a single image and return top-k predictions."""
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])

    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.nn.functional.softmax(outputs[0], dim=0)

    top_probs, top_indices = torch.topk(probs, top_k)

    results = []
    for prob, idx in zip(top_probs, top_indices):
        results.append({
            "breed": class_names[idx.item()],
            "confidence": round(prob.item() * 100, 1),
        })

    return results


def main():
    parser = argparse.ArgumentParser(description="CatVision AI — Local Inference")
    parser.add_argument("--model", type=str, default="./model.pth")
    parser.add_argument("--image", type=str, required=True)
    parser.add_argument("--top_k", type=int, default=3)
    parser.add_argument(
        "--variant", type=str, default="oxford",
        choices=["oxford", "gano"],
        help="Which class list to use (oxford=12 breeds, gano=15 breeds)",
    )
    args = parser.parse_args()

    class_names = OXFORD_CLASSES if args.variant == "oxford" else GANO_CLASSES
    num_classes = len(class_names)

    print(f"Loading model from {args.model} ({args.variant}, {num_classes} classes)...")
    model = load_model(args.model, num_classes)

    predictions = predict_image(model, args.image, class_names, args.top_k)
    print(f"\nPredictions for: {args.image}")
    for i, p in enumerate(predictions, 1):
        print(f"  #{i}  {p['breed']}: {p['confidence']}%")


if __name__ == "__main__":
    main()
