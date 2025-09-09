// interactive-map.js

function createInteractiveMap(containerId, imagePath, language = 'en') {
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

  let scale = 1, baseScale = 1;
  let translateX = 0, translateY = 0;
  let isDragging = false, startX = 0, startY = 0, origX = 0, origY = 0;

  // Redraw the canvas
  function redraw() {
    // Clear canvas completely
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Apply current scale and translation
    ctx.setTransform(scale, 0, 0, scale, translateX, translateY);
    ctx.drawImage(mapImage, 0, 0);
  }

  // Resize canvas and fit image
  function fitImage() {
    const w = container.clientWidth;
    const h = container.clientHeight;

    if (!mapImage.width || !mapImage.height) return;

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    // Fit image to container while preserving aspect ratio
    const scaleX = w / mapImage.width;
    const scaleY = h / mapImage.height;
    baseScale = Math.min(scaleX, scaleY); // "contain" style
    scale = baseScale;

    // Center the image
    translateX = (w - mapImage.width * scale) / 2;
    translateY = (h - mapImage.height * scale) / 2;

    redraw();
  }

  // Observe container size changes (handles expandable cards)
  const ro = new ResizeObserver(fitImage);
  ro.observe(container);

  mapImage.onload = fitImage;

  // Pan
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origX = translateX;
    origY = translateY;
    canvas.style.cursor = 'grabbing';
  });
  document.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'default';
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    translateX = origX + (e.clientX - startX);
    translateY = origY + (e.clientY - startY);
    redraw();
  });

  // Mouse-centered zoom
  function zoom(factor, centerX = canvas.width/2, centerY = canvas.height/2) {
    const mapX = (centerX - translateX) / scale;
    const mapY = (centerY - translateY) / scale;

    scale *= factor;
    translateX = centerX - mapX * scale;
    translateY = centerY - mapY * scale;

    redraw();
  }

  // Zoom buttons
  container.querySelector('.zoom .in')?.addEventListener('click', e => {
    e.preventDefault();
    zoom(1.2);
  });
  container.querySelector('.zoom .out')?.addEventListener('click', e => {
    e.preventDefault();
    zoom(0.8);
  });

  // Mouse wheel zoom
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.2 : 0.8;
    zoom(factor, e.offsetX, e.offsetY);
  });

  // Tooltip
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - translateX) / scale);
    const y = Math.floor((e.clientY - rect.top - translateY) / scale);

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
}

