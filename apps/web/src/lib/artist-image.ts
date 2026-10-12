const MAX_IMAGE_BYTES = 1_500_000;

export async function readArtistImage(file: File, keepGif: boolean): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen pesa más de 1.5 MB.');
  }
  if (keepGif || file.type === 'image/gif') {
    return readAsDataUrl(file);
  }
  return compressPhoto(file);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('No se pudo leer el archivo.'));
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

async function compressPhoto(file: File): Promise<string> {
  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return source;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo abrir la imagen.'));
    image.src = src;
  });
}
