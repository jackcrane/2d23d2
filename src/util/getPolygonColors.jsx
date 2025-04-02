export const getPolygonColors = (posX, posZ, radius, imageData, config) => {
  if (!imageData) return { averageColor: null, colors: [] };

  const { width: imgWidth, height: imgHeight, data } = imageData;

  const worldToPixel = (x, z) => {
    const u = (x + config.imageWidth / 2) / config.imageWidth;
    const v = (config.imageHeight / 2 - z) / config.imageHeight;
    const px = Math.floor(u * imgWidth);
    const py = Math.floor(v * imgHeight);
    return { px, py };
  };

  const minX = posX - radius;
  const maxX = posX + radius;
  const minZ = posZ - radius;
  const maxZ = posZ + radius;
  const topLeft = worldToPixel(minX, maxZ);
  const bottomRight = worldToPixel(maxX, minZ);

  const startX = Math.max(0, topLeft.px);
  const endX = Math.min(imgWidth - 1, bottomRight.px);
  const startY = Math.max(0, topLeft.py);
  const endY = Math.min(imgHeight - 1, bottomRight.py);

  let totalR = 0,
    totalG = 0,
    totalB = 0,
    count = 0;
  const colors = [];
  const samplingStep = 4;

  for (let py = startY; py <= endY; py += samplingStep) {
    for (let px = startX; px <= endX; px += samplingStep) {
      const x = (px / imgWidth) * config.imageWidth - config.imageWidth / 2;
      const z = config.imageHeight / 2 - (py / imgHeight) * config.imageHeight;
      if ((x - posX) ** 2 + (z - posZ) ** 2 <= radius ** 2) {
        const index = (py * imgWidth + px) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const { h, s, l } = rgbToHsl(r, g, b);
        totalR += r;
        totalG += g;
        totalB += b;
        count++;
        colors.push({ r, g, b, h, s, l });
      }
    }
  }

  if (count === 0) return { averageColor: null, colors: [] };

  const avgR = Math.round(totalR / count);
  const avgG = Math.round(totalG / count);
  const avgB = Math.round(totalB / count);
  const { h, s, l } = rgbToHsl(avgR, avgG, avgB);
  const averageColor = { r: avgR, g: avgG, b: avgB, h, s, l };

  return { averageColor, colors };
};

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};
