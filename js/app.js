/**
 * SpecFrame Application Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  const exifService = new window.ExifService();
  const paletteService = new window.PaletteService();
  const renderer = new window.FrameRenderer();

  // App State
  const state = {
    currentImage: null,
    imageSrc: null,
    metadata: exifService.getDefaultMetadata(),
    extractedPalette: [],
    deferredPrompt: null,
    options: {
      preset: 'classic',
      frameColor: '#FFFFFF',
      textColor: '#111827',
      accentColor: '#E02424',
      fontFamily: 'sans',
      fontSizeScale: 1.0,
      borderScale: 1.0,
      bottomBarScale: 1.0,
      cornerRadius: 0,
      shadowEnabled: false,
      shadowBlur: 24,
      aspectRatio: 'original',
      brandLogo: 'auto',
      exportFormat: 'jpeg',
      exportQuality: 0.92,
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
      }
    }
  };

  // DOM Elements
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const previewCanvas = document.getElementById('preview-canvas');
  const previewContainer = document.getElementById('preview-container');
  const emptyState = document.getElementById('empty-state');
  const activeWorkspace = document.getElementById('active-workspace');
  const downloadBtn = document.getElementById('download-btn');
  const copyBtn = document.getElementById('copy-btn');
  const pwaInstallBtn = document.getElementById('pwa-install-btn');
  const resolutionBadge = document.getElementById('resolution-badge');
  const paletteChipsContainer = document.getElementById('palette-chips');

  // Sample Buttons
  const sample1Btn = document.getElementById('sample-1-btn');
  const sample2Btn = document.getElementById('sample-2-btn');

  // Metadata Form Inputs
  const metaMake = document.getElementById('meta-make');
  const metaModel = document.getElementById('meta-model');
  const metaLens = document.getElementById('meta-lens');
  const metaFocal = document.getElementById('meta-focal');
  const metaAperture = document.getElementById('meta-aperture');
  const metaShutter = document.getElementById('meta-shutter');
  const metaIso = document.getElementById('meta-iso');
  const metaEv = document.getElementById('meta-ev');
  const metaDate = document.getElementById('meta-date');
  const metaAuthor = document.getElementById('meta-author');
  const metaLocation = document.getElementById('meta-location');
  const brandLogoSelect = document.getElementById('brand-logo-select');

  // Sliders and Selects
  const borderScaleInput = document.getElementById('border-scale-input');
  const borderScaleVal = document.getElementById('border-scale-val');
  const bottomBarScaleInput = document.getElementById('bottom-bar-scale-input');
  const bottomBarScaleVal = document.getElementById('bottom-bar-scale-val');
  const cornerRadiusInput = document.getElementById('corner-radius-input');
  const cornerRadiusVal = document.getElementById('corner-radius-val');
  const fontSizeScaleInput = document.getElementById('font-size-scale-input');
  const fontSizeScaleVal = document.getElementById('font-size-scale-val');
  const resetStyleBtn = document.getElementById('reset-style-btn');
  const dragOverlay = document.getElementById('drag-overlay');
  const frameColorPicker = document.getElementById('frame-color-picker');
  const textColorPicker = document.getElementById('text-color-picker');
  const accentColorPicker = document.getElementById('accent-color-picker');
  const fontFamilySelect = document.getElementById('font-family-select');
  const aspectRatioSelect = document.getElementById('aspect-ratio-select');
  const exportFormatSelect = document.getElementById('export-format-select');
  const exportQualityInput = document.getElementById('export-quality-input');
  const exportQualityVal = document.getElementById('export-quality-val');

  /* ------------------------------------------------------------------
   * Service Worker & PWA Installation
   * ------------------------------------------------------------------ */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        reg.update();
      }).catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    if (pwaInstallBtn) {
      pwaInstallBtn.style.display = 'inline-flex';
    }
  });

  if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', async () => {
      if (state.deferredPrompt) {
        state.deferredPrompt.prompt();
        const { outcome } = await state.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          pwaInstallBtn.style.display = 'none';
        }
        state.deferredPrompt = null;
      }
    });
  }

  /* ------------------------------------------------------------------
   * Image Loading & Processing
   * ------------------------------------------------------------------ */
  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      await loadImageFromSource(dataUrl, file);
    };
    reader.readAsDataURL(file);
  }

  async function loadImageFromSource(src, fileOrBlob) {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      state.currentImage = img;
      state.imageSrc = src;

      // Extract EXIF
      const parsedMeta = await exifService.parse(fileOrBlob || src);
      state.metadata = parsedMeta;

      // Extract harmonic colors from photo
      state.extractedPalette = paletteService.extract(img);
      renderPaletteChips();

      // Populate form fields
      syncMetadataForm();

      // Adjust defaults based on preset
      applyPresetStyles(state.options.preset);

      // Show workspace, hide empty drop area
      if (emptyState) emptyState.classList.add('hidden');
      if (activeWorkspace) activeWorkspace.classList.remove('hidden');

      // Trigger Render
      renderCanvas();
      setTimeout(fitPreviewCanvas, 40);
    };

    img.src = src;
  }

  /* ------------------------------------------------------------------
   * UI Sync & Forms
   * ------------------------------------------------------------------ */
  function syncMetadataForm() {
    const m = state.metadata;
    if (metaMake) metaMake.value = m.make || '';
    if (metaModel) metaModel.value = m.model || '';
    if (metaLens) metaLens.value = m.lens || '';
    if (metaFocal) metaFocal.value = m.focalLength || '';
    if (metaAperture) metaAperture.value = m.aperture || '';
    if (metaShutter) metaShutter.value = m.shutterSpeed || '';
    if (metaIso) metaIso.value = m.iso || '';
    if (metaEv) metaEv.value = m.ev || '';
    if (metaDate) metaDate.value = m.date || '';
    if (metaAuthor) metaAuthor.value = m.author || '';
    if (metaLocation) metaLocation.value = m.location || '';

    if (brandLogoSelect) {
      brandLogoSelect.value = state.options.brandLogo || 'auto';
    }
  }

  function renderPaletteChips() {
    if (!paletteChipsContainer) return;
    paletteChipsContainer.innerHTML = '';

    // Standard preset color chips
    const allChips = [
      ...paletteService.classicPalettes,
      ...state.extractedPalette
    ];

    allChips.forEach((chip) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-chip';
      btn.title = chip.name;
      btn.style.backgroundColor = chip.hex;

      if (state.options.frameColor.toLowerCase() === chip.hex.toLowerCase()) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        state.options.frameColor = chip.hex;
        state.options.textColor = chip.text;
        if (frameColorPicker) frameColorPicker.value = chip.hex;
        if (textColorPicker) textColorPicker.value = chip.text;
        
        document.querySelectorAll('.palette-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCanvas();
      });

      paletteChipsContainer.appendChild(btn);
    });
  }

  function applyPresetStyles(preset) {
    state.options.preset = preset;

    // Smart default styles according to selected aesthetic preset
    if (preset === 'classic') {
      state.options.frameColor = '#FFFFFF';
      state.options.textColor = '#111827';
      state.options.accentColor = '#E02424';
      state.options.fontFamily = 'sans';
    } else if (preset === 'hasselblad') {
      state.options.frameColor = '#0F1014';
      state.options.textColor = '#F3F4F6';
      state.options.accentColor = '#F59E0B';
      state.options.fontFamily = 'sans';
    } else if (preset === 'minimal') {
      state.options.frameColor = '#FFFFFF';
      state.options.textColor = '#1F2937';
      state.options.borderScale = 0.8;
      state.options.fontFamily = 'sans';
    } else if (preset === 'polaroid') {
      state.options.frameColor = '#F8F6F0';
      state.options.textColor = '#2B2B30';
      state.options.fontFamily = 'handwriting';
    } else if (preset === 'cinema') {
      state.options.frameColor = '#060709';
      state.options.textColor = '#ECEFF4';
      state.options.accentColor = '#38BDF8';
      state.options.fontFamily = 'mono';
    } else if (preset === 'film') {
      state.options.frameColor = '#121215';
      state.options.textColor = '#F59E0B';
      state.options.accentColor = '#F59E0B';
      state.options.fontFamily = 'mono';
    } else if (preset.startsWith('overlay')) {
      state.options.textColor = '#FFFFFF';
      state.options.accentColor = '#FF5E36';
      state.options.fontFamily = preset === 'overlay-quartz' ? 'mono' : 'sans';
    }

    if (frameColorPicker) frameColorPicker.value = state.options.frameColor;
    if (textColorPicker) textColorPicker.value = state.options.textColor;
    if (accentColorPicker) accentColorPicker.value = state.options.accentColor;
    if (fontFamilySelect) fontFamilySelect.value = state.options.fontFamily;
  }

  /* ------------------------------------------------------------------
   * Render Dispatcher & Dynamic Auto-Fit
   * ------------------------------------------------------------------ */
  function fitPreviewCanvas() {
    if (!previewCanvas || !previewContainer) return;

    // Use getBoundingClientRect for accurate layout dimension calculation
    const rect = previewContainer.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    // Available space inside viewport container (minus padding for breathing room)
    const paddingX = 20;
    const paddingY = 20;
    const availW = Math.max(20, Math.floor(rect.width - paddingX));
    const availH = Math.max(20, Math.floor(rect.height - paddingY));

    const canvasW = previewCanvas.width;
    const canvasH = previewCanvas.height;
    if (!canvasW || !canvasH) return;

    // Calculate scale factor so the canvas ALWAYS fits 100% inside availW and availH
    const scale = Math.min(availW / canvasW, availH / canvasH);
    const displayW = Math.max(1, Math.floor(canvasW * scale));
    const displayH = Math.max(1, Math.floor(canvasH * scale));

    previewCanvas.style.setProperty('width', `${displayW}px`, 'important');
    previewCanvas.style.setProperty('height', `${displayH}px`, 'important');
  }

  function renderCanvas() {
    if (!state.currentImage) return;

    // Render using FrameRenderer
    const rendered = renderer.render(state.currentImage, state.metadata, state.options);

    // Copy to preview canvas
    previewCanvas.width = rendered.width;
    previewCanvas.height = rendered.height;
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, rendered.width, rendered.height);
    ctx.drawImage(rendered, 0, 0);

    // Update resolution badge
    if (resolutionBadge) {
      resolutionBadge.textContent = `${rendered.width} × ${rendered.height} px`;
    }

    // Auto-fit display size so the complete frame is always fully visible with zero scrolling
    fitPreviewCanvas();
    requestAnimationFrame(() => {
      fitPreviewCanvas();
    });
  }

  /* ------------------------------------------------------------------
   * Event Handlers
   * ------------------------------------------------------------------ */

  // File Upload
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-active');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-active');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-active');
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    dropZone.addEventListener('click', () => {
      fileInput.click();
    });
  }

  // Global Drag & Drop replacement anywhere on the window
  let dragCounter = 0;
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    window.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  window.addEventListener('dragenter', (e) => {
    if (e.dataTransfer && e.dataTransfer.types && (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('public.file-url'))) {
      dragCounter++;
      if (dragOverlay) dragOverlay.classList.add('visible');
    }
  });

  window.addEventListener('dragleave', (e) => {
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      if (dragOverlay) dragOverlay.classList.remove('visible');
    }
  });

  window.addEventListener('drop', (e) => {
    dragCounter = 0;
    if (dragOverlay) dragOverlay.classList.remove('visible');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });
  }

  // Sample Buttons
  if (sample1Btn) {
    sample1Btn.addEventListener('click', async () => {
      const response = await fetch('./assets/sample1.jpg');
      const blob = await response.blob();
      await loadImageFromSource('./assets/sample1.jpg', blob);
    });
  }

  if (sample2Btn) {
    sample2Btn.addEventListener('click', async () => {
      const response = await fetch('./assets/sample2.jpg');
      const blob = await response.blob();
      await loadImageFromSource('./assets/sample2.jpg', blob);
    });
  }

  // Presets Selector Cards
  const presetCards = document.querySelectorAll('.preset-card');
  presetCards.forEach((card) => {
    card.addEventListener('click', () => {
      presetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const presetId = card.dataset.preset;
      applyPresetStyles(presetId);
      renderCanvas();
    });
  });

  // Tab navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-pane');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // Slider inputs
  if (borderScaleInput) {
    borderScaleInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.options.borderScale = val;
      if (borderScaleVal) borderScaleVal.textContent = `${Math.round(val * 100)}%`;
      renderCanvas();
    });
  }

  if (bottomBarScaleInput) {
    bottomBarScaleInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.options.bottomBarScale = val;
      if (bottomBarScaleVal) bottomBarScaleVal.textContent = `${Math.round(val * 100)}%`;
      renderCanvas();
    });
  }

  if (cornerRadiusInput) {
    cornerRadiusInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.options.cornerRadius = val;
      if (cornerRadiusVal) cornerRadiusVal.textContent = `${val}px`;
      renderCanvas();
    });
  }

  if (fontSizeScaleInput) {
    fontSizeScaleInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.options.fontSizeScale = val;
      if (fontSizeScaleVal) fontSizeScaleVal.textContent = `${Math.round(val * 100)}%`;
      renderCanvas();
    });
  }

  // Reset Style Button
  if (resetStyleBtn) {
    resetStyleBtn.addEventListener('click', () => {
      state.options.borderScale = 1.0;
      state.options.bottomBarScale = 1.0;
      state.options.cornerRadius = 0;
      state.options.fontSizeScale = 1.0;
      state.options.aspectRatio = 'original';
      state.options.brandLogo = 'auto';

      if (borderScaleInput) { borderScaleInput.value = 1.0; borderScaleVal.textContent = '100%'; }
      if (bottomBarScaleInput) { bottomBarScaleInput.value = 1.0; bottomBarScaleVal.textContent = '100%'; }
      if (cornerRadiusInput) { cornerRadiusInput.value = 0; cornerRadiusVal.textContent = '0px'; }
      if (fontSizeScaleInput) { fontSizeScaleInput.value = 1.0; fontSizeScaleVal.textContent = '100%'; }
      if (aspectRatioSelect) aspectRatioSelect.value = 'original';
      if (brandLogoSelect) brandLogoSelect.value = 'auto';

      applyPresetStyles(state.options.preset);
      renderCanvas();
    });
  }

  // Color Pickers
  if (frameColorPicker) {
    frameColorPicker.addEventListener('input', (e) => {
      state.options.frameColor = e.target.value;
      renderCanvas();
    });
  }

  if (textColorPicker) {
    textColorPicker.addEventListener('input', (e) => {
      state.options.textColor = e.target.value;
      renderCanvas();
    });
  }

  if (accentColorPicker) {
    accentColorPicker.addEventListener('input', (e) => {
      state.options.accentColor = e.target.value;
      renderCanvas();
    });
  }

  if (fontFamilySelect) {
    fontFamilySelect.addEventListener('change', (e) => {
      state.options.fontFamily = e.target.value;
      renderCanvas();
    });
  }

  if (aspectRatioSelect) {
    aspectRatioSelect.addEventListener('change', (e) => {
      state.options.aspectRatio = e.target.value;
      renderCanvas();
    });
  }

  if (brandLogoSelect) {
    brandLogoSelect.addEventListener('change', (e) => {
      state.options.brandLogo = e.target.value;
      renderCanvas();
    });
  }

  // Export Quality
  if (exportFormatSelect) {
    exportFormatSelect.addEventListener('change', (e) => {
      state.options.exportFormat = e.target.value;
    });
  }

  if (exportQualityInput) {
    exportQualityInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.options.exportQuality = val / 100;
      if (exportQualityVal) exportQualityVal.textContent = `${val}%`;
    });
  }

  // Checkbox Items Toggles
  const itemCheckboxes = document.querySelectorAll('.item-toggle');
  itemCheckboxes.forEach((cb) => {
    cb.addEventListener('change', () => {
      const itemKey = cb.dataset.item;
      state.options.items[itemKey] = cb.checked;
      renderCanvas();
    });
  });

  // Metadata Form Inputs Live Update
  const metaInputs = [
    { el: metaMake, key: 'make' },
    { el: metaModel, key: 'model' },
    { el: metaLens, key: 'lens' },
    { el: metaFocal, key: 'focalLength' },
    { el: metaAperture, key: 'aperture' },
    { el: metaShutter, key: 'shutterSpeed' },
    { el: metaIso, key: 'iso' },
    { el: metaEv, key: 'ev' },
    { el: metaDate, key: 'date' },
    { el: metaAuthor, key: 'author' },
    { el: metaLocation, key: 'location' }
  ];

  metaInputs.forEach(({ el, key }) => {
    if (el) {
      el.addEventListener('input', (e) => {
        state.metadata[key] = e.target.value;
        renderCanvas();
      });
    }
  });

  // Download Action
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!state.currentImage) return;

      const format = state.options.exportFormat || 'jpeg';
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = state.options.exportQuality || 0.92;

      previewCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const makeStr = (state.metadata.model || state.metadata.make || 'photo').replace(/[^a-zA-Z0-9_-]/g, '_');
        a.download = `SpecFrame_${makeStr}_${Date.now()}.${format === 'png' ? 'png' : 'jpg'}`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, mimeType, quality);
    });
  }

  // Copy to Clipboard Action
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (!state.currentImage) return;

      try {
        previewCanvas.toBlob(async (blob) => {
          if (!blob) return;
          if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span>✓ コピー完了</span>';
            setTimeout(() => {
              copyBtn.innerHTML = originalText;
            }, 2000);
          } else {
            alert('お使いのブラウザはクリップボード画像コピーに対応していません');
          }
        }, 'image/png');
      } catch (err) {
        console.error('Copy failed:', err);
        alert('クリップボードへのコピーに失敗しました');
      }
    });
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      if (fileInput) fileInput.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (downloadBtn) downloadBtn.click();
    }
  });

  // Change Photo button
  const changePhotoBtn = document.getElementById('change-photo-btn');
  if (changePhotoBtn) {
    changePhotoBtn.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });
  }

  // Auto-fit on window resize, orientation change, or container resize
  window.addEventListener('resize', fitPreviewCanvas);
  window.addEventListener('orientationchange', () => {
    setTimeout(fitPreviewCanvas, 150);
  });

  if (window.ResizeObserver && previewContainer) {
    const ro = new ResizeObserver(() => {
      fitPreviewCanvas();
    });
    ro.observe(previewContainer);
  }

  // Auto-load Sample 1 on initial launch so user sees the app in action immediately!
  fetch('./assets/sample1.jpg')
    .then(r => r.blob())
    .then(blob => {
      loadImageFromSource('./assets/sample1.jpg', blob);
    })
    .catch(() => {
      console.log('Ready for user photo upload');
    });
});
