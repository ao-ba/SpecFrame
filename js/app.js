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
      fontSizeScale: 1.3,
      borderScale: 1.0,
      bottomBarScale: 1.0,
      cornerRadius: 0,
      shadowEnabled: false,
      shadowBlur: 24,
      textShadow: false,
      aspectRatio: 'original',
      cropPositionX: 50,
      cropPositionY: 50,
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
  const canvasShadowWrapper = document.getElementById('canvas-shadow-wrapper');
  const emptyState = document.getElementById('empty-state');
  const activeWorkspace = document.getElementById('active-workspace');
  const downloadBtn = document.getElementById('download-btn');
  const copyBtn = document.getElementById('copy-btn');
  const shareBtn = document.getElementById('share-btn');
  const pwaInstallBtn = document.getElementById('pwa-install-btn');
  const resolutionBadge = document.getElementById('resolution-badge');
  const paletteChipsContainer = document.getElementById('palette-chips');

  // Preview Zoom & Pan Elements
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const zoomResetBtn = document.getElementById('zoom-reset-btn');
  const zoomLevelText = document.getElementById('zoom-level-text');

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
  const textShadowToggle = document.getElementById('text-shadow-toggle');
  const resetStyleBtn = document.getElementById('reset-style-btn');
  const dragOverlay = document.getElementById('drag-overlay');
  const frameColorPicker = document.getElementById('frame-color-picker');
  const textColorPicker = document.getElementById('text-color-picker');
  const accentColorPicker = document.getElementById('accent-color-picker');
  const fontFamilySelect = document.getElementById('font-family-select');
  const aspectRatioSelect = document.getElementById('aspect-ratio-select');
  const cropPositionSection = document.getElementById('crop-position-section');
  const cropStatusBadge = document.getElementById('crop-status-badge');
  const cropNotice = document.getElementById('crop-notice');
  const cropControlsWrapper = document.getElementById('crop-controls-wrapper');
  const cropAxisXGroup = document.getElementById('crop-axis-x-group');
  const cropAxisYGroup = document.getElementById('crop-axis-y-group');
  const cropHintX = document.getElementById('crop-hint-x');
  const cropHintY = document.getElementById('crop-hint-y');
  const cropPosXInput = document.getElementById('crop-pos-x-input');
  const cropPosXVal = document.getElementById('crop-pos-x-val');
  const cropPosYInput = document.getElementById('crop-pos-y-input');
  const cropPosYVal = document.getElementById('crop-pos-y-val');
  const cropPresetBtns = document.querySelectorAll('.crop-preset-btn');
  const cropAlignBtns = document.querySelectorAll('.crop-align-btn');
  const exportFormatSelect = document.getElementById('export-format-select');
  const exportQualityInput = document.getElementById('export-quality-input');
  const exportQualityVal = document.getElementById('export-quality-val');

  /* ------------------------------------------------------------------
   * Service Worker & PWA Update Notification System
   * ------------------------------------------------------------------ */
  const APP_VERSION = 'v1.9.1';
  const pwaUpdateToast = document.getElementById('pwa-update-toast');
  const toastUpdateBtn = document.getElementById('toast-update-btn');
  const toastDismissBtn = document.getElementById('toast-dismiss-btn');
  const updateToastTitle = document.querySelector('.update-toast-title');
  const updateToastDesc = document.getElementById('update-toast-desc');
  const updateToastIcon = document.querySelector('.update-toast-icon');

  // 1. If user just completed an update, show brief positive confirmation toast
  if (sessionStorage.getItem('pwa_just_updated') === 'true') {
    sessionStorage.removeItem('pwa_just_updated');
    showUpdatedSuccessToast();
  }

  function showUpdatedSuccessToast() {
    if (!pwaUpdateToast) return;
    if (updateToastIcon) updateToastIcon.textContent = '✓';
    if (updateToastTitle) updateToastTitle.textContent = `最新バージョンに更新されました (${APP_VERSION})`;
    if (updateToastDesc) updateToastDesc.textContent = '最新の機能と改善が利用可能です';
    if (toastUpdateBtn) toastUpdateBtn.style.display = 'none';
    if (toastDismissBtn) toastDismissBtn.style.display = 'none';
    pwaUpdateToast.style.borderColor = 'rgba(74, 222, 128, 0.5)';
    pwaUpdateToast.style.display = 'block';

    setTimeout(() => {
      pwaUpdateToast.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      pwaUpdateToast.style.opacity = '0';
      setTimeout(() => {
        pwaUpdateToast.style.display = 'none';
        pwaUpdateToast.style.opacity = '1';
        pwaUpdateToast.style.borderColor = '';
        if (updateToastIcon) updateToastIcon.textContent = '🚀';
        if (updateToastTitle) updateToastTitle.textContent = '新しいバージョンが利用可能です';
        if (toastUpdateBtn) toastUpdateBtn.style.display = '';
        if (toastDismissBtn) toastDismissBtn.style.display = '';
      }, 500);
    }, 2500);
  }

  function showUpdatePromptToast(newVersionTag) {
    if (!pwaUpdateToast) return;
    // Don't show if user dismissed this specific version in this session
    if (sessionStorage.getItem('pwa_dismissed_version') === newVersionTag) return;

    if (newVersionTag && updateToastDesc) {
      updateToastDesc.textContent = `最新バージョン (${newVersionTag}) に更新できます`;
    }
    pwaUpdateToast.style.display = 'block';
  }

  function hideUpdateToast() {
    if (!pwaUpdateToast) return;
    pwaUpdateToast.style.display = 'none';
  }

  // Version comparator: returns true ONLY if remote is strictly newer than current
  function isNewerVersion(remote, current) {
    if (!remote || !current) return false;
    const cleanRemote = remote.replace(/^v/, '');
    const cleanCurrent = current.replace(/^v/, '');
    if (cleanRemote === cleanCurrent) return false;

    const rParts = cleanRemote.split('.').map(n => parseInt(n, 10) || 0);
    const cParts = cleanCurrent.split('.').map(n => parseInt(n, 10) || 0);

    for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
      const r = rParts[i] || 0;
      const c = cParts[i] || 0;
      if (r > c) return true;
      if (r < c) return false;
    }
    return false;
  }

  // Check remote sw.js file to verify if a strictly newer CACHE_NAME exists on the server
  async function checkRemoteVersion(reg) {
    try {
      const res = await fetch(`./sw.js?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const text = await res.text();
      const match = text.match(/CACHE_NAME\s*=\s*['"]specframe-([^'"]+)['"]/);
      if (match && match[1]) {
        const remoteVer = `v${match[1]}`;
        // Strictly verify that the server version is newer than currently running version
        if (isNewerVersion(remoteVer, APP_VERSION)) {
          showUpdatePromptToast(remoteVer);
          if (reg) reg.update();
        } else {
          // Already running latest or ahead, keep toast hidden!
          hideUpdateToast();
        }
      }
    } catch (e) {
      // Offline, silently ignore
    }
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        // Proactive update check
        reg.update();

        // Check if there is really a newer version on the server
        checkRemoteVersion(reg);

        // When a new service worker finishes installing
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                // Verify against server version before showing toast!
                checkRemoteVersion(reg);
              }
            });
          }
        });
      }).catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });

    // Re-check when user returns to foreground/app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            reg.update();
            checkRemoteVersion(reg);
          }
        });
      }
    });
  }

  // Toast Button Actions
  if (toastUpdateBtn) {
    toastUpdateBtn.addEventListener('click', () => {
      toastUpdateBtn.disabled = true;
      toastUpdateBtn.innerHTML = '<span>⏳ 更新中...</span>';

      sessionStorage.setItem('pwa_just_updated', 'true');

      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });

      // Force cache purge and reload to guarantee fresh assets
      setTimeout(() => {
        forceAppUpdate(toastUpdateBtn);
      }, 200);
    });
  }

  if (toastDismissBtn) {
    toastDismissBtn.addEventListener('click', () => {
      const match = updateToastDesc ? updateToastDesc.textContent.match(/v\d+\.\d+\.\d+/) : null;
      if (match) {
        sessionStorage.setItem('pwa_dismissed_version', match[0]);
      } else {
        sessionStorage.setItem('pwa_dismissed_version', 'dismissed');
      }
      hideUpdateToast();
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
      syncCropUI();

      // Adjust defaults based on preset
      applyPresetStyles(state.options.preset);

      // Show workspace, hide empty drop area
      if (emptyState) emptyState.classList.add('hidden');
      if (activeWorkspace) activeWorkspace.classList.remove('hidden');

      // Trigger Render
      resetPreviewZoom(false);
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

  function syncCropUI() {
    if (!cropPositionSection) return;

    const ratio = state.options.aspectRatio || 'original';
    const isOriginal = ratio === 'original';

    if (isOriginal) {
      if (cropNotice) {
        cropNotice.style.display = 'block';
        cropNotice.textContent = 'オリジナル比率では写真全体が表示されます。アスペクト比を変更すると枠内のトリミング位置を自由に調整できます。';
      }
      if (cropControlsWrapper) cropControlsWrapper.style.display = 'none';
      if (cropStatusBadge) {
        cropStatusBadge.textContent = 'オリジナル比率';
        cropStatusBadge.classList.remove('is-active');
      }
      return;
    }

    if (cropNotice) cropNotice.style.display = 'none';
    if (cropControlsWrapper) cropControlsWrapper.style.display = 'flex';

    // Determine which axis is cropped based on image and ratio
    let hasXOverflow = false;
    let hasYOverflow = false;

    if (state.currentImage) {
      const imgW = state.currentImage.naturalWidth || state.currentImage.width;
      const imgH = state.currentImage.naturalHeight || state.currentImage.height;

      let targetRatio = imgW / imgH;
      if (ratio === '1:1') targetRatio = 1;
      else if (ratio === '4:5') targetRatio = 4 / 5;
      else if (ratio === '16:9') targetRatio = 16 / 9;
      else if (ratio === '3:2') targetRatio = 3 / 2;
      else if (ratio === '9:16') targetRatio = 9 / 16;

      const currentRatio = imgW / imgH;
      if (currentRatio > targetRatio + 0.001) {
        hasXOverflow = true;
      } else if (currentRatio < targetRatio - 0.001) {
        hasYOverflow = true;
      }
    } else {
      // If no image loaded yet, allow both axes
      hasXOverflow = true;
      hasYOverflow = true;
    }

    if (cropStatusBadge) {
      if (hasXOverflow && !hasYOverflow) {
        cropStatusBadge.textContent = '横位置で調整中';
        cropStatusBadge.classList.add('is-active');
      } else if (hasYOverflow && !hasXOverflow) {
        cropStatusBadge.textContent = '縦位置で調整中';
        cropStatusBadge.classList.add('is-active');
      } else if (!hasXOverflow && !hasYOverflow) {
        cropStatusBadge.textContent = '比率一致 (クロップなし)';
        cropStatusBadge.classList.remove('is-active');
      } else {
        cropStatusBadge.textContent = '位置調整可能';
        cropStatusBadge.classList.add('is-active');
      }
    }

    if (cropAxisXGroup) {
      if (hasXOverflow) {
        cropAxisXGroup.classList.add('is-effective');
        cropAxisXGroup.classList.remove('is-ineffective');
        if (cropHintX) cropHintX.textContent = '（有効）';
        if (cropPosXInput) cropPosXInput.disabled = false;
      } else {
        cropAxisXGroup.classList.remove('is-effective');
        cropAxisXGroup.classList.add('is-ineffective');
        if (cropHintX) cropHintX.textContent = '（この比率では余白なし）';
        if (cropPosXInput) cropPosXInput.disabled = true;
      }
    }

    if (cropAxisYGroup) {
      if (hasYOverflow) {
        cropAxisYGroup.classList.add('is-effective');
        cropAxisYGroup.classList.remove('is-ineffective');
        if (cropHintY) cropHintY.textContent = '（有効）';
        if (cropPosYInput) cropPosYInput.disabled = false;
      } else {
        cropAxisYGroup.classList.remove('is-effective');
        cropAxisYGroup.classList.add('is-ineffective');
        if (cropHintY) cropHintY.textContent = '（この比率では余白なし）';
        if (cropPosYInput) cropPosYInput.disabled = true;
      }
    }

    const posX = typeof state.options.cropPositionX === 'number' ? state.options.cropPositionX : 50;
    const posY = typeof state.options.cropPositionY === 'number' ? state.options.cropPositionY : 50;

    if (cropPosXInput) cropPosXInput.value = posX;
    if (cropPosYInput) cropPosYInput.value = posY;

    if (cropPosXVal) {
      cropPosXVal.textContent = posX === 50 ? '中央 (50%)' : (posX < 50 ? `左寄り (${posX}%)` : `右寄り (${posX}%)`);
    }
    if (cropPosYVal) {
      cropPosYVal.textContent = posY === 50 ? '中央 (50%)' : (posY < 50 ? `上寄り (${posY}%)` : `下寄り (${posY}%)`);
    }

    // Update preset buttons
    if (cropPresetBtns) {
      cropPresetBtns.forEach((btn) => {
        const axis = btn.dataset.axis;
        const val = Number(btn.dataset.val);
        const currentVal = axis === 'x' ? posX : posY;
        if (val === currentVal) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });
    }

    // Update 3x3 align grid buttons
    if (cropAlignBtns) {
      cropAlignBtns.forEach((btn) => {
        const bx = Number(btn.dataset.x);
        const by = Number(btn.dataset.y);
        let matches = false;
        if (hasXOverflow && !hasYOverflow) {
          matches = (bx === posX);
        } else if (hasYOverflow && !hasXOverflow) {
          matches = (by === posY);
        } else {
          matches = (bx === posX && by === posY);
        }
        if (matches) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });
    }

    updateCanvasCursor();
  }

  /* ------------------------------------------------------------------
   * Interactive Direct Crop Drag Controller (Mouse & Touch)
   * Allows dragging the photo directly inside the frame to adjust crop position
   * ------------------------------------------------------------------ */
  const cropDragState = {
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    initialCropX: 0,
    initialCropY: 0,
    overflowX: 0,
    overflowY: 0,
    canvasScale: 1
  };

  let cropRafId = null;

  function getCropOverflow() {
    if (!state.currentImage || state.options.aspectRatio === 'original') {
      return { overflowX: 0, overflowY: 0, cropW: 0, cropH: 0, cropX: 0, cropY: 0, imgW: 0, imgH: 0 };
    }
    const imgW = state.currentImage.naturalWidth || state.currentImage.width;
    const imgH = state.currentImage.naturalHeight || state.currentImage.height;
    if (!imgW || !imgH) {
      return { overflowX: 0, overflowY: 0, cropW: 0, cropH: 0, cropX: 0, cropY: 0, imgW: 0, imgH: 0 };
    }

    const crop = renderer.calculateCrop(imgW, imgH, state.options.aspectRatio, state.options.cropPositionX, state.options.cropPositionY);
    return {
      overflowX: Math.max(0, imgW - crop.w),
      overflowY: Math.max(0, imgH - crop.h),
      cropW: crop.w,
      cropH: crop.h,
      cropX: crop.x,
      cropY: crop.y,
      imgW,
      imgH
    };
  }

  function updateCanvasCursor() {
    if (!canvasShadowWrapper) return;
    if (zoomState.scale > 1.01) {
      canvasShadowWrapper.classList.remove('can-crop-x', 'can-crop-y', 'can-crop-both', 'is-crop-dragging');
      return;
    }
    const ov = getCropOverflow();
    canvasShadowWrapper.classList.remove('can-crop-x', 'can-crop-y', 'can-crop-both');
    if (ov.overflowX > 0 && ov.overflowY > 0) {
      canvasShadowWrapper.classList.add('can-crop-both');
    } else if (ov.overflowX > 0) {
      canvasShadowWrapper.classList.add('can-crop-x');
    } else if (ov.overflowY > 0) {
      canvasShadowWrapper.classList.add('can-crop-y');
    }
  }

  function updateHoverCursor(clientX, clientY) {
    if (zoomState.scale > 1.01 || cropDragState.isDragging || zoomState.isDragging) return;
    if (!previewCanvas || !previewContainer) return;

    const canvasRect = previewCanvas.getBoundingClientRect();
    const isOver = (
      clientX >= canvasRect.left &&
      clientX <= canvasRect.right &&
      clientY >= canvasRect.top &&
      clientY <= canvasRect.bottom
    );

    if (isOver) {
      const ov = getCropOverflow();
      if (ov.overflowX > 0 && ov.overflowY > 0) {
        previewContainer.style.cursor = 'move';
      } else if (ov.overflowX > 0) {
        previewContainer.style.cursor = 'ew-resize';
      } else if (ov.overflowY > 0) {
        previewContainer.style.cursor = 'ns-resize';
      } else {
        previewContainer.style.cursor = 'default';
      }
    } else {
      previewContainer.style.cursor = 'default';
    }
  }

  function startCropDrag(clientX, clientY) {
    if (zoomState.scale > 1.01) return false;
    const ov = getCropOverflow();
    if (ov.overflowX <= 0 && ov.overflowY <= 0) return false;
    if (!previewCanvas) return false;

    const canvasRect = previewCanvas.getBoundingClientRect();
    const margin = 15;
    if (
      clientX < canvasRect.left - margin ||
      clientX > canvasRect.right + margin ||
      clientY < canvasRect.top - margin ||
      clientY > canvasRect.bottom + margin
    ) {
      return false;
    }

    const canvasScale = previewCanvas.width / canvasRect.width;

    cropDragState.isDragging = true;
    cropDragState.dragStartX = clientX;
    cropDragState.dragStartY = clientY;
    cropDragState.initialCropX = ov.cropX;
    cropDragState.initialCropY = ov.cropY;
    cropDragState.overflowX = ov.overflowX;
    cropDragState.overflowY = ov.overflowY;
    cropDragState.canvasScale = canvasScale;

    document.body.style.cursor = 'grabbing';
    if (previewContainer) previewContainer.style.cursor = 'grabbing';
    if (canvasShadowWrapper) canvasShadowWrapper.classList.add('is-crop-dragging');
    return true;
  }

  function moveCropDrag(clientX, clientY) {
    if (!cropDragState.isDragging) return;

    const deltaX = clientX - cropDragState.dragStartX;
    const deltaY = clientY - cropDragState.dragStartY;

    let changed = false;

    if (cropDragState.overflowX > 0) {
      const deltaImageX = deltaX * cropDragState.canvasScale;
      const targetCropX = Math.max(0, Math.min(cropDragState.overflowX, cropDragState.initialCropX - deltaImageX));
      const newPosX = Math.round((targetCropX / cropDragState.overflowX) * 100);
      if (newPosX !== state.options.cropPositionX) {
        state.options.cropPositionX = newPosX;
        changed = true;
      }
    }

    if (cropDragState.overflowY > 0) {
      const deltaImageY = deltaY * cropDragState.canvasScale;
      const targetCropY = Math.max(0, Math.min(cropDragState.overflowY, cropDragState.initialCropY - deltaImageY));
      const newPosY = Math.round((targetCropY / cropDragState.overflowY) * 100);
      if (newPosY !== state.options.cropPositionY) {
        state.options.cropPositionY = newPosY;
        changed = true;
      }
    }

    if (changed) {
      if (!cropRafId) {
        cropRafId = requestAnimationFrame(() => {
          cropRafId = null;
          syncCropUI();
          renderCanvas();
        });
      }
    }
  }

  function endCropDrag() {
    if (cropDragState.isDragging) {
      cropDragState.isDragging = false;
      if (cropRafId) {
        cancelAnimationFrame(cropRafId);
        cropRafId = null;
      }
      syncCropUI();
      renderCanvas();
      document.body.style.cursor = '';
      if (previewContainer) previewContainer.style.cursor = 'default';
      if (canvasShadowWrapper) canvasShadowWrapper.classList.remove('is-crop-dragging');
      updateCanvasCursor();
    }
  }

  /* ------------------------------------------------------------------
   * Preview Zoom & Pan Controller (Touch Pinch, Drag & Button Controls)
   * Prevents full-page pinch zoom while allowing buttery smooth frame inspection
   * ------------------------------------------------------------------ */
  const zoomState = {
    scale: 1.0,
    panX: 0,
    panY: 0,
    minScale: 1.0,
    maxScale: 4.0,
    step: 0.25,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    initialPanX: 0,
    initialPanY: 0,
    initialPinchDist: 0,
    initialPinchScale: 1.0,
    initialPinchCenter: { x: 0, y: 0 },
    lastTapTime: 0
  };

  function clampPan() {
    if (zoomState.scale <= 1.001) {
      zoomState.panX = 0;
      zoomState.panY = 0;
      return;
    }

    if (!previewCanvas || !previewContainer) return;
    const contRect = previewContainer.getBoundingClientRect();
    const canvasRect = previewCanvas.getBoundingClientRect();

    const baseW = parseFloat(previewCanvas.style.width) || (canvasRect.width / zoomState.scale);
    const baseH = parseFloat(previewCanvas.style.height) || (canvasRect.height / zoomState.scale);

    const scaledW = baseW * zoomState.scale;
    const scaledH = baseH * zoomState.scale;

    const maxPanX = Math.max(0, (scaledW - contRect.width) / 2 + 60);
    const maxPanY = Math.max(0, (scaledH - contRect.height) / 2 + 60);

    zoomState.panX = Math.max(-maxPanX, Math.min(maxPanX, zoomState.panX));
    zoomState.panY = Math.max(-maxPanY, Math.min(maxPanY, zoomState.panY));
  }

  function updateZoomTransform(animated = false) {
    if (!canvasShadowWrapper) return;

    if (animated) {
      canvasShadowWrapper.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)';
    } else {
      canvasShadowWrapper.style.transition = 'none';
    }

    clampPan();

    canvasShadowWrapper.style.transform = `translate3d(${zoomState.panX}px, ${zoomState.panY}px, 0) scale(${zoomState.scale})`;

    const percent = Math.round(zoomState.scale * 100);
    if (zoomLevelText) {
      zoomLevelText.textContent = `${percent}%`;
    }

    if (zoomResetBtn) {
      const isModified = Math.abs(zoomState.scale - 1.0) > 0.01 || Math.abs(zoomState.panX) > 1 || Math.abs(zoomState.panY) > 1;
      if (isModified) {
        zoomResetBtn.classList.add('is-active');
        zoomResetBtn.title = '元の倍率に戻す (100%)';
      } else {
        zoomResetBtn.classList.remove('is-active');
        zoomResetBtn.title = '等倍 (100%)';
      }
    }

    if (zoomState.scale > 1.01) {
      canvasShadowWrapper.classList.add('is-zoomed');
    } else {
      canvasShadowWrapper.classList.remove('is-zoomed');
    }
  }

  function setZoom(newScale, animated = true) {
    const clampedScale = Math.max(zoomState.minScale, Math.min(zoomState.maxScale, Math.round(newScale * 100) / 100));
    zoomState.scale = clampedScale;
    if (zoomState.scale <= 1.001) {
      zoomState.panX = 0;
      zoomState.panY = 0;
    }
    updateZoomTransform(animated);
  }

  function resetPreviewZoom(animated = true) {
    zoomState.scale = 1.0;
    zoomState.panX = 0;
    zoomState.panY = 0;
    updateZoomTransform(animated);
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

    updateZoomTransform(false);
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
    updateCanvasCursor();
    requestAnimationFrame(() => {
      fitPreviewCanvas();
      updateCanvasCursor();
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
      resetPreviewZoom(true);
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

  // Text Drop Shadow Toggle
  if (textShadowToggle) {
    textShadowToggle.addEventListener('change', (e) => {
      state.options.textShadow = e.target.checked;
      renderCanvas();
    });
  }

  // Reset Style Button
  if (resetStyleBtn) {
    resetStyleBtn.addEventListener('click', () => {
      state.options.borderScale = 1.0;
      state.options.bottomBarScale = 1.0;
      state.options.cornerRadius = 0;
      state.options.fontSizeScale = 1.3;
      state.options.textShadow = false;
      state.options.aspectRatio = 'original';
      state.options.cropPositionX = 50;
      state.options.cropPositionY = 50;
      state.options.brandLogo = 'auto';

      if (borderScaleInput) { borderScaleInput.value = 1.0; borderScaleVal.textContent = '100%'; }
      if (bottomBarScaleInput) { bottomBarScaleInput.value = 1.0; bottomBarScaleVal.textContent = '100%'; }
      if (cornerRadiusInput) { cornerRadiusInput.value = 0; cornerRadiusVal.textContent = '0px'; }
      if (fontSizeScaleInput) { fontSizeScaleInput.value = 1.3; fontSizeScaleVal.textContent = '130%'; }
      if (textShadowToggle) { textShadowToggle.checked = false; }
      if (aspectRatioSelect) aspectRatioSelect.value = 'original';
      if (brandLogoSelect) brandLogoSelect.value = 'auto';

      syncCropUI();
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
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          renderCanvas();
        });
      }
    });
  }

  if (aspectRatioSelect) {
    aspectRatioSelect.addEventListener('change', (e) => {
      state.options.aspectRatio = e.target.value;
      syncCropUI();
      renderCanvas();
    });
  }

  // Crop Position Sliders & Buttons
  if (cropPosXInput) {
    cropPosXInput.addEventListener('input', (e) => {
      state.options.cropPositionX = Number(e.target.value);
      syncCropUI();
      renderCanvas();
    });
  }

  if (cropPosYInput) {
    cropPosYInput.addEventListener('input', (e) => {
      state.options.cropPositionY = Number(e.target.value);
      syncCropUI();
      renderCanvas();
    });
  }

  if (cropPresetBtns && cropPresetBtns.length > 0) {
    cropPresetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const axis = btn.dataset.axis;
        const val = Number(btn.dataset.val);
        if (axis === 'x') {
          state.options.cropPositionX = val;
        } else if (axis === 'y') {
          state.options.cropPositionY = val;
        }
        syncCropUI();
        renderCanvas();
      });
    });
  }

  if (cropAlignBtns && cropAlignBtns.length > 0) {
    cropAlignBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const x = Number(btn.dataset.x);
        const y = Number(btn.dataset.y);
        state.options.cropPositionX = x;
        state.options.cropPositionY = y;
        syncCropUI();
        renderCanvas();
      });
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

  // Web Share Action (Share image directly to other apps / SNS)
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      if (!state.currentImage) return;

      const format = state.options.exportFormat || 'jpeg';
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = state.options.exportQuality || 0.92;
      const ext = format === 'png' ? 'png' : 'jpg';
      const makeStr = (state.metadata.model || state.metadata.make || 'photo').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `SpecFrame_${makeStr}_${Date.now()}.${ext}`;

      const originalHtml = shareBtn.innerHTML;
      shareBtn.disabled = true;

      previewCanvas.toBlob(async (blob) => {
        if (!blob) {
          shareBtn.disabled = false;
          return;
        }

        try {
          const file = new File([blob], filename, { type: mimeType });
          const shareData = {
            files: [file],
            title: 'SpecFrame Photo',
            text: `${state.metadata.model || 'SpecFrame'} で作成したフレーム付き写真`
          };

          // 1. Try Native Web Share with file attachment
          if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            shareBtn.innerHTML = '<span>✓ 共有完了</span>';
            setTimeout(() => {
              shareBtn.innerHTML = originalHtml;
              shareBtn.disabled = false;
            }, 1800);
            return;
          }

          // 2. Fallback: try sharing text / URL if files cannot be shared
          if (navigator.share) {
            await navigator.share({
              title: 'SpecFrame',
              text: `${state.metadata.model || 'SpecFrame'} で作成したフレーム写真`,
              url: window.location.href
            });
            shareBtn.innerHTML = originalHtml;
            shareBtn.disabled = false;
            return;
          }

          // 3. Fallback on Desktop without Web Share: auto copy image to clipboard
          if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            shareBtn.innerHTML = '<span>✓ 画像コピー済</span>';
            setTimeout(() => {
              shareBtn.innerHTML = originalHtml;
              shareBtn.disabled = false;
            }, 2000);
            return;
          }

          // 4. Ultimate fallback: download
          if (downloadBtn) downloadBtn.click();
          shareBtn.innerHTML = originalHtml;
          shareBtn.disabled = false;
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Share failed:', err);
            // Fallback to clipboard or download on unexpected share failure
            if (copyBtn) copyBtn.click();
          }
          shareBtn.innerHTML = originalHtml;
          shareBtn.disabled = false;
        }
      }, mimeType, quality);
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

  /* ------------------------------------------------------------------
   * Preview Zoom & Pan Event Listeners (Mobile Pinch/Pan & Desktop Controls)
   * ------------------------------------------------------------------ */
  if (previewContainer) {
    // Suppress Safari native gestures on the canvas preview viewport
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((evName) => {
      previewContainer.addEventListener(evName, (e) => {
        e.preventDefault();
      }, { passive: false });
    });

    // Touch events for mobile Pinch & Pan
    previewContainer.addEventListener('touchstart', (e) => {
      if (e.target.closest('#preview-zoom-bar')) return;

      if (e.touches.length === 2) {
        // Pinch start
        e.preventDefault();
        zoomState.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        zoomState.initialPinchDist = Math.hypot(dx, dy);
        zoomState.initialPinchScale = zoomState.scale;
        zoomState.initialPinchCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        zoomState.initialPanX = zoomState.panX;
        zoomState.initialPanY = zoomState.panY;
      } else if (e.touches.length === 1) {
        // Double-tap inspection toggle: 100% -> 200% -> 100%
        const now = Date.now();
        if (now - zoomState.lastTapTime < 320) {
          e.preventDefault();
          if (zoomState.scale > 1.05) {
            resetPreviewZoom(true);
          } else {
            setZoom(2.0, true);
          }
          zoomState.lastTapTime = 0;
          return;
        }
        zoomState.lastTapTime = now;

        // Pan start when zoomed in
        if (zoomState.scale > 1.01) {
          e.preventDefault();
          zoomState.isDragging = true;
          zoomState.dragStartX = e.touches[0].clientX;
          zoomState.dragStartY = e.touches[0].clientY;
          zoomState.initialPanX = zoomState.panX;
          zoomState.initialPanY = zoomState.panY;
          if (canvasShadowWrapper) canvasShadowWrapper.classList.add('is-dragging');
        } else if (zoomState.scale <= 1.01) {
          if (startCropDrag(e.touches[0].clientX, e.touches[0].clientY)) {
            e.preventDefault();
          }
        }
      }
    }, { passive: false });

    previewContainer.addEventListener('touchmove', (e) => {
      if (e.target.closest('#preview-zoom-bar')) return;

      if (e.touches.length === 2 && zoomState.initialPinchDist > 0) {
        // Pinch moving
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const factor = currentDist / zoomState.initialPinchDist;
        const targetScale = Math.max(zoomState.minScale, Math.min(zoomState.maxScale, zoomState.initialPinchScale * factor));
        zoomState.scale = targetScale;

        const currentCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        zoomState.panX = zoomState.initialPanX + (currentCenter.x - zoomState.initialPinchCenter.x);
        zoomState.panY = zoomState.initialPanY + (currentCenter.y - zoomState.initialPinchCenter.y);

        updateZoomTransform(false);
      } else if (e.touches.length === 1 && zoomState.isDragging) {
        // Pan moving
        e.preventDefault();
        const deltaX = e.touches[0].clientX - zoomState.dragStartX;
        const deltaY = e.touches[0].clientY - zoomState.dragStartY;
        zoomState.panX = zoomState.initialPanX + deltaX;
        zoomState.panY = zoomState.initialPanY + deltaY;
        updateZoomTransform(false);
      } else if (e.touches.length === 1 && cropDragState.isDragging) {
        e.preventDefault();
        moveCropDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    previewContainer.addEventListener('touchend', (e) => {
      if (zoomState.isDragging) {
        zoomState.isDragging = false;
        if (canvasShadowWrapper) canvasShadowWrapper.classList.remove('is-dragging');
      }
      if (cropDragState.isDragging) {
        endCropDrag();
      }
      if (e.touches.length === 0) {
        zoomState.initialPinchDist = 0;
        if (zoomState.scale <= 1.02) {
          resetPreviewZoom(true);
        } else {
          updateZoomTransform(true);
        }
      }
    });

    previewContainer.addEventListener('touchcancel', () => {
      zoomState.isDragging = false;
      zoomState.initialPinchDist = 0;
      if (canvasShadowWrapper) canvasShadowWrapper.classList.remove('is-dragging');
      if (cropDragState.isDragging) {
        endCropDrag();
      }
      updateZoomTransform(true);
    });

    // Mouse Drag Pan for Desktop & Direct Crop Drag
    previewContainer.addEventListener('mousedown', (e) => {
      if (e.target.closest('#preview-zoom-bar')) return;
      if (zoomState.scale > 1.01 && e.button === 0) {
        e.preventDefault();
        zoomState.isDragging = true;
        zoomState.dragStartX = e.clientX;
        zoomState.dragStartY = e.clientY;
        zoomState.initialPanX = zoomState.panX;
        zoomState.initialPanY = zoomState.panY;
        if (canvasShadowWrapper) canvasShadowWrapper.classList.add('is-dragging');
      } else if (zoomState.scale <= 1.01 && e.button === 0) {
        if (startCropDrag(e.clientX, e.clientY)) {
          e.preventDefault();
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (zoomState.isDragging) {
        e.preventDefault();
        const deltaX = e.clientX - zoomState.dragStartX;
        const deltaY = e.clientY - zoomState.dragStartY;
        zoomState.panX = zoomState.initialPanX + deltaX;
        zoomState.panY = zoomState.initialPanY + deltaY;
        updateZoomTransform(false);
      } else if (cropDragState.isDragging) {
        e.preventDefault();
        moveCropDrag(e.clientX, e.clientY);
      } else {
        updateHoverCursor(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (zoomState.isDragging) {
        zoomState.isDragging = false;
        if (canvasShadowWrapper) canvasShadowWrapper.classList.remove('is-dragging');
        updateZoomTransform(true);
      }
      if (cropDragState.isDragging) {
        endCropDrag();
      }
    });

    previewContainer.addEventListener('mouseleave', () => {
      if (!cropDragState.isDragging && zoomState.scale <= 1.01) {
        previewContainer.style.cursor = 'default';
      }
    });

    // Mouse Wheel Zoom
    previewContainer.addEventListener('wheel', (e) => {
      if (e.target.closest('#preview-zoom-bar')) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? zoomState.step : -zoomState.step;
      setZoom(zoomState.scale + delta, true);
    }, { passive: false });
  }

  // Zoom Button Controls
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setZoom(zoomState.scale + zoomState.step, true);
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setZoom(zoomState.scale - zoomState.step, true);
    });
  }

  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetPreviewZoom(true);
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

  // Initial Crop UI state sync
  syncCropUI();

  /* ------------------------------------------------------------------
   * Force Cache Clear & App Update (One-Tap PWA Refresher)
   * ------------------------------------------------------------------ */
  async function forceAppUpdate(triggerBtn) {
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.innerHTML = '<span>⏳ キャッシュ削除中...</span>';
    }

    try {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // 2. Delete all Cache Storage (purges old v1.x caches completely)
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }

      // 3. Clear session storage
      try {
        sessionStorage.clear();
      } catch (e) {}

      if (triggerBtn) {
        triggerBtn.innerHTML = '<span>✓ 完了！再読み込み中...</span>';
      }

      // 4. Force hard reload with timestamp query to bypass any disk cache
      setTimeout(() => {
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('t', Date.now().toString());
        window.location.replace(url.toString());
      }, 300);
    } catch (err) {
      console.error('Cache clear failed:', err);
      window.location.reload(true);
    }
  }

  // Attach click listener to all .btn-refresh-cache buttons across footer and info cards
  document.querySelectorAll('.btn-refresh-cache').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      forceAppUpdate(btn);
    });
  });

  // Re-render canvas when web fonts are fully loaded
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (state.currentImage) renderCanvas();
    });
  }
});
