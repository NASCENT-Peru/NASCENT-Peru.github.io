// makeChart.js

// Function to create a chart with a palette loaded from JSON
function makeChart(canvasId, dataFile, paletteFile, chartTitle) {
  // Load both the data and the palette JSONs
  Promise.all([
    fetch(dataFile).then(res => res.json()),
    fetch(paletteFile).then(res => res.json())
  ])
  .then(([data, palette]) => {
    // Invert the data JSON: values = labels, keys = percentages
    const labels = Object.values(data).map(arr => arr[0]);
    const values = Object.keys(data).map(k => parseFloat(k));

    // Convert palette JSON into a lookup object: { "ClassName": "#hex" }
    const palMap = {};
    palette.forEach(p => {
      palMap[p.class_name] = p.colour;
    });

    // Match colours for labels, default grey if missing
    const colours = labels.map(l => palMap[l] || "#cccccc");

    // Chart.js dataset
    const chartData = {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colours,
        borderWidth: 0
      }]
    };

    // Render chart
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: chartTitle },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.parsed.y.toFixed(2) + '%';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Percentage Area (%)' }
          }
        }
      }
    });
  });
}

