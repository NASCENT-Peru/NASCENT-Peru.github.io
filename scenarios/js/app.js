

/******************* INIT ***************************/
const scenarioNames={
"a":"EI_NAT",
"b":"EI_CUL",
"c":"EI_SOC",
"d":"BAU",
"e":"GR_EX" 
}

const backgroundColors = [
	'#a8aba5', '#d1d3cf', '#97d1d5', '#29898f', '#bb8a75',
	'#f59f78', '#6ca147', '#c4e0a1', '#f8eb52', '#d5f1ff'
];

const landUse = {
	urban:{name_en:"Urban",name_de:"Siedlungsflächen",color:"#a8aba5"},
	static: { name_en: "Static",name_de:"Statisch", color: "#d1d3cf" },
	open_forest: { name_en: "Open forest",name_de:"Offener Wald", color: "#97d1d5" },
	closed_forest: { name_en: "Closed forest",name_de:"Geschlossener Wald", color: "#29898f" },
	overgrown: { name_en: "Overgrown",name_de:"Gebüschflächen", color: "#bb8a75" },
	intensive_agriculture: { name_en: "Intensive agriculture",name_de:"Intensive Landwirtschaft", color: "#f59f78" },
	alpine_pastures: { name_en: "Alpine pastures",name_de:"Alpwirtschaftsflächen", color: "#6ca147" },
	grassland: { name_en: "Grassland",name_de:"Naturwiesen und Heimweiden", color: "#c4e0a1" },
	permanent_crops: { name_en: "Permanent crops",name_de:"Dauerkulturen", color: "#f8eb52" },
	glacier: { name_en: "Glacier",name_de:"Gletscher", color: "#d5f1ff" }
}
var currentLandUse;

var columnNames = ['a', 'b', 'c', 'd', 'e'];
var rowCount = 5; // Anzahl Fragen
/******************************************************/
var openSections = [];
const barChartInstances = {};
const sankeyChartInstances = {};

$(document).ready(function () {

/************ Check localStorage *****************/
var welcome = localStorage.getItem('welcome');
	if (welcome == 1) {
	$('body').removeClass('info');
}

function setSize() {
	var openCount = openSections.length;
	var totalWidth = $(window).innerWidth();
	var autoWidth = totalWidth / 5;
	var openWidth = totalWidth / (openCount + 1);
	var closedWidth = (totalWidth - (openWidth * openCount)) / (5 - openCount);
	$('header.auto, section.auto').css('width', autoWidth + 'px');
	$('header.open, section.open').css('width', openWidth + 'px');
	$('header.closed, section.closed').css('width', closedWidth + 'px');
	$('.open .image2').css('background-size', openWidth - 60 + 'px');
	$('.closed .image2').css('background-size', closedWidth - 30 + 'px');
	$('.auto .image2').css('background-size', autoWidth - 30 + 'px');
	setMapSize(1);
}
setSize();
$(window).resize(function () {
	setSize();
})

	var mapBaseWidth = $(window).innerWidth()/2.4;//$(".map").width(); // initial map width
	var zoomFactor = 1;

	$(".zoom button").click(function () {
		var zoomstep = $(this).data('zoomstep');
		setMapSize(zoomstep);
	})

	function setMapSize(zoomstep){
		var container = $(".open .map-container");
		var map = $(".open .map");
		var inactiveMap=$(".closed .map, .auto .map");
	
		var containerCenterX = container.width() / 2;
		var containerCenterY = container.height() / 2;
		
		var preZoomMapCenterX = -parseInt(map.css('left')) + containerCenterX;
		var preZoomMapCenterY = -parseInt(map.css('top')) + containerCenterY;
		
		mapBaseWidth *= zoomstep; // adjust the base width
		var mapNewWidth = mapBaseWidth; // you can apply additional scaling here if required
		var mapNewHeight = mapNewWidth * 0.638;
	
		map.width(mapNewWidth);
		map.height(mapNewHeight);
		//inactiveMap.width(container.width() * zoomFactor);
		//inactiveMap.height(map.width() * 0.638);
		
		var postZoomMapCenterX = preZoomMapCenterX * zoomstep;
		var postZoomMapCenterY = preZoomMapCenterY * zoomstep;
	
		var mapNewLeft = containerCenterX - postZoomMapCenterX;
		var mapNewTop = containerCenterY - postZoomMapCenterY;
	
		map.css({ left: mapNewLeft + 'px', top: mapNewTop + 'px' });
		inactiveMap.css({left: mapNewLeft + 'px', top: mapNewTop + 'px'});
	}

	var scrollTarget=0;
	function calculateScroll() {
		var myScroll = $(window).scrollTop();
		var myHeight = $(document).height()-$(window).height();
		var percentPos = (myScroll / myHeight)*100;
		console.log(percentPos);
		scrollTarget = percentPos;
	}
	function scrollToPercent() {
        var documentHeight = $(document).height() - $(window).height();
		var targetScrollPosition = (scrollTarget / 100) * documentHeight;
		$('html').scrollTop(targetScrollPosition);
	}

////// VERBESSERN!!!
	$('body').on('click', 'header.auto', function () {
		calculateScroll();
	var myName = $(this).attr('name')
	openSections.push(myName);
	$('section, header').attr('class', 'closed');
	$('*[name="' + myName + '"]').attr('class', 'open');
	setSize();
	updateBarCharts();
		drawSankeyCharts();
		scrollToPercent();
})
	$('body').on('click', '.auto canvas, .auto .map-container', function () {
		calculateScroll();
	var myName = $(this).closest('section').attr('name')
	openSections.push(myName);
	$('section, header').attr('class', 'closed');
	$('*[name="' + myName + '"]').attr('class', 'open');
	setSize();
	updateBarCharts();
		drawSankeyCharts();
		scrollToPercent();
})
////////
	$('body').on('click', 'header.open', function () {
		calculateScroll();
	var myName = $(this).attr('name');
	$('*[name="' + myName + '"]').attr('class', 'closed');
	if ($('.open').length == 0) {
		$('section, header').attr('class', 'auto');
	}
	var removeItem = myName;
	openSections = $.grep(openSections, function (value) {
		return value != removeItem;
	});
	setSize();
	updateBarCharts();
		drawSankeyCharts();
		scrollToPercent();
})

	$('body').on('click', '.closed', function () {
		calculateScroll();
	var myName = $(this).attr('name')
	openSections.push(myName);
	if (openSections.length > 2) {
		$('*[name="' + openSections[0] + '"]').attr('class', 'closed');
		openSections.splice(0, 1);
	}
	$('*[name="' + myName + '"]').attr('class', 'open');
	setSize();
	updateBarCharts();
		drawSankeyCharts();
		scrollToPercent();
})


$('body').on('keyup', 'textarea', function () {
	var myID = $(this).closest('section').attr('id');
	var myValue = $(this).val();
	localStorage.setItem(myID, myValue);
})

	$('#sendmail').click(function () {
		$('body').removeClass('submit');
		$('html').scrollTop(0);
    var myString = 'Name: ' + $('#name').val() + '\n\n Email:' + $('#email').val()+ '\n\n';

    for (var column = 0; column < 5; column++) {
        for (var row = 1; row <= rowCount; row++) {
            var myID = columnNames[column] + '_' + row;
            var myValue = localStorage.getItem(myID);
            myString += myID + '=' + myValue + '\n';
        }
	}
	
	console.log(myString);

    // Send data to PHP script using AJAX
    $.ajax({
        type: 'POST',
        url: 'send_data.php', // Update with the correct path to your PHP script
        data: {
            dataString: myString
        },
        success: function (response) {
            // Handle the response from the PHP script if needed
            alert(response);
        },
        error: function (xhr, status, error) {
            alert(error);
        }
    });
});

$('#info').click(function(){
	$('body').addClass('info');
	$('html').scrollTop(0);
})
$('#submit').click(function(){
	$('body').addClass('submit');
	$('html').scrollTop(0);
})
$('.close, #start').click(function(){
	$('body').removeClass('info');
	$('body').removeClass('submit');
	$('html').scrollTop(0);
	localStorage.setItem('welcome', 1);
})

})
