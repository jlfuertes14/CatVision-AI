import os
import shutil
import random
import zipfile
import subprocess

# Settings
KAGGLE_DATASET = "shawngano/gano-cat-breed-image-collection"
RAW_DATA_DIR = "../dataset/gano_raw"
PROCESSED_DATA_DIR = "../dataset/gano"
TRAIN_RATIO = 0.8  # 80% train, 20% validation

def download_dataset():
    """Downloads the dataset using the Kaggle CLI."""
    if not os.path.exists(RAW_DATA_DIR):
        os.makedirs(RAW_DATA_DIR)
        
    print(f"Downloading dataset {KAGGLE_DATASET} from Kaggle...")
    try:
        # Requires Kaggle CLI to be installed and authenticated (~/.kaggle/kaggle.json)
        subprocess.run(["kaggle", "datasets", "download", "-d", KAGGLE_DATASET, "-p", RAW_DATA_DIR], check=True)
        
        # Unzip
        zip_path = os.path.join(RAW_DATA_DIR, f"{KAGGLE_DATASET.split('/')[-1]}.zip")
        if os.path.exists(zip_path):
            print("Unzipping dataset...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(RAW_DATA_DIR)
            os.remove(zip_path) # Clean up zip
            print("Download and extraction complete.")
        else:
            print(f"Error: Could not find downloaded zip file at {zip_path}")
            
    except subprocess.CalledProcessError:
        print("\n[!] ERROR: Kaggle CLI failed.")
        print("Please ensure you have installed the kaggle library: pip install kaggle")
        print("And that you have placed your kaggle.json API token in ~/.kaggle/kaggle.json")
        exit(1)
    except FileNotFoundError:
        print("\n[!] ERROR: 'kaggle' command not found.")
        print("Please run: pip install kaggle")
        exit(1)

def split_dataset():
    """Splits the raw dataset into PyTorch ImageFolder format (train/val)."""
    print("Splitting dataset into train and val directories...")
    
    train_dir = os.path.join(PROCESSED_DATA_DIR, "train")
    val_dir = os.path.join(PROCESSED_DATA_DIR, "val")
    
    if os.path.exists(PROCESSED_DATA_DIR):
        shutil.rmtree(PROCESSED_DATA_DIR)
        
    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(val_dir, exist_ok=True)
    
    # The Gano dataset usually unzips into a root folder or directly has breed folders.
    # We need to find where the breed folders are.
    # Sometimes it extracts into a subfolder with the same name.
    search_dir = RAW_DATA_DIR
    for root, dirs, files in os.walk(RAW_DATA_DIR):
        # Find the directory that actually contains the breed subfolders
        if len(dirs) >= 10: 
            search_dir = root
            break
            
    breeds = [d for d in os.listdir(search_dir) if os.path.isdir(os.path.join(search_dir, d))]
    
    total_images = 0
    for breed in breeds:
        breed_path = os.path.join(search_dir, breed)
        images = [f for f in os.listdir(breed_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        
        random.shuffle(images)
        split_idx = int(len(images) * TRAIN_RATIO)
        
        train_images = images[:split_idx]
        val_images = images[split_idx:]
        
        # Create output dirs
        os.makedirs(os.path.join(train_dir, breed), exist_ok=True)
        os.makedirs(os.path.join(val_dir, breed), exist_ok=True)
        
        # Copy files
        for img in train_images:
            shutil.copy(os.path.join(breed_path, img), os.path.join(train_dir, breed, img))
        for img in val_images:
            shutil.copy(os.path.join(breed_path, img), os.path.join(val_dir, breed, img))
            
        print(f"{breed}: {len(train_images)} train, {len(val_images)} val")
        total_images += len(images)
        
    print(f"\nSuccessfully processed {total_images} images across {len(breeds)} breeds.")
    print(f"Dataset is ready at: {os.path.abspath(PROCESSED_DATA_DIR)}")

if __name__ == "__main__":
    download_dataset()
    split_dataset()
