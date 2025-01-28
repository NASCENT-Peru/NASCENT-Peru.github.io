
function updateBarCharts() {
// Iteriere über alle Canvas-Elemente mit der Klasse 'chart'
$('.chart.bar').each(function() {
const canvasElement = this;
const sectionElement = $(canvasElement).closest('section');

// Überprüfe, ob die übergeordnete <section> die Klasse 'open' hat
if (sectionElement.hasClass('open')) {
// Überprüfe, ob das Canvas-Element eine Chart-Instanz hat
if (barChartInstances[canvasElement.id]) {
const barChartInstance = barChartInstances[canvasElement.id];
// Zugriff auf die Chart-Instanz erfolgreich
barChartInstance.options.scales.x.display = true;
barChartInstance.options.scales.y.display = true;
barChartInstance.update();
}
}else{
// Überprüfe, ob das Canvas-Element eine Chart-Instanz hat
if (barChartInstances[canvasElement.id]) {
const barChartInstance = barChartInstances[canvasElement.id];
// Zugriff auf die Chart-Instanz erfolgreich
barChartInstance.options.scales.x.display = false;
barChartInstance.options.scales.y.display = false;
barChartInstance.update();
}
}
});
};

// % change 2040 - 2060 Switzerland
$(document).ready(function () {
	
function calculatePercentageChange(value, base) {
return ((value - base) / base) * 100;
}
	
const labels = [];

for (const key in landUse) {
	if (landUse.hasOwnProperty(key)) {
		const myLandUse = landUse[key];
		labels.push(myLandUse['name_'+language]);
	}
}

function createChart(data, myID) {

	const datasets = data.datasets.map((dataset, index) => {
return {
...dataset
};
});

const config = {
type: 'bar',
data: {
labels: labels,
datasets: datasets
},
options: {
animation: false,
scales: {
x: {
display: false,
grid: {
display: false
}
},
y: {
min: -50,
max: 30,
display: false,
grid: {
display: true
},
ticks: {
beginAtZero: true,
callback: function(value) {
  return value + '%';
}
}
}
},
plugins: {
legend: {
display: false
},
tooltip: {
callbacks: {
label: function(context) {
const value = context.dataset.data[context.dataIndex];
const formattedValue = value.toFixed(2); // Rundet den Wert auf zwei Dezimalstellen
const sign = value >= 0 ? '+' : ''; // Fügt das Pluszeichen hinzu, wenn der Wert positiv ist
return sign + formattedValue + '%'; // Gibt das formatierte Label zurück
}
}
}
}
}
};

const chart = new Chart(document.getElementById(myID), config);
barChartInstances[myID] = chart;
}
// BAU
const percentChange_BAU = {
datasets: [{
label: 'Veränderung in %',
data: [
	calculatePercentageChange(283245, 226026),
	calculatePercentageChange(634653, 598995),
	calculatePercentageChange(179164, 201353),
	calculatePercentageChange(1221221, 1112030),
	calculatePercentageChange(232919, 276325),
	calculatePercentageChange(320967, 388383),
	calculatePercentageChange(451409, 476668),
	calculatePercentageChange(535111, 539423),
	calculatePercentageChange(43569, 47968),
	calculatePercentageChange(50599, 85686)
],
backgroundColor: backgroundColors,
borderWidth: 0,
minBarLength: 4
}]
};
// EI NAT
const percentChange_EI_NAT = {
datasets: [{
label: 'Veränderung in %',
data: [
	calculatePercentageChange(242216, 226026),
	calculatePercentageChange(629784, 598995),
	calculatePercentageChange(185554, 201353),
	calculatePercentageChange(1253484, 1112030),
	calculatePercentageChange(241163, 276325),
	calculatePercentageChange(339369, 388383),
	calculatePercentageChange(405101, 476668),
	calculatePercentageChange(554153, 539423),
	calculatePercentageChange(46564, 47968),
	calculatePercentageChange(55469, 85686)
],
backgroundColor: backgroundColors,
borderWidth: 0,
minBarLength: 4
}]
};
// EI SOC
const percentChange_EI_SOC = {
datasets: [{
label: 'Veränderung in %',
data: [
	calculatePercentageChange(248129, 226026),
	calculatePercentageChange(634653, 598995),
	calculatePercentageChange(181680, 201353),
	calculatePercentageChange(1229329, 1112030),
	calculatePercentageChange(224368, 276325),
	calculatePercentageChange(337278, 388383),
	calculatePercentageChange(449475, 476668),
	calculatePercentageChange(552896, 539423),
	calculatePercentageChange(44450, 47968),
	calculatePercentageChange(50599, 85686)
],
backgroundColor: backgroundColors,
borderWidth: 0,
minBarLength: 4
}]
};
// EI CUL
const percentChange_EI_CUL = {
datasets: [{
label: 'Veränderung in %',
data: [
	calculatePercentageChange(240683, 226026),
	calculatePercentageChange(629783, 598995),
	calculatePercentageChange(180980, 201353),
	calculatePercentageChange(1192657, 1112030),
	calculatePercentageChange(234194, 276325),
	calculatePercentageChange(344202, 388383),
	calculatePercentageChange(458810, 476668),
	calculatePercentageChange(566678, 539423),
	calculatePercentageChange(49401, 47968),
	calculatePercentageChange(55469, 85686)
],
backgroundColor: backgroundColors,
borderWidth: 0,
minBarLength: 4
}]
};
// GR EX
const percentChange_GR_EX = {
datasets: [{
label: 'Veränderung in %',
data: [
	calculatePercentageChange(317825, 226026),
	calculatePercentageChange(641455, 598995),
	calculatePercentageChange(171567, 201353),
	calculatePercentageChange(1168617, 1112030),
	calculatePercentageChange(242167, 276325),
	calculatePercentageChange(314977, 388383),
	calculatePercentageChange(443074, 476668),
	calculatePercentageChange(564994, 539423),
	calculatePercentageChange(44384, 47968),
	calculatePercentageChange(43797, 85686)

],
backgroundColor: backgroundColors,
borderWidth: 0,
minBarLength: 4
}]
};


function drawBarCharts(){
createChart(percentChange_EI_NAT, 'myChart1');
createChart(percentChange_EI_CUL, 'myChart2');
createChart(percentChange_EI_SOC, 'myChart3');
createChart(percentChange_BAU, 'myChart4');
createChart(percentChange_GR_EX, 'myChart5');
}
drawBarCharts();
})





