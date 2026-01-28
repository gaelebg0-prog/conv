
export const convertImage = (file: File, targetFormat: string, quality: number = 0.92): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        
        let mimeType = `image/${targetFormat.toLowerCase()}`;
        if (targetFormat.toLowerCase() === 'jpg') mimeType = 'image/jpeg';
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Conversion failed"));
        }, mimeType, quality);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const applyImageEffects = (file: File, radius: number, enhance: boolean): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }

        // Apply Enhancement Filters
        if (enhance) {
          // Subtle professional enhancement: boost contrast, saturation and brightness slightly
          ctx.filter = 'contrast(1.1) saturate(1.1) brightness(1.05) blur(0px)';
        }

        // Apply Rounded Corners
        if (radius > 0) {
          ctx.beginPath();
          // Use radius as a percentage of the smallest dimension if needed, 
          // but here we use absolute pixels for precision based on the input
          const r = (radius / 100) * Math.min(canvas.width, canvas.height) / 2;
          ctx.roundRect(0, 0, canvas.width, canvas.height, r);
          ctx.clip();
        }

        ctx.drawImage(img, 0, 0);
        
        // Output as PNG to preserve transparency of rounded corners
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Effect processing failed"));
        }, 'image/png', 1.0);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const convertText = async (file: File, targetFormat: string): Promise<Blob> => {
  const text = await file.text();
  let result = text;

  // Basic "conversion" logic for text formats
  if (targetFormat === 'json') {
    try {
      result = JSON.stringify({ content: text }, null, 2);
    } catch {
      result = text;
    }
  }

  return new Blob([result], { type: 'text/plain' });
};
