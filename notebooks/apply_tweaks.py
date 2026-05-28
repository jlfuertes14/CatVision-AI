import json
import os

notebook_path = "train_model.ipynb"

with open(notebook_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

for cell in nb.get("cells", []):
    if cell.get("cell_type") == "code":
        source = "".join(cell.get("source", []))
        
        # 1. Unfreeze layer3
        if "# Unfreeze layer4 for fine-tuning" in source and "layer3" not in source:
            new_source = source.replace(
                "# Unfreeze layer4 for fine-tuning\nfor param in model.layer4.parameters():\n    param.requires_grad = True\n",
                "# Unfreeze layer3 and layer4 for fine-tuning\nfor param in model.layer3.parameters():\n    param.requires_grad = True\nfor param in model.layer4.parameters():\n    param.requires_grad = True\n"
            )
            cell["source"] = [line + "\n" for line in new_source.split("\n")]
            # Clean up trailing newlines in array
            if len(cell["source"]) > 0:
                cell["source"][-1] = cell["source"][-1].rstrip("\n")

        # 2. Add scheduler and increase EPOCHS
        if "EPOCHS = 15" in source or "EPOCHS = 15\n" in source:
            new_source = source.replace("EPOCHS = 15", "EPOCHS = 35")
            
            # Add scheduler definition
            if "from torch.optim.lr_scheduler import StepLR" not in new_source:
                new_source = new_source.replace(
                    "optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=0.001)",
                    "optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=0.001)\nfrom torch.optim.lr_scheduler import StepLR\nscheduler = StepLR(optimizer, step_size=7, gamma=0.1)"
                )
            
            # Add scheduler step
            if "scheduler.step()" not in new_source:
                new_source = new_source.replace(
                    "epoch_loss = running_loss / total\n",
                    "scheduler.step()  # Step the scheduler at the end of the train phase\n    epoch_loss = running_loss / total\n"
                )
                
            cell["source"] = [line + "\n" for line in new_source.split("\n")]
            if len(cell["source"]) > 0:
                cell["source"][-1] = cell["source"][-1].rstrip("\n")

        # 3. Change model filename
        if "model_filename =" in source:
            new_source = source.replace(
                'model_filename = "model.pth"',
                'model_filename = "ganomodel.pth"'
            )
            cell["source"] = [line + "\n" for line in new_source.split("\n")]
            if len(cell["source"]) > 0:
                cell["source"][-1] = cell["source"][-1].rstrip("\n")

with open(notebook_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1)

print("Tweaks successfully applied to the notebook!")
