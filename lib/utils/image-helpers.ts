import toast from "react-hot-toast";

async function convertHeicToJpeg(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  try {
    // Dynamically import heic2any so it doesn't break SSR
    const heic2anyModule = await import("heic2any");
    const heic2any = heic2anyModule.default || heic2anyModule;

    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85,
    });

    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

    return new File(
      [blob],
      file.name.replace(/\.(heic|heif)$/i, ".jpg"),
      { type: "image/jpeg", lastModified: Date.now() }
    );
  } catch (error) {
    console.error("HEIC conversion failed:", error);
    throw new Error("Could not convert HEIC image. Please upload a JPG or PNG instead.");
  }
}

export async function resizeAndCompressImage(
  file: File,
  maxWidth = 1600,
  quality = 0.78
): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }
  // If file is already small (e.g. < 400KB), keep it as is
  if (file.size < 400 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".webp"),
            {
              type: "image/webp",
              lastModified: Date.now(),
            }
          );
          resolve(compressedFile);
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export async function processImageFile(file: File): Promise<File> {
  const isHeic = file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
  let workingFile = file;
  if (isHeic) {
    workingFile = await convertHeicToJpeg(file);
  }
  return await resizeAndCompressImage(workingFile);
}

// Maximum allowed size per image (after compression) — matches Vercel's
// server-action payload cap with headroom for FormData overhead.
export const MAX_IMAGE_SIZE_MB = 4;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export async function handleFileSelection(
  files: File[],
  onSuccess: (processedFiles: File[]) => void
) {
  if (files.length === 0) return;

  const hasHeic = files.some(
    (f) => f.name.toLowerCase().endsWith(".heic") || f.name.toLowerCase().endsWith(".heif")
  );

  let toastId;
  if (hasHeic) {
    toastId = toast.loading("Converting Apple HEIC format...");
  }

  try {
    const processedFiles = await Promise.all(files.map(processImageFile));

    // Warn (but don't block) if any image is still too large after compression
    const oversized = processedFiles.filter((f) => f.size > MAX_IMAGE_SIZE_BYTES);
    if (oversized.length > 0) {
      const names = oversized.map((f) => f.name).join(", ");
      const sizeMB = (oversized[0].size / (1024 * 1024)).toFixed(1);
      toast.error(
        `⚠️ "${names}" is ${sizeMB}MB — limit is ${MAX_IMAGE_SIZE_MB}MB per image. Please use a smaller or lower-resolution photo.`,
        { duration: 6000 }
      );
      // Filter out oversized files so they don't get attached
      const validFiles = processedFiles.filter((f) => f.size <= MAX_IMAGE_SIZE_BYTES);
      if (toastId) toast.dismiss(toastId);
      if (validFiles.length > 0) onSuccess(validFiles);
      return;
    }

    if (toastId) {
      toast.success("Ready!", { id: toastId });
    }
    onSuccess(processedFiles);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process image format";
    if (toastId) {
      toast.error(message, { id: toastId });
    } else {
      toast.error(message);
    }
  }
}

