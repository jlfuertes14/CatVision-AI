import json
import os

notebook_path = "train_model.ipynb"

# Load the existing notebook
with open(notebook_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Reconstruct cells
new_cells = []

# Cell 0: Markdown Intro
new_cells.append({
    "cell_type": "markdown",
    "metadata": {},
    "source": [
        "# CatVision AI — Model Training Notebook\n",
        "\n",
        "Welcome to the training notebook for **CatVision AI**! This notebook will download the **Gano Cat Breed Image Collection** (15 breeds, ~5600 images), preprocess the images, and train a ResNet-50 model using PyTorch.\n",
        "\n",
        "### ⚠️ IMPORTANT\n",
        "Before running any cells, make sure you are using a GPU runtime:\n",
        "1. In the top menu, go to **Runtime** → **Change runtime type**.\n",
        "2. Select **T4 GPU** (or any available GPU) under Hardware Accelerator.\n",
        "3. Click **Save**."
    ]
})

# Cell 1: Markdown
new_cells.append({
    "cell_type": "markdown",
    "metadata": {},
    "source": ["## 1. Install & Import Dependencies"]
})

# Cell 2: Code Pip
new_cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
        "# Install standard packages\n",
        "!pip install torch torchvision matplotlib tqdm kaggle"
    ]
})

# Cell 3: Code Imports
new_cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
        "import os\n",
        "import time\n",
        "import copy\n",
        "import zipfile\n",
        "import numpy as np\n",
        "import matplotlib.pyplot as plt\n",
        "from tqdm import tqdm\n",
        "\n",
        "import torch\n",
        "import torch.nn as nn\n",
        "import torch.optim as optim\n",
        "from torch.utils.data import DataLoader, Subset\n",
        "import torchvision\n",
        "from torchvision import datasets, models, transforms"
    ]
})

# Cell 4: Markdown Mount Drive
new_cells.append({
    "cell_type": "markdown",
    "metadata": {},
    "source": [
        "## 2. Mount Google Drive (Optional)\n",
        "Uncomment and run this cell if you want to mount your Google Drive to save checkpoints directly to your drive storage."
    ]
})

# Cell 5: Code Mount Drive
new_cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
        "# from google.colab import drive\n",
        "# drive.mount('/content/drive')"
    ]
})

# Cell 6: Markdown Download
new_cells.append({
    "cell_type": "markdown",
    "metadata": {},
    "source": [
        "## 3. Download & Extract Gano Dataset\n",
        "We use the Gano Cat Breed Image Collection from Kaggle. Note: You will need your `kaggle.json` uploaded to Colab for the CLI to authenticate."
    ]
})

# Cell 7: Code Download
new_cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
        "# Set Kaggle config dir to where we upload kaggle.json if necessary\n",
        "# import os\n",
        "# os.environ['KAGGLE_CONFIG_DIR'] = '/content'\n",
        "\n",
        "!kaggle datasets download -d shawngano/gano-cat-breed-image-collection -p ./data\n",
        "\n",
        "zip_path = \"./data/gano-cat-breed-image-collection.zip\"\n",
        "extract_path = \"./data/gano\"\n",
        "\n",
        "if os.path.exists(zip_path):\n",
        "    print(\"Unzipping dataset...\")\n",
        "    with zipfile.ZipFile(zip_path, 'r') as zip_ref:\n",
        "        zip_ref.extractall(extract_path)\n",
        "    print(\"Unzipping complete.\")\n",
        "else:\n",
        "    print(\"Warning: Zip file not found. Ensure the kaggle command worked.\")"
    ]
})

# Cell 8: Markdown Dataset & Transforms
new_cells.append({
    "cell_type": "markdown",
    "metadata": {},
    "source": [
        "## 4. Dataset Loading & Transformations\n",
        "We apply data augmentation for training, and setup standard normalization for validation."
    ]
})

# Cell 9: Code Loaders
new_cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
        "train_transform = transforms.Compose([\n",
        "    transforms.Resize((256, 256)),\n",
        "    transforms.RandomCrop(224),\n",
        "    transforms.RandomHorizontalFlip(),\n",
        "    transforms.RandomRotation(15),\n",
        "    transforms.ColorJitter(brightness=0.2, contrast=0.2),\n",
        "    transforms.ToTensor(),\n",
        "    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])\n",
        "])\n",
        "\n",
        "val_transform = transforms.Compose([\n",
        "    transforms.Resize((224, 224)),\n",
        "    transforms.ToTensor(),\n",
        "    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])\n",
        "])\n",
        "\n",
        "# Find the actual folder containing the breeds\n",
        "data_dir = \"./data/gano\"\n",
        "for root, dirs, files in os.walk(extract_path):\n",
        "    if len(dirs) >= 10:\n",
        "        data_dir = root\n",
        "        break\n",
        "\n",
        "# Create two datasets with different transforms\n",
        "dataset_train = datasets.ImageFolder(root=data_dir, transform=train_transform)\n",
        "dataset_val = datasets.ImageFolder(root=data_dir, transform=val_transform)\n",
        "\n",
        "print(f\"Found {len(dataset_train.classes)} breeds: {dataset_train.classes}\")\n",
        "print(f\"Total images: {len(dataset_train)}\")\n",
        "\n",
        "# Split 85% train, 15% val\n",
        "dataset_size = len(dataset_train)\n",
        "indices = list(range(dataset_size))\n",
        "np.random.shuffle(indices)\n",
        "split = int(np.floor(0.15 * dataset_size))\n",
        "\n",
        "train_indices, val_indices = indices[split:], indices[:split]\n",
        "\n",
        "train_dataset = Subset(dataset_train, train_indices)\n",
        "val_dataset = Subset(dataset_val, val_indices)\n",
        "\n",
        "train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=2)\n",
        "val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=2)"
    ]
})

# Cell 10: Markdown Model
new_cells.append({
    "cell_type": "markdown",
    "metadata": {},
    "source": [
        "## 5. Define Model (ResNet-50 Transfer Learning)\n",
        "We load a pre-trained ResNet-50, freeze early layers, and replace the classification head to output our classes."
    ]
})

# Cell 11: Code Model
new_cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
        "model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)\n",
        "\n",
        "# Freeze early layers\n",
        "for param in model.parameters():\n",
        "    param.requires_grad = False\n",
        "\n",
        "# Replace classification layer\n",
        "num_features = model.fc.in_features\n",
        "num_classes = len(dataset_train.classes)\n",
        "\n",
        "model.fc = nn.Sequential(\n",
        "    nn.Dropout(0.3),\n",
        "    nn.Linear(num_features, num_classes)\n",
        ")\n",
        "\n",
        "# Unfreeze layer4 for fine-tuning\n",
        "for param in model.layer4.parameters():\n",
        "    param.requires_grad = True\n",
        "for param in model.fc.parameters():\n",
        "    param.requires_grad = True\n",
        "\n",
        "device = torch.device(\"cuda\" if torch.cuda.is_available() else \"cpu\")\n",
        "model = model.to(device)\n",
        "print(f\"Model configured on: {device}\")"
    ]
})

# Copy the remaining cells from the original notebook (Training pipeline and Save)
for cell in nb["cells"]:
    if cell.get("source") and len(cell["source"]) > 0:
        source = "".join(cell["source"])
        if "## 6. Training Pipeline" in source:
            new_cells.append(cell)
        elif "criterion = nn.CrossEntropyLoss()" in source:
            new_cells.append(cell)
        elif "## 7. Save & Download Model" in source:
            new_cells.append(cell)
        elif "model_filename = " in source:
            new_cells.append(cell)

nb["cells"] = new_cells

with open(notebook_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1)

print("Notebook successfully updated.")
