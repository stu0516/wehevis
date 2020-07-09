function groupedbarchart() {
	let margin = {
			top: 60,
			left: 70,
			right: 30,
			bottom: 100
		},
		width = 750 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom,
		all_data,
		bar_selector,
		chart_group,
		selectedEmptyArea = true,
		filter = {
			isp: "all",
			country: "all",
			time_start: new Date(2017, 12, 01),
			time_end: new Date(2020, 03, 01),
			app: "all",
			diff: "all"
		},
		dispatcher,
		xLabelSize = "16px",
		yLabelSize = "16px",
		yTicks = 8;

    //filter data based on selections
    function filter_data(selected) {

        filtered_data = all_data

        if (selected.country != 'all')
            filtered_data = all_data.filter(function (d) {
                return d.country_code == selected.country
            })

        if (selected.app != 'all')
            filtered_data = filtered_data.filter(function (d) {
                return d.app_name == selected.app
            })

        if (selected.diff != 'all')
            filtered_data = filtered_data.filter(function (d) {
                return d.diff == selected.diff
            })

        if(selected.time_start != 'all')
			filtered_data = filtered_data.filter(function(d){
                return d.created_date >= selected.time_start
            })

		if(selected.time_end != 'all')
			filtered_data = filtered_data.filter(function(d){
                return d.created_date <= selected.time_end
            })

		if(selected.isp != 'all')
            filtered_data = filtered_data.filter(function(d){
                return d.carrier_name == selected.isp
            })


        return filtered_data

    }

    //prepare data for the chart
    function prepare_data(data) {

        bar_pie_data = data.map(function (d) {
            return {
                appName: d.app_name,
                diff: +d.diff
            };
        })

        let bar_data = [];
        let appSet = new Set();

        for (let d in bar_pie_data) {
            appSet.add(bar_pie_data[d].appName);
        }

        let applications = [];
        for (let item of appSet.keys())
            applications.push(item);

        // Filtering no diff and diff data from all of the datasets per application.
        for (let i in applications) {
            let diffFiltered = bar_pie_data.filter((f) => {
                if (f.appName == applications[i] && f.diff == 1)
                    return 1;
                else
                    return 0;
            });
            let nodiffFiltered = bar_pie_data.filter((f) => {
                if (f.appName == applications[i] && f.diff == 0)
                    return 1;
                else
                    return 0;
            });

            bar_data.push({
                appName: applications[i],
                diff: diffFiltered.length,
                nodiff: nodiffFiltered.length,
                sourceAppName: applications[i]
            });
        }

        return bar_data

    }

    //call dispatch
    const dispatching = () => {
        // Get the name of our dispatcher's event
        let dispatchString = Object.getOwnPropertyNames(dispatcher._)[0];

        // Let other charts know about our selection
        dispatcher.call(dispatchString, this, filter);
    }

    //update the bar chart based on new data
    function draw(filtered_data) {
        bar_data = prepare_data(filtered_data);

        chart_group.selectAll("*").remove();

        // The scale spacing the groups:
        let x0 = d3.scaleBand()
            .rangeRound([0, width])
            .paddingInner(0.1);

        // The scale for spacing each group's bar:
        let x1 = d3.scaleBand()
            .padding(0.05);

        // Coloring Scale
        let z = d3.scaleOrdinal()
            .range(["#f7d54d", "#2E768C"]);

        let keys = ['diff', 'nodiff'];

        // X0 Scale
        x0.domain(bar_data.map(function (d) {
            return d.appName;
        }));

        // X1 Scale
        x1.domain(keys)
            .rangeRound([0, x0.bandwidth()]);

        // Y Scale
        let y = d3.scaleLinear()
            .domain([0, d3.max(bar_data, function (d) {
                return Math.max(d.diff, d.nodiff);
            })])
            .rangeRound([height, 0]);

        // Create and Fill The Bars
        chart_group.append("g")
            .selectAll("g")
            .data(bar_data)
            .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function (d) {
                return "translate(" + x0(d.appName) + ",0)";
            })
            .selectAll("rect")
            .data(function (d) {
                return keys.map(function (key) {
                    return {
                        appName: d.appName,
                        key: key,
                        value: d[key],
                        sourceAppName: d.sourceAppName
                    };
                });
            })
            .enter().append("rect")
            .attr("x", function (d) {
                return x1(d.key);
            })
            .attr("y", function (d) {
                return y(d.value);
            })
            .attr("width", x1.bandwidth())
            .attr("height", function (d) {
                return height - y(d.value);
            })
            .attr("fill", function (d) {
                return z(d.key);
            });

        //tooltip
        let tooltip = d3.select('#groupbarchart').append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden");

        chart_group.selectAll('rect')
            .on('mouseover', function (d) {
                tooltip
                    .text(d.value + ' tests')
                    .style("top", (event.pageY + 10) + "px").style("left", (event.pageX + 10) + "px")
                    .style('visibility', 'visible');
            })
            .on('mouseout', function () {
                tooltip
                    .style('visibility', 'hidden')
            })
            .on('click', function (d) {
                selectedEmptyArea = false;
                tooltip
                    .style('visibility', 'hidden')
                filter.app = d.sourceAppName;
                if (d.key == "diff")
                    filter.diff = 1;
                else
                    filter.diff = 0;

                barData = filter_data(filter)

                // redraw chart
                draw(barData);
                dispatching()
            });

        // x axis
        let x_axis = chart_group.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x0));

        // Put X axis tick labels at an angle
        x_axis.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.2em")
            .attr("dy", ".8em")
            .attr("transform", "rotate(-45)")
            .style("font-size", xLabelSize);

        let y_axis = d3.axisLeft()
            .scale(y)
            .ticks(yTicks);

        // y axis
        chart_group.append("g")
            .call(y_axis)
            .style("font-size", yLabelSize)
            .append("text")
            .attr("x", -50)
            // .attr("y", y(y.ticks().pop()) - 10)
            .attr("y", 0 - (margin.top / 2) + 10)
            // .attr("dy", "0.32em")
            .attr("fill", "#000")
            .attr("font-size", yLabelSize)
            .attr("text-anchor", "start")
            .text("Total Number of Tests");

        // Clicking on Application Names
        chart_group.selectAll('text')
            .on('click', function (appName) {
                selectedEmptyArea = false;
                tooltip
                    .style('visibility', 'hidden')
                for (let item of bar_data) {
                    if (item.appName == appName) {
                        filter.diff = 'all';
                        filter.app = item.sourceAppName;
                        barData = filter_data(filter)
                        draw(barData);
                        dispatching()
                    }
                }
            })
            .on('mouseover', function () {
                d3.select(this).style("color", 'red')
                // this.style("font-size", 20)
                // console.log(this)
            })
            .on('mouseout', function () {
                d3.select(this).style("color", 'black')
            });

        // title
        chart_group.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2) + 11)
            .attr("text-anchor", "middle")
            .style("font-size", "19px")
            .text("Differentiation Per Application");

        // color codes and legend
        let legend = chart_group.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 14)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(['No Diff', 'Diff'].slice().reverse())
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(0," + i * 15 + ")";
            });

        legend.append("rect")
            .attr("x", width)
            .attr("y", -5)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", z)
            .attr("stroke", z)
            .attr("stroke-width", 2)

        legend.append("text")
            .attr("x", width - 5)
            .attr("y", 0)
            .attr("dy", "0.32em")
            .text(function (d) {
                return d;
            });
    }

    // Create the chart by adding an svg to the div with the id
    // specified by the selector using the given data
    function chart(selector, data) {
        all_data = data
        bar_selector = selector

        bar_data = prepare_data(data)

        let svg = d3.select(selector)
            .append("svg")
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom].join(' '))
            .classed("svg-content", true);

        svg.on('click', function (d) {
            if (selectedEmptyArea) {
                filter.app = 'all';
                filter.diff = 'all';
                draw(filter_data(filter));
                dispatching();
            } else {
                selectedEmptyArea = true;
            }
        });

        chart_group = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        draw(data);
        return chart;
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
        if (!arguments.length) return;

        filter = selectedData;

        // filter data
        filtered_data = filter_data(selectedData)
        //redraw
        draw(filtered_data)

    };

    return chart;
}
