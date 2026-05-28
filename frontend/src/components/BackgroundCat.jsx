"use client";

import { useEffect, useRef } from "react";

const RAW_BASE = "https://media.githubusercontent.com/media/jlfuertes14/CatVision-AI/main/frontend/public";

const FRAME_PATHS = Array.from(
  { length: 15 },
  (_, index) => `${RAW_BASE}/cat-pixelgif/frames/frame-${String(index).padStart(2, "0")}.png`,
);
const YARN_FRAME_PATHS = Array.from(
  { length: 7 },
  (_, index) => `${RAW_BASE}/catyarn/frames/frame-${String(index).padStart(2, "0")}.png`,
);
const TINY_FRAME_PATHS = Array.from(
  { length: 61 },
  (_, index) => `${RAW_BASE}/tinycat/frames/frame-${String(index).padStart(2, "0")}.png`,
);
const YARN_FRAME_DURATIONS = [100, 500, 100, 300, 200, 200, 500];

const SOURCE_WIDTH = 220;
const SOURCE_HEIGHT = 176;
const DISPLAY_SCALE = 0.64;
const DISPLAY_WIDTH = Math.round(SOURCE_WIDTH * DISPLAY_SCALE);
const DISPLAY_HEIGHT = Math.round(SOURCE_HEIGHT * DISPLAY_SCALE);
const YARN_DISPLAY_SCALE = 0.44;
const TINY_DISPLAY_SCALE = 0.42;
const TINY_FRAME_DURATION = 170;
const CORNER_MARGIN = 24;
const BACKGROUND_MARGIN = 24;
const MOVE_SPEED = 1.45;
const FRAME_DURATION = 100;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function spriteIntersectsRect(x, y, rect, spriteWidth = DISPLAY_WIDTH, spriteHeight = DISPLAY_HEIGHT) {
  return (
    x < rect.right &&
    x + spriteWidth > rect.left &&
    y < rect.bottom &&
    y + spriteHeight > rect.top
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function createFrameCanvases(images) {
  return images.map((image) => {
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = image.width;
    frameCanvas.height = image.height;

    const frameContext = frameCanvas.getContext("2d");
    if (!frameContext) {
      return null;
    }

    frameContext.imageSmoothingEnabled = false;
    frameContext.drawImage(image, 0, 0);
    return frameCanvas;
  }).filter(Boolean);
}

function pickTarget(width, height, excludedRects = [], spriteWidth = DISPLAY_WIDTH, spriteHeight = DISPLAY_HEIGHT) {
  const paddingX = Math.max(BACKGROUND_MARGIN, spriteWidth * 0.75);
  const paddingY = Math.max(BACKGROUND_MARGIN, spriteHeight * 0.75);
  const maxX = Math.max(paddingX, width - spriteWidth - paddingX);
  const maxY = Math.max(paddingY, height - spriteHeight - paddingY);

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const target = {
      x: paddingX + Math.random() * Math.max(1, maxX - paddingX),
      y: paddingY + Math.random() * Math.max(1, maxY - paddingY),
    };

    if (!excludedRects.some((rect) => spriteIntersectsRect(target.x, target.y, rect, spriteWidth, spriteHeight))) {
      return target;
    }
  }

  const fallbackTargets = [
    { x: paddingX, y: paddingY },
    { x: maxX, y: paddingY },
    { x: paddingX, y: maxY },
    { x: maxX, y: maxY },
  ];

  return fallbackTargets.find(
    (target) =>
      !excludedRects.some((rect) => spriteIntersectsRect(target.x, target.y, rect, spriteWidth, spriteHeight)),
  ) || fallbackTargets[0];
}

function pickCornerTarget(width, height, spriteWidth, spriteHeight, excludedRects = []) {
  const maxX = Math.max(CORNER_MARGIN, width - spriteWidth - CORNER_MARGIN);
  const maxY = Math.max(CORNER_MARGIN, height - spriteHeight - CORNER_MARGIN);
  const corners = [
    { x: maxX, y: CORNER_MARGIN }, // Top Right
    { x: CORNER_MARGIN, y: maxY }, // Bottom Left
    { x: maxX, y: maxY },          // Bottom Right
  ];
  const startIndex = Math.floor(Math.random() * corners.length);
  const orderedCorners = corners.slice(startIndex).concat(corners.slice(0, startIndex));

  return orderedCorners.find(
    (corner) =>
      !excludedRects.some((rect) =>
        spriteIntersectsRect(corner.x, corner.y, rect, spriteWidth, spriteHeight),
      ),
  ) || orderedCorners[0];
}

export default function BackgroundCat() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    let animationId = 0;
    let isActive = true;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let devicePixelRatio = window.devicePixelRatio || 1;
    let frameCanvases = [];
    let yarnFrameCanvases = [];
    let tinyFrameCanvases = [];
    let ready = false;
    let frameIndex = 0;
    let lastFrameTime = 0;
    let restUntil = 0;
    let mouseX = -1000;
    let mouseY = -1000;

    const cat = {
      x: 0,
      y: 0,
      targetX: null,
      targetY: null,
      facing: "right",
    };

    const yarnCat = {
      x: CORNER_MARGIN,
      y: CORNER_MARGIN,
      width: 0,
      height: 0,
      frame: 0,
      lastFrameTime: 0,
    };

    const tinyCat = {
      x: BACKGROUND_MARGIN,
      y: BACKGROUND_MARGIN,
      width: 0,
      height: 0,
      frame: 0,
      lastFrameTime: 0,
      isPlaying: false,
    };

    const getExcludedRects = () =>
      Array.from(document.querySelectorAll("[data-cat-exclusion]")).map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      });

    const pointIsExcluded = (x, y) =>
      getExcludedRects().some((rect) => pointInRect(x, y, rect));

    const catIsExcluded = () =>
      getExcludedRects().some((rect) => spriteIntersectsRect(cat.x, cat.y, rect));

    const yarnCatIsExcluded = () =>
      yarnCat.width > 0 &&
      getExcludedRects().some((rect) =>
        spriteIntersectsRect(yarnCat.x, yarnCat.y, rect, yarnCat.width, yarnCat.height),
      );

    const tinyCatIsExcluded = () =>
      tinyCat.width > 0 &&
      getExcludedRects().some((rect) =>
        spriteIntersectsRect(tinyCat.x, tinyCat.y, rect, tinyCat.width, tinyCat.height),
      );

    const placeYarnCat = () => {
      if (yarnCat.width <= 0 || yarnCat.height <= 0) {
        return;
      }

      const target = pickCornerTarget(width, height, yarnCat.width, yarnCat.height, getExcludedRects());
      yarnCat.x = target.x;
      yarnCat.y = target.y;
    };

    const placeTinyCat = () => {
      if (tinyCat.width <= 0 || tinyCat.height <= 0) {
        return;
      }

      const target = pickTarget(width, height, getExcludedRects(), tinyCat.width, tinyCat.height);
      tinyCat.x = target.x;
      tinyCat.y = target.y;
    };

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.imageSmoothingEnabled = false;

      if (catIsExcluded()) {
        const target = pickTarget(width, height, getExcludedRects());
        cat.x = target.x;
        cat.y = target.y;
      }

      if (yarnCatIsExcluded()) {
        placeYarnCat();
      }

      if (tinyCatIsExcluded()) {
        placeTinyCat();
      }
    };

    const setRandomTarget = () => {
      const target = pickTarget(width, height, getExcludedRects());
      cat.targetX = target.x;
      cat.targetY = target.y;
    };

    const moveAwayFrom = (sourceX, sourceY) => {
      const excludedRects = getExcludedRects();
      const target = pickTarget(width, height, excludedRects);
      const offsetX = target.x - sourceX;
      const offsetY = target.y - sourceY;
      const distance = Math.hypot(offsetX, offsetY);

      if (distance < 120) {
        const fallbackTarget = pickTarget(width, height, excludedRects);
        cat.targetX = fallbackTarget.x;
        cat.targetY = fallbackTarget.y;
        return;
      }

      cat.targetX = target.x;
      cat.targetY = target.y;
    };

    const handleMouseMove = (event) => {
      if (pointIsExcluded(event.clientX, event.clientY)) {
        mouseX = -1000;
        mouseY = -1000;
        return;
      }

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleClick = (event) => {
      if (pointIsExcluded(event.clientX, event.clientY)) {
        return;
      }

      if (
        tinyCat.width > 0 &&
        pointInRect(event.clientX, event.clientY, {
          left: tinyCat.x,
          right: tinyCat.x + tinyCat.width,
          top: tinyCat.y,
          bottom: tinyCat.y + tinyCat.height,
        })
      ) {
        tinyCat.frame = 0;
        tinyCat.isPlaying = true;
        tinyCat.lastFrameTime = 0;
        return;
      }

      const centerX = cat.x + DISPLAY_WIDTH / 2;
      const centerY = cat.y + DISPLAY_HEIGHT / 2;
      const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);

      if (distance < Math.min(DISPLAY_WIDTH, DISPLAY_HEIGHT) * 0.45) {
        moveAwayFrom(event.clientX, event.clientY);
      } else {
        const targetX = clamp(event.clientX - DISPLAY_WIDTH / 2, 0, Math.max(0, width - DISPLAY_WIDTH));
        const targetY = clamp(event.clientY - DISPLAY_HEIGHT / 2, 0, Math.max(0, height - DISPLAY_HEIGHT));

        if (getExcludedRects().some((rect) => spriteIntersectsRect(targetX, targetY, rect))) {
          return;
        }

        cat.targetX = targetX;
        cat.targetY = targetY;
      }

      restUntil = 0;
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    const observer = new ResizeObserver(() => {
      if (!isActive) return;
      if (catIsExcluded()) {
        const target = pickTarget(width, height, getExcludedRects());
        cat.targetX = target.x;
        cat.targetY = target.y;
        // Also snap position to avoid getting stuck during fast resizes
        cat.x = target.x;
        cat.y = target.y;
      }
      if (yarnCatIsExcluded()) {
        placeYarnCat();
      }
      if (tinyCatIsExcluded()) {
        placeTinyCat();
      }
    });

    document.querySelectorAll("[data-cat-exclusion]").forEach((el) => {
      observer.observe(el);
    });

    resizeCanvas();
    const initialTarget = pickTarget(width, height, getExcludedRects());
    cat.x = initialTarget.x;
    cat.y = initialTarget.y;
    setRandomTarget();

    const start = async () => {
      try {
        const [images, yarnImages, tinyImages] = await Promise.all([
          Promise.all(FRAME_PATHS.map(loadImage)),
          Promise.all(YARN_FRAME_PATHS.map(loadImage)),
          Promise.all(TINY_FRAME_PATHS.map(loadImage)),
        ]);

        if (!isActive) {
          return;
        }

        frameCanvases = createFrameCanvases(images);
        yarnFrameCanvases = createFrameCanvases(yarnImages);
        tinyFrameCanvases = createFrameCanvases(tinyImages);

        if (yarnFrameCanvases[0]) {
          yarnCat.width = Math.round(yarnFrameCanvases[0].width * YARN_DISPLAY_SCALE);
          yarnCat.height = Math.round(yarnFrameCanvases[0].height * YARN_DISPLAY_SCALE);
          placeYarnCat();
        }

        if (tinyFrameCanvases[0]) {
          tinyCat.width = Math.round(tinyFrameCanvases[0].width * TINY_DISPLAY_SCALE);
          tinyCat.height = Math.round(tinyFrameCanvases[0].height * TINY_DISPLAY_SCALE);
          placeTinyCat();
        }

        ready = frameCanvases.length > 0 && yarnFrameCanvases.length > 0 && tinyFrameCanvases.length > 0;
        animationId = requestAnimationFrame(animate);
      } catch {
        ready = false;
      }
    };

    const animate = (time) => {
      if (!ready) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      if (time >= restUntil) {
        if (cat.targetX === null || cat.targetY === null) {
          setRandomTarget();
        }

        const centerX = cat.x + DISPLAY_WIDTH / 2;
        const centerY = cat.y + DISPLAY_HEIGHT / 2;
        const hoverDistance = Math.hypot(mouseX - centerX, mouseY - centerY);

        if (hoverDistance < Math.min(DISPLAY_WIDTH, DISPLAY_HEIGHT) * 0.65) {
          moveAwayFrom(mouseX, mouseY);
        }

        const deltaX = cat.targetX - cat.x;
        const deltaY = cat.targetY - cat.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance < 4) {
          cat.targetX = null;
          cat.targetY = null;
          restUntil = time + 700 + Math.random() * 1200;
          frameIndex = 0;
        } else {
          cat.x += (deltaX / distance) * MOVE_SPEED;
          cat.y += (deltaY / distance) * MOVE_SPEED;
          cat.facing = deltaX >= 0 ? "right" : "left";

          if (time - lastFrameTime >= FRAME_DURATION) {
            frameIndex = (frameIndex + 1) % frameCanvases.length;
            lastFrameTime = time;
          }
        }
      } else {
        frameIndex = 0;
      }

      if (yarnFrameCanvases.length > 0) {
        const yarnFrameDuration = YARN_FRAME_DURATIONS[yarnCat.frame] || 160;

        if (time - yarnCat.lastFrameTime >= yarnFrameDuration) {
          yarnCat.frame = (yarnCat.frame + 1) % yarnFrameCanvases.length;
          yarnCat.lastFrameTime = time;
        }
      }

      if (tinyCat.isPlaying && tinyFrameCanvases.length > 0) {
        if (time - tinyCat.lastFrameTime >= TINY_FRAME_DURATION) {
          tinyCat.frame += 1;
          tinyCat.lastFrameTime = time;

          if (tinyCat.frame >= tinyFrameCanvases.length) {
            tinyCat.frame = 0;
            tinyCat.isPlaying = false;
          }
        }
      }

      context.clearRect(0, 0, width, height);

      const activeYarnFrame = yarnFrameCanvases[yarnCat.frame];
      if (activeYarnFrame && yarnCat.width > 0 && yarnCat.height > 0) {
        context.drawImage(activeYarnFrame, yarnCat.x, yarnCat.y, yarnCat.width, yarnCat.height);
      }

      const activeTinyFrame = tinyFrameCanvases[tinyCat.frame];
      if (activeTinyFrame && tinyCat.width > 0 && tinyCat.height > 0) {
        context.drawImage(activeTinyFrame, tinyCat.x, tinyCat.y, tinyCat.width, tinyCat.height);
      }

      const activeFrame = frameCanvases[frameIndex];
      if (activeFrame) {
        context.save();

        if (cat.facing === "right") {
          context.translate(cat.x + DISPLAY_WIDTH, cat.y);
          context.scale(-1, 1);
        } else {
          context.translate(cat.x, cat.y);
        }

        context.drawImage(activeFrame, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
        context.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    start();

    return () => {
      isActive = false;
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-65"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
