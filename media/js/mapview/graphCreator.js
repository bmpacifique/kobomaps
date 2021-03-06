/***********************************************************
* graphCreator.js - Script
* This software is copy righted by Etherton Technologies Ltd. 2013
* Written by Dylan Gillespie <dylan@ethertontech.com> 
* Started on 2013-08-05
* Javascript code for the graphs and charts throughout the map
*************************************************************/



 //Constructor for graphCreator
var graphCreator = (function(){
	/*Todo: Make all these setings on the website:*/
	var kmapInfodivHeight = 315;
	//modifiers for the flot graphs
	//var kmapInfochartWidth = 315; //if this number is changed, the legend div (which contains the national graph) also needs to be adjusted 
	var kmapInfochartBarHeight = 26; //these are numbers, not strings
	var kmapInfochartXAxisMargin = 35;
	var tabsClicked = false;
	
	
	/**
	* Draws graph of data from javascript.flot when user clicks on a location
	* @param string id is the id of the region that was clicked
	* @param string name is the name of the area being colored
	*/
	function DrawDataGraph(id, name){
		//remove "200_0_0_0_by_area_chart" from the end of the ID
		var fullId = id;
		var lengthToCut = id.length - "_by_area_chart".length;	
		id = id.substring(0,lengthToCut);
		
		var idArray = id.split("_");
		var regionData = null;

		var dataPtr = mapData.sheets[+idArray[0]];
		for(var i=1; i < idArray.length; i++){
			//that little plus down there converts the strings into actual integers to access data array
			dataPtr = dataPtr.indicators[+idArray[i]];
			if(i == idArray.length - 2){
				regionData = dataPtr;
			}
		}

		//this will account if there is only one level of indicator on the map and just pass in the original array instead of finding the lowest indicators
		var oneLevel = false;
		for(i in mapData.sheets[+idArray[0]].indicators){
			if(mapData.sheets[+idArray[0]].indicators[i].indicators.length == 0){
				oneLevel = true;
			}
			else{
				oneLevel = false;
				break;
			}
		}

		//make regionData the original arrray
		if(oneLevel){
			regionData = mapData.sheets[+idArray[0]];
		}
		
		//contains the path given by the id to access the data
		var dataPath = dataPtr.data;

		
	    $("#iChartTabs").tabs({
	    	activate: function(event, ui){
	    		//Make the graph draw when the panel is opened..there were issues happening with it
	    		if(ui.newPanel.selector == '#iChartLocalTab' && !tabsClicked){
	    			drawRegionChart(regionData, name, idArray[idArray.length - 1]);
	    			tabsClicked = true;
	    		}
	    	}
	    });
	    
		
		//draw the general chart
		drawGeneralChart(fullId, dataPath, name);
		
	}
	

	/**
	* Draws the chart that is found on the second page of the popup window, showing only the selected regions data
	* @param array regionData parsed from the mapData, contains all the values of the indicators
	* @param string name of the region selected
	* @param int indicatorIdNum to know that this is the region selected
	*/
	function drawRegionChart(regionData, name, indicatorIdNum){
		var graphYAxis = new Array();
		var selectedArea = new Array(); //Array to hold changes colors for selected area
		var selecY;
		var graphXData = new Array();	
		var tempXData = new Array();
		var tempYAxis = new Array();
		var selecX;
		var count = 1;
		var largest = 0;
		var stringLen = 0;
		
		//last indicator level is the one we want the data from
		for(i in regionData.indicators){
			//data level
			for(j in regionData.indicators[i].data){
				if(j == name){
					var value = parseFloat(regionData.indicators[i].data[j].value);
					if(!isNaN(value)){
						if(value > largest){
							largest = value;
						}	
						tempYAxis[i] = regionData.indicators[i].name;
						tempXData[i] = value;
						if(regionData.indicators[i].name.length > stringLen){
							stringLen = regionData.indicators[i].name.length;
						}
					}
					break;
				}
			}
			
		}
		count = Object.keys(tempYAxis).length;
		
		
		for(i in tempYAxis){
			graphYAxis.push([count, tempYAxis[i]]);
			graphXData.push([tempXData[i], count]);
			if(i == indicatorIdNum){
				selecY = count;
				selecX = tempXData[i];
			}	
			count --;
		}
				
		
		for(i=0; i < graphXData.length; i++){
			if(graphXData[i][1] == selecY){
				selecX = graphXData[i][0];
				break;
			}
		}
		//fixes an issue with hovertips being reversed, doesn't affect drawing of charts 
		graphXData.reverse();
		graphYAxis.reverse();
		
		
		var kmapInfochartHeight = calculateBarHeight(graphYAxis.length);
		
		var dimen = " height: " + kmapInfochartHeight + "px; ";
		var oldStyle = $("#iChartLocal").attr("style");
		
		$("#iChartLocal").attr("style", dimen + oldStyle);
		selectedArea = [[selecX, selecY]];
		  
	      /*
	      * Size of the chart is controlled by the div tag where iChartFull is created
	      */
		
	     //check to see if the region has any data, if not, don't draw the graph
	     var data = false;
	     for(i in graphXData){
	         if(!isNaN(graphXData[i][0])){
	             data = true;
	             break;
	         }
	     }
	     
	     var bothData = [
			        	  {
					        	data: graphXData,
					          	bars: {show: true, barWidth: .80, align: "center", fill:true, fillColor: colorProperties.getGraph()} ,
					          	color: colorProperties.getGraph()
				        	  },
				        	  {
					        	data: selectedArea,
					        	bars: {show: true, barWidth: .80, align: "center", fill:true, fillColor: colorProperties.getGraphS()} ,
				        		color: colorProperties.getGraphS()
				        	  }
			  ];
		  
	      /*
	      * Size of the chart is controlled by the div tag where iChartFull is created
	      */
	     if(data){
	    	 if(stringLen > 20){
	    		 $('#iChartLocal').width($('#iChartLocal').width() + 40);
	    	 }
			 $.plot($("#iChartLocal"), bothData,  {
				 	bars: {horizontal: true},
			    	grid: {hoverable: true},
			    	yaxis:{ticks: graphYAxis, min:.45, max:graphXData.length + .55}
				}
			);
	     }
	     else{
			$('iChartLocal').text("No regional data to display.");
	     }
	     
		bindHoverTip("#iChartLocal", graphYAxis);	
		//$('#iChartLocal .y1Axis').children().css('left', '0px');
	}
	
		
	/**
	* Draws the charts if there are totals present
	* @param string indicator is the path to the indicator selected on the left side of the map
	*/
	//used to draw the national total data chart
	function drawTotalChart(indicator, barColor, barSelectColor){
		var id = indicator.split("_");
		var totalData = new Array();
		var selecY;
		var selecX;
		var tempYAxis = new Array();
		var tempXData = new Array();
		var graphXData = new Array();
		var graphYAxis = new Array();
		var selectedArea = new Array();
		var stringLen = 0;

		var dataPtr = mapData.sheets[+id[0]];
		for(var i=1; i < id.length; i++){
			//that little plus down there converts the strings into actual integers to access data array
			dataPtr = dataPtr.indicators[+id[i]];
			if(i == id.length - 2){
				totalData = dataPtr;
			}
		}

		if(dataPtr.total == null){
			//$('#minButtonLegend').click();
			return;
		}

		else{
		//fill temp arrays with data
			for(i in totalData.indicators){
				var total = parseFloat(totalData.indicators[i].total);
				if(!isNaN(total)){
					if(totalData.indicators[i].name.length > stringLen){
						stringLen = totalData.indicators[i].name.length;
					}
					tempYAxis.push(totalData.indicators[i].name);
					tempXData.push(total);
				}
			}
			count = tempYAxis.length;
		//fill in full arrays so that the chart is as large as it needs to be
			for(i = 0; i < tempYAxis.length; i++){
				graphYAxis.push([count, tempYAxis[i]]);
				graphXData.push([tempXData[i], count]);
				if(i == id[id.length - 1]){
					selecY = count;
					selecX = tempXData[i];
				}	
				
				count --;
			}
		
			//fixes tooltip issue
			graphXData.reverse();
			graphYAxis.reverse();
		
			//attempt to change height and width of nationalIndicatorChart div
			var kmapInfochartHeight = 1.1 * calculateBarHeight(graphYAxis.length);
			//add in a new chart
			$("#nationalIndicatorChart").empty();
			$("#nationalIndicatorChart").height(kmapInfochartHeight);
		
			
			selectedArea = [[selecX, selecY]];
			var bothData = [
				        	  {
					        	data: graphXData,
					          	bars: {show: true, barWidth: .80, align: "center", fill:true, fillColor: barColor} ,
					          	color: barColor
				        	  },
				        	  {
					        	data: selectedArea,
					        	bars: {show: true, barWidth: .80, align: "center", fill:true, fillColor: barSelectColor} ,
				        		color: barSelectColor
				        	  }
				  ];

			if(graphYAxis.length != 0){
				$.plot($("#nationalIndicatorChart"), bothData,  {
			    	bars: {show: true, horizontal: true, fill: true},
			    	grid: {hoverable: true},
			    	yaxis:{ticks: graphYAxis, position: "left",  min:.45, max:graphXData.length + .55}
					}
				);
				bindHoverTip("#nationalIndicatorChart", graphYAxis);
			}
		}
		
		//if it's been hidden, open it
		/*
		if($('#minButtonLegend').text() == '+'){
			$('#minButtonLegend').click();
		}
		*/
	}

	/**
	* Draws the graph that is found on the first page of the popup window, detailing the data for all the regions
	* @param string fullId is the indicator path to this indicator
	* @param array dataPath is the parsed Mapdata array that contains the data for the general chart
	* @param string name of the region selected
	*/
	function drawGeneralChart(fullId, dataPath, name){
		
		var graphYAxis = new Array();
		var selectedArea = new Array(); //Array to hold changes colors for selected area
		var selecY;
		var graphXData = new Array();	
		var selecX;
		var count = 1;
		var largest = 0;
		var stringLen = 0;

		//create the graph data array and the array of yAxis Names
		for(i in dataPath){
			var value = parseFloat(dataPath[i].value);
			if(!isNaN(value))//make sure we're only dealing with real numbers, not Not-A-Number numbers
			{
				graphYAxis.push([count, i]);
				graphXData.push([value, count]);
				if(name == i){
					selecY = count;
					selecX = value;
				}
				if(value > largest){
					largest = value;
				}
				if(i.length > stringLen){
					stringLen = i.length;
				}
				count++; //increment that counter
			}
		}
		//variables for javascript graph, ynames and xdata
		//add data to graphXData, i indicates location on graph
		for(i=0; i < graphXData.length; i++){
			if(graphXData[i][1] == selecY){
				selecX = graphXData[i][0];
				break;
			}
		}
		selectedArea = [[selecX, selecY]];
		var bothData = [
			        	  {
					        	data: graphXData,
					          	bars: {show: true, barWidth: .80, align: "center", fill:true, fillColor: colorProperties.getGraph()} ,
					          	color: colorProperties.getGraph()
				        	  },
				        	  {
					        	data: selectedArea,
					        	bars: {show: true, barWidth: .80, align: "center", fill:true, fillColor: colorProperties.getGraphS()} ,
				        		color: colorProperties.getGraphS()
				        	  }
			  ];
		  
	      /*
	      * Size of the chart is controlled by the div tag where iChartFull is created
	      */
		if(stringLen > 25){
			$('#iChartTabs').width($('#iChartTabs').width() + 40);
   		 }
		 $.plot($("#iChartFull"+fullId), bothData,  {
		    	bars: {horizontal: true},
		    	grid: {hoverable: true},
		    	yaxis:{ticks: graphYAxis, min:.45, max:graphXData.length + .55}	    
			}
		);
		bindHoverTip("#iChartFull" + fullId,graphYAxis);
	}



	/**
	 * Creates tooltips when hovering over bars on any of the graphs on the map
	 * @param int x is the x coordinate of the tooltip
	 * @param int y is the y coordinate of the tooltip
	 * @param string contents is the message that is displayed
	 * @param string backColor is the background color
	 * @param string fontColor is the font color of the tooltip
	 */
	function showTooltip(x, y, contents, backColor, fontColor) {
	          $('<div id="tooltip">' + contents + '</div>').css( {
	              position: 'absolute',
	              display: 'none',
	              top: y,
	              left: x,
	              'z-index': 1000,
	              border: '1px solid #000',
	              padding: '2px',
	              'background-color': backColor,
	              'font-color': fontColor,
	              opacity: 1
	          }).appendTo("body").fadeIn(200);
	}

	/**
	* Creates the message and binds a tooltip to the graphs using the name from the array
	* @param int id of the bar to hover over
	* @param array graphYAxis the data that created the y axis on the graphs
	*/
	function bindHoverTip(id, graphYAxis){
		$(id).unbind("plothover");
		$(id).bind("plothover", function (event, pos, item) {
			  if (item) { 
		            $("#tooltip").remove(); 				
		            //datapoint is minus 1 as graphYAxis is 0 indexed and datapoint is 1 indexed
		            var hoverName = graphYAxis[item.datapoint[1] - 1][1];
		            
		            showTooltip(pos.pageX, pos.pageY - 27, 'The value of ' + hoverName + ' is ' + item.datapoint[0] + '.', '#FFF', '#000');
			   }
			    else { 
		             $("#tooltip").remove(); 
		           } 
			});
	}
	
	/**
	* Returns a created height for the divs that contain the graphs to make bars look uniform
	* @param int barCount
	* @return int what the height should be for the div
	*/
	function calculateBarHeight(barCount){
		if(barCount <= 2){
			return (2 * (parseInt(kmapInfochartBarHeight)) + 50);
		}
		else return (barCount * (parseInt(kmapInfochartBarHeight)));
	}
	
	/**
	* This takes in the min score, the spread between the min and the max, and the national average
	* and then updates the nationalaveragediv element
	* @param double Min: Minimum value of percentages across all areas for baselining the color scale
	* @param double Spread: Spread from min to max of percentages across all areas for making the ceiling of the color scale
	* @param double nationalAverage: average of the values for the selected region
	* @param string unit is the unit designated by the user when the map was made
	* @param string indicator is the example (0_0_2) string of the indicator path
	* @param string totalLabel is the name for the totals that is designated by the user
	*/
	function updateNationalAverage(min, spread, nationalAverage, unit, indicator, totalLabel)
	{
		//displays the box container
		$('#nationalaveragediv').show();

		//set the color
		var color = colorProperties.calculateColor(nationalAverage, min, spread);
	    
		$("#nationalaveragediv").css("background-color", color);
		$("#nationalaverageimg").text(mapParsers.addCommas(nationalAverage)+" "+mapParsers.htmlDecode(unit));

		$("#nationalaveragelabel").html('Total: ' +totalLabel);
	}
	
	/**
	* First step in the process for updating data in the title
	* @param string Name: Area's name as defined in the JSON that defines areas and their bounds
	* @param double Percentage: percentage of X in the given area
	* @param double Min: Minimum value of percentages across all areas for baselining the color scale
	* @param double Spread: Spread from min to max of percentages across all areas for making the ceiling of the color scale
	* @param string Title: Title of the question
	* @param array Data: associative array of the percentages keyed by Area names as defined in the JSON that defines areas and their bounds
	* @param string indicator is the example (0_0_2) string of the indicators
	* @param string unit is the unit designated by the user when the map was created
	*/
	function UpdateAreaPercentageTitleData(name, percentage, min, spread, title, data, indicator, unit, currentIndicatorString)
	{
		var message = '<div class="chartHolder" >' + createHTMLChart(name, title, data, indicator+"_by_area_chart", currentIndicatorString);
		message += "</div>";
		
		//now call the next method that does work
		UpdateAreaPercentageMessage(name, percentage, min, spread, message, unit, indicator+"_by_area_chart");
	}
	
	/**
	* Used to update the color and create the popup info window for a region
	* @param string name is the name of the area being colored
	* @param double percentage is the data of the area looking to be colored
	* @param double min is the lowest value given in the data
	* @param double spread is the spread from lowest to highest data points
	* @param string unit is the unit designated by the user when they created the map
	* @param string id is the id of the region that was clicked
	*/
	function UpdateAreaPercentageMessage(name, percentage, min, spread, message, unit, id)
	{
		//first update the polygon and the marker
		colorProperties.UpdateAreaPercentage(name, percentage, min, spread, unit);
		
		//close all other info windows if they are open
		for(var windowName in infoWindows)
		{
			infoWindows[windowName].close();
		}
		
		//now make up some info windows and click handlers and such
		var infoWindow = new google.maps.InfoWindow({content: message});
		infoWindows[name] = infoWindow;
		
		
		//remove any old listeners
		google.maps.event.clearListeners(areaGPolygons[name], 'click');
		// Add a listener for the click event
		google.maps.event.addListener(areaGPolygons[name], 'click', function(event) {
			//close all other info windows if they are open
			for(var windowName in infoWindows)
			{
				infoWindows[windowName].close();
			}
			//set up the new info window and open it.
			infoWindow.setPosition(event.latLng);
			infoWindow.open(map);
			//reset the listener for a new region
			tabsClicked = false;
			//draw the data chart inside the window
			DrawDataGraph(id, name);	
		});	
			
	}

	/**
	* Creates the html within the popup window that contains the tabs and the graphs
	* @param string Name: Area's name as defined in the JSON that defines areas and their bounds
	* @param string Title: Title of the question
	* @param array Data: associative array of the percentages keyed by Area names as defined in the JSON that defines areas and their bounds
	* @param int id: id of the region currently selected
	* @return string chartStr that contains the html used to create the tabs and graphs
	*/
	function createHTMLChart(name,title, data, id, indicatorString)
	{
		
		//now loop through the data and build the rest of the URL
		var count = 0; 
		for(areaName in data)
		{
			//handle non-numbers
			var t = data[areaName]; 
			if(isNaN(t) || typeof t == "undefined" || t == Number.NEGATIVE_INFINITY || t == Number.POSITIVE_INFINITY)
			{
				continue;
			}
			count++;
			//areaName = encodeURIComponent(areaName).replace(/ /g, "+");
		}

		var kmapInfochartHeight = calculateBarHeight(count);
		
		//creates the tab html that contains the chart ids
		var chartStr = '<div id="'+ id + '" class="infowindow"><p class="bubbleheader">' + name + " - " + title +": " + data[name]
		+'</p>' +
		'<div id = "iChartTabs" style= "width:auto;">' +
		  		'<ul>' +
		  			'<li> <a href="#iChartFull">' + indicatorString + ' </a> </li>' + 
					'<li> <a href="#iChartLocalTab">' + name + '</a> </li>' +
		  		'</ul>' +
		  		'<div id= "iChartFull" style="height:auto; width:auto; overflow-y: hidden; overflow-x: hidden">'+
		  			'<div id="iChartFull' + id + '" style="height:'+kmapInfochartHeight+'px; width:auto; overflow-x:hidden">' + 
		  				'</div>' +
		  			'</div>' +
		  			'<div id="iChartLocalTab" style="height:auto; width:auto;">' +
		  				'<div id="iChartLocal" style="width:380px; position: relative; padding: 0px">'  +
		  			'</div> </div>' + 
		  	'</div> ';
			

		//now put all of that together
		chartStr += '</div>';
		return chartStr;
	}


	
	//return so that the functions are called when using class.function()
	return {DrawDataGraph:DrawDataGraph, calculateBarHeight:calculateBarHeight, drawTotalChart:drawTotalChart, UpdateAreaPercentageTitleData:UpdateAreaPercentageTitleData,
		updateNationalAverage:updateNationalAverage};
	  
})();
 
