import sharp from "sharp";

export async function lightlyEnhanceImage(input: ArrayBuffer) {
  return sharp(Buffer.from(input))
    .rotate()
    .modulate({
      brightness: 1.03,
      saturation: 1.02,
    })
    .linear(1.04, -2)
    .sharpen({
      sigma: 0.7,
      m1: 0.4,
      m2: 1.2,
    })
    .jpeg({
      quality: 92,
      mozjpeg: true,
    })
    .toBuffer();
}

export function enhancedFilename(filename: string) {
  const stem = filename.replace(/\.[^.]+$/, "");
  return `${stem}-enhanced.jpg`;
}
