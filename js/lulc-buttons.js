// lulc-buttons.js
// Dynamically generate land-use buttons from LULC_pal.json
// and hook them up to a specific map instance

async function attachLandUseButtons(mapInstance, buttonContainerId, jsonPath = 'data/LULC_pal.json', scenario = 'bau') {
  try {
    // 1. Load JSON
    const response = await fetch(jsonPath);
    const landUseClasses = await response.json();

    // 2. Container for buttons
    const buttonContainer = document.getElementById(buttonContainerId);
    if (!buttonContainer) {
      console.error(`Button container #${buttonContainerId} not found`);
      return;
    }

    // 3. Clear container
    buttonContainer.innerHTML = '';

    // 4. Build buttons
    landUseClasses.forEach((lu, index) => {
      const btn = document.createElement('div');
      btn.className = 'landusechange';
      btn.setAttribute('data-name', lu.class_name);
      btn.setAttribute('data-colour', lu.colour);

      // color swatch
      const colorBox = document.createElement('div');
      colorBox.className = 'color';
      colorBox.style.backgroundColor = lu.colour;

      // label
      const label = document.createElement('span');
      label.textContent = lu.class_name;

      btn.appendChild(colorBox);
      btn.appendChild(label);

      // click handler
      btn.addEventListener('click', () => {
        // Clean up class name -> lowercase, spaces → underscores
        const cleanName = lu.class_name.replace(/\s+/g, '_').toLowerCase();
        const fileName = `${scenario}-${cleanName}-change.png`;
        const newImage = `data/lulc/${fileName}`;

        mapInstance.mapImage.src = newImage;
        mapInstance.mapImage.onload = () => mapInstance.redraw();

        // active state
        document.querySelectorAll(`#${buttonContainerId} .landusechange`)
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });

      buttonContainer.appendChild(btn);

      // Optionally activate first button by default
      if (index === 0) {
        btn.click();
      }
    });

    // 5. Force layout refresh to remove extra whitespace
    setTimeout(() => {
      const panel = buttonContainer.closest('.panel');
      if (panel) panel.style.height = 'auto';
    }, 50);

  } catch (err) {
    console.error('Error loading land use JSON:', err);
  }
}


