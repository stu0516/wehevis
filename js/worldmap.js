//Creates a world map. Inspired by Mike Bostock's
// D3 map https://bost.ocks.org/mike/map/ and
// Threshold Choropleth https://observablehq.com/@d3/threshold-choropleth
function worldmap(){

	let margin = {
		top: 10,
		left: 50,
		right: 30,
		bottom: 15
	  },	

		width = 600 - margin.left - margin.right,
		height = 250 - margin.top - margin.bottom,

		dispatcher,
		all_data,
		all_geo_data,
		current_datapoints,
		filter = {isp: 'all', country:'all', time_start: new Date(2017, 12, 01), time_end: new Date(2020, 03, 01), app:'all',  diff:'all'},
		filter_world = {isp: 'all', country:'all', time_start:  new Date(2017, 12, 01), time_end: new Date(2020, 03, 01), app:'all',  diff:'all'},
		clicked = false,
		wrapper,
		svg,
		world,
		country_group,
		world_selector,
		projection_country,
		scales = {"AFG":400, "AGO":200, "ALB":500,"ARE":400,"ARG":300,"ARM":500,"ATA":50,"ATF":200,"au":200,"at":400,"AZE":500,"BDI":400,"BEL":400,"BEN":300,
		"BFA":200,"BGD":200,"BGR":400,"BHS":300,"BIH":300,"BLR":400,"BLZ":200,"BOL":400,"BRA":200,"BRN":300,"BTN":500,"BWA":500,"CAF":400,"ca":200,
		"CHE":300,"CHL":400,"CHN":200,"CIV":200,"CMR":400,"COD":200,"COG":400,"COL":200,"CRI":200,"CUB":500,"-99":0,"CYP":500,"cz":600,"DEU":200,
		"DJI":200,"DNK":400,"DOM":500,"DZA":200,"ECU":500,"EGY":300,"ERI":300,"ESP":300,"EST":400,"ETH":200,"FIN":400,"FJI":400,"FLK":200,"fr":400,
		"GAB":400,"GBR":500,"GEO":400,"GHA":400,"GIN":400,"GMB":400,"GNB":400,"GNQ":200,"GRC":400,"GRL":200,"GTM":300,"GUY":200,"HND":200,"HRV":400,
		"HTI":400,"HUN":400,"IDN":200,"IND":200,"IRL":500,"IRN":500,"IRQ":500,"ISL":200,"ISR":500,"ITA":500,"JAM":500,"JOR":200,"JPN":400,"KAZ":300,
		"KEN":400,"KGZ":400,"KHM":400,"KOR":400,"OSA":200,"KWT":400,"LAO":200,"LBN":400,"LBR":400,"LBY":400,"LKA":400,"LSO":200,"LTU":500,"LUX":500,
		"LVA":500,"MAR":400,"MDA":400,"MDG":300,"mx":300,"MKD":200,"MLI":200,"MMR":200,"MNE":200,"MNG":200,"MOZ":200,"MRT":200,"MWI":200,"MYS":200,
		"NAM":400,"NCL":200,"NER":200,"NGA":400,"NIC":200,"NLD":500,"NOR":200,"NPL":200,"NZL":200,"OMN":200,"PAK":400,"PAN":200,"PER":300,"PHL":400,
		"PNG":200,"pl":500,	"pr":400,	"PRK":200,"PRT":200,"PRY":200,"QAT":400,"ROU":200,"RUS":150,"RWA":200,"ESH":200,"SAU":300,"SDN":200,"SDS":200,
		"SEN":200,"SLB":200,"SLE":200,"SLV":400,"ABV":200,"SOM":300,"SRB":400,"SUR":400,"SVK":400,"SVN":400,"se":400,"SWZ":400,"SYR":400,"TCD":200,
		"TGO":200,"THA":200,"TJK":200,"TKM":200,"TLS":200,"TTO":200,"TUN":400,"TUR":200,"TWN":400,"TZA":400,"UGA":400,"UKR":300,"URY":200,"us":200,
		"UZB":300,"VEN":200,"VNM":300,"VUT":200,"PSE":200,"YEM":400,"ZAF":200,"ZMB":400,"ZWE":400},
		colorScale = d3.scaleThreshold()
		.domain([1,10,100,300,500, 1000])
		.range(["#e7f6e1","#b2e1bc","#9dd9bb","#4eafcd","#2081b9","#0d66a7"]);

		
	//filter initial dataset based on the applied filters
	function filter_data(selected){

		filtered_data = all_data

		if (selected.country != 'all')
			filtered_data = all_data.filter(function(d){ return d.country_code == selected.country})

		if(selected.app != 'all')
			filtered_data = filtered_data.filter(function(d){ return d.app_name == selected.app})

		if(selected.diff != 'all')
			filtered_data = filtered_data.filter(function(d){ return d.diff == selected.diff})

		if(selected.time_start != 'all')
			filtered_data = filtered_data.filter(function(d){ return d.created_date >= selected.time_start})

		if(selected.time_end != 'all')
			filtered_data = filtered_data.filter(function(d){ return d.created_date <= selected.time_end})

		if(selected.isp != 'all')
			filtered_data = filtered_data.filter(function(d){return d.carrier_name == selected.isp})

		return filtered_data 

    }

	//prepare data for drawing
	function prepare_data(data){

		return data.map(function(d){
			return{
				code: d.country_code,
				latitude: +d.latitude,
				longitude: +d.longitude,
				diff: +d.diff
	
			};
		})

	}

	//dispatch function on country/world click
	const dispatching = () => {

		// Get the name of our dispatcher's event
		let dispatchString = Object.getOwnPropertyNames(dispatcher._)[0];

		// Let other charts know about our selection
		dispatcher.call(dispatchString, this, filter);
	}

	//function to redraw the world after the selections were updated(fill the countries with the new color)
	function redraw_world(filtered){
		current_datapoints = prepare_data(filtered)

		wrapper.selectAll('path')
			.attr("fill", function (f) {
				const matched = current_datapoints.filter(d => d.code == f.id);
				return colorScale(matched.length);
			});
	
	}

	//redraw the country when the selections were updated(fill the country with the new geographical points for tests)
	function redraw_country(filtered){

		new_data = prepare_data(filtered)

		country_new_circles = new_data.filter(function(d){ return d.code == filter.country}).map(d => [d.longitude, d.latitude])

		const circles = country_group.selectAll('circle')
			.data(country_new_circles)
		
		circles
			.enter()
			.append("circle")
			.attr("cx", function (d) {return projection_country(d)[0]; })
			.attr("cy", function (d) { return projection_country(d)[1]; })
			.attr("r", "1px")
			.attr("fill", "#013a6c");

		circles
			.exit()
			.remove();

	}

	//function to delete the country after the user clicks to show the world map or clears all selections
	function deleteCountry(){
		svg.selectAll("g.country-group").remove();
		world.selectAll("path.country").style("opacity", 1);
	}


	//function to draw the world map and country when clicked
	function chart(selector, geodata, data) {

		all_data = data;
		all_geo_data = geodata.features;

		//getting the prepared data for the chart
		current_datapoints = prepare_data(data)
		features = geodata.features;

		
		world_selector = selector

		//create svg for the world map
		svg = d3.select(world_selector)
		    .append("svg")
			.attr("preserveAspectRatio", "xMidYMid meet")
			.attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom].join(' '))
			.classed("svg-content", true)
			.on("click", function() {
				if (d3.event.target == this && clicked) {
					console.log('clicked')
					deleteCountry()
					clicked = false;
					filter.country = "all"
					dispatching();
				}});

		//create group for the world map
		wrapper = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr("class", "world-group-wrapper");

		//create tooltip for the tests information about every country
		let tooltip = d3.select(selector).append("div")	
			.attr("class", "tooltip")	
			.style("position", "absolute")
			.style("visibility", "hidden");

		//getting projection for the world map
		let projection = d3.geoEquirectangular() 
			.scale(80)
			.translate([width / 2, height / 2]);

		// Draw the map
		world = wrapper
			.append("g")
			.attr("class", "world-group");

		//draw countries
		let countries = world
			.selectAll("path")
			.data(features)
			.enter()
			.append("path")
			// draw each country
			.attr("d", d3.geoPath().projection(projection))
			// set the color of each country
			.attr("fill", function (f) {
				const matched = current_datapoints.filter(d => d.code == f.id);
				return colorScale(matched.length);
			})
			.style("stroke", "transparent")
			.style("opacity", 1)
			.attr("class", function(d){ return "country" })
			.on("click", function(d) {
				if (clicked){
					console.log('clicked')
					deleteCountry()
					clicked = false;
					filter.country = "all"
				}
				else {
					console.log('not clicked')
					filter.country = d.id
					drawCountry(d.id)
					clicked = true;
				}
				dispatching();
			})
			.on('mousemove', function(d) {
				if (!clicked) {
					const name = d.properties.name
					const case_counts = current_datapoints.filter(gd => gd.code == d.id).length
					tooltip
						.text(name + " - "  + case_counts + ' tests')	
						.style("top", (event.pageY)+"px").style("left",(event.pageX)+"px")
						.style("visibility", "visible");	
					d3.select(this).style('stroke',   '#013a6c' );
				}
			})
			.on("mouseout", function(d) {
				tooltip.style("visibility", "hidden")
				d3.select(this).style('stroke', 'transparent')		

			})
		

		//setting the width and length for the legend
		const width_legend = 150;
		const length_legend = colorScale.range().length;

		//setting the scale for the legend
		const x = d3.scaleLinear()
			.domain([1, length_legend - 1])
			.rangeRound([width_legend / length_legend, width_legend * (length_legend - 1) / length_legend]);

		//adding the SVG group for all elements of the legend
		let legend = wrapper.append("g")
			.attr("class", "world-map-legend")
			.attr("transform", "translate(10, 200)");

		//adding the rectangles for every color
		legend.selectAll("rect")
			.data(colorScale.range())
			.join("rect")
			.attr("height", 6)
			.attr("x", (d, i) => x(i))
			.attr("width", (d, i) => x(i + 1) - x(i))
			.attr("fill", d => d);

		//addinf the label of the legend
		legend.append("text")
			.attr("y", 30)
			.attr("fill", "currentColor")
			.attr("text-anchor", "start")
			.attr("font-size", 8)
			.text("Number of Tests");

		//draw the legend 
		legend.call(d3.axisBottom(x)
			.tickSize(8)
			.tickFormat(i => colorScale.domain()[i - 1])
			.tickValues(d3.range(1, length_legend)))
			.select(".domain")
			.remove();

		//adding the label to the chart
		let title = wrapper.append("text")
			.attr("font-size", 8)
			.text("Number of Tests Worldwide")
			.attr("transform", "translate(200,0)");
			
		//draw country on the top of the world map when clicked
		function drawCountry(id){

			let tooltip_country = d3.select(selector).append("div")	
				.attr("class", "tooltip-country")	
				.style("position", "absolute")
				.style("visibility", "hidden");
			
			let country_data_lst = features.filter(function(d){ return d.id == id})
			let country_data = country_data_lst[0]

			let country_centroid
			if (id == "fr")
				country_centroid =  [ 2, 43];
			else
				country_centroid = d3.geoCentroid(country_data);
			
				console.log(country_centroid)

			projection_country = d3.geoEquirectangular()
				.center(country_centroid) // GPS of location to zoom on
				.scale(scales[id])      // This is like the zoom
				.translate([ width/2, height/2 ])

			let path_country = d3.geoPath().projection(projection_country);

			circles_data = prepare_data(filter_data(filter))

			world.selectAll("path.country").style("opacity", 0.3);

			//Adding the group for the country map
			country_group = wrapper.append("g")
				.attr("class", "country-group");

			//Draw the country
			let country_map = country_group
				.selectAll("path")
				.data(country_data_lst)
				.enter()
				.append("path")
				.attr("d", path_country)
				.attr("fill", function (f) {
					const matched = circles_data.filter(d => d.code == filter.country);
					return colorScale(matched.length);
				})
				.style("stroke", "transparent")
				.attr("class", "selected-country")
				.attr("opacity", 0.75);
			
			//Country label
			let country_label = country_group
				.append("text")
				.attr("class", "country-label")
				.attr("transform", "translate(250, 50)")
				//.attr("transform", "translate(" + path_country.centroid(country_data) + ")")
				.text(country_data.properties.name);

			//Selecting tests for the country and filling appropriate data structure to draw the locations of tests
			aa = circles_data.filter(function(d){ return d.code == id}).map(d => [d.longitude, d.latitude])

			//add locations of tests to the country map
			country_circles = country_group.selectAll(".circle")
				.data(aa).enter()
				.append("circle")
				.attr("cx", function (d) {return projection_country(d)[0]; })
				.attr("cy", function (d) { return projection_country(d)[1]; })
				.attr("r", "1px")
				.attr("fill", '#013a6c')
				.on('mousemove', function(d) {
					if (clicked) {
						const test_counts = current_datapoints.filter(gd => (gd.code == id && gd.longitude == d[0] && gd.latitude == d[1])).length
						const test_counts_diff = current_datapoints.filter(gd => (gd.code == id && gd.longitude == d[0] && gd.latitude == d[1] && gd.diff == 1)).length
						const test_counts_ndiff = current_datapoints.filter(gd => (gd.code == id && gd.longitude == d[0] && gd.latitude == d[1] && gd.diff == 0)).length
	
						tooltip_country
							.text(test_counts + ' Tests: ' + test_counts_diff + ' Diff ' + test_counts_ndiff + ' No Diff')	
							.style("top", (event.pageY)+"px").style("left",(event.pageX)+"px")
							.style("visibility", "visible");			
					}
				})
				.on("mouseout", function(d) {tooltip_country.style("visibility", "hidden")});				
		}

		return chart;
	}
	
	//Gets or sets the dispatcher we use for selection events
	chart.selectionDispatcher = function (_) {

		if (!arguments.length) return dispatcher;
		dispatcher = _;
		return chart;
	};
	//linking: function to update world/country charts after brushing/selection
	chart.updateSelection = function (selectedData) {
		if (!arguments.length) return;

		// console.log("worldmap intercepts dispathing...", selectedData);

		//update filter
		filter = selectedData;

		//update filter for the world
		filter_world.app = selectedData.app;
		filter_world.diff = selectedData.diff;
		filter_world.time_end = selectedData.time_end;
		filter_world.time_start = selectedData.time_start;
		filter.time_end = selectedData.time_end;
		filter.time_start = selectedData.time_start;
		filter_world.isp = selectedData.isp;
		
        // filter data
		filtered_data_world = filter_data(filter_world)
		filtered_data = filter_data(filter)

		//update world map
		redraw_world(filtered_data_world);

		//update country if necessary
		if (filter.country != 'all')
			redraw_country(filtered_data);
		//delete country chart if necessary
		else
			deleteCountry();
			
	};

	return chart;

}

