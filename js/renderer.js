/**
 * Canvas Rendering Engine for SpecFrame
 * Renders high-resolution photo frames, bottom bars, and in-image overlays
 */
class FrameRenderer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Main render function
   * @param {HTMLImageElement} image
   * @param {Object} metadata
   * @param {Object} options
   * @returns {HTMLCanvasElement}
   */
  render(image, metadata, options = {}) {
    const opts = {
      preset: 'classic',
      frameColor: '#FFFFFF',
      textColor: '#111827',
      accentColor: '#E02424',
      fontFamily: 'sans',
      fontSizeScale: 1.3,
      borderScale: 1.0,
      bottomBarScale: 1.0,
      cornerRadius: 0,
      shadowEnabled: false,
      shadowBlur: 24,
      textShadow: false,
      aspectRatio: 'original',
      brandLogo: 'auto',
      items: {
        camera: true,
        lens: true,
        exposure: true,
        focalLength: true,
        ev: false,
        date: true,
        location: false,
        author: true,
        logo: true
      },
      ...options
    };
    if (opts.fontSizeScale === undefined || opts.fontSizeScale === null) {
      opts.fontSizeScale = 1.3;
    }

    const {
      preset,
      aspectRatio
    } = opts;

    const imgW = image.naturalWidth || image.width;
    const imgH = image.naturalHeight || image.height;

    // Determine target crop/fit for photo if aspect ratio is forced
    const targetCrop = this.calculateCrop(imgW, imgH, aspectRatio);
    const croppedW = targetCrop.w;
    const croppedH = targetCrop.h;

    // Preset routing
    switch (preset) {
      case 'classic': // Leica Exhibition Style
        return this.renderClassicFrame({
          image, metadata, options: opts,
          imgW, imgH, targetCrop, croppedW, croppedH
        });
      case 'hasselblad': // Medium Format Technical
        return this.renderHasselbladFrame({
          image, metadata, options: opts,
          imgW, imgH, targetCrop, croppedW, croppedH
        });
      case 'minimal': // Modern Hairline Minimal
        return this.renderMinimalFrame({
          image, metadata, options: opts,
          imgW, imgH, targetCrop, croppedW, croppedH
        });
      case 'polaroid': // Instant Film Style
        return this.renderPolaroidFrame({
          image, metadata, options: opts,
          imgW, imgH, targetCrop, croppedW, croppedH
        });
      case 'cinema': // Cinematic Letterbox
        return this.renderCinemaFrame({
          image, metadata, options: opts,
          imgW, imgH, targetCrop, croppedW, croppedH
        });
      case 'film': // 35mm Analog Negative & Sprocket
        return this.renderFilmNegativeFrame({
          image, metadata, options: opts,
          imgW, imgH, targetCrop, croppedW, croppedH
        });
      case 'overlay-glass': // In-image Frosted Glass Pill
        return this.renderOverlayGlass({
          image, metadata, options: opts,
          imgW, imgH, targetCrop, croppedW, croppedH
        });
      case 'overlay-clean': // In-image Direct Watermark
        return this.renderOverlayClean({
          image, metadata, options: opts,
          imgW, imgH, targetCrop, croppedW, croppedH
        });
      case 'overlay-quartz': // Retro 90s Amber Date Stamp
        return this.renderOverlayQuartz({
          image, metadata, options: opts,
          imgW, imgH, targetCrop, croppedW, croppedH
        });
      default:
        return this.renderClassicFrame({
          image, metadata, options: opts,
          imgW, imgH, targetCrop, croppedW, croppedH
        });
    }
  }

  /* -------------------------------------------------------------
   * Presets Implementation
   * ------------------------------------------------------------- */

  /**
   * Preset 1: Classic Exhibition (Leica Style)
   * Elegant outer borders with extended bottom bar featuring brand badge & specs
   */
  renderClassicFrame({ image, metadata, options, targetCrop, croppedW, croppedH }) {
    const scale = croppedW / 1800;
    const border = Math.round(croppedW * 0.045 * (options.borderScale || 1.0));
    const bottomBar = Math.round(croppedW * 0.12 * (options.bottomBarScale || 1.0));

    const totalW = croppedW + border * 2;
    const totalH = croppedH + border + bottomBar;

    this.canvas.width = totalW;
    this.canvas.height = totalH;
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = options.frameColor || '#FFFFFF';
    ctx.fillRect(0, 0, totalW, totalH);

    // Draw Photo
    const photoX = border;
    const photoY = border;
    this.drawPhotoWithCorners(ctx, image, targetCrop, photoX, photoY, croppedW, croppedH, options);

    // Bottom Bar Area
    const barY = photoY + croppedH;
    const barH = bottomBar;
    const paddingX = Math.round(border * 0.8 + croppedW * 0.02);

    const fontBase = this.getFontFamily(options.fontFamily);
    const textColor = options.textColor || '#111827';
    const subtextColor = this.getMutedColor(textColor, 0.78);

    // Left block: Brand logo + Camera model + Lens
    const centerY = barY + barH * 0.5;
    let leftCursor = photoX + paddingX;

    const fontScale = options.fontSizeScale !== undefined ? options.fontSizeScale : 1.3;
    const logoSize = Math.round(28 * scale * Math.min(1.4, Math.max(0.7, fontScale)));
    if (options.items.logo) {
      const logoBrand = this.resolveBrand(metadata, options.brandLogo);
      this.drawBrandLogo(ctx, logoBrand, leftCursor + logoSize / 2, centerY, logoSize, textColor, options.accentColor);
      leftCursor += logoSize + Math.round(16 * scale);
    }

    const titleSize = Math.round(22 * scale * fontScale);
    const subtitleSize = Math.round(15 * scale * fontScale);
    const lineGap = Math.round(7 * scale * fontScale);

    if (options.items.camera || options.items.lens) {
      const camText = options.items.camera ? (metadata.model || metadata.make || '') : '';
      const lensText = options.items.lens ? (metadata.lens || '') : '';

      this.drawTextBlockCentered(ctx, {
        line1: camText,
        font1: `600 ${titleSize}px ${fontBase}`,
        color1: textColor,
        line2: lensText,
        font2: `400 ${subtitleSize}px ${fontBase}`,
        color2: subtextColor,
        x: leftCursor,
        centerY,
        align: 'left',
        gap: lineGap
      });
    }

    // Right block: Exposure specs + Date/Author
    const rightCursor = photoX + croppedW - paddingX;

    const specTokens = [];
    if (options.items.focalLength && metadata.focalLength) specTokens.push(metadata.focalLength);
    if (options.items.exposure) {
      if (metadata.aperture) specTokens.push(metadata.aperture);
      if (metadata.shutterSpeed) specTokens.push(metadata.shutterSpeed);
      if (metadata.iso) specTokens.push(metadata.iso);
    }
    if (options.items.ev && metadata.ev) specTokens.push(metadata.ev);

    const specsLine = specTokens.join('  ·  ');
    const sublineTokens = [];
    if (options.items.date && metadata.date) sublineTokens.push(metadata.date);
    if (options.items.author && metadata.author) sublineTokens.push(metadata.author);
    if (options.items.location && metadata.location) sublineTokens.push(metadata.location);
    const subline = sublineTokens.join('  |  ');

    if (specsLine || subline) {
      this.drawTextBlockCentered(ctx, {
        line1: specsLine,
        font1: `600 ${titleSize}px ${fontBase}`,
        color1: textColor,
        line2: subline,
        font2: `400 ${subtitleSize}px ${fontBase}`,
        color2: subtextColor,
        x: rightCursor,
        centerY,
        align: 'right',
        gap: lineGap
      });
    }

    return this.canvas;
  }

  /**
   * Preset 2: Hasselblad Medium Format Technical Frame
   * Precise typography, Swedish minimalist accent line, geometric exposure badge pills
   */
  renderHasselbladFrame({ image, metadata, options, targetCrop, croppedW, croppedH }) {
    const scale = croppedW / 1800;
    const border = Math.round(croppedW * 0.05 * (options.borderScale || 1.0));
    const bottomBar = Math.round(croppedW * 0.14 * (options.bottomBarScale || 1.0));

    const totalW = croppedW + border * 2;
    const totalH = croppedH + border + bottomBar;

    this.canvas.width = totalW;
    this.canvas.height = totalH;
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = options.frameColor || '#0E0F12';
    ctx.fillRect(0, 0, totalW, totalH);

    // Draw Photo
    const photoX = border;
    const photoY = border;
    this.drawPhotoWithCorners(ctx, image, targetCrop, photoX, photoY, croppedW, croppedH, options);

    // Subtle divider accent line
    const textColor = options.textColor || '#F3F4F6';
    const accentColor = options.accentColor || '#F59E0B'; // Hasselblad orange/gold accent
    const fontBase = this.getFontFamily(options.fontFamily);
    const barY = photoY + croppedH;
    const barH = bottomBar;
    const paddingX = Math.round(border * 0.6);

    ctx.strokeStyle = this.getMutedColor(textColor, 0.15);
    ctx.lineWidth = Math.max(1, Math.round(1.5 * scale));
    ctx.beginPath();
    ctx.moveTo(photoX + paddingX, barY + Math.round(barH * 0.15));
    ctx.lineTo(photoX + croppedW - paddingX, barY + Math.round(barH * 0.15));
    ctx.stroke();

    // Center Hasselblad/Camera brand mark
    const centerY = barY + barH * 0.58;

    const fontScale = options.fontSizeScale !== undefined ? options.fontSizeScale : 1.3;
    let leftX = photoX + paddingX;
    if (options.items.logo) {
      const logoBrand = this.resolveBrand(metadata, options.brandLogo);
      const logoSize = Math.round(26 * scale * Math.min(1.4, Math.max(0.7, fontScale)));
      this.drawBrandLogo(ctx, logoBrand, leftX + logoSize / 2, centerY, logoSize, textColor, accentColor);
      leftX += logoSize + Math.round(14 * scale);
    }

    const titleSize = Math.round(20 * scale * fontScale);
    const subSize = Math.round(13 * scale * fontScale);
    const lineGap = Math.round(6 * scale * fontScale);

    const modelName = options.items.camera ? (metadata.model || metadata.make || 'CAMERA').toUpperCase() : '';
    const lensName = options.items.lens ? (metadata.lens || '') : '';

    if (modelName || lensName) {
      this.drawTextBlockCentered(ctx, {
        line1: modelName,
        font1: `700 ${titleSize}px ${fontBase}`,
        color1: textColor,
        line2: lensName,
        font2: `400 ${subSize}px ${fontBase}`,
        color2: this.getMutedColor(textColor, 0.6),
        x: leftX,
        centerY,
        align: 'left',
        gap: lineGap
      });
    }

    // Right: Technical exposure badge boxes
    const badges = [];
    if (options.items.focalLength && metadata.focalLength) badges.push({ label: 'FOCAL', val: metadata.focalLength });
    if (options.items.exposure) {
      if (metadata.aperture) badges.push({ label: 'APERTURE', val: metadata.aperture });
      if (metadata.shutterSpeed) badges.push({ label: 'SHUTTER', val: metadata.shutterSpeed });
      if (metadata.iso) badges.push({ label: 'ISO', val: metadata.iso.replace('ISO ', '') });
    }

    let rightX = photoX + croppedW - paddingX;
    const badgePadX = Math.round(12 * scale);
    const badgeFont = `600 ${Math.round(15 * scale * fontScale)}px ${fontBase}`;
    const labelFont = `500 ${Math.round(9 * scale * fontScale)}px ${fontBase}`;

    // Draw badges from right to left
    badges.reverse().forEach((b) => {
      ctx.font = badgeFont;
      const valWidth = ctx.measureText(b.val).width;
      ctx.font = labelFont;
      const labelWidth = ctx.measureText(b.label).width;
      const boxW = Math.max(valWidth, labelWidth) + badgePadX * 2;
      const boxH = Math.round(38 * scale * Math.max(0.85, fontScale));
      const boxX = rightX - boxW;
      const boxY = centerY - boxH / 2;

      // Badge outline
      ctx.strokeStyle = this.getMutedColor(textColor, 0.22);
      ctx.lineWidth = Math.max(1, Math.round(1 * scale));
      this.roundedRect(ctx, boxX, boxY, boxW, boxH, Math.round(6 * scale));
      ctx.stroke();

      // Top label
      ctx.font = labelFont;
      ctx.fillStyle = this.getMutedColor(textColor, 0.8);
      ctx.textAlign = 'center';
      ctx.fillText(b.label, boxX + boxW / 2, boxY + Math.round(11 * scale * fontScale));

      // Value
      ctx.font = badgeFont;
      ctx.fillStyle = textColor;
      ctx.fillText(b.val, boxX + boxW / 2, boxY + Math.round(26 * scale * fontScale));

      rightX -= boxW + Math.round(10 * scale);
    });

    return this.canvas;
  }

  /**
   * Preset 3: Modern Hairline Minimal
   * Clean hairline frame with single-line metadata and bullet dots
   */
  renderMinimalFrame({ image, metadata, options, targetCrop, croppedW, croppedH }) {
    const scale = croppedW / 1800;
    const border = Math.round(croppedW * 0.03 * (options.borderScale || 1.0));
    const bottomBar = Math.round(croppedW * 0.075 * (options.bottomBarScale || 1.0));

    const totalW = croppedW + border * 2;
    const totalH = croppedH + border + bottomBar;

    this.canvas.width = totalW;
    this.canvas.height = totalH;
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = options.frameColor || '#FFFFFF';
    ctx.fillRect(0, 0, totalW, totalH);

    // Draw Photo
    const photoX = border;
    const photoY = border;
    this.drawPhotoWithCorners(ctx, image, targetCrop, photoX, photoY, croppedW, croppedH, options);

    // Bottom Bar
    const textColor = options.textColor || '#1F2937';
    const fontBase = this.getFontFamily(options.fontFamily);
    const centerY = photoY + croppedH + bottomBar * 0.5;

    const parts = [];
    if (options.items.camera && metadata.model) parts.push(metadata.model);
    if (options.items.lens && metadata.lens) parts.push(metadata.lens);
    if (options.items.focalLength && metadata.focalLength) parts.push(metadata.focalLength);
    if (options.items.exposure) {
      if (metadata.aperture) parts.push(metadata.aperture);
      if (metadata.shutterSpeed) parts.push(metadata.shutterSpeed);
      if (metadata.iso) parts.push(metadata.iso);
    }
    if (options.items.date && metadata.date) parts.push(metadata.date);
    if (options.items.author && metadata.author) parts.push(metadata.author);

    const fontScale = options.fontSizeScale !== undefined ? options.fontSizeScale : 1.3;
    const fullText = parts.join('   ·   ');
    const fontSize = Math.round(16 * scale * fontScale);

    ctx.font = `400 ${fontSize}px ${fontBase}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fullText, totalW / 2, centerY);

    return this.canvas;
  }

  /**
   * Preset 4: Classic Polaroid / Instant Film
   * Authentic proportions: equal top and sides with large bottom chin, typewriter/handwritten font
   */
  renderPolaroidFrame({ image, metadata, options, targetCrop, croppedW, croppedH }) {
    const scale = croppedW / 1800;
    const border = Math.round(croppedW * 0.06 * (options.borderScale || 1.0));
    const bottomBar = Math.round(croppedW * 0.22 * (options.bottomBarScale || 1.0));

    const totalW = croppedW + border * 2;
    const totalH = croppedH + border + bottomBar;

    this.canvas.width = totalW;
    this.canvas.height = totalH;
    const ctx = this.ctx;

    // Classic Polaroid Ivory / Off-white paper background
    ctx.fillStyle = options.frameColor || '#F7F5F0';
    ctx.fillRect(0, 0, totalW, totalH);

    // Draw Photo
    const photoX = border;
    const photoY = border;
    this.drawPhotoWithCorners(ctx, image, targetCrop, photoX, photoY, croppedW, croppedH, options);

    // Bottom Chin Typography
    const textColor = options.textColor || '#2D3139';
    const fontBase = options.fontFamily === 'handwriting' 
      ? "'Caveat', cursive, sans-serif" 
      : (this.getFontFamily(options.fontFamily));

    const centerY = photoY + croppedH + bottomBar * 0.48;
    const authorLine = options.items.author && metadata.author ? metadata.author : (metadata.model || 'SpecFrame Instant');

    const specs = [];
    if (options.items.focalLength && metadata.focalLength) specs.push(metadata.focalLength);
    if (options.items.exposure) {
      if (metadata.aperture) specs.push(metadata.aperture);
      if (metadata.shutterSpeed) specs.push(metadata.shutterSpeed);
      if (metadata.iso) specs.push(metadata.iso);
    }
    if (options.items.date && metadata.date) specs.push(metadata.date);

    const fontScale = options.fontSizeScale !== undefined ? options.fontSizeScale : 1.3;
    const titleSize = Math.round(30 * scale * fontScale);
    const specSize = Math.round(16 * scale * fontScale);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `600 ${titleSize}px ${fontBase}`;
    ctx.fillStyle = textColor;
    ctx.fillText(authorLine, totalW / 2, centerY - titleSize * 0.4);

    if (specs.length > 0) {
      ctx.font = `400 ${specSize}px ${fontBase}`;
      ctx.fillStyle = this.getMutedColor(textColor, 0.65);
      ctx.fillText(specs.join('   /   '), totalW / 2, centerY + specSize * 0.9);
    }

    return this.canvas;
  }

  /**
   * Preset 5: Cinema Scope / Letterbox
   * Dark top and bottom cinematic matte bars with illuminated corner camera stats
   */
  renderCinemaFrame({ image, metadata, options, targetCrop, croppedW, croppedH }) {
    const scale = croppedW / 1800;
    const barH = Math.round(croppedH * 0.12 * (options.bottomBarScale || 1.0));

    const totalW = croppedW;
    const totalH = croppedH + barH * 2;

    this.canvas.width = totalW;
    this.canvas.height = totalH;
    const ctx = this.ctx;

    // Cinema Black bars
    ctx.fillStyle = options.frameColor || '#070709';
    ctx.fillRect(0, 0, totalW, totalH);

    // Photo in center
    const photoX = 0;
    const photoY = barH;
    this.drawPhotoWithCorners(ctx, image, targetCrop, photoX, photoY, croppedW, croppedH, options);

    const textColor = options.textColor || '#ECEFF4';
    const accentColor = options.accentColor || '#38BDF8';
    const fontBase = this.getFontFamily('mono');
    const padX = Math.round(croppedW * 0.04);

    const fontScale = options.fontSizeScale !== undefined ? options.fontSizeScale : 1.3;
    const topCenterY = barH / 2;
    const botCenterY = totalH - barH / 2;
    const fontSize = Math.round(14 * scale * fontScale);

    // Top Bar: Date / Title
    ctx.font = `500 ${fontSize}px ${fontBase}`;
    ctx.fillStyle = this.getMutedColor(textColor, 0.6);
    ctx.textBaseline = 'middle';

    ctx.textAlign = 'left';
    ctx.fillText('CINEMATIC SPEC // 2.39:1', padX, topCenterY);

    if (options.items.date && metadata.date) {
      ctx.textAlign = 'right';
      ctx.fillText(metadata.date, totalW - padX, topCenterY);
    }

    // Bottom Bar: Left Camera & Lens, Right Exposure specs
    ctx.textAlign = 'left';
    const camText = [
      options.items.camera ? metadata.model : '',
      options.items.lens ? metadata.lens : ''
    ].filter(Boolean).join('  +  ');

    ctx.fillStyle = textColor;
    ctx.fillText(camText, padX, botCenterY);

    const specs = [];
    if (options.items.focalLength && metadata.focalLength) specs.push(metadata.focalLength);
    if (options.items.exposure) {
      if (metadata.aperture) specs.push(metadata.aperture);
      if (metadata.shutterSpeed) specs.push(metadata.shutterSpeed);
      if (metadata.iso) specs.push(metadata.iso);
    }
    if (specs.length > 0) {
      ctx.textAlign = 'right';
      ctx.fillStyle = textColor;
      ctx.fillText(specs.join('   '), totalW - padX, botCenterY);
    }

    return this.canvas;
  }

  /**
   * Preset 6: 35mm Analog Negative & Film Sprocket Style
   * Sprocket holes, frame counter "▶ 24A", film stock label and exposure stats
   */
  renderFilmNegativeFrame({ image, metadata, options, targetCrop, croppedW, croppedH }) {
    const scale = croppedW / 1800;
    const border = Math.round(croppedW * 0.04 * (options.borderScale || 1.0));
    const sprocketBarH = Math.round(croppedW * 0.09 * (options.bottomBarScale || 1.0));

    const totalW = croppedW + border * 2;
    const totalH = croppedH + sprocketBarH * 2;

    this.canvas.width = totalW;
    this.canvas.height = totalH;
    const ctx = this.ctx;

    // Dark film border
    ctx.fillStyle = options.frameColor || '#121215';
    ctx.fillRect(0, 0, totalW, totalH);

    // Draw Sprocket holes top and bottom
    const spW = Math.round(20 * scale);
    const spH = Math.round(28 * scale);
    const spRadius = Math.round(5 * scale);
    const spSpacing = Math.round(48 * scale);
    const spYTop = Math.round(sprocketBarH * 0.22);
    const spYBot = totalH - Math.round(sprocketBarH * 0.65);

    ctx.fillStyle = '#050507';
    for (let x = border; x < totalW - border; x += spSpacing) {
      this.roundedRect(ctx, x, spYTop, spW, spH, spRadius);
      ctx.fill();
      this.roundedRect(ctx, x, spYBot, spW, spH, spRadius);
      ctx.fill();
    }

    // Photo
    const photoX = border;
    const photoY = sprocketBarH;
    this.drawPhotoWithCorners(ctx, image, targetCrop, photoX, photoY, croppedW, croppedH, options);

    // Film Stamp texts in amber/gold color
    const fontScale = options.fontSizeScale !== undefined ? options.fontSizeScale : 1.3;
    const textColor = options.textColor || '#F59E0B';
    const fontBase = this.getFontFamily('mono');
    const fontSize = Math.round(14 * scale * fontScale);

    ctx.font = `700 ${fontSize}px ${fontBase}`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';

    // Top text: Film brand & ISO
    ctx.textAlign = 'left';
    const filmName = options.items.author && metadata.author ? metadata.author : 'KODAK PORTRA 400';
    ctx.fillText(`▶ 24A   ${filmName}   ${metadata.iso || 'ISO 400'}`, photoX + 10, Math.round(sprocketBarH * 0.78));

    // Bottom text: Lens & Exposure
    const specs = [
      metadata.model || '',
      metadata.focalLength || '',
      metadata.aperture || '',
      metadata.shutterSpeed || ''
    ].filter(Boolean).join('   ');

    ctx.textAlign = 'right';
    ctx.fillText(`${specs}   SAFETY FILM`, photoX + croppedW - 10, totalH - Math.round(sprocketBarH * 0.22));

    return this.canvas;
  }

  /**
   * Preset 7: In-Image Frosted Glass Badge (Glassmorphism Pill)
   * 100% original photo size (no outer border!). Stylish frosted pill in corner.
   */
  renderOverlayGlass({ image, metadata, options, targetCrop, croppedW, croppedH }) {
    const scale = croppedW / 1800;
    this.canvas.width = croppedW;
    this.canvas.height = croppedH;
    const ctx = this.ctx;

    // Draw full cropped photo
    this.drawPhotoWithCorners(ctx, image, targetCrop, 0, 0, croppedW, croppedH, { cornerRadius: 0 });

    const fontBase = this.getFontFamily(options.fontFamily);
    const textColor = options.textColor || '#FFFFFF';
    const accentColor = options.accentColor || '#FF5E36';

    // Build specs string
    const titleParts = [];
    if (options.items.camera && metadata.model) titleParts.push(metadata.model);
    if (options.items.lens && metadata.lens) titleParts.push(metadata.lens);

    const specParts = [];
    if (options.items.focalLength && metadata.focalLength) specParts.push(metadata.focalLength);
    if (options.items.exposure) {
      if (metadata.aperture) specParts.push(metadata.aperture);
      if (metadata.shutterSpeed) specParts.push(metadata.shutterSpeed);
      if (metadata.iso) specParts.push(metadata.iso);
    }
    if (options.items.date && metadata.date) specParts.push(metadata.date);

    const titleLine = titleParts.join('  ·  ') || 'SpecFrame';
    const specsLine = specParts.join('   ');

    const fontScale = options.fontSizeScale !== undefined ? options.fontSizeScale : 1.3;
    const titleSize = Math.round(18 * scale * fontScale);
    const specSize = Math.round(14 * scale * fontScale);

    ctx.font = `600 ${titleSize}px ${fontBase}`;
    const titleW = ctx.measureText(titleLine).width;
    ctx.font = `500 ${specSize}px ${fontBase}`;
    const specsW = ctx.measureText(specsLine).width;

    const contentW = Math.max(titleW, specsW);
    const logoSize = options.items.logo ? Math.round(24 * scale * Math.min(1.4, Math.max(0.7, fontScale))) : 0;
    const padX = Math.round(20 * scale);
    const padY = Math.round(14 * scale);

    const cardW = contentW + (logoSize ? logoSize + Math.round(16 * scale) : 0) + padX * 2;
    const cardH = titleSize + specSize + padY * 2 + Math.round(6 * scale);

    const margin = Math.round(croppedW * 0.035);
    const cardX = croppedW - cardW - margin;
    const cardY = croppedH - cardH - margin;
    const pillRadius = Math.round(16 * scale);

    // Frosted Glass Card background
    ctx.save();
    this.roundedRect(ctx, cardX, cardY, cardW, cardH, pillRadius);
    ctx.fillStyle = 'rgba(15, 18, 24, 0.72)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.round(24 * scale);
    ctx.shadowOffsetY = Math.round(6 * scale);
    ctx.fill();

    // Subtle glass border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = Math.max(1, Math.round(1.5 * scale));
    ctx.stroke();
    ctx.restore();

    // Content inside card
    const cardCenterY = cardY + cardH / 2;
    let textStartX = cardX + padX;
    if (options.items.logo) {
      const logoBrand = this.resolveBrand(metadata, options.brandLogo);
      this.drawBrandLogo(ctx, logoBrand, textStartX + logoSize / 2, cardCenterY, logoSize, textColor, accentColor);
      textStartX += logoSize + Math.round(14 * scale);
    }

    ctx.save();
    if (options.textShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = Math.round(8 * scale);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.round(1 * scale);
    }

    this.drawTextBlockCentered(ctx, {
      line1: titleLine,
      font1: `600 ${titleSize}px ${fontBase}`,
      color1: textColor,
      line2: specsLine,
      font2: `500 ${specSize}px ${fontBase}`,
      color2: this.getMutedColor(textColor, 0.82),
      x: textStartX,
      centerY: cardCenterY,
      align: 'left',
      gap: Math.round(6 * scale * fontScale)
    });
    ctx.restore();

    return this.canvas;
  }

  /**
   * Preset 8: In-Image Clean Minimal Direct Watermark
   * Text placed directly over photo with soft readable drop-shadow
   */
  renderOverlayClean({ image, metadata, options, targetCrop, croppedW, croppedH }) {
    const scale = croppedW / 1800;
    this.canvas.width = croppedW;
    this.canvas.height = croppedH;
    const ctx = this.ctx;

    // Draw photo
    this.drawPhotoWithCorners(ctx, image, targetCrop, 0, 0, croppedW, croppedH, { cornerRadius: 0 });

    const fontBase = this.getFontFamily(options.fontFamily);
    const textColor = options.textColor || '#FFFFFF';
    const margin = Math.round(croppedW * 0.04);

    const titleParts = [];
    if (options.items.camera && metadata.model) titleParts.push(metadata.model);
    if (options.items.lens && metadata.lens) titleParts.push(metadata.lens);

    const specParts = [];
    if (options.items.focalLength && metadata.focalLength) specParts.push(metadata.focalLength);
    if (options.items.exposure) {
      if (metadata.aperture) specParts.push(metadata.aperture);
      if (metadata.shutterSpeed) specParts.push(metadata.shutterSpeed);
      if (metadata.iso) specParts.push(metadata.iso);
    }
    if (options.items.date && metadata.date) specParts.push(metadata.date);
    if (options.items.author && metadata.author) specParts.push(metadata.author);

    const titleLine = titleParts.join('  ·  ');
    const specsLine = specParts.join('   ');

    const fontScale = options.fontSizeScale !== undefined ? options.fontSizeScale : 1.3;
    const titleSize = Math.round(22 * scale * fontScale);
    const specSize = Math.round(16 * scale * fontScale);

    ctx.save();
    if (options.textShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = Math.round(12 * scale);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.round(2 * scale);
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    if (specsLine) {
      ctx.font = `500 ${specSize}px ${fontBase}`;
      ctx.fillStyle = this.getMutedColor(textColor, 0.85);
      ctx.fillText(specsLine, croppedW - margin, croppedH - margin);
    }

    if (titleLine) {
      ctx.font = `600 ${titleSize}px ${fontBase}`;
      ctx.fillStyle = textColor;
      ctx.fillText(titleLine, croppedW - margin, croppedH - margin - specSize * 1.5);
    }

    ctx.restore();
    return this.canvas;
  }

  /**
   * Preset 9: Retro 90s Quartz Date & Exposure Stamp
   * Iconic amber LCD font in bottom right corner
   */
  renderOverlayQuartz({ image, metadata, options, targetCrop, croppedW, croppedH }) {
    const scale = croppedW / 1800;
    this.canvas.width = croppedW;
    this.canvas.height = croppedH;
    const ctx = this.ctx;

    // Draw photo
    this.drawPhotoWithCorners(ctx, image, targetCrop, 0, 0, croppedW, croppedH, { cornerRadius: 0 });

    const fontBase = "'VT323', 'Courier New', monospace";
    const stampColor = options.textColor && options.textColor !== '#FFFFFF' ? options.textColor : (options.accentColor || '#FFA100');
    const margin = Math.round(croppedW * 0.04);

    // Format quartz date stamp: '24 10 18
    let dateStr = "'24 10 18";
    if (metadata.date) {
      const parts = metadata.date.split(' ')[0].split('.');
      if (parts.length === 3) {
        dateStr = `'${parts[0].slice(-2)} ${parts[1]} ${parts[2]}`;
      }
    }

    const specs = [];
    if (metadata.aperture) specs.push(metadata.aperture.replace('/', ''));
    if (metadata.shutterSpeed) specs.push(metadata.shutterSpeed.replace('s', ''));
    if (metadata.iso) specs.push(metadata.iso);

    const fontScale = options.fontSizeScale !== undefined ? options.fontSizeScale : 1.3;
    const stampLine = `${dateStr}   ${specs.join(' ')}`;
    const fontSize = Math.round(36 * scale * fontScale);

    ctx.save();
    // Glowing amber stamp
    ctx.shadowColor = 'rgba(255, 140, 0, 0.75)';
    ctx.shadowBlur = Math.round(10 * scale);
    ctx.font = `700 ${fontSize}px ${fontBase}`;
    ctx.fillStyle = stampColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(stampLine, croppedW - margin, croppedH - margin);
    ctx.restore();

    return this.canvas;
  }

  /* -------------------------------------------------------------
   * Helper Methods & Drawing Utilities
   * ------------------------------------------------------------- */

  drawPhotoWithCorners(ctx, image, crop, x, y, w, h, options) {
    const radius = Math.min(w / 4, Math.min(h / 4, (options.cornerRadius || 0)));

    ctx.save();

    // Shadow if enabled
    if (options.shadowEnabled && radius > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = options.shadowBlur || 24;
      ctx.shadowOffsetY = Math.round((options.shadowBlur || 24) * 0.3);
    }

    if (radius > 0) {
      this.roundedRect(ctx, x, y, w, h, radius);
      ctx.clip();
    }

    ctx.drawImage(
      image,
      crop.x, crop.y, crop.w, crop.h,
      x, y, w, h
    );

    ctx.restore();
  }

  calculateCrop(imgW, imgH, ratio) {
    if (!ratio || ratio === 'original') {
      return { x: 0, y: 0, w: imgW, h: imgH };
    }

    let targetRatio = imgW / imgH;
    if (ratio === '1:1') targetRatio = 1;
    else if (ratio === '4:5') targetRatio = 4 / 5;
    else if (ratio === '16:9') targetRatio = 16 / 9;
    else if (ratio === '3:2') targetRatio = 3 / 2;
    else if (ratio === '9:16') targetRatio = 9 / 16;

    const currentRatio = imgW / imgH;
    let cropW = imgW;
    let cropH = imgH;
    let cropX = 0;
    let cropY = 0;

    if (currentRatio > targetRatio) {
      // Image is wider than target
      cropW = Math.round(imgH * targetRatio);
      cropX = Math.round((imgW - cropW) / 2);
    } else {
      // Image is taller than target
      cropH = Math.round(imgW / targetRatio);
      cropY = Math.round((imgH - cropH) / 2);
    }

    return { x: cropX, y: cropY, w: cropW, h: cropH };
  }

  roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  getFontFamily(fontKey) {
    switch (fontKey) {
      case 'montserrat':
        return "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      case 'cormorant':
        return "'Cormorant Garamond', 'Shippori Mincho', 'Playfair Display', Georgia, serif";
      case 'cinzel':
        return "'Cinzel', 'Playfair Display', 'Shippori Mincho', Georgia, serif";
      case 'shippori':
        return "'Shippori Mincho', 'Cormorant Garamond', 'Playfair Display', 'Noto Serif JP', serif";
      case 'serif':
      case 'playfair':
        return "'Playfair Display', 'Cormorant Garamond', 'Shippori Mincho', Georgia, serif";
      case 'grotesk':
        return "'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      case 'mono':
        return "'JetBrains Mono', 'Roboto Mono', Menlo, Consolas, monospace";
      case 'handwriting':
        return "'Caveat', cursive, sans-serif";
      case 'lcd':
        return "'VT323', 'Courier New', monospace";
      case 'sans':
      default:
        return "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', sans-serif";
    }
  }

  getMutedColor(hex, opacity = 0.6) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  resolveBrand(metadata, manualBrand) {
    if (manualBrand && manualBrand !== 'auto') {
      return manualBrand;
    }
    return metadata.brand || 'camera';
  }

  /**
   * Draw 1- or 2-line text block such that its visual bounding box center
   * aligns exactly with centerY (matching adjacent logo centerY).
   */
  drawTextBlockCentered(ctx, { line1, font1, color1, line2, font2, color2, x, centerY, align = 'left', gap = 6 }) {
    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';

    if (!line1 && !line2) {
      ctx.restore();
      return;
    }

    if (!line2) {
      ctx.font = font1;
      ctx.fillStyle = color1;
      const m1 = ctx.measureText(line1);
      const asc1 = m1.actualBoundingBoxAscent || (parseFloat(font1.match(/(\d+(?:\.\d+)?)px/)?.[1] || 20) * 0.72);
      const desc1 = m1.actualBoundingBoxDescent ?? 0;
      const base1 = centerY + (asc1 - desc1) / 2;
      ctx.fillText(line1, x, base1);
      ctx.restore();
      return;
    }

    if (!line1) {
      ctx.font = font2;
      ctx.fillStyle = color2;
      const m2 = ctx.measureText(line2);
      const asc2 = m2.actualBoundingBoxAscent || (parseFloat(font2.match(/(\d+(?:\.\d+)?)px/)?.[1] || 14) * 0.72);
      const desc2 = m2.actualBoundingBoxDescent ?? 0;
      const base2 = centerY + (asc2 - desc2) / 2;
      ctx.fillText(line2, x, base2);
      ctx.restore();
      return;
    }

    ctx.font = font1;
    const m1 = ctx.measureText(line1);
    const asc1 = m1.actualBoundingBoxAscent || (parseFloat(font1.match(/(\d+(?:\.\d+)?)px/)?.[1] || 20) * 0.72);
    const desc1 = m1.actualBoundingBoxDescent ?? 0;

    ctx.font = font2;
    const m2 = ctx.measureText(line2);
    const asc2 = m2.actualBoundingBoxAscent || (parseFloat(font2.match(/(\d+(?:\.\d+)?)px/)?.[1] || 14) * 0.72);
    const desc2 = m2.actualBoundingBoxDescent ?? 0;

    const h1 = asc1 + desc1;
    const h2 = asc2 + desc2;
    const totalH = h1 + gap + h2;
    const topY = centerY - totalH / 2;

    const base1 = topY + asc1;
    const base2 = topY + h1 + gap + asc2;

    ctx.font = font1;
    ctx.fillStyle = color1;
    ctx.fillText(line1, x, base1);

    ctx.font = font2;
    ctx.fillStyle = color2;
    ctx.fillText(line2, x, base2);

    ctx.restore();
  }

  /**
   * Draw a text glyph centered on (x, y) using its true visual bounding box
   */
  drawCenteredGlyph(ctx, text, x, y) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(text);
    const asc = m.actualBoundingBoxAscent ?? 0;
    const desc = m.actualBoundingBoxDescent ?? 0;
    if (asc > 0 || desc > 0) {
      ctx.fillText(text, x, y + (asc - desc) / 2);
    } else {
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    }
  }

  /**
   * Draw camera manufacturer vector logo / badge
   */
  drawBrandLogo(ctx, brand, x, y, size, color, accentColor) {
    ctx.save();
    ctx.translate(x, y);

    const r = size / 2;

    switch (brand.toLowerCase()) {
      case 'leica':
        // Iconic Leica Red Dot
        ctx.fillStyle = '#E02424';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // White script "Leica" text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `italic 700 ${Math.round(size * 0.46)}px 'Playfair Display', serif`;
        this.drawCenteredGlyph(ctx, 'Leica', 0, 0);
        break;

      case 'hasselblad':
        // Hasselblad elegant monogram / circle
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.5, size * 0.08);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = `italic 700 ${Math.round(size * 0.58)}px serif`;
        ctx.fillStyle = accentColor || '#F59E0B';
        this.drawCenteredGlyph(ctx, 'H', 0, 0);
        break;

      case 'sony':
        // Sony Alpha badge - visually centered via actualBoundingBox
        ctx.fillStyle = '#FF5E36';
        ctx.font = `700 ${Math.round(size * 0.85)}px sans-serif`;
        this.drawCenteredGlyph(ctx, 'α', 0, 0);
        break;

      case 'fujifilm': {
        // Fuji green/red dot badge centered on (0, 0)
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, size * 0.06);
        const rectH = r * 1.25;
        ctx.strokeRect(-r, -rectH / 2, size, rectH);

        ctx.fillStyle = '#E02424';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'canon':
        ctx.font = `bold ${Math.round(size * 0.65)}px serif`;
        ctx.fillStyle = '#CC0000';
        this.drawCenteredGlyph(ctx, 'C', 0, 0);
        break;

      case 'nikon':
        // Nikon yellow badge
        ctx.fillStyle = '#FFE600';
        ctx.fillRect(-r, -r, size, size);
        ctx.fillStyle = '#111111';
        ctx.font = `italic 800 ${Math.round(size * 0.65)}px sans-serif`;
        this.drawCenteredGlyph(ctx, 'N', 0, 0);
        break;

      case 'apple':
        ctx.font = `${Math.round(size * 0.8)}px sans-serif`;
        ctx.fillStyle = color;
        this.drawCenteredGlyph(ctx, '', 0, 0);
        break;

      case 'lumix':
        ctx.font = `bold italic ${Math.round(size * 0.7)}px sans-serif`;
        ctx.fillStyle = '#E02424';
        this.drawCenteredGlyph(ctx, 'L', 0, 0);
        break;

      case 'ricoh': {
        // Ricoh GR Red badge centered on (0, 0)
        ctx.fillStyle = '#E02424';
        const rectH = r * 1.35;
        this.roundedRect(ctx, -r, -rectH / 2, size, rectH, size * 0.18);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(size * 0.52)}px sans-serif`;
        this.drawCenteredGlyph(ctx, 'GR', 0, 0);
        break;
      }

      default:
        // Stylized vector camera aperture
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.5, size * 0.07);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = accentColor || '#FF5E36';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}

window.FrameRenderer = FrameRenderer;
