
from pathlib import Path
from types import SimpleNamespace

import torch
import numpy as np
from PIL import Image


# --------------------------------------------------
# PATHS AND CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

CHECKPOINT_PATH = BASE_DIR / "model" / "best_ckpt.pt"

IMAGE_SIZE = 256
DEFAULT_THRESHOLD = 0.10


# --------------------------------------------------
# LOAD BIT MODEL
# --------------------------------------------------

def load_model(output_dir):

    # Import the existing BIT model architecture.
    # This must be available inside the Django project.
    from .model.basic_model import CDEvaluator

    args = SimpleNamespace(
        n_class=2,
        gpu_ids=[],

        net_G="base_transformer_pos_s4_dd8_dedim8",

        input_nc=3,
        output_nc=2,

        init_type="normal",
        init_gain=0.02,

        token_len=4,
        resnet_stages_num=4,
        with_pos="learned",
        enc_depth=1,
        dec_depth=8,
        decoder_dim_head=8,

        checkpoint_dir=str(CHECKPOINT_PATH.parent),
        output_folder=str(output_dir)
    )

    evaluator = CDEvaluator(args)

    evaluator.load_checkpoint(
        checkpoint_name=CHECKPOINT_PATH.name
    )

    evaluator.eval()

    return evaluator


# --------------------------------------------------
# IMAGE PREPROCESSING
# --------------------------------------------------

def preprocess_image(image_path):

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    image = Image.open(image_path).convert("RGB")

    image = image.resize(
        (IMAGE_SIZE, IMAGE_SIZE),
        Image.Resampling.BICUBIC
    )

    image_array = np.array(
        image,
        dtype=np.float32
    ) / 255.0

    image_tensor = torch.from_numpy(
        image_array.transpose(2, 0, 1)
    )

    image_tensor = (image_tensor - 0.5) / 0.5

    return image_tensor.unsqueeze(0)


# --------------------------------------------------
# RUN CHANGE DETECTION
# --------------------------------------------------

def run_change_detection(
    image_a,
    image_b,
    output_dir,
    threshold=DEFAULT_THRESHOLD
):

    image_a = Path(image_a)
    image_b = Path(image_b)
    output_dir = Path(output_dir)

    output_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    if not CHECKPOINT_PATH.exists():
        raise FileNotFoundError(
            f"BIT checkpoint not found: {CHECKPOINT_PATH}"
        )

    if not 0 <= threshold <= 1:
        raise ValueError("Threshold must be between 0 and 1.")

    # CPU-only inference
    device = torch.device("cpu")

    # Load model
    evaluator = load_model(output_dir)

    # Preprocess images
    tensor_a = preprocess_image(image_a).to(device)
    tensor_b = preprocess_image(image_b).to(device)

    batch = {
        "A": tensor_a,
        "B": tensor_b
    }

    # Model prediction
    with torch.inference_mode():

        evaluator._forward_pass(batch)

        logits = evaluator.G_pred

        probabilities = torch.softmax(
            logits,
            dim=1
        )

        changed_probability = probabilities[:, 1, :, :]

        prediction = (
            changed_probability > threshold
        ).long()

    prediction = prediction.squeeze(0).cpu().numpy()

    # --------------------------------------------------
    # SAVE CHANGE MASK
    # --------------------------------------------------

    mask_array = (
        prediction * 255
    ).astype(np.uint8)

    mask_image = Image.fromarray(mask_array)

    mask_path = output_dir / "change_mask.png"

    mask_image.save(mask_path)

    # --------------------------------------------------
    # SAVE OVERLAY
    # --------------------------------------------------

    later_image = Image.open(
        image_b
    ).convert("RGB")

    later_image = later_image.resize(
        (IMAGE_SIZE, IMAGE_SIZE),
        Image.Resampling.BICUBIC
    )

    overlay_array = np.array(later_image).copy()

    changed_pixels = prediction == 1

    red_overlay = np.zeros_like(overlay_array)
    red_overlay[:, :, 0] = 255

    overlay_array[changed_pixels] = (
        0.5 * overlay_array[changed_pixels]
        + 0.5 * red_overlay[changed_pixels]
    ).astype(np.uint8)

    overlay_image = Image.fromarray(overlay_array)

    overlay_path = output_dir / "change_overlay.png"

    overlay_image.save(overlay_path)

    # --------------------------------------------------
    # CALCULATE RESULTS
    # --------------------------------------------------

    changed_pixels_count = int(
        np.sum(prediction == 1)
    )

    total_pixels = prediction.size

    percentage = (
        changed_pixels_count / total_pixels
    ) * 100

    return {
        "mask_path": str(mask_path),
        "overlay_path": str(overlay_path),
        "changed_pixels": changed_pixels_count,
        "total_pixels": total_pixels,
        "change_percentage": round(percentage, 5)
    }
