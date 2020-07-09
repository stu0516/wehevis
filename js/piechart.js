function piechart(){

	let margin = {
		top: 35,
		left: 150,
		right: 25,
		bottom: 25
	},

		width = 450 - margin.left - margin.right,
		height = 450 - margin.top - margin.bottom,

		dispatcher,
		all_data,
		pie_selector,
		svg,
		pie,
		pie_arc,
		pie_color,
		pie_group,
		pie_arcs,
	filter = {isp: 'all', country:'all', time_start:new Date(2017, 12, 01), time_end:new Date(2020, 03, 01), app:'all',  diff:'all'};

	//format the data for the pie chart
	function prepare_data(data){

		let numOfDiff = 0;
		let numOfNoDiff = 0;

		for (let d in data) {
			if (data[d].diff == 1)
				numOfDiff++
			else
				numOfNoDiff++
		}

		return [{
			label: 'Diff',
			value: numOfDiff
		}, {
			label: 'No Diff',
			value: numOfNoDiff
		}];


    }

    //filter the initial dataset based on the applied selections
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
            filtered_data = filtered_data.filter(function(d){ return d.carrier_name == selected.isp})


		return filtered_data

    }

    //call dispatch
    const dispatching = () => {
        // Get the name of our dispatcher's event
        let dispatchString = Object.getOwnPropertyNames(dispatcher._)[0];

        // Let other charts know about our selection
        dispatcher.call(dispatchString, this, filter);
    }


    //draw the pie chart
    function redraw(data){

        //tooltip for the pie chart
        var tooltip = d3.select('#piechart').append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden");

        const arcs = pie_group
            .selectAll("path")
            .data(data)

        const all_arcs = arcs
            .enter()
            .append("path")
            .merge(arcs)
            .attr("class", "slice")
            .attr("fill", (d, i) => pie_color(i))
            .attr("d", pie_arc)
            .on('mouseover',function(d) {
                tooltip
                  .text(d.data.label + " - "  + d.data.value + ' tests')
                  .style("top", (event.pageY)+"px").style("left",(event.pageX)+"px")
                  .style("visibility", "visible");
            })
            .on("mousemove", function(d) {
                tooltip
                    .text(d.data.label + " - "  + d.data.value + ' tests')
                    .style("top", (event.pageY)+"px").style("left",(event.pageX)+"px")
                    .style("visibility", "visible");
            })
            .on("mouseout", function(d) {tooltip.style("visibility", "hidden")})
            .on('click',function(d) {
              
                    console.log('clicked')

                    tooltip.style("visibility", "hidden")
                    if (label_diff = d.data.label == "Diff")
                        filter.diff = 1;
                    else
                        filter.diff = 0;
                    // filter data
                    pie_data = prepare_data(filter_data(filter));
                    //redraw
                    redraw(pie(pie_data));
                    dispatching()
                
            });

        arcs
            .exit()
            .remove();
    }

    //create the pie chart
	function chart(selector, data) {

        all_data = data
        pie_selector = selector

        pie_data = prepare_data(data)

        svg = d3.select(selector)
            .append("svg")
			.attr("preserveAspectRatio", "xMidYMid meet")
			.attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom].join(' '))
            .classed("svg-content", true)
            .on('click',function(d) {
                if (d3.event.target == this){
                    console.log('clicked')

                    if(filter.diff != 'all'){
                        //tooltip.style("visibility", "hidden")
                        filter.diff = 'all'
                        // filter data
                        pie_data = prepare_data(filter_data(filter));
                        //redraw
                        redraw(pie(pie_data));
                        dispatching()
                    }
                }
            });

		pie_group = svg.append("g")
			.attr("transform", "translate(250, 250)");

        const radius = 120;

        pie_color = d3.scaleOrdinal(["#f7d54d", "#2E768C"]);

        pie = d3.pie()
            .value(d => d.value)
            .sort(null);

        pie_arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        redraw(pie(pie_data));

		// title
        svg.append("text")
            .text("Percentage of Differentiation")
            .attr("font-size", 32)
            .attr("transform", "translate(30,35)");

        // color codes and legend
        let legend = pie_group.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 24)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(['No Diff', 'Diff'].slice().reverse())
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(0," + i * 26 + ")";
            });

        legend.append("rect")
            .attr("x", width - 97)
            .attr("y", 140)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", pie_color)
            .attr("stroke", pie_color)
            .attr("stroke-width", 2)

        legend.append("text")
            .attr("x", width - 104)
            .attr("y", 150)
            .attr("dy", "0.32em")
            .text(function (d) {
                return d;
            });


        return chart
    }

    //Gets or sets the dispatcher we use for selection events
	chart.selectionDispatcher = function (_) {
		if (!arguments.length) return dispatcher;
		dispatcher = _;
		return chart;
    };

    // Given selected data from another visualization
	// select the relevant elements here (linking)
	chart.updateSelection = function (selectedData) {
        // console.log("piecharts intercepts dispathing...", selectedData);
        if (!arguments.length) return;

        filter = selectedData;

        // filter data
        pie_data = prepare_data(filter_data(selectedData));
        //redraw
        redraw(pie(pie_data));
    };

    return chart;
}

