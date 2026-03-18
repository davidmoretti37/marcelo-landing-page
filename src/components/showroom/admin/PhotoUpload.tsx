"use client";

import { useRef } from "react";

interface Photo {
  url: string;
  caption: string;
}

interface PhotoUploadProps {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}

const MAX_PHOTOS = 10;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;
const JPEG_QUALITY = 0.7;

function resizeAndCompress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Cannot get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_PHOTOS - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);

    const newPhotos: Photo[] = [];
    for (const file of toProcess) {
      try {
        const url = await resizeAndCompress(file);
        newPhotos.push({ url, caption: "" });
      } catch {
        // skip failed images silently
      }
    }

    onChange([...photos, ...newPhotos]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = photos.map((p, i) => (i === index ? { ...p, caption } : p));
    onChange(updated);
  };

  return (
    <div>
      {/* Photo count + Add button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: "12px",
            color: "var(--sr-text-muted)",
          }}
        >
          {photos.length} / {MAX_PHOTOS} photos
        </span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={photos.length >= MAX_PHOTOS}
          style={{
            padding: "8px 20px",
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            background: photos.length >= MAX_PHOTOS ? "var(--sr-surface-hover)" : "transparent",
            border: "1px solid var(--sr-gold-dim)",
            color: photos.length >= MAX_PHOTOS ? "var(--sr-text-dim)" : "var(--sr-gold-light)",
            cursor: photos.length >= MAX_PHOTOS ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Add Photos
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        style={{ display: "none" }}
      />

      {/* Photo grid */}
      {photos.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "16px",
          }}
        >
          {photos.map((photo, i) => (
            <div key={i} style={{ position: "relative" }}>
              {/* Thumbnail */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 3",
                  background: "var(--sr-bg)",
                  border: "1px solid var(--sr-border)",
                  overflow: "hidden",
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || `Photo ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0, 0, 0, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "14px",
                    lineHeight: 1,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(220, 80, 80, 0.8)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                  }}
                >
                  x
                </button>
              </div>
              {/* Caption input */}
              <input
                type="text"
                value={photo.caption}
                onChange={(e) => updateCaption(i, e.target.value)}
                placeholder="Caption..."
                style={{
                  width: "100%",
                  marginTop: "6px",
                  padding: "6px 8px",
                  fontSize: "11px",
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  background: "var(--sr-surface)",
                  border: "1px solid var(--sr-border)",
                  color: "var(--sr-text)",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--sr-gold-dim)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--sr-border)";
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            border: "1px dashed var(--sr-border)",
            background: "var(--sr-bg)",
            cursor: "pointer",
          }}
          onClick={() => fileRef.current?.click()}
        >
          <p
            style={{
              fontSize: "13px",
              color: "var(--sr-text-dim)",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            }}
          >
            Click to add photos
          </p>
          <p
            style={{
              fontSize: "11px",
              color: "var(--sr-text-dim)",
              marginTop: "4px",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              opacity: 0.6,
            }}
          >
            Images will be resized and compressed client-side
          </p>
        </div>
      )}
    </div>
  );
}
