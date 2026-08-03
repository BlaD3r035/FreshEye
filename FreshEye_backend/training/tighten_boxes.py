"""
     pip install segment-anything opencv-python pyyaml tqdm
"""

import argparse
import csv
import shutil
import sys
from pathlib import Path

import cv2
import numpy as np
import yaml
from tqdm import tqdm

BASE_DIR = Path(__file__).resolve().parent  
SPLITS = ["train", "val", "test"]


def load_yolo_labels(label_path: Path):
    boxes = []
    if not label_path.exists():
        return boxes
    with open(label_path) as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 5:
                continue
            cls = int(parts[0])
            x, y, w, h = map(float, parts[1:5])
            boxes.append((cls, x, y, w, h))
    return boxes


def yolo_to_xyxy(box, img_w, img_h):
    cls, x, y, w, h = box
    x1 = (x - w / 2) * img_w
    y1 = (y - h / 2) * img_h
    x2 = (x + w / 2) * img_w
    y2 = (y + h / 2) * img_h
    return cls, np.array([x1, y1, x2, y2], dtype=np.float32)


def xyxy_to_yolo(cls, xyxy, img_w, img_h):
    x1, y1, x2, y2 = xyxy
    x1, x2 = np.clip([x1, x2], 0, img_w)
    y1, y2 = np.clip([y1, y2], 0, img_h)
    w, h = x2 - x1, y2 - y1
    xc, yc = x1 + w / 2, y1 + h / 2
    return cls, xc / img_w, yc / img_h, w / img_w, h / img_h


def box_area(xyxy):
    x1, y1, x2, y2 = xyxy
    return max(0.0, x2 - x1) * max(0.0, y2 - y1)


def largest_connected_component(mask):
  
    mask_u8 = (mask.astype(np.uint8)) * 255
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask_u8, connectivity=8)
    if num_labels <= 1:
        return mask 
    areas = stats[1:, cv2.CC_STAT_AREA]
    largest_label = 1 + int(np.argmax(areas))
    return labels == largest_label


def mask_to_tight_box(mask):
    mask = largest_connected_component(mask)
    ys, xs = np.where(mask)
    if len(xs) == 0 or len(ys) == 0:
        return None
    return np.array([xs.min(), ys.min(), xs.max(), ys.max()], dtype=np.float32)


def pad_box(xyxy, pad_ratio, img_w, img_h):
    x1, y1, x2, y2 = xyxy
    w, h = x2 - x1, y2 - y1
    x1 -= w * pad_ratio
    x2 += w * pad_ratio
    y1 -= h * pad_ratio
    y2 += h * pad_ratio
    return np.array([max(0, x1), max(0, y1), min(img_w, x2), min(img_h, y2)])



def process_split(split, dataset_dir, out_dir, predictor, log_rows,
                   pad_ratio, min_area_ratio, max_area_ratio,
                   dry_run, dry_run_n, review_dir):
    images_dir = dataset_dir / "images" / split
    labels_dir = dataset_dir / "labels" / split
    if not images_dir.exists():
        print(f"  [{split}] {images_dir} does not exist, skipping.")
        return

    out_images_dir = out_dir / "images" / split
    out_labels_dir = out_dir / "labels" / split
    out_images_dir.mkdir(parents=True, exist_ok=True)
    out_labels_dir.mkdir(parents=True, exist_ok=True)

    img_paths = sorted([p for p in images_dir.iterdir()
                         if p.suffix.lower() in (".jpg", ".jpeg", ".png")])
    if dry_run:
        img_paths = img_paths[:dry_run_n]

    for img_path in tqdm(img_paths, desc=f"[{split}]"):
        label_path = labels_dir / (img_path.stem + ".txt")
        boxes = load_yolo_labels(label_path)

        image_bgr = cv2.imread(str(img_path))
        if image_bgr is None:
            log_rows.append([split, img_path.name, "", "ERROR_LECTURA_IMAGEN",
                              "", "", "", "conservada_original"])
            shutil.copy2(img_path, out_images_dir / img_path.name)
            if label_path.exists():
                shutil.copy2(label_path, out_labels_dir / label_path.name)
            continue

        img_h, img_w = image_bgr.shape[:2]
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        new_lines = []
        vis_image = image_bgr.copy() if dry_run else None

        if boxes:
            predictor.set_image(image_rgb)

        for cls, x, y, w, h in boxes:
            _, orig_xyxy = yolo_to_xyxy((cls, x, y, w, h), img_w, img_h)
            orig_area = box_area(orig_xyxy)
            action = "ajustada"
            final_xyxy = orig_xyxy

            try:
                masks, scores, _ = predictor.predict(
                    box=orig_xyxy[None, :],
                    multimask_output=False,
                )
                mask = masks[0]
                tight = mask_to_tight_box(mask)

                if tight is None:
                    action = "conservada_mascara_vacia"
                    final_xyxy = orig_xyxy
                else:
                    tight_padded = pad_box(tight, pad_ratio, img_w, img_h)
                    new_area = box_area(tight_padded)
                    ratio = new_area / orig_area if orig_area > 0 else 0

                    if ratio < min_area_ratio or ratio > max_area_ratio:
                       
                        action = f"conservada_ratio_sospechoso({ratio:.2f})"
                        final_xyxy = orig_xyxy
                    else:
                        final_xyxy = tight_padded

            except Exception as e:
                action = f"conservada_error_sam({type(e).__name__})"
                final_xyxy = orig_xyxy

            new_area = box_area(final_xyxy)
            log_rows.append([
                split, img_path.name, cls,
                f"{orig_area:.1f}", f"{new_area:.1f}",
                f"{(new_area/orig_area if orig_area>0 else 0):.3f}",
                action,
            ])

            _, xc, yc, ww, hh = xyxy_to_yolo(cls, final_xyxy, img_w, img_h)
            new_lines.append(f"{cls} {xc:.6f} {yc:.6f} {ww:.6f} {hh:.6f}")

            if dry_run:
                ox1, oy1, ox2, oy2 = orig_xyxy.astype(int)
                nx1, ny1, nx2, ny2 = final_xyxy.astype(int)
                cv2.rectangle(vis_image, (ox1, oy1), (ox2, oy2), (0, 0, 255), 2)   # rojo = original
                cv2.rectangle(vis_image, (nx1, ny1), (nx2, ny2), (0, 255, 0), 2)   # verde = ajustada

        with open(out_labels_dir / (img_path.stem + ".txt"), "w") as f:
            f.write("\n".join(new_lines))

        shutil.copy2(img_path, out_images_dir / img_path.name)

        if dry_run and vis_image is not None:
            review_dir.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(review_dir / f"{split}_{img_path.name}"), vis_image)


def main():
    parser = argparse.ArgumentParser(
        description="Tightens loose YOLO boxes using SAM, without touching the original dataset."
    )
    parser.add_argument("--dataset", default=str((BASE_DIR / ".." / "dataset").resolve()),
                         help="Original dataset folder (read-only, never modified).")
    parser.add_argument("--output", default=str((BASE_DIR / ".." / "dataset_tight").resolve()),
                         help="New folder where the tightened dataset is written.")
    parser.add_argument("--checkpoint", required=True,
                         help="Path to the SAM checkpoint (.pth).")
    parser.add_argument("--model_type", default="vit_b", choices=["vit_b", "vit_l", "vit_h"],
                         help="SAM backbone type. vit_b is the fastest/lightest.")
    parser.add_argument("--device", default="cuda", choices=["cuda", "cpu"])
    parser.add_argument("--pad", type=float, default=0.02,
                         help="Extra padding around the tightened mask (fraction of height/width).")
    parser.add_argument("--min_area_ratio", type=float, default=0.15,
                         help="If the new box is smaller than this fraction of the original, the adjustment is discarded.")
    parser.add_argument("--max_area_ratio", type=float, default=1.05,
                         help="If the new box is larger than this fraction of the original, the adjustment is discarded.")
    parser.add_argument("--dry_run", action="store_true",
                         help="Processes only a few images and saves visual comparisons for review.")
    parser.add_argument("--dry_run_n", type=int, default=15)
    parser.add_argument("--overwrite_output", action="store_true",
                         help="Allows writing to --output even if it already has content.")
    parser.add_argument("--write_data_yaml", action="store_true",
                         help="Generates training/data_tight.yaml pointing to the tightened dataset.")
    args = parser.parse_args()

    dataset_dir = Path(args.dataset).resolve()
    out_dir = Path(args.output).resolve()
    review_dir = out_dir.parent / (out_dir.name + "_review")

    if not dataset_dir.exists():
        sys.exit(f"ERROR: dataset not found at {dataset_dir}")

    if out_dir == dataset_dir:
        sys.exit("ERROR: --output cannot be the same as --dataset. Aborting for safety.")

    if out_dir.exists() and any(out_dir.iterdir()) and not args.dry_run and not args.overwrite_output:
        sys.exit(f"ERROR: {out_dir} already exists and has content. "
                  f"Use --overwrite_output if you are sure you want to overwrite it.")

    from segment_anything import sam_model_registry, SamPredictor
    import torch

    if args.device == "cuda" and not torch.cuda.is_available():
        print("WARNING: no GPU detected, using CPU (will be considerably slower).")
        args.device = "cpu"

    print(f"Loading SAM ({args.model_type}) on {args.device}...")
    sam = sam_model_registry[args.model_type](checkpoint=args.checkpoint)
    sam.to(device=args.device)
    predictor = SamPredictor(sam)

    log_rows = []
    print(f"Original dataset (read-only): {dataset_dir}")
    print(f"Output dataset: {out_dir}")
    if args.dry_run:
        print(f"DRY RUN MODE: processing {args.dry_run_n} images per split. "
              f"Visual review at: {review_dir}")

    for split in SPLITS:
        process_split(split, dataset_dir, out_dir, predictor, log_rows,
                       args.pad, args.min_area_ratio, args.max_area_ratio,
                       args.dry_run, args.dry_run_n, review_dir)

    # log CSV
    log_path = BASE_DIR / ("tighten_boxes_log_dryrun.csv" if args.dry_run else "tighten_boxes_log.csv")
    with open(log_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["split", "imagen", "clase", "area_original_px",
                          "area_nueva_px", "ratio", "accion"])
        writer.writerows(log_rows)
    print(f"\nLog saved to: {log_path}")

    n_ajustadas = sum(1 for r in log_rows if r[-1] == "ajustada")
    n_conservadas = len(log_rows) - n_ajustadas
    print(f"Tightened boxes: {n_ajustadas} | Kept boxes (fallback/safety): {n_conservadas}")

    if args.dry_run:
        print(f"\nReview the images in {review_dir} "
              f"(red = original box, green = tightened box) before running without --dry_run.")
        return

    if args.write_data_yaml:
        src_yaml = BASE_DIR / "data.yaml"
        with open(src_yaml) as f:
            data = yaml.safe_load(f)
        data["path"] = f"../{out_dir.name}"
        dst_yaml = BASE_DIR / "data_tight.yaml"
        with open(dst_yaml, "w") as f:
            yaml.safe_dump(data, f, sort_keys=False, allow_unicode=True)
        print(f"Generated: {dst_yaml} (points to {out_dir.name}). "
              f"The original dataset and data.yaml remain untouched.")


if __name__ == "__main__":
    main()