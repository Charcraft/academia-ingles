/**
 * Compresses an image file client-side using the Canvas API.
 * - Max file size: 200KB
 * - Output format: webp
 * - Max width: 1024px
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Resize if width exceeds 1024px
      if (width > 1024) {
        height = Math.round((height * 1024) / width);
        width = 1024;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try quality 0.8 first, then reduce until under 200KB
      const tryCompress = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not compress image"));
              return;
            }

            if (blob.size <= 200 * 1024 || quality <= 0.3) {
              resolve(blob);
            } else {
              tryCompress(quality - 0.1);
            }
          },
          "image/webp",
          quality
        );
      };

      tryCompress(0.8);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
