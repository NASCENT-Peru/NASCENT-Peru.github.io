function syncRowHeights() {
  const rowTypes = ["intro", "characteristics", "themes", "visual", "narrative", "lulc"];
  const columns = document.querySelectorAll('.expandable-columns .column');
  const anyExpanded = Array.from(columns).some(col => col.classList.contains('expanded'));

  if (anyExpanded) {
    rowTypes.forEach(type => {
      const rows = document.querySelectorAll(`.row.${type}`);
      rows.forEach(row => row.style.height = 'auto');
    });
    return;
  }

  rowTypes.forEach(type => {
    const rows = document.querySelectorAll(`.row.${type}`);
    let maxHeight = 0;

    rows.forEach(row => {
      row.style.height = 'auto';
      const h = row.offsetHeight;
      if (h > maxHeight) maxHeight = h;
    });

    rows.forEach(row => {
      // row.style.height = maxHeight + "px";
    });
  });
}

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

  const instructionNote = document.getElementById('instruction-note');
  const instructionText = document.getElementById('instruction-text');

  if (instructionNote) {
    instructionNote.style.display = anyExpanded ? 'none' : 'block';
  }
  if (instructionText) {
    instructionText.style.display = anyExpanded ? 'none' : 'block';
  }

  requestAnimationFrame(() => {
    setTimeout(syncRowHeights, 50);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  syncRowHeights();

  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
});

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

document.addEventListener("DOMContentLoaded", function () {
  const elems = document.querySelectorAll(".popover-key");

  elems.forEach(el => {
    const key = el.dataset.popoverKey;
    const info = popoverMap[key];
    if (!info) return;

    const popover = new bootstrap.Popover(el, {
      content: info.content,
      html: true,
      trigger: 'manual',
      placement: 'top',
      sanitize: false
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
      }, 400);
    });

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
        }, 400);
      }
    }, true);
  });
});
