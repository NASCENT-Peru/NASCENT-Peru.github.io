// Row height synchronization for expandable columns
function syncRowHeights() {
  const rowTypes = ["intro", "characteristics", "themes", "visual", "narrative", "lulc"]; // Extend if needed
  const columns = document.querySelectorAll('.expandable-columns .column');
  const anyExpanded = Array.from(columns).some(col => col.classList.contains('expanded'));

  // If a column is expanded, reset all row heights
  if (anyExpanded) {
    rowTypes.forEach(type => {
      const rows = document.querySelectorAll(`.row.${type}`);
      rows.forEach(row => row.style.height = 'auto');
    });
    return;
  }

  // Otherwise, standardize row heights across columns
  rowTypes.forEach(type => {
    const rows = document.querySelectorAll(`.row.${type}`);
    let maxHeight = 0;

    // First pass: measure max height
    rows.forEach(row => {
      row.style.height = 'auto'; // Reset
      const h = row.offsetHeight;
      if (h > maxHeight) maxHeight = h;
    });

    // Second pass: apply max height
    rows.forEach(row => {
      // row.style.height = maxHeight + "px";
    });
  });
}

// Toggle expand functionality for columns
function toggleExpand(el) {
  el.classList.toggle('expanded');

  const columns = document.querySelectorAll('.expandable-columns .column');
  const anyExpanded = Array.from(columns).some(col => col.classList.contains('expanded'));

  columns.forEach(col => {
    col.classList.remove('dimmed');
    if (anyExpanded && !col.classList.contains('expanded')) {
      col.classList.add('dimmed');
    }
  });

  // Hide/show instruction note and text
  const instructionNote = document.getElementById('instruction-note');
  const instructionText = document.getElementById('instruction-text');

  if (instructionNote) {
    instructionNote.style.display = anyExpanded ? 'none' : 'block';
  }
  if (instructionText) {
    instructionText.style.display = anyExpanded ? 'none' : 'block';
  }

  // Let the layout settle, then update row heights
  requestAnimationFrame(() => {
    setTimeout(syncRowHeights, 50);
  });
}

// Function to check if a click should be ignored (doesn't trigger column expansion)
function shouldIgnoreClick(target) {
  // List of selectors that should not trigger column expansion
  const ignoredSelectors = [
    '.panel-tabset button', // Quarto tabset buttons
    '.panel-tabset a',      // Quarto tabset links
    '.nav-tabs button',     // Bootstrap nav tabs
    '.nav-tabs a',          // Bootstrap nav tab links
    'button',               // All buttons
    'a',                    // All links
    'input',                // Form inputs
    'select',               // Dropdowns
    'textarea',             // Text areas
    '.map-container',       // Map containers
    '.zoom button',         // Zoom buttons
    'canvas',               // Canvas elements
    '.card',                // Cards (if you want them to be non-clickable)
    '[data-bs-toggle]',     // Bootstrap toggles
  ];

  // Check if the target or any of its parents match the ignored selectors
  for (const selector of ignoredSelectors) {
    if (target.matches(selector) || target.closest(selector)) {
      return true;
    }
  }

  return false;
}

// Popover configuration
const popoverMap = {
  climate: {
    content: 'IPCC climate change <a href="https://en.wikipedia.org/wiki/Representative_Concentration_Pathway" target="_blank" rel="noopener noreferrer">Representative Concentration Pathway</a>.'
  },
  population: {
    content: "Population projected growth to 2060."
  },
  economy: {
    content: "GDP per capita projected to 2060 (converted to USD using purchasing power parity (PPP) in 2017), "
  },
  value: {
    content: 'Societal values: intrinsic, instrumental, etc., according to the <a href="https://www.naturefuturesframework.org/" target="_blank" rel="noopener noreferrer">IPBES-NFF</a>.'
  },
  protected: {
    content: "% of national land covered by conservation areas"
  }
};

// Interactive map creation function
function createInteractiveMap(containerId, imagePath, language = 'en') {
  // Swiss land use color mapping
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
  const canvas = container.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const tooltip = document.getElementById('mapTooltip') || createTooltip();

  function createTooltip() {
    const tip = document.createElement('div');
    tip.id = 'mapTooltip';
    tip.className = 'map-tooltip';
    document.body.appendChild(tip);
    return tip;
  }

  const mapImage = new Image();
  mapImage.src = imagePath;

  let isDragging = false, startX = 0, startY = 0, translateX = 0, translateY = 0, origX = 0, origY = 0, scale = 1;

  function redraw() {
    if (!mapImage.complete) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
  }

  function resizeCanvas() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    redraw();
  }

  mapImage.onload = () => {
    resizeCanvas();
    redraw();
    console.log('Map loaded for:', containerId);
  };

  window.addEventListener('resize', resizeCanvas);

  // Pan/drag functionality
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    origX = translateX;
    origY = translateY;
    canvas.style.cursor = 'default';
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    translateX = origX + dx;
    translateY = origY + dy;
    canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  });

  // Zoom functionality
  const zoomInBtn = container.querySelector('.zoom .in');
  const zoomOutBtn = container.querySelector('.zoom .out');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scale *= 1.2;
      canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      console.log('Zoom in, scale:', scale);
    });
  } else {
    console.error('Zoom in button not found in container:', containerId);
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scale *= 0.8;
      canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      console.log('Zoom out, scale:', scale);
    });
  } else {
    console.error('Zoom out button not found in container:', containerId);
  }

  // Tooltip functionality
  canvas.addEventListener('mousemove', e => {
    console.log('Mouse move detected on canvas');

    // Always show a test tooltip first
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX + 8) + 'px';
    tooltip.style.top = (e.clientY - 30) + 'px';
    tooltip.textContent = 'Mouse detected';
    tooltip.style.background = 'red';
    tooltip.style.color = 'white';

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width) / scale);
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height) / scale);

    console.log('Mouse position:', e.clientX, e.clientY, 'Canvas coords:', x, y);
    console.log('Canvas dimensions:', canvas.width, canvas.height);
    console.log('Scale:', scale);

    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
      console.log('Mouse outside canvas bounds');
      tooltip.textContent = 'Outside bounds';
      return;
    }

    try {
      console.log('Attempting to read pixel data...');
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      console.log('Pixel data successfully read:', pixel);

      const hex = '#' + pixel[0].toString(16).padStart(2, '0') +
                        pixel[1].toString(16).padStart(2, '0') +
                        pixel[2].toString(16).padStart(2, '0');

      console.log('Detected color:', hex, 'RGB:', pixel[0], pixel[1], pixel[2]);

      tooltip.textContent = `Color: ${hex} RGB: ${pixel[0]},${pixel[1]},${pixel[2]}`;
      tooltip.style.background = 'yellow';
      tooltip.style.color = 'black';

    } catch (err) {
      console.error('Error reading pixel data:', err);
      tooltip.textContent = 'Pixel read error: ' + err.message;
      tooltip.style.background = 'orange';
      tooltip.style.color = 'black';
    }
  });

  canvas.addEventListener('mouseout', () => {
    tooltip.style.display = 'none';
  });

  if (mapImage.complete) {
    resizeCanvas();
    redraw();
  }
}

// DOM Content Loaded Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  // Initialize row height synchronization
  syncRowHeights();

  // Add event listeners to columns with filtered click handling
  const columns = document.querySelectorAll('.expandable-columns .column');
  columns.forEach(column => {
    // Remove the inline onclick attribute if it exists
    column.removeAttribute('onclick');

    // Add the new click event listener with filtering
    column.addEventListener('click', function(event) {
      // Check if the click should be ignored
      if (shouldIgnoreClick(event.target)) {
        console.log('Click ignored on:', event.target);
        return; // Don't trigger column expansion
      }

      // Only trigger expansion if clicking on safe areas
      console.log('Click allowed on:', event.target);
      toggleExpand(this);
    });

    // Add visual feedback for clickable areas
    column.style.cursor = 'pointer';
  });

  // Initialize Bootstrap popovers (if Bootstrap is available)
  if (typeof bootstrap !== 'undefined') {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl);
    });
  }

  // Initialize custom popovers
  const elems = document.querySelectorAll(".popover-key");

  elems.forEach(el => {
    const key = el.dataset.popoverKey;
    const info = popoverMap[key];
    if (!info) return;

    // Only initialize if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
      const popover = new bootstrap.Popover(el, {
        content: info.content,
        html: true,
        trigger: 'manual',
        placement: 'top',
        sanitize: false // allow your HTML links safely
      });

      let hideTimeout;

      function clearHideTimeout() {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
      }

      el.addEventListener('mouseenter', () => {
        clearHideTimeout();
        popover.show();
      });

      el.addEventListener('mouseleave', () => {
        hideTimeout = setTimeout(() => {
          popover.hide();
        }, 400); // increased delay to 400ms
      });

      // Use event delegation to handle mouseenter/mouseleave on the popover element
      document.body.addEventListener('mouseenter', e => {
        const pop = document.querySelector('.popover');
        if (pop && pop.contains(e.target)) {
          clearHideTimeout();
        }
      }, true);

      document.body.addEventListener('mouseleave', e => {
        const pop = document.querySelector('.popover');
        if (pop && pop.contains(e.target)) {
          hideTimeout = setTimeout(() => {
            popover.hide();
          }, 400); // same delay on leaving popover
        }
      }, true);
    }
  });
});
