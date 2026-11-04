/**
 * Exif Service for SpecFrame
 * Extracts and formats photographic metadata using exifr
 */
class ExifService {
  constructor() {
    this.brandMap = {
      'sony': { id: 'sony', name: 'SONY', logo: 'sony' },
      'fujifilm': { id: 'fujifilm', name: 'FUJIFILM', logo: 'fujifilm' },
      'canon': { id: 'canon', name: 'Canon', logo: 'canon' },
      'nikon': { id: 'nikon', name: 'Nikon', logo: 'nikon' },
      'leica': { id: 'leica', name: 'Leica', logo: 'leica' },
      'hasselblad': { id: 'hasselblad', name: 'HASSELBLAD', logo: 'hasselblad' },
      'apple': { id: 'apple', name: 'Apple', logo: 'apple' },
      'ricoh': { id: 'ricoh', name: 'RICOH', logo: 'ricoh' },
      'panasonic': { id: 'lumix', name: 'LUMIX', logo: 'lumix' },
      'lumix': { id: 'lumix', name: 'LUMIX', logo: 'lumix' },
      'olympus': { id: 'olympus', name: 'OLYMPUS', logo: 'olympus' },
      'om digital': { id: 'olympus', name: 'OM SYSTEM', logo: 'olympus' },
      'sigma': { id: 'sigma', name: 'SIGMA', logo: 'sigma' },
      'zeiss': { id: 'zeiss', name: 'ZEISS', logo: 'zeiss' },
      'dji': { id: 'dji', name: 'DJI', logo: 'dji' }
    };
  }

  /**
   * Parse Exif from a File, Blob, or URL
   */
  async parse(input) {
    if (!window.exifr) {
      console.warn('exifr library not loaded, returning empty metadata');
      return this.getDefaultMetadata();
    }

    try {
      const raw = await window.exifr.parse(input, {
        tiff: true,
        exif: true,
        gps: true,
        xmp: true,
        iptc: true,
        icc: false,
        mergeOutput: true
      });

      if (!raw) {
        return this.getDefaultMetadata('No EXIF metadata found');
      }

      return this.normalize(raw);
    } catch (err) {
      console.error('Error parsing EXIF:', err);
      return this.getDefaultMetadata('Could not read EXIF data');
    }
  }

  /**
   * Normalize raw Exif tags into clean displayable properties
   */
  normalize(raw) {
    const make = (raw.Make || '').trim();
    const model = (raw.Model || '').trim();
    const brand = this.detectBrand(make, model);
    const cleanedModel = this.cleanCameraModel(make, model);

    const lens = (raw.LensModel || raw.Lens || raw.LensSpecification || '').toString().trim();
    const cleanedLens = this.cleanLensModel(lens);

    const shutterSpeed = this.formatShutterSpeed(raw.ExposureTime || raw.ShutterSpeedValue);
    const aperture = this.formatAperture(raw.FNumber || raw.ApertureValue);
    const iso = this.formatISO(raw.ISO || raw.ISOSpeedRatings);
    const focalLength = this.formatFocalLength(raw.FocalLength, raw.FocalLengthIn35mmFormat);
    const ev = this.formatExposureBias(raw.ExposureCompensation || raw.ExposureBiasValue);
    const date = this.formatDate(raw.DateTimeOriginal || raw.CreateDate || raw.ModifyDate);
    const location = this.formatLocation(raw.latitude, raw.longitude);

    return {
      hasExif: true,
      brand: brand.id,
      brandName: brand.name,
      make: make,
      model: cleanedModel || 'Camera',
      lens: cleanedLens || (focalLength ? `${focalLength} Lens` : ''),
      focalLength: focalLength,
      focalLengthRaw: raw.FocalLength ? Math.round(raw.FocalLength) : null,
      focalLength35mm: raw.FocalLengthIn35mmFormat || null,
      aperture: aperture,
      fNumberRaw: raw.FNumber || null,
      shutterSpeed: shutterSpeed,
      iso: iso,
      isoRaw: raw.ISO || raw.ISOSpeedRatings || null,
      ev: ev,
      date: date,
      location: location,
      author: (raw.Artist || raw.Creator || raw.Byline || '').toString().trim(),
      orientation: raw.Orientation || 1,
      raw: raw
    };
  }

  detectBrand(make, model) {
    const combined = `${make} ${model}`.toLowerCase();
    for (const [key, info] of Object.entries(this.brandMap)) {
      if (combined.includes(key)) {
        return info;
      }
    }
    if (make) {
      return { id: 'custom', name: make.toUpperCase(), logo: 'generic' };
    }
    return { id: 'generic', name: '', logo: 'camera' };
  }

  cleanCameraModel(make, model) {
    if (!model) return make || '';
    let m = model;

    // Common camera model cleanup
    // Sony ILCE-7RM4 -> Sony α7R IV or ILCE-7RM4
    if (m === 'ILCE-7RM4') return 'Sony α7R IV';
    if (m === 'ILCE-7RM5') return 'Sony α7R V';
    if (m === 'ILCE-7M4') return 'Sony α7 IV';
    if (m === 'ILCE-7M3') return 'Sony α7 III';
    if (m === 'ILCE-7SM3') return 'Sony α7S III';
    if (m === 'ILCE-1') return 'Sony α1';
    if (m === 'ILCE-9M2') return 'Sony α9 II';
    if (m === 'ILCE-6700') return 'Sony α6700';

    // Remove redundant make prefix if present
    if (make && m.toLowerCase().startsWith(make.toLowerCase())) {
      m = m.substring(make.length).trim();
    }

    return m;
  }

  cleanLensModel(lens) {
    if (!lens) return '';
    return lens.trim();
  }

  formatShutterSpeed(val) {
    if (val === undefined || val === null) return '';
    if (typeof val === 'string' && val.includes('/')) return `${val}s`;

    const sec = Number(val);
    if (isNaN(sec) || sec <= 0) return '';

    if (sec >= 1) {
      // 1s or longer
      return Number.isInteger(sec) ? `${sec}s` : `${sec.toFixed(1)}s`;
    }

    // Fraction (e.g. 0.00625 -> 1/160)
    const denom = Math.round(1 / sec);
    return `1/${denom}s`;
  }

  formatAperture(val) {
    if (val === undefined || val === null) return '';
    const f = Number(val);
    if (isNaN(f) || f <= 0) return '';

    // Standard aperture formatting (e.g. f/1.4, f/2.8, f/8.0)
    const formatted = (f < 10 && Number.isInteger(f)) ? f.toFixed(1) : (Math.round(f * 10) / 10);
    return `f/${formatted}`;
  }

  formatISO(val) {
    if (val === undefined || val === null) return '';
    const num = Number(val);
    if (isNaN(num)) return `ISO ${val}`;
    return `ISO ${num}`;
  }

  formatFocalLength(fl, fl35) {
    if (!fl && !fl35) return '';
    const actual = fl ? Math.round(Number(fl)) : null;
    const eq = fl35 ? Math.round(Number(fl35)) : null;

    if (actual && eq && actual !== eq) {
      return `${actual}mm (${eq}mm eq.)`;
    }
    if (actual) return `${actual}mm`;
    if (eq) return `${eq}mm`;
    return '';
  }

  formatExposureBias(val) {
    if (val === undefined || val === null) return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    if (Math.abs(num) < 0.01) return '0 EV';
    const sign = num > 0 ? '+' : '';
    // Round to 1 decimal or fractional representation
    return `${sign}${(Math.round(num * 10) / 10).toFixed(1)} EV`;
  }

  formatDate(val) {
    if (!val) return '';
    try {
      const d = (val instanceof Date) ? val : new Date(val);
      if (isNaN(d.getTime())) {
        // String fallback (e.g. "2024:10:18 21:42:15")
        if (typeof val === 'string') {
          const parts = val.trim().split(' ');
          const datePart = parts[0].replace(/:/g, '.');
          const timePart = parts[1] ? parts[1].substring(0, 5) : '';
          return timePart ? `${datePart} ${timePart}` : datePart;
        }
        return '';
      }
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${y}.${m}.${day} ${h}:${min}`;
    } catch {
      return '';
    }
  }

  formatLocation(lat, lon) {
    if (lat === undefined || lon === undefined) return '';
    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (isNaN(latNum) || isNaN(lonNum)) return '';

    const latDir = latNum >= 0 ? 'N' : 'S';
    const lonDir = lonNum >= 0 ? 'E' : 'W';
    return `${Math.abs(latNum).toFixed(3)}° ${latDir}, ${Math.abs(lonNum).toFixed(3)}° ${lonDir}`;
  }

  getDefaultMetadata(notice = '') {
    return {
      hasExif: false,
      notice: notice,
      brand: 'generic',
      brandName: '',
      make: '',
      model: '',
      lens: '',
      focalLength: '',
      aperture: '',
      shutterSpeed: '',
      iso: '',
      ev: '',
      date: '',
      location: '',
      author: '',
      orientation: 1
    };
  }
}

window.ExifService = ExifService;
