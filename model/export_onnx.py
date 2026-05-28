"""
CatVision AI — ONNX Export Script
====================================
Convert the trained PyTorch model (.pth) to ONNX format for lighter,
faster inference on the DigitalOcean deployment.

Usage:
    python export_onnx.py --input model.pth --output model.onnx
    python export_onnx.py --input model.pth --output model.onnx --variant gano
"""

import argparse
import os

import torch
from torchvision import models

OXFORD_CLASSES = 12
GANO_CLASSES = 15


def export_to_onnx(input_path: str, output_path: str, num_classes: int):
    """
    Load a .pth model and export it to ONNX format.

    Args:
        input_path: Path to the trained .pth model.
        output_path: Path to save the .onnx model.
        num_classes: Number of output classes.
    """
    # 1. Recreate the model architecture
    model = models.resnet50(weights=None)
    model.fc = torch.nn.Sequential(
        torch.nn.Dropout(0.3),
        torch.nn.Linear(model.fc.in_features, num_classes),
    )

    # 2. Load trained weights
    model.load_state_dict(torch.load(input_path, map_location="cpu"))
    model.eval()

    # 3. Create a dummy input tensor (batch=1, channels=3, 224x224)
    dummy_input = torch.randn(1, 3, 224, 224)

    # 4. Export to ONNX
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        input_names=["image"],
        output_names=["predictions"],
        dynamic_axes={
            "image": {0: "batch_size"},
            "predictions": {0: "batch_size"},
        },
        opset_version=17,
    )

    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"Model exported to {output_path}")
    print(f"File size: {size_mb:.1f} MB")


def main():
    parser = argparse.ArgumentParser(description="Export PyTorch model to ONNX")
    parser.add_argument("--input", type=str, default="./model.pth")
    parser.add_argument("--output", type=str, default="./model.onnx")
    parser.add_argument(
        "--variant", type=str, default="oxford",
        choices=["oxford", "gano"],
        help="Which variant to export (oxford=12 classes, gano=15 classes)",
    )
    args = parser.parse_args()

    num_classes = OXFORD_CLASSES if args.variant == "oxford" else GANO_CLASSES
    print(f"Exporting {args.variant} model ({num_classes} classes)...")
    export_to_onnx(args.input, args.output, num_classes)


if __name__ == "__main__":
    main()
