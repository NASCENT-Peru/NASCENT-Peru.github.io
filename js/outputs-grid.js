// Enhanced grid layout functionality
document.addEventListener("DOMContentLoaded", function () {

    // State tracking
    const state = {
        expandedScenarios: new Set(),     // no scenario expanded initially
        expandedSubjects: new Set(['characteristics']) // LULC row open by default
    };

    // Keep scenario order fixed left→right
    const SCENARIOS = ['bau', 'nature', 'society', 'culture'];

    // Toggle scenario column expansion
    function toggleScenarioExpansion(scenario) {
        const scenarioHeader = document.querySelector(`.scenario-header[data-scenario="${scenario}"]`);
        const contentCells = document.querySelectorAll(`.content-cell[data-scenario="${scenario}"]`);

        if (state.expandedScenarios.has(scenario)) {
            state.expandedScenarios.delete(scenario);
            scenarioHeader.classList.add('collapsed');
            contentCells.forEach(cell => cell.classList.add('scenario-collapsed'));
        } else {
            state.expandedScenarios.add(scenario);
            scenarioHeader.classList.remove('collapsed');
            contentCells.forEach(cell => cell.classList.remove('scenario-collapsed'));
        }

        updateGridDisplay();
    }

    // Toggle subject row expansion — only one row open at a time
    function toggleSubjectExpansion(subject) {
        if (state.expandedSubjects.has(subject)) {
            state.expandedSubjects.clear(); // collapse it
        } else {
            state.expandedSubjects.clear(); // close others
            state.expandedSubjects.add(subject); // open this one
        }
        updateGridDisplay();
    }

    // Animate expand/collapse of content cells
    function animateContentCell(cell, expand) {
        if (expand) {
            cell.classList.remove('collapsed');
            let startHeight = cell.offsetHeight;
            let endHeight = cell.scrollHeight;

            cell.style.maxHeight = startHeight + "px";
            void cell.offsetHeight; // force reflow

            cell.style.maxHeight = endHeight + "px";

            cell.addEventListener('transitionend', function handler(e) {
                if (e.propertyName === "max-height") {
                    cell.style.maxHeight = "none"; // reset for responsiveness
                    cell.removeEventListener('transitionend', handler);
                }
            });
        } else {
            let startHeight = cell.scrollHeight;
            cell.style.maxHeight = startHeight + "px";
            void cell.offsetHeight; // force reflow

            cell.style.maxHeight = "0px";

            cell.addEventListener('transitionend', function handler(e) {
                if (e.propertyName === "max-height") {
                    cell.classList.add('collapsed');
                    cell.removeEventListener('transitionend', handler);
                }
            });
        }
    }

    // Update grid display based on current state
    function updateGridDisplay() {
        const hasExpandedScenarios = state.expandedScenarios.size > 0;
        const hasExpandedSubjects = state.expandedSubjects.size > 0;

        // Update subject headers
        document.querySelectorAll('.subject-header').forEach(header => {
            const subj = header.getAttribute('data-subject');
            if (state.expandedSubjects.has(subj)) {
                header.classList.remove('collapsed', 'dimmed');
            } else {
                header.classList.add('collapsed');
            }
        });

        // Update content cells with smooth animation
        document.querySelectorAll('.content-cell').forEach(cell => {
            const scenario = cell.getAttribute('data-scenario');
            const subject = cell.getAttribute('data-subject');

            const shouldCollapse = (hasExpandedSubjects && !state.expandedSubjects.has(subject));

            if (shouldCollapse && !cell.classList.contains('collapsed')) {
                animateContentCell(cell, false); // collapse
            } else if (!shouldCollapse && cell.classList.contains('collapsed')) {
                animateContentCell(cell, true); // expand
            }

            // Scenario collapse handling
            cell.classList.toggle('scenario-collapsed', !state.expandedScenarios.has(scenario));

            // Dim cells if scenario or subject collapsed
            if ((hasExpandedScenarios && !state.expandedScenarios.has(scenario)) ||
                (hasExpandedSubjects && !state.expandedSubjects.has(subject))) {
                cell.classList.add('dimmed');
            } else {
                cell.classList.remove('dimmed');
            }
        });

        // Update scenario headers
        document.querySelectorAll('.scenario-header').forEach(header => {
            const scenario = header.getAttribute('data-scenario');
            if (state.expandedScenarios.has(scenario)) {
                header.classList.remove('collapsed');
            } else {
                header.classList.add('collapsed');
            }
        });

        updateGridColumns();
        resizePlotlyCharts();
        updateInstructionNotes();
    }

    // Dynamically set grid column widths using CSS classes
    function updateGridColumns() {
        const gridLayout = document.querySelector('.grid-layout');
        if (!gridLayout) return;

        gridLayout.classList.remove('one-expanded', 'two-expanded', 'three-expanded', 'four-expanded', 'all-collapsed');

        const expandedCount = state.expandedScenarios.size;

        if (expandedCount === 0) {
            gridLayout.classList.add('all-collapsed');
            gridLayout.style.gridTemplateColumns = '250px repeat(4, 1fr)';
        } else {
            switch (expandedCount) {
                case 1: gridLayout.classList.add('one-expanded'); break;
                case 2: gridLayout.classList.add('two-expanded'); break;
                case 3: gridLayout.classList.add('three-expanded'); break;
                case 4: gridLayout.classList.add('four-expanded'); break;
            }

            let template = '250px ';
            if (expandedCount === 1) {
                SCENARIOS.forEach(scenario => {
                    template += state.expandedScenarios.has(scenario) ? '2fr ' : '0.5fr ';
                });
            } else if (expandedCount === 2) {
                SCENARIOS.forEach(scenario => {
                    template += state.expandedScenarios.has(scenario) ? '1.5fr ' : '0.5fr ';
                });
            } else if (expandedCount === 3) {
                SCENARIOS.forEach(scenario => {
                    template += state.expandedScenarios.has(scenario) ? '1.33fr ' : '0.5fr ';
                });
            } else {
                SCENARIOS.forEach(() => template += '1fr ');
            }
            gridLayout.style.gridTemplateColumns = template.trim();
        }
    }

    // Enhanced resize function for Plotly charts
    function resizePlotlyCharts() {
        const plotlyCharts = document.querySelectorAll('.content-cell .plotly');
        plotlyCharts.forEach(el => {
            if (el.data || el._fullLayout) {
                setTimeout(() => {
                    const currentLayout = el.layout || {};
                    Plotly.relayout(el, { ...currentLayout, width: null, height: null })
                          .then(() => Plotly.Plots.resize(el));
                }, 250);
            }
        });
    }

    // Instruction notes
    function updateInstructionNotes() {
        const instructionText = document.getElementById('instruction-text');
        const hasExpandedScenarios = state.expandedScenarios.size > 0;
        const hasExpandedSubjects = state.expandedSubjects.size > 0;
        if (instructionText) {
            instructionText.style.display = (hasExpandedScenarios || hasExpandedSubjects) ? 'none' : 'block';
        }
    }

    // Click listeners for scenario headers
    document.querySelectorAll('.scenario-header').forEach(header => {
        header.addEventListener('click', function() {
            const scenario = this.getAttribute('data-scenario');
            if (scenario) toggleScenarioExpansion(scenario);
        });
    });

    // Click listeners for subject headers
    document.querySelectorAll('.subject-header').forEach(header => {
        header.addEventListener('click', function() {
            const subject = this.getAttribute('data-subject');
            if (subject) toggleSubjectExpansion(subject);
        });
    });

    // Initialize display
    updateGridDisplay();

    // Refresh tabsets to ensure proper behavior inside content cells
    if (typeof refreshTabsets === "function") {
        refreshTabsets();
    }

    // Popover configuration for custom keys
    const popoverMap = {
        climate: { content: 'IPCC climate change <a href="https://en.wikipedia.org/wiki/Representative_Concentration_Pathway" target="_blank" rel="noopener noreferrer">Representative Concentration Pathway</a>.' },
        population: { content: "Population projected growth to 2060." },
        economy: { content: "GDP per capita projected to 2060 (converted to USD using purchasing power parity (PPP) in 2017)." },
        value: { content: 'Societal values: intrinsic, instrumental, etc., according to the <a href="https://www.naturefuturesframework.org/" target="_blank" rel="noopener noreferrer">IPBES-NFF</a>.' },
        protected: { content: "% of national land covered by conservation areas" }
    };

    const elems = document.querySelectorAll(".popover-key");
    elems.forEach(el => {
        const key = el.dataset.popoverKey;
        const info = popoverMap[key];
        if (!info) return;

        if (typeof bootstrap !== 'undefined') {
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
        }
    });

    // -----------------------
    // Initialize popovers for info icons next to headings
    // -----------------------
    const infoIcons = document.querySelectorAll('.info-icon');
    infoIcons.forEach(el => {
        if (typeof bootstrap !== 'undefined') {
            new bootstrap.Popover(el, {
                trigger: 'hover focus',
                placement: 'right',
                html: false
            });
        }
    });

const ecosystemContent = `
<p>Ecosystem services influence a wide range of economic sectors, and future changes in these services will affect the Peruvian economy. To assess this impact, we examined the relationships between <strong>8 ecosystem services</strong> and <strong>7 economic sectors</strong>, using data from the <a href="https://www.encorenature.org/en" target="_blank" rel="noopener noreferrer">ENCORE database</a>, which evaluates sectoral dependencies on ecosystem services. Only the sectors relevant to Peru were included.</p>
<p>We analyzed <strong>two scenarios</strong> to evaluate the impact of ecosystem service changes on economic sectors. We calculate the impact as the product of the <strong>average change</strong> in ecosystem services and the <strong>materiality rating</strong> of each economic sector:</p>
<p>$$Impact = avg\\_change \\times mat\\_rating + std$$</p>
<p>The results of the scenario analyses are shown below in the bar plots.</p>
`;

const el = document.getElementById('ecosystem-icon');
if (typeof bootstrap !== 'undefined' && el) {
    const pop = new bootstrap.Popover(el, {
        html: true,
        content: ecosystemContent,
        trigger: 'hover focus',
        placement: 'right'
    });

    // Ensure math renders after the popover is shown
    el.addEventListener('shown.bs.popover', () => {
        if (window.MathJax) {
            // v3 MathJax
            MathJax.typesetPromise();
        }
    });
}


});


