"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ImagePlus } from "lucide-react";

/**
 * ImageUploader — Drag-and-drop + click-to-upload component.
 */
export default function ImageUploader({ onUpload, onError, onTrySample, disabled = false }) {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file || disabled) return;

      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        onError?.("Please upload a JPEG, PNG, or WebP image.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        onError?.("Image must be under 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      onUpload(file);
    },
    [onUpload, onError, disabled]
  );

  useEffect(() => {
    const handlePaste = (e) => {
      if (disabled) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFile, disabled]);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative w-full max-w-lg mx-auto rounded-[32px] border-2 border-dashed
        transition-all duration-400 ease-out cursor-pointer
        ${
          isDragging
            ? "border-cafe-green bg-cafe-green/5 scale-[0.98]"
            : "border-cafe-green/30 bg-cafe-card hover:border-cafe-green hover:bg-cafe-light"
        }
        ${disabled ? "opacity-60 cursor-not-allowed" : ""}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center gap-4 p-12">
        {preview ? (
          <img
            src={preview}
            alt="Uploaded cat"
            className="w-56 h-56 object-cover rounded-2xl border-4 border-cafe-bg"
          />
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-cafe-bg flex items-center justify-center text-cafe-brown mb-2 transition-transform duration-300 group-hover:scale-110">
              <ImagePlus size={32} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h3 className="font-display font-bold text-xl text-cafe-brown mb-1">
                Drop or paste your cat photo here
              </h3>
              <p className="text-cafe-brown/60 text-sm font-medium">
                or click to browse
              </p>
            </div>
            <div className="mt-4 px-4 py-1.5 rounded-full bg-cafe-bg text-cafe-brown/50 text-xs font-bold uppercase tracking-wider">
              JPEG, PNG, WebP
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTrySample?.();
              }}
              className="mt-1 px-5 py-2 rounded-full bg-cafe-brown text-cafe-light text-sm font-bold hover:bg-cafe-orange transition-colors"
              disabled={disabled}
            >
              Try sample image
            </button>
          </>
        )}
      </div>
    </div>
  );
}
