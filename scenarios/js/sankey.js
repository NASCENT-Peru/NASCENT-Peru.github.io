function drawSankeyCharts() {
	loadChartData('data.json', function (data) {
	  createChart(data.BAU, 'mySankey1');
	  createChart(data.EI_NAT, 'mySankey2');
	  createChart(data.EI_SOC, 'mySankey3');
	  createChart(data.EI_CUL, 'mySankey4');
	  createChart(data.GR_EX, 'mySankey5');
	});
  }

var labelsClosed={
	'Urban ':' ',
	'Urban':' ',
	'Static ':' ',
	'Static':' ',
	'Open forest ':' ',
	'Open forest':' ',
	'Closed forest ':' ',
	'Closed forest':' ',
	'Overgrown ':' ',
	'Overgrown':' ',
	'Intensive agriculture ':' ',
	'Intensive agriculture':' ',
	'Alpine pastures ':' ',
	'Alpine pastures':' ',
	'Grassland ':' ',
	'Grassland':' ',
	'Permanent crops ':' ',
	'Permanent crops':' ',
	'Glacier ':' ',
	'Glacier': ' ',
	'Siedlungsflächen ':' ',
	'Siedlungsflächen':' ',
	'Statisch ':' ',
	'Statisch':' ',
	'Offener Wald ':' ',
	'Offener Wald':' ',
	'Geschlossener Wald ':' ',
	'Geschlossener Wald':' ',
	'Gebüschflächen ':' ',
	'Gebüschflächen':' ',
	'Intensive Landwirtschaft ':' ',
	'Intensive Landwirtschaft':' ',
	'Alpwirtschaftsflächen ':' ',
	'Alpwirtschaftsflächen':' ',
	'Naturwiesen und Heimweiden ':' ',
	'Naturwiesen und Heimweiden':' ',
	'Dauerkulturen ':' ',
	'Dauerkulturen':' ',
	'Gletscher ':' ',
	'Gletscher':' '
}

var labelsOpen={
	'Urban ':'Urban',
	'Urban':'Urban',
	'Static ':'Static',
	'Static': 'Static',
	'Open forest ': 'Open forest',
	'Open forest': 'Open forest',
	'Closed forest ': 'Closed forest',
	'Closed forest': 'Closed forest',
	'Overgrown ': 'Overgrown',
	'Overgrown': 'Overgrown',
	'Intensive agriculture ': 'Intensive agriculture',
	'Intensive agriculture': 'Intensive agriculture',
	'Alpine pastures ': 'Alpine pastures',
	'Alpine pastures': 'Alpine pastures',
	'Grassland ': 'Grassland',
	'Grassland': 'Grassland',
	'Permanence crops ': 'Permanence crops',
	'Permanence crops': 'Permanence crops',
	'Glacier ': 'Glacier',
	'Glacier': 'Glacier',
	'Siedlungsflächen ':'Siedlungsflächen',
	'Siedlungsflächen':'Siedlungsflächen',
	'Statisch ':'Statisch',
	'Statisch': 'Statisch',
	'Offener Wald ': 'Offener Wald',
	'Offener Wald': 'Offener Wald',
	'Geschlossener Wald ': 'Geschlossener Wald',
	'Geschlossener Wald': 'Geschlossener Wald',
	'Gebüschflächen ': 'Gebüschflächen',
	'Gebüschflächen': 'Gebüschflächen',
	'Intensive Landwirtschaft ': 'Intensive Landwirtschaft',
	'Intensive Landwirtschaft': 'Intensive Landwirtschaft',
	'Alpwirtschaftsflächen ': 'Alpwirtschaftsflächen',
	'Alpwirtschaftsflächen': 'Alpwirtschaftsflächen',
	'Naturwiesen und Heimweiden ': 'Naturwiesen und Heimweiden',
	'Naturwiesen und Heimweiden': 'Naturwiesen und Heimweiden',
	'Dauerkulturen ': 'Dauerkulturen',
	'Dauerkulturen': 'Dauerkulturen',
	'Gletscher ': 'Gletscher',
	'Gletscher': 'Gletscher'
}


function getNameByNumber(number) {
	const keys = Object.keys(landUse);
	const index = number % keys.length;
	return landUse[keys[index]]['name_'+language];
}
function getColorByNumber(number) {
	const keys = Object.keys(landUse);
	const index = number % keys.length;
	return landUse[keys[index]].color;
}

var priority = {
'urban ': 1,
'static':2,
'open_forest':3,
'closed_forest':4
};



// Funktion zum Laden der Daten aus JSON
function loadChartData(url, callback) {
  $.getJSON(url, function (data) {
	callback(data);
  });
}

function createChart(data, myID, x) {
	if ($('#' + myID).closest('section').hasClass('open')) {
		var labels = labelsOpen;
		var minThickness=0.05;
	} else {
		var labels = labelsClosed;
		var minThickness=0.1;
	}
	let myData;
  
	if (typeof currentLandUse === 'undefined') {
	  myData = data;
	} else {
	  myData = data.filter(item => item.To === currentLandUse || item.From === currentLandUse);
	}

const datasets = [
{
  data: myData.map(item => ({
	from: landUse[item.From]['name_'+language] + ' ',
	to: landUse[item.To]['name_'+language],
	flow: Math.max(item.flow,minThickness),
	color1: landUse[item.From].color,
	color2: landUse[item.To].color
  })),
  priority,
  labels,
 colorFrom: (c) => c.dataset.data[c.dataIndex].color1,
  colorTo: (c) => c.dataset.data[c.dataIndex].color2,
  borderWidth: 0,
},
];
  const config = {
	type: 'sankey',
	data: {
	  datasets: datasets,
	},
	  options: {
	  animation: false,
	  scales: {
		x: {
		  display: false,
		  grid: {
			display: false,
		  },
		  
		},
		y: {
		  display: false,
		  grid: {
			display: true,
		  },
		},
	  },
	  plugins: {
		
		tooltip: {
			enabled: false // Tooltips ausblenden
		  },
	  },
	},
  };
  var existingChart = Chart.getChart(myID);
	if (existingChart) {
		existingChart.destroy(); // Zerstöre das vorhandene Diagramm
	  }

	const chart = new Chart(document.getElementById(myID), config);
	Chart.defaults.font.family = "Roboto Condensed";
  sankeyChartInstances[myID] = chart;
}

$(document).ready(function () {
	// Laden der JSON-Daten und Erstellen der Diagramme
	drawSankeyCharts();
  });
  