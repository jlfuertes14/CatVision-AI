from collections import deque
from pathlib import Path
import math
import shutil

from PIL import Image, ImageSequence


ROOT = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT / "catvision-ai" / "frontend" / "public"
PIXEL_GIF_PATH = ROOT / "cat-pixelgif.gif"
YARN_GIF_PATH = ROOT / "catyarn.gif"
TINY_GIF_PATH = ROOT / "tinycat.gif"
PIXEL_OUTPUT_DIR = PUBLIC_DIR / "cat-pixelgif" / "frames"
YARN_OUTPUT_DIR = PUBLIC_DIR / "catyarn" / "frames"
TINY_OUTPUT_DIR = PUBLIC_DIR / "tinycat" / "frames"
PUBLIC_PIXEL_GIF_PATH = PUBLIC_DIR / "cat-pixelgif.gif"
PUBLIC_YARN_GIF_PATH = PUBLIC_DIR / "catyarn.gif"
PUBLIC_TINY_GIF_PATH = PUBLIC_DIR / "tinycat.gif"

SKY = (41, 173, 255)
GRASS = (0, 135, 81)
THRESHOLD = 60
TINY_BACKGROUND_COLORS = {
    (214, 174, 125),
    (242, 203, 156),
}


def close_to_background(pixel):
    sky_distance = math.sqrt(sum((pixel[index] - SKY[index]) ** 2 for index in range(3)))
    grass_distance = math.sqrt(sum((pixel[index] - GRASS[index]) ** 2 for index in range(3)))
    red, green, blue = pixel[:3]
    is_sky_or_grass = sky_distance <= THRESHOLD or grass_distance <= THRESHOLD
    is_cyan_edge = blue - red >= 48 and green - red >= 42 and green >= 70
    is_green_edge = green - red >= 48 and blue - red >= 36 and red <= 28
    return is_sky_or_grass or is_cyan_edge or is_green_edge


def clear_frame_dir(output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)

    for frame_path in output_dir.glob("frame-*.png"):
        frame_path.unlink()


def extract_pixel_foreground_frame(frame):
    rgba = frame.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()

    background = [
        [close_to_background(pixels[x, y]) for x in range(width)]
        for y in range(height)
    ]
    visited = [[False] * width for _ in range(height)]
    queue = deque()

    for x in range(width):
        for y in (0, height - 1):
            if background[y][x] and not visited[y][x]:
                visited[y][x] = True
                queue.append((x, y))

    for y in range(height):
        for x in (0, width - 1):
            if background[y][x] and not visited[y][x]:
                visited[y][x] = True
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        for next_x, next_y in (
            (x + 1, y),
            (x - 1, y),
            (x, y + 1),
            (x, y - 1),
        ):
            if 0 <= next_x < width and 0 <= next_y < height:
                if background[next_y][next_x] and not visited[next_y][next_x]:
                    visited[next_y][next_x] = True
                    queue.append((next_x, next_y))

    foreground = [[not background[y][x] for x in range(width)] for y in range(height)]
    seen = [[False] * width for _ in range(height)]
    largest_component = []

    for y in range(height):
        for x in range(width):
            if foreground[y][x] and not seen[y][x]:
                component_queue = deque([(x, y)])
                seen[y][x] = True
                component = []

                while component_queue:
                    current_x, current_y = component_queue.popleft()
                    component.append((current_x, current_y))

                    for next_x, next_y in (
                        (current_x + 1, current_y),
                        (current_x - 1, current_y),
                        (current_x, current_y + 1),
                        (current_x, current_y - 1),
                    ):
                        if 0 <= next_x < width and 0 <= next_y < height:
                            if foreground[next_y][next_x] and not seen[next_y][next_x]:
                                seen[next_y][next_x] = True
                                component_queue.append((next_x, next_y))

                if len(component) > len(largest_component):
                    largest_component = component

    output = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    output_pixels = output.load()

    for x, y in largest_component:
        output_pixels[x, y] = pixels[x, y]

    return output


def get_union_bbox(image):
    union = [10**9, 10**9, -1, -1]

    for frame in ImageSequence.Iterator(image):
        bbox = frame.convert("RGBA").getbbox()

        if not bbox:
            continue

        union[0] = min(union[0], bbox[0])
        union[1] = min(union[1], bbox[1])
        union[2] = max(union[2], bbox[2])
        union[3] = max(union[3], bbox[3])

    if union[2] < union[0] or union[3] < union[1]:
        return (0, 0, image.width, image.height)

    return tuple(union)


def export_pixel_gif():
    clear_frame_dir(PIXEL_OUTPUT_DIR)
    shutil.copyfile(PIXEL_GIF_PATH, PUBLIC_PIXEL_GIF_PATH)

    image = Image.open(PIXEL_GIF_PATH)
    frame_count = getattr(image, "n_frames", 1)

    for index, frame in enumerate(ImageSequence.Iterator(image)):
        output_frame = extract_pixel_foreground_frame(frame)
        output_frame.save(PIXEL_OUTPUT_DIR / f"frame-{index:02d}.png")

    print(f"Exported {frame_count} frames to {PIXEL_OUTPUT_DIR}")
    print(f"Copied source GIF to {PUBLIC_PIXEL_GIF_PATH}")


def export_transparent_gif(gif_path, output_dir, public_gif_path):
    clear_frame_dir(output_dir)
    shutil.copyfile(gif_path, public_gif_path)

    image = Image.open(gif_path)
    frame_count = getattr(image, "n_frames", 1)
    bbox = get_union_bbox(image)

    image.seek(0)
    for index, frame in enumerate(ImageSequence.Iterator(image)):
        output_frame = frame.convert("RGBA").crop(bbox)
        output_frame.save(output_dir / f"frame-{index:02d}.png")

    print(f"Exported {frame_count} frames to {output_dir}")
    print(f"Copied source GIF to {public_gif_path}")


def clean_background_color_frame(frame, background_colors):
    rgba = frame.convert("RGBA")
    output = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    source_pixels = rgba.load()
    output_pixels = output.load()

    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, alpha = source_pixels[x, y]

            if alpha and (red, green, blue) not in background_colors:
                output_pixels[x, y] = source_pixels[x, y]

    return output


def get_frames_union_bbox(frames, padding=0):
    union = [10**9, 10**9, -1, -1]

    for frame in frames:
        bbox = frame.getbbox()

        if not bbox:
            continue

        union[0] = min(union[0], bbox[0])
        union[1] = min(union[1], bbox[1])
        union[2] = max(union[2], bbox[2])
        union[3] = max(union[3], bbox[3])

    if union[2] < union[0] or union[3] < union[1]:
        return (0, 0, frames[0].width, frames[0].height)

    return (
        max(0, union[0] - padding),
        max(0, union[1] - padding),
        min(frames[0].width, union[2] + padding),
        min(frames[0].height, union[3] + padding),
    )


def export_background_color_gif(gif_path, output_dir, public_gif_path, background_colors, padding=0):
    clear_frame_dir(output_dir)
    shutil.copyfile(gif_path, public_gif_path)

    image = Image.open(gif_path)
    frame_count = getattr(image, "n_frames", 1)
    frames = [
        clean_background_color_frame(frame, background_colors)
        for frame in ImageSequence.Iterator(image)
    ]
    bbox = get_frames_union_bbox(frames, padding)

    for index, frame in enumerate(frames):
        frame.crop(bbox).save(output_dir / f"frame-{index:02d}.png")

    print(f"Exported {frame_count} frames to {output_dir}")
    print(f"Copied source GIF to {public_gif_path}")


def main():
    export_pixel_gif()
    export_transparent_gif(YARN_GIF_PATH, YARN_OUTPUT_DIR, PUBLIC_YARN_GIF_PATH)
    export_background_color_gif(
        TINY_GIF_PATH,
        TINY_OUTPUT_DIR,
        PUBLIC_TINY_GIF_PATH,
        TINY_BACKGROUND_COLORS,
        padding=16,
    )


if __name__ == "__main__":
    main()
