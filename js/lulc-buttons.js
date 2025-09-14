// lulc-buttons.js
// Dynamically generate land-use buttons from LULC_pal.json
// and hook them up to a specific map instance
// Buttons are synced across all maps with the same sync key
// Clicking a button changes only the map image; pan/zoom is preserved

// Global sync registry for LULC buttons
const LULC_BUTTON_SYNC_GROUPS = {};

/**
 * Attach land-use buttons to a map instance, synchronized across all maps with the same sync key.
 *
 * @param {Object} mapInstance - The map object created by createInteractiveMap.
 * @param {string} buttonContainerId - The ID of the container for the buttons.
 * @param {string} jsonPath - Path to LULC JSON file.
 * @param {string} scenario - Scenario prefix for image filenames.
 */
async function attachLandUseButtons(mapInstance, buttonContainerId, jsonPath = 'data/LULC_pal.json', scenario = 'bau') {
  try {
    const buttonContainer = document.getElementById(buttonContainerId);
    if (!buttonContainer) {
      console.error(`Button container #${buttonContainerId} not found`);
      return;
    }

    // Determine sync key (either from data attribute or generate unique)
    let syncKey = buttonContainer.dataset.syncKey || `lulc-buttons-${buttonContainerId}`;
    if (!LULC_BUTTON_SYNC_GROUPS[syncKey]) {
      LULC_BUTTON_SYNC_GROUPS[syncKey] = { maps: [], buttons: [] };
    }
    LULC_BUTTON_SYNC_GROUPS[syncKey].maps.push(mapInstance);

    buttonContainer.innerHTML = '';

    // Load LULC JSON
    const response = await fetch(jsonPath);
    const landUseClasses = await response.json();

    landUseClasses.forEach((lu, index) => {
      const btn = document.createElement('div');
      btn.className = 'landusechange';
      btn.setAttribute('data-name', lu.class_name);
      btn.setAttribute('data-colour', lu.colour);

      // ---- Set full background colour and readable text ----
      btn.style.backgroundColor = lu.colour;
      const getContrastYIQ = (hexcolor) => {
        hexcolor = hexcolor.replace("#", "");
        const r = parseInt(hexcolor.substr(0,2),16);
        const g = parseInt(hexcolor.substr(2,2),16);
        const b = parseInt(hexcolor.substr(4,2),16);
        const yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? '#000' : '#fff';
      };
      btn.style.color = getContrastYIQ(lu.colour);
      // ------------------------------------------------------

      const label = document.createElement('span');
      label.textContent = lu.class_name;
      btn.appendChild(label);

      // Click handler
      btn.addEventListener('click', () => {
        const cleanName = lu.class_name.replace(/\s+/g, '_').toLowerCase();
        const fileName = `${scenario}-${cleanName}-change.png`;
        const newImage = `data/lulc/${fileName}`;

        // Update all maps in this sync group without changing pan/zoom
        LULC_BUTTON_SYNC_GROUPS[syncKey].maps.forEach(map => {
          // Preserve current transform
          const s = map.enableSync ? globalSyncState.scale : map.localScale;
          const tx = map.enableSync ? globalSyncState.translateX : map.localTranslateX;
          const ty = map.enableSync ? globalSyncState.translateY : map.localTranslateY;

          map.mapImage.src = newImage;
          map.mapImage.onload = () => {
            map.ctx.setTransform(s, 0, 0, s, tx, ty);
            map.redraw();
          };
        });

        // Update active button in all synced containers
        LULC_BUTTON_SYNC_GROUPS[syncKey].buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });

      buttonContainer.appendChild(btn);
      LULC_BUTTON_SYNC_GROUPS[syncKey].buttons.push(btn);

      // Optionally activate the first button
      if (index === 0) btn.click();
    });

    // Refresh layout if needed
    setTimeout(() => {
      const panel = buttonContainer.closest('.panel');
      if (panel) panel.style.height = 'auto';
    }, 50);

  } catch (err) {
    console.error('Error in attachLandUseButtons:', err);
  }
}







