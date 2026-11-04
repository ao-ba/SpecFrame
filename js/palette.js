/**
 * Palette Extractor for SpecFrame
 * Analyzes photo pixel data to extract harmonic dominant colors for frame & text tinting
 */
class PaletteService {
  constructor() {
    this.classicPalettes = [
      { name: 'スタジオ・ホワイト', hex: '#FFFFFF', text: '#111111' },
      { name: 'ギャラリー・アイボリー', hex: '#F7F4EE', text: '#1A1816' },
      { name: '和紙ナチュラル', hex: '#EDE8DF', text: '#2A2724' },
      { name: 'シネマ・チャコール', hex: '#1E2025', text: '#ECEFF4' },
      { name: 'マット・オブシディアン', hex: '#0B0C0E', text: '#F3F4F6' },
      { name: 'ミッドナイト・ブルー', hex: '#0D141F', text: '#E2E8F0' }
    ];
  }

  /**
   * Extract top 5 dominant harmonic colors from an Image or Canvas
   */
  extract(imageElement) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const size = 64; // Small thumbnail for fast pixel sampling
      canvas.width = size;
      canvas.height = size;

      ctx.drawImage(imageElement, 0, 0, size, size);
      const imgData = ctx.getImageData(0, 0, size, size).data;

      const colorBuckets = {};
      const step = 4; // Sample every 4th pixel for speed

      for (let i = 0; i < imgData.length; i += 4 * step) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];

        if (a < 128) continue; // Skip transparency

        // Quantize colors into 32-step buckets to group similar shades
        const qr = Math.round(r / 24) * 24;
        const qg = Math.round(g / 24) * 24;
        const qb = Math.round(b / 24) * 24;
        const key = `${qr},${qg},${qb}`;

        if (!colorBuckets[key]) {
          colorBuckets[key] = { r: qr, g: qg, b: qb, count: 0 };
        }
        colorBuckets[key].count++;
      }

      // Sort by frequency
      const sorted = Object.values(colorBuckets)
        .sort((a, b) => b.count - a.count);

      // Select diverse colors (not too close to each other)
      const selected = [];
      for (const c of sorted) {
        if (selected.length >= 5) break;

        // Check color distance against already selected
        const isFarEnough = selected.every((s) => {
          const dr = s.r - c.r;
          const dg = s.g - c.g;
          const db = s.b - c.b;
          return Math.sqrt(dr * dr + dg * dg + db * db) > 45;
        });

        if (isFarEnough) {
          const hex = this.rgbToHex(c.r, c.g, c.b);
          const luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
          const textColor = luminance > 0.5 ? '#111827' : '#F9FAFB';
          selected.push({
            name: `写真抽出 #${selected.length + 1}`,
            hex: hex,
            text: textColor,
            luminance: luminance
          });
        }
      }

      return selected;
    } catch (err) {
      console.warn('Could not extract palette:', err);
      return [];
    }
  }

  rgbToHex(r, g, b) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return '#' + [r, g, b].map(x => clamp(x).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  isLight(hex) {
    const { r, g, b } = this.hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
  }
}

window.PaletteService = PaletteService;
