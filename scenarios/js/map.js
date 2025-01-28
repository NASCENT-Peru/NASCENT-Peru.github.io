$(document).ready(function () {


	$('.map-container').append('<div class="zoom l"><button class="out" data-zoomstep=0.8>-</button><button class="in" data-zoomstep=1.2>+</button></div>');
	/***************************************************** */
	

	const scenarioID = ['a', 'b', 'c', 'd', 'e'];
	//var pa= false;
	var pa=false;
	var year='2020';

    function drawGifToCanvas(scenarioID, gifSrc) {
  // Canvas-Element abrufen
  var canvas = $('section[name='+scenarioID+'] .map').get(0);
  var ctx = canvas.getContext("2d");

  // GIF-Datei erstellen
  var gif = new Image();

  // Wenn das GIF geladen ist, zeichne es auf das Canvas
  gif.onload = function () {
    canvas.width = 2700//gif.width;
	  canvas.height = 1725//gif.height;
	  

	  if (pa != false) {
		var protected = new Image();
		// Wenn das Bild geladen ist, zeichne es auf das Canvas
		  protected.onload = function () {
			ctx.drawImage(gif, 0, 0);
			 ctx.globalAlpha = 0.8;
			ctx.drawImage(protected, 0, 0);
			 ctx.globalAlpha = 1;
		};
		//Pfad zu Protected Areas setzen	
		//protected.src='img/maps/base-pa.gif';
		//var protectedPath=gifSrc
		//protected.src='img/maps/'+scenarioNames[value]+'-pa-2060.gif';
		protected.src = gifSrc.replace('.gif', '-pa.gif');
	  } else {
		ctx.drawImage(gif, 0, 0);
	  }
	  
  };

	//Pfad zum Gif setzen	
	gif.src = gifSrc; 
	
	}

	$(scenarioID).each(function (index,value) {
		drawGifToCanvas(value, 'img/maps/base.gif');
	})
  /***************************************************** */
    //var map = $(".open .map");
    //var container = $(".open .map-container");
    var scaleFactor = 1.03;
    var dragMode = false;
	var mapObj, mapPosX, mapPosY, mouseX, mouseY;
	 
	 $(document).on("mousedown", ".open .map", function (e) {
		e.preventDefault();
		dragMode = true;
  
		 mapObj = $(this);
		
		mapPosX = parseFloat(mapObj.css("left")) || 0;
		mapPosY = parseFloat(mapObj.css("top")) || 0;
		mouseX = e.pageX;
		 mouseY = e.pageY;
	 })


$('.map').on('mousemove', function(event) {
  mapObj = $(this);
	var colorPickerTooltip = $('.color-picker-tooltip');

  var rect = mapObj[0].getBoundingClientRect();
  
  // Berücksichtige den Canvas Offset
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;

    // Berechne die Skalierungsfaktoren für X und Y auf Basis der aktuellen Größe von map
    var mapWidth = parseFloat(mapObj.css("width")) || originalWidth;
  var mapHeight = parseFloat(mapObj.css("height")) || originalHeight;

  // Berechne die Skalierungsfaktoren für X und Y auf Basis der aktuellen Größe von map
	var scaleX = 2700 / mapWidth;
	var scaleY = 1725 / mapHeight;

	// Berücksichtige die Skalierung der Karte
	x *= scaleX;
	y *= scaleY;

    // Hole Pixel-Daten an den angepassten Koordinaten x und y
    var ctx = mapObj[0].getContext("2d");
    var pixelData = ctx.getImageData(x, y, 1, 1).data;
	
	var color =
        '#' +
        pixelData[0].toString(16).padStart(2, '0') +
        pixelData[1].toString(16).padStart(2, '0') +
        pixelData[2].toString(16).padStart(2,'0');

		var landUseID = Object.keys(landUse).find(function(key) {
			return landUse[key].color === color;
		});

		var landUseName = landUseID ? landUse[landUseID]['name_'+language]: undefined;

	
		if (landUseName == undefined) {
			colorPickerTooltip.hide();
		} else {
			colorPickerTooltip.show();
			colorPickerTooltip.text(landUseName);
		}
	
	/*
	if (landUse[color] == undefined) {
		colorPickerTooltip.hide();
	} else {
		colorPickerTooltip.show();
		colorPickerTooltip.text(landUse[color]);
	}
  	*/

	colorPickerTooltip.css({
	  left:
        event.pageX +
        parseFloat($('body').scrollLeft()) +
        'px',
          
	  top:
          event.pageY +
          parseFloat($('body').scrollTop()) -
          parseInt(colorPickerTooltip.outerHeight()) -20+ // Damit distanziert sich unser text vom Mousecursor damit man besser sehen kann was unten liegt.
           'px'
        
	  
   });


});
	
	$('.map').on('mouseout', function (event) {
		$('.color-picker-tooltip').hide();
	})
	$('.map').on('mouseover', function (event) {
		$('.color-picker-tooltip').show();
	})


/****************************************************** */

	$(document).on("mousemove", function (e) {

		var container = $(".open .map-container");
		var map = $(".open .map");
		var inactiveMap=$(".closed .map, .auto .map");
      if (!dragMode) return;

      var dx = mouseX - e.pageX;
		var dy = mouseY - e.pageY;

      var newPosX = mapPosX - dx;
      var newPosY = mapPosY - dy;

      map.css({ left: newPosX + "px", top: newPosY + "px" });
      inactiveMap.css({ left: newPosX + "px", top: newPosY + "px" });
	});



	$(document).on("mouseup", function (e) {
		
      dragMode = false;
	});
	

	/***************************** YEAR BUTTONS **********************/

	$('button.model').click(function () {
		let myYear = $(this).attr('name');
		year = myYear;
		$('.landusechange').removeClass('active');
		$('.base').removeClass('active');
		$('.change').removeClass('active');
		$('.model').addClass('active');
		
		$(scenarioID).each(function (index,value) {
			drawGifToCanvas(value, 'img/maps/' + scenarioNames[value] + '-' + myYear + '.gif');
			$('section[name='+value+'] .map-container').css('background-image','url(img/maps/'+scenarioNames[value]+'-'+myYear + '.gif)');

		})
		currentLandUse = undefined;
		drawSankeyCharts();
	})
	$('button.change').click(function () {
		if (!$(this).hasClass('active')) {
			pa = false;
			$('.button_year button').removeClass('active');
			$('button.change').addClass('active');
			//$('.landusechange').removeClass('active');
			$('.landusechange[name="urban"]').addClass('active');
			currentLandUse = 'urban';
			$(scenarioID).each(function (index, value) {
				drawGifToCanvas(value, 'img/maps/' + scenarioNames[value] + '-' + currentLandUse + '.gif');
				$('section[name=' + value + '] .map-container').css('background-image', 'url(img/maps/' + scenarioNames[value] + '-' + currentLandUse + '.gif)');

			})
			drawSankeyCharts();
		} else {
			allLandUses();
		}
	})
	function allLandUses() {
		$('.landusechange').removeClass('active');
		$('.change').removeClass('active');

		if (year == '2020') {
			$('button.base').addClass('active');
			$('button.model').removeClass('active');
		}else{
			$('button.model').addClass('active');
			$('button.base').removeClass('active');
		}
		

		$(scenarioID).each(function (index,value) {
			$(scenarioID).each(function (index, value) {
				
				if (year == '2020') {
					drawGifToCanvas(value, 'img/maps/base.gif');
					$('section[name='+value+'] .map-container').css('background-image','url(img/maps/base.gif)');
				} else {
					drawGifToCanvas(value, 'img/maps/' + scenarioNames[value] + '-' + year + '.gif');
					$('section[name='+value+'] .map-container').css('background-image','url(img/maps/'+scenarioNames[value]+'-'+year + '.gif)');
				}
				
			})
		})
		currentLandUse = undefined;
		drawSankeyCharts();
	}
	$('button.base').click(function () {
		year=2020;
		allLandUses();
	})
	/***************************** LAND-USE BUTTONS **********************/
	for (const key in landUse) {
		if (landUse.hasOwnProperty(key)) {
			const myLandUse = landUse[key];
		$('.landuse').append('<div class="landusechange" name="'+key+'" title="'+myLandUse['name_'+language]+'"><div class="color" style="background-color:'+myLandUse.color+'"></div><span class="l">'+ myLandUse['name_'+language]+'</span></div>');
		}
	  }


	$('.landusechange').click(function () {
		pa=false;
		$('.button_year button').removeClass('active');
		$('button.change').addClass('active');
		$('.landusechange').removeClass('active');
		
		let myLandUse = $(this).attr('name');
		currentLandUse = myLandUse;
		$('.landusechange[name="'+myLandUse+'"]').addClass('active');
		
		$(scenarioID).each(function (index,value) {
			drawGifToCanvas(value, 'img/maps/'+scenarioNames[value]+'-'+myLandUse + '.gif');
			$('section[name='+value+'] .map-container').css('background-image','url(img/maps/'+scenarioNames[value]+'-'+myLandUse + '.gif)');
		})
		drawSankeyCharts();
	})
	/***************************** Protected Areas BUTTON **********************/

	$('.pa').click(function () {
		$('.landusechange').removeClass('active');
		$('.change').removeClass('active');
		//$('.buttons_regions button').removeClass('active');

		//let myRegion = $(this).attr('name');
		if($(this).hasClass('active')){
			$('.pa').removeClass('active');
			pa=false;
		}else{
			$('.pa').addClass('active');
			pa=true;

			if (year == '2020') {
				$('button.base').addClass('active');
			}else{
				$('button.model').addClass('active');
			}
		}
		
		$(scenarioID).each(function (index,value) {
			$(scenarioID).each(function (index, value) {
				if (year == '2020') {
					drawGifToCanvas(value, 'img/maps/base.gif');
				} else {
					drawGifToCanvas(value, 'img/maps/'+scenarioNames[value]+'-'+year+'.gif');
				}
				
			})
		})
	})
  });