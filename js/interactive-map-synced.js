// interactive-map-synced.js - Synchronized version (updated)
// Key changes:
// - globalSyncState now contains isInitialized & userInteracted flags
// - fitImage() will re-fit on resize if user has NOT interacted; otherwise it preserves the current centre
// - user interactions (pan/zoom/buttons/wheel) set userInteracted = true
// - added a Reset View button that calls resetSyncedMapsView()

// Global synchronization state
let syncedMapInstances = [];
let globalSyncState = {
  scale: 1,
  baseScale: 1,
  translateX: 0,
  translateY: 0,
  // new flags
  isInitialized: false,
  userInteracted: false
};

function createInteractiveMap(containerId, imagePath, language = 'en', enableSync = true) {
  const colorMapping = {
    "#a8aba5": language === 'de' ? "Siedlungsflächen" : "Urban",
    "#d1d3cf": language === 'de' ? "Statisch" : "Static",
    "#97d1d5": language === 'de' ? "Offener Wald" : "Open forest",
    "#29898f": language === 'de' ? "Geschlossener Wald" : "Closed forest",
    "#bb8a75": language === 'de' ? "Gebüschflächen" : "Overgrown",
    "#f59f78": language === 'de' ? "Intensive Landwirtschaft" : "Intensive agriculture",
    "#6ca147": language === 'de' ? "Alpwirtschaftsflächen" : "Alpine pastures",
    "#c4e0a1": language === 'de' ? "Naturwiesen und Heimweiden" : "Grassland",
    "#f8eb52": language === 'de' ? "Dauerkulturen" : "Permanent crops",
    "#d5f1ff": language === 'de' ? "Gletscher" : "Glacier"
  };

  const container = document.getElementById(containerId);
  if (!container) return console.error('Container not found:', containerId);

  const canvas = container.querySelector('canvas');
  if (!canvas) return console.error('Canvas not found in container:', containerId);

  const ctx = canvas.getContext('2d');

  // Tooltip
  let tooltip = document.getElementById('mapTooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'mapTooltip';
    tooltip.className = 'map-tooltip';
    document.body.appendChild(tooltip);
  }

  const mapImage = new Image();
  mapImage.src = imagePath;

  // Local state for this instance (used when enableSync === false)
  let scale = 1, baseScale = 1;
  let translateX = 0, translateY = 0;
  let isDragging = false, startX = 0, startY = 0, origX = 0, origY = 0;

  // Map instance object
  const mapInstance = {
    containerId,
    container,
    canvas,
    ctx,
    mapImage,
    redraw: () => redraw(),
    fitImage: () => fitImage(),
    enableSync
  };

  // Register for synchronization if enabled
  if (enableSync) {
    syncedMapInstances.push(mapInstance);
  }

  // Redraw the canvas
  function redraw() {
    // Clear canvas completely
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Use synced state if sync is enabled, otherwise use local state
    const currentScale = enableSync ? globalSyncState.scale : scale;
    const currentTranslateX = enableSync ? globalSyncState.translateX : translateX;
    const currentTranslateY = enableSync ? globalSyncState.translateY : translateY;

    // Apply current scale and translation
    ctx.setTransform(currentScale, 0, 0, currentScale, currentTranslateX, currentTranslateY);
    ctx.drawImage(mapImage, 0, 0);
  }

  // Resize canvas and fit image
  function fitImage() {
    // Keep old canvas size & global transform to compute preserved center if needed
    const oldCanvasW = canvas.width || container.clientWidth;
    const oldCanvasH = canvas.height || container.clientHeight;
    const prevScale = globalSyncState.scale;
    const prevTranslateX = globalSyncState.translateX;
    const prevTranslateY = globalSyncState.translateY;

    const w = container.clientWidth;
    const h = container.clientHeight;

    // If the container is hidden (tab not active), skip resize
    if (w === 0 || h === 0) {
      return;
    }

    if (!mapImage.width || !mapImage.height) return;

    // Update canvas pixel size
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    // Fit image to container while preserving aspect ratio
    const scaleX = w / mapImage.width;
    const scaleY = h / mapImage.height;
    baseScale = Math.min(scaleX, scaleY); // "contain" style

    if (enableSync) {
      // If it's the first initialization for synced maps -> center & set base
      if (!globalSyncState.isInitialized) {
        globalSyncState.baseScale = baseScale;
        globalSyncState.scale = baseScale;
        globalSyncState.translateX = (w - mapImage.width * globalSyncState.scale) / 2;
        globalSyncState.translateY = (h - mapImage.height * globalSyncState.scale) / 2;
        globalSyncState.isInitialized = true;

      } else if (!globalSyncState.userInteracted) {
        // User hasn't interacted yet: keep re-fitting/centering on resize/expansion
        globalSyncState.baseScale = baseScale;
        globalSyncState.scale = baseScale;
        globalSyncState.translateX = (w - mapImage.width * globalSyncState.scale) / 2;
        globalSyncState.translateY = (h - mapImage.height * globalSyncState.scale) / 2;

      } else {
        // User HAS interacted: preserve the map center as best as possible
        // Compute the map coordinates of the old canvas center, then re-project to new canvas size
        try {
          const effectivePrevScale = (prevScale && prevScale > 0) ? prevScale : globalSyncState.baseScale || 1;
          const mapCenterX = (oldCanvasW / 2 - prevTranslateX) / effectivePrevScale;
          const mapCenterY = (oldCanvasH / 2 - prevTranslateY) / effectivePrevScale;

          // Keep the same scale (do NOT change globalSyncState.scale)
          globalSyncState.translateX = (w / 2) - mapCenterX * globalSyncState.scale;
          globalSyncState.translateY = (h / 2) - mapCenterY * globalSyncState.scale;
        } catch (err) {
          // fallback: center
          globalSyncState.translateX = (w - mapImage.width * globalSyncState.scale) / 2;
          globalSyncState.translateY = (h - mapImage.height * globalSyncState.scale) / 2;
        }
      }

      // After adjusting global state, redraw ALL synced maps so they match the new canvas size/center
      syncedMapInstances.forEach(inst => inst.redraw());
    } else {
      // Independent map always fits to container (old behaviour for non-synced maps)
      scale = baseScale;
      translateX = (w - mapImage.width * scale) / 2;
      translateY = (h - mapImage.height * scale) / 2;
      redraw();
    }
  }

  // Observe container size changes (handles expandable cards)
  const ro = new ResizeObserver(() => {
    fitImage();
    // If this is a synced map, ensure all synced maps redraw as well (fitImage already triggers redraws in that case)
    if (enableSync) {
      syncedMapInstances.forEach(inst => {
        if (inst !== mapInstance) inst.redraw();
      });
    }
  });
  ro.observe(container);

  mapImage.onload = fitImage;

  // Synchronized zoom function
  function syncZoom(factor, centerX = canvas.width/2, centerY = canvas.height/2) {
    // mark that the user has interacted
    globalSyncState.userInteracted = true;

    if (enableSync) {
      const mapX = (centerX - globalSyncState.translateX) / globalSyncState.scale;
      const mapY = (centerY - globalSyncState.translateY) / globalSyncState.scale;

      globalSyncState.scale *= factor;
      globalSyncState.translateX = centerX - mapX * globalSyncState.scale;
      globalSyncState.translateY = centerY - mapY * globalSyncState.scale;

      // Redraw all synced maps
      syncedMapInstances.forEach(instance => instance.redraw());
    } else {
      // Independent zoom
      zoom(factor, centerX, centerY);
    }
  }

  // Independent zoom function
  function zoom(factor, centerX = canvas.width/2, centerY = canvas.height/2) {
    // mark local interaction (not used for synced logic)
    scale *= factor;
    translateX = centerX - ((centerX - translateX) / (scale / factor)) * scale;
    translateY = centerY - ((centerY - translateY) / (scale / factor)) * scale;
    redraw();
  }

  // Pan function for synchronized maps
  function syncPan(deltaX, deltaY) {
    // mark that the user has interacted
    globalSyncState.userInteracted = true;

    if (enableSync) {
      globalSyncState.translateX += deltaX;
      globalSyncState.translateY += deltaY;

      // Redraw all synced maps
      syncedMapInstances.forEach(instance => {
        instance.redraw();
      });
    } else {
      translateX += deltaX;
      translateY += deltaY;
      redraw();
    }
  }

  // Zoom buttons
  container.querySelector('.zoom .in')?.addEventListener('click', e => {
    e.preventDefault();
    globalSyncState.userInteracted = true;
    syncZoom(1.2);
  });
  container.querySelector('.zoom .out')?.addEventListener('click', e => {
    e.preventDefault();
    globalSyncState.userInteracted = true;
    syncZoom(0.8);
  });

(function addResetButton() {
  let zoomContainer = container.querySelector('.zoom');
  if (!zoomContainer) {
    zoomContainer = document.createElement('div');
    zoomContainer.className = 'zoom';
    zoomContainer.style.position = 'absolute';
    zoomContainer.style.top = '8px';
    zoomContainer.style.right = '8px';
    container.appendChild(zoomContainer);
  }

  // Avoid adding multiple reset buttons
  if (!zoomContainer.querySelector('.reset-view')) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'reset-view';
    btn.textContent = 'Reset view';
    btn.title = 'Re-center map';

    // Styling to fit text horizontally
    btn.style.display = 'block';
    btn.style.width = 'auto';
    btn.style.padding = '4px 8px';
    btn.style.marginBottom = '6px';  // put it ABOVE zoom buttons

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      resetSyncedMapsView();
    });
    zoomContainer.prepend(btn); // ensures it’s above the zoom buttons
  }
})();


  // Pan handlers
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    if (enableSync) {
      // mark that the user has started interacting (so later resizes won't reset)
      globalSyncState.userInteracted = true;
      origX = globalSyncState.translateX;
      origY = globalSyncState.translateY;
    } else {
      origX = translateX;
      origY = translateY;
    }

    canvas.style.cursor = 'grabbing';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'default';
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (enableSync) {
      globalSyncState.translateX = origX + deltaX;
      globalSyncState.translateY = origY + deltaY;
      syncedMapInstances.forEach(instance => instance.redraw());
    } else {
      translateX = origX + deltaX;
      translateY = origY + deltaY;
      redraw();
    }
  });

  // Mouse wheel zoom
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    globalSyncState.userInteracted = true;
    const factor = e.deltaY < 0 ? 1.2 : 0.8;
    syncZoom(factor, e.offsetX, e.offsetY);
  });

  // Tooltip
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const currentScale = enableSync ? globalSyncState.scale : scale;
    const currentTranslateX = enableSync ? globalSyncState.translateX : translateX;
    const currentTranslateY = enableSync ? globalSyncState.translateY : translateY;

    const x = Math.floor((e.clientX - rect.left - currentTranslateX) / currentScale);
    const y = Math.floor((e.clientY - rect.top - currentTranslateY) / currentScale);

    if (x < 0 || y < 0 || x >= mapImage.width || y >= mapImage.height) {
      tooltip.style.display = 'none';
      return;
    }

    try {
      // Temporary offscreen canvas to read pixel
      const tempCtx = document.createElement('canvas').getContext('2d');
      tempCtx.canvas.width = mapImage.width;
      tempCtx.canvas.height = mapImage.height;
      tempCtx.drawImage(mapImage, 0, 0);
      const pixel = tempCtx.getImageData(x, y, 1, 1).data;
      const hex = '#' + pixel[0].toString(16).padStart(2,'0') +
                        pixel[1].toString(16).padStart(2,'0') +
                        pixel[2].toString(16).padStart(2,'0');
      const landUseType = colorMapping[hex];

      if (landUseType) {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 8) + 'px';
        tooltip.style.top = (e.clientY - 30) + 'px';
        tooltip.textContent = landUseType;
      } else {
        tooltip.style.display = 'none';
      }
    } catch {
      tooltip.style.display = 'none';
    }
  });

  canvas.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });

  return mapInstance;
}

// Utility function to reset all synced maps to re-center at current scale
function resetSyncedMapsView() {
  if (syncedMapInstances.length === 0) return;

  syncedMapInstances.forEach(inst => {
    const w = inst.container.clientWidth;
    const h = inst.container.clientHeight;
    const img = inst.mapImage;

    // Skip hidden maps (in inactive tabsets)
    if (w === 0 || h === 0 || !img.width || !img.height) return;

    const currentScale = globalSyncState.scale || globalSyncState.baseScale;
    globalSyncState.translateX = (w - img.width * currentScale) / 2;
    globalSyncState.translateY = (h - img.height * currentScale) / 2;
    globalSyncState.userInteracted = false;
    globalSyncState.isInitialized = true;

    inst.redraw();
  });
}



// Utility function to disable synchronization for a specific map
function disableMapSync(containerId) {
  const instance = syncedMapInstances.find(inst => inst.containerId === containerId);
  if (instance) {
    instance.enableSync = false;
    // Remove from synced instances array
    const index = syncedMapInstances.indexOf(instance);
    if (index > -1) {
      syncedMapInstances.splice(index, 1);
    }
  }
}

// Utility function to enable synchronization for a specific map
function enableMapSync(containerId) {
  const instance = syncedMapInstances.find(inst => inst.containerId === containerId);
  if (instance) {
    instance.enableSync = true;
    // Add back to synced instances if not already there
    if (!syncedMapInstances.includes(instance)) {
      syncedMapInstances.push(instance);
    }
  }
}


