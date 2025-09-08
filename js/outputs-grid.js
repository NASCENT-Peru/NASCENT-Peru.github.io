// Enhanced grid layout functionality
document.addEventListener("DOMContentLoaded", function () {

    // State tracking
    const state = {
        expandedScenarios: new Set(),     // no scenario expanded initially
        expandedSubjects: new Set(['lulc']) // LULC row open by default
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

        // Update content cells
        document.querySelectorAll('.content-cell').forEach(cell => {
            const scenario = cell.getAttribute('data-scenario');
            const subject = cell.getAttribute('data-subject');

            cell.classList.remove('scenario-collapsed', 'collapsed', 'dimmed');

            // Scenario collapsed
            if (!state.expandedScenarios.has(scenario)) {
                cell.classList.add('scenario-collapsed');
            }

            // Subject collapsed only if a subject is expanded
            if (hasExpandedSubjects && !state.expandedSubjects.has(subject)) {
                cell.classList.add('collapsed');
            }

            // Dim cells if scenario or subject collapsed
            if ((hasExpandedScenarios && !state.expandedScenarios.has(scenario)) ||
                (hasExpandedSubjects && !state.expandedSubjects.has(subject))) {
                cell.classList.add('dimmed');
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

        // Remove existing grid state classes
        gridLayout.classList.remove('one-expanded', 'two-expanded', 'three-expanded', 'four-expanded', 'all-collapsed');

        const expandedCount = state.expandedScenarios.size;

        if (expandedCount === 0) {
            // No scenarios expanded - use default equal distribution
            gridLayout.classList.add('all-collapsed');
            gridLayout.style.gridTemplateColumns = '250px repeat(4, 1fr)';
        } else {
            // Apply appropriate class based on number of expanded scenarios
            switch (expandedCount) {
                case 1:
                    gridLayout.classList.add('one-expanded');
                    break;
                case 2:
                    gridLayout.classList.add('two-expanded');
                    break;
                case 3:
                    gridLayout.classList.add('three-expanded');
                    break;
                case 4:
                    gridLayout.classList.add('four-expanded');
                    break;
            }

            // Build the grid template dynamically
            let template = '250px '; // subject column

            if (expandedCount === 1) {
                // One expanded: give it more space, others get minimal
                SCENARIOS.forEach(scenario => {
                    template += state.expandedScenarios.has(scenario) ? '2fr ' : '0.5fr ';
                });
            } else if (expandedCount === 2) {
                // Two expanded: share space between them
                SCENARIOS.forEach(scenario => {
                    template += state.expandedScenarios.has(scenario) ? '1.5fr ' : '0.5fr ';
                });
            } else if (expandedCount === 3) {
                // Three expanded: equal distribution for expanded, minimal for collapsed
                SCENARIOS.forEach(scenario => {
                    template += state.expandedScenarios.has(scenario) ? '1.33fr ' : '0.5fr ';
                });
            } else {
                // All expanded: equal distribution
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

    // Popover configuration (keeping your existing popover functionality)
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

    // Initialize Bootstrap popovers if available
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
});
