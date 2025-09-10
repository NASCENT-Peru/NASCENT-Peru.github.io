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
  });
});
