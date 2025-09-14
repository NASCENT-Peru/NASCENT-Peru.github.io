// makeImpactChartCSVErrorBars.js - CORRECTED VERSION matching R code logic
// canvasId = ID of <canvas> element
// peruFile = "outputs/data/peru_diagram_df.csv"
// scenariosFile = "outputs/data/dummy_scenarios.csv"
// paletteFile = JSON with impact bins colors
// scenarioName = string, e.g., "Scenario 1"
function makeImpactChartCSVErrorBars(canvasId, peruFile, scenariosFile, paletteFile, scenarioName) {
  Promise.all([
    d3.csv(peruFile),
    d3.csv(scenariosFile),
    fetch(paletteFile).then(res => res.json())
  ])
  .then(([peruData, scenariosData, palette]) => {
    console.log('Peru data loaded:', peruData.slice(0, 3)); // Debug
    console.log('Scenarios data loaded:', scenariosData.slice(0, 3)); // Debug

    // --- 1. Process Peru data ---
    const ratingMap = { "VL": 1, "L": 2, "M": 3, "H": 4, "VH": 5 };
    peruData.forEach(d => {
      d.ISIC_cat = d.ISIC_cat === "Public_admin" ? "Public Administration" : d.ISIC_cat;
      d.rating_num = d.rating ? ratingMap[d.rating] : 0;
    });

    // --- 2. Inner join Peru data with scenarios (like R inner_join) ---
    const scenarioData = [];
    peruData.forEach(peruRow => {
      scenariosData.forEach(scenarioRow => {
        if (scenarioRow.Ecosystem_Service === peruRow.Ecosystem_Service) {
          // Create joined row with all columns from both datasets
          const joinedRow = {
            ...peruRow,  // All Peru data columns
            ...scenarioRow,  // All scenario data columns (Scenario, Ecosystem_Service, avg_change, std)
            // Convert avg_change and std to numbers
            avg_change: +scenarioRow.avg_change || 0,
            std: +scenarioRow.std || 0
          };
          scenarioData.push(joinedRow);
        }
      });
    });

    console.log('Joined scenario data:', scenarioData.slice(0, 5)); // Debug

    // --- 3. Calculate impacts with simulated noise (like R code) ---
    // Set seed equivalent for reproducible results
    let seed = 123;
    function seededRandom() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }

    // Box-Muller transform for normal distribution
    function normalRandom(mean = 0, stdDev = 1) {
      let u = 0, v = 0;
      while(u === 0) u = seededRandom(); // Converting [0,1) to (0,1)
      while(v === 0) v = seededRandom();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return z * stdDev + mean;
    }

    scenarioData.forEach(d => {
      if (isNaN(d.avg_change) || d.avg_change === null) {
        d.impact = 0; // no change if ES not in scenario
      } else {
        // impact = avg_change * rating_num + rnorm(1, mean = 0, sd = std)
        const noise = normalRandom(0, d.std);
        d.impact = d.avg_change * d.rating_num + noise;
      }
    });

    // --- 4. Filter by selected scenario and aggregate by ISIC_cat ---
    const filtered = scenarioData.filter(d => d.Scenario === scenarioName);
    console.log('Filtered data for scenario:', filtered); // Debug

    // Group by ISIC_cat and calculate mean and sd (like R group_by + summarise)
    const categoryMap = new Map();
    filtered.forEach(d => {
      if (!categoryMap.has(d.ISIC_cat)) {
        categoryMap.set(d.ISIC_cat, []);
      }
      categoryMap.get(d.ISIC_cat).push(d.impact);
    });

    // Calculate summary statistics for each category
    const categorySummary = Array.from(categoryMap.entries()).map(([cat, impacts]) => {
      const meanImpact = impacts.reduce((sum, val) => sum + val, 0) / impacts.length;
      // Calculate standard deviation
      const variance = impacts.reduce((sum, val) => sum + Math.pow(val - meanImpact, 2), 0) / impacts.length;
      const sdImpact = Math.sqrt(variance);

      return {
        ISIC_cat: cat,
        mean_impact: meanImpact,
        sd_impact: sdImpact || 0  // Handle NaN case
      };
    });

    // Ensure all ISIC categories are included (like R right_join)
    const allCats = Array.from(new Set(peruData.map(d => d.ISIC_cat)));
    const catData = allCats.map(cat => {
      const existing = categorySummary.find(x => x.ISIC_cat === cat);
      return {
        ISIC_cat: cat,
        mean_impact: existing ? existing.mean_impact : 0,
        sd_impact: existing ? existing.sd_impact : 0
      };
    });

    console.log('Final category summary:', catData); // Debug

    // --- 5. Bin colors (matching R cut function logic) ---
    const palMap = {};
    palette.forEach(p => palMap[p.class_name] = p.colour);

    const getImpactBin = val => {
      // Matching R's cut() with breaks = seq(-1, 1, by = 0.25), right = FALSE
      if (val >= -1 && val < -0.75) return "[-1,-0.75)";
      else if (val >= -0.75 && val < -0.5) return "[-0.75,-0.5)";
      else if (val >= -0.5 && val < -0.25) return "[-0.5,-0.25)";
      else if (val >= -0.25 && val < 0) return "[-0.25,0)";
      else if (val >= 0 && val < 0.25) return "[0,0.25)";
      else if (val >= 0.25 && val < 0.5) return "[0.25,0.5)";
      else if (val >= 0.5 && val < 0.75) return "[0.5,0.75)";
      else if (val >= 0.75 && val <= 1) return "[0.75,1]";
      else return "grey90"; // na.value equivalent
    };

    const labels = catData.map(d => d.ISIC_cat);

    // Prepare data in the correct format for chartjs-chart-error-bars
    const chartData = catData.map(d => ({
      y: d.mean_impact,
      yMin: d.mean_impact - d.sd_impact,
      yMax: d.mean_impact + d.sd_impact
    }));

    const backgroundColors = catData.map(d =>
      palMap[getImpactBin(d.mean_impact)] || "#cccccc"
    );

    console.log('Chart data prepared:', chartData); // Debug
    console.log('Background colors:', backgroundColors); // Debug

    const ctx = document.getElementById(canvasId).getContext('2d');

if (!window.impactCharts) window.impactCharts = {};

    window.impactChart = new Chart(ctx, {
      type: 'barWithErrorBars',
      data: {
        labels: labels,
        datasets: [{
          label: 'Mean Impact',
          data: chartData,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors,
          borderWidth: 1,
          errorBarColor: 'black',
          errorBarWhiskerSize: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `Impact of change in Ecosystem service provision according to ISIC Category (${scenarioName})`
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const dataPoint = context.raw;
                const mean = dataPoint.y;
                const errorBar = Math.abs(dataPoint.yMax - dataPoint.y);
                return `Mean Impact: ${mean.toFixed(3)}, SD: ${errorBar.toFixed(3)}`;
              }
            }
          }
        },
        scales: {
          y: {
            min: -1,
            max: 1,
            title: { display: true, text: 'Economic Impact' }
          },
          x: {
            title: { display: true, text: 'ISIC Category' },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });

    console.log('Chart created successfully');
  })
  .catch(error => {
    console.error('Error loading data or creating chart:', error);
  });
}


