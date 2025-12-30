
import { ImageQuality } from './types';

export const analyzeImageQuality = (imageData: string): Promise<ImageQuality> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve({} as ImageQuality);
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;
      
      let darkPixels = 0;
      let brightPixels = 0;
      let totalBrightness = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
        if (brightness < 50) darkPixels++;
        if (brightness > 200) brightPixels++;
      }
      
      const avgBrightness = totalBrightness / (data.length / 4);
      const darkRatio = darkPixels / (data.length / 4);
      const brightRatio = brightPixels / (data.length / 4);
      
      const quality = {
        avgBrightness: avgBrightness,
        isTooDark: avgBrightness < 80,
        isTooBright: avgBrightness > 200,
        hasShadows: darkRatio > 0.3,
        hasOverexposure: brightRatio > 0.3,
        resolution: { width: img.width, height: img.height },
        isLowRes: img.width < 400 || img.height < 400
      };
      
      resolve(quality);
    };
    img.src = imageData;
  });
};

export const calculateSeverity = (stage: string, lesionCount: number, avgLesionSize: number): string => {
  const severityScores: Record<string, number> = {
    'H0': 0,
    'E1': Math.min((lesionCount * avgLesionSize * 0.2), 15),
    'E2': Math.min((lesionCount * avgLesionSize * 0.8), 45),
    'E3': Math.min((lesionCount * avgLesionSize * 2.0), 100),
    'N0': 0
  };

  return Math.min(severityScores[stage] || 0, 100).toFixed(1);
};
