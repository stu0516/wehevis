// Initialize a line chart. Modeled after Mike Bostock's
// Reusable Chart framework https://bost.ocks.org/mike/chart/
function linechart() {
	// Based on Mike Bostock's margin convention
	// https://bl.ocks.org/mbostock/3019563
	let margin = {
			top: 20,
			left: 70,
			right: 30,
			bottom: 80
		},
		padding = 5,
		width = 650 - margin.left - margin.right,
		height = 220 - margin.top - margin.bottom,
		xValue = d => d[0],
		yValue = d => d[1],
		xLabelText = "",
		yLabelText = "",
		yLabelOffsetPx = 80,
		dispatcher,
		all_data,
		selected_data,
		time_data,
		filter = {
			isp: "all",
			country: "all",
			// FIXME: we should get this from the dataset
			time_start: new Date(2017, 12, 01),
			time_end: new Date(2020, 03, 01),
			app: "all",
			diff: "all"
		},
		time_start,
		time_end,
		parser = d3.timeParse("%Y/%m/%d"),
		line_selector,
		svg,
		wrapper,
		line_chart,
		xScale = d3.scaleTime(),
		yScale = d3.scaleLinear(),
		line = d3
			.line()
			.x(d => xScale(d[0]))
			.y(d => yScale(d[1])),
		xAxis,
		yAxis,
		xLabelSize = "13px",
		yLabelSize = "13px",
		xTicks = 18,
		yTicks = 8;

	//prepare data for the chart
	function prepare_data(data) {
		// parse the date / time
		let parseDate = d3.timeParse("%Y-%m-%d");
		let formatTime = d3.timeFormat("%Y/%m/%d");

		// Parse the date strings into javascript dates
		data.forEach(function(d) {
			d.created_date = parseDate(d.time_stamp);
		});

		// Store the number of tests on each day
		time_data = d3
			.nest()
			.key(function(d) {
				return formatTime(parseDate(d.time_stamp));
			})
			.sortKeys(d3.ascending)
			.rollup(function(v) {
				return {
					num: v.length
				};
			})
			.entries(data);

		return time_data;
	}

	// Return the filtered data
	//
	// filter the initial dataset based on the applied selections
	function filter_data(selected) {
		filtered_data = all_data;

		if (selected.country != "all")
			filtered_data = filtered_data.filter(function(d) {
				return d.country_code == selected.country;
			});

		if (selected.app != "all")
			filtered_data = filtered_data.filter(function(d) {
				return d.app_name == selected.app;
			});

		if (selected.diff != "all")
			filtered_data = filtered_data.filter(function(d) {
				return d.diff == selected.diff;
			});

		if (selected.time_start != "all")
			filtered_data = filtered_data.filter(function(d) {
				return d.created_date >= selected.time_start;
			});

		if (selected.time_end != "all")
			filtered_data = filtered_data.filter(function(d) {
				return d.created_date <= selected.time_end;
			});

		if (selected.isp != "all")
			filtered_data = filtered_data.filter(function(d) {
				return d.carrier_name == selected.isp;
			});

		return filtered_data;
	}

	// dispatching shortcut
	const dispatching = () => {
		// Get the name of our dispatcher's event
		let dispatchString = Object.getOwnPropertyNames(dispatcher._)[0];

		// Let other charts know about our selection
		dispatcher.call(dispatchString, this, filter);
	};

	// Redraw the chart
	//
	// updating chart with coordinated data
	function redraw(filtered) {
		time_data = prepare_data(filtered);

		// update the datapoints in time_data
		let redraw_data = [];
		for (let elem of time_data) {
			let tmp_date = parser(elem.key);
			redraw_data.push([tmp_date, elem.value.num]);
		}

		// update xScale domain
		xScale.domain([
			d3.min(redraw_data, d => d[0]),
			d3.max(redraw_data, d => d[0])
		]);

		// update the y scale domain
		yScale.domain([
			d3.min(redraw_data, d => d[1]),
			d3.max(redraw_data, d => d[1])
		]);

		// then update the x axis
		xAxis
			.transition()
			.duration(800)
			.call(
				d3
					.axisBottom(xScale)
					.tickFormat(d3.timeFormat("%Y/%m/%d"))
					.ticks(xTicks)
			);

		// then update the y axis
		yAxis
			.transition()
			.duration(800)
			.call(d3.axisLeft(yScale).ticks(yTicks));

		// we need to set the style again
		xAxis
			.selectAll(".tick")
			.select("text")
			.style("text-anchor", "end")
			.attr("dx", "-.2em")
			.attr("dy", ".8em")
			.attr("transform", "rotate(-45)")
			.style("font-size", xLabelSize);

		yAxis.selectAll(".tick").style("font-size", yLabelSize);

		// Update redraw line
		var redraw_line = line_chart.selectAll("path.linePath").data(redraw_data);

		redraw_line
			.enter()
			.append("path")
			.attr("d", line(redraw_data))
			.attr("class", "linePath");

		redraw_line
			.exit()
			.transition()
			.duration(800)
			.remove();

		redraw_line
			.transition()
			.duration(800)
			.attr("d", line(redraw_data));
	}

	// Draw the chart
	//
	// Create the chart by adding an svg to the div with the id
	// specified by the selector using the given data
	function chart(selector, data) {
		all_data = data;
		line_selector = selector;

		// get time data
		time_data = prepare_data(data);

		// generate chart data
		let chart_data = [];
		for (let elem of time_data) {
			let tmp_date = parser(elem.key);
			chart_data.push([tmp_date, elem.value.num]);
		}

		// svg content
		svg = d3
			.select(selector)
			.append("svg")
			.attr("preserveAspectRatio", "xMidYMid meet")
			.attr(
				"viewBox",
				[
					0,
					0,
					width + margin.left + margin.right,
					height + margin.top + margin.bottom
				].join(" ")
			)
			.classed("svg-content", true);

		// handler wrapper
		wrapper = svg
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr("class", "linechart-wrapper");

		line_chart = wrapper.append("g").attr("class", "line_chart");

		time_start = d3.min(chart_data, d => d[0]);
			time_end = d3.max(chart_data, d => d[0]);
		// xScale
		xScale
			.domain([time_start, time_end])
			.rangeRound([padding, width - padding]);

		// yScale
		yScale
			.domain([d3.min(chart_data, d => d[1]), d3.max(chart_data, d => d[1])])
			.rangeRound([height - padding, padding]);

		// X axis
		xAxis = wrapper
			.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(
				d3
					.axisBottom(xScale)
					.tickFormat(d3.timeFormat("%Y/%m/%d"))
					.ticks(xTicks)
			);

		// Put X axis tick labels at an angle
		xAxis
			.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.2em")
			.attr("dy", ".8em")
			.attr("transform", "rotate(-45)")
			.style("font-size", xLabelSize);

		// X axis label
		xAxis
			.append("text")
			.attr("class", "axisLabel")
			.attr("transform", "translate(" + (width - 50) + ", -30)")
			.style("text-anchor", "middle")
			.style("font-size", xLabelSize)
			.text(xLabelText);

		// Y axis and label
		yAxis = wrapper.append("g").call(d3.axisLeft(yScale).ticks(yTicks));

		yAxis.selectAll(".tick").style("font-size", yLabelSize);

		yAxis
			.append("text")
			.attr("class", "axisLabel")
			.attr("transform", "translate( 80, -5)")
			.style("font-size", yLabelSize)
			.text(yLabelText);

		// TODO on('mouseover')
		line_chart
			.selectAll("path")
			.data(chart_data)
			.enter()
			.append("path")
			.attr("class", "linePath")
			.attr("d", d => {
				return line(chart_data);
			});

		//label
		wrapper
			.append("text")
			.attr("x", width / 2)
			.attr("y", 0)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.attr("fill", "black")
			.text("Number of Tests over Time");

		// If user double click, reinitialize the chart
    svg.on("click",function(){
			filter.time_start = time_start;
			filter.time_end = time_end;

			filtered_data = filter_data(filter);
			redraw(filtered_data);
			dispatching();
    });

		svg.call(brush);

		// Highlight points when brushed
		function brush(g) {
			const brush = d3
				.brushX()
				.on("start brush", highlight)
				.on("end", brushEnd)
				.extent([
					[margin.left + padding, margin.top + padding],
					[margin.left + padding + width, margin.top + padding + height]
				]);

			ourBrush = brush;

			g.call(brush); // Adds the brush to this element

			// Highlight the selected circles.
			function highlight() {
				if (d3.event.selection === null) return;
				const [x0, x1] = d3.event.selection;

				// use old xScale to update time_start and time_end
				filter.time_start = xScale.invert(x0 - margin.left);
				filter.time_end = xScale.invert(x1 - margin.left);

				console.log(filter);
			}

			function brushEnd() {
				// We don't want an infinite recursion
				if (d3.event.sourceEvent.type != "end") {
					d3.select(this).call(brush.move, null);
				}

				// update the datapoints in time_data
				let brush_data = [];
				for (let elem of time_data) {
					let tmp_date = parser(elem.key);
					if (tmp_date >= filter.time_start && tmp_date <= filter.time_end) {
						brush_data.push([tmp_date, elem.value.num]);
					}
				}

				// update xScale domain
				xScale.domain([
					d3.min(brush_data, d => d[0]),
					d3.max(brush_data, d => d[0])
				]);

				// then update the x axis
				xAxis
					.transition()
					.duration(800)
					.call(
						d3
							.axisBottom(xScale)
							.tickFormat(d3.timeFormat("%Y/%m/%d"))
							.ticks(xTicks)
					);

				// We need to set the style here
				xAxis
					.selectAll(".tick")
					.select("text")
					.style("text-anchor", "end")
					.attr("dx", "-.2em")
					.attr("dy", ".8em")
					.attr("transform", "rotate(-45)")
					.style("font-size", xLabelSize);

				yAxis.selectAll(".tick").style("font-size", yLabelSize);

				// update the y scale domain
				yScale.domain([
					d3.min(brush_data, d => d[1]),
					d3.max(brush_data, d => d[1])
				]);

				// then update the y axis
				yAxis
					.transition()
					.duration(800)
					.call(d3.axisLeft(yScale).ticks(yTicks));

				// new line
				var new_line = line_chart.selectAll("path.linePath").data(brush_data);

				new_line
					.enter()
					.append("path")
					.attr("d", line(brush_data))
					.attr("class", "linePath");

				new_line
					.exit()
					.transition()
					.duration(800)
					.remove();

				new_line
					.transition()
					.duration(800)
					.attr("d", line(brush_data));

				dispatching();
			} // brushEnd
		}

		return chart;
	}

	// The x-accessor from the datum
	function X(d) {
		// console.log(xValue(d));
		return xScale(xValue(d));
	}

	// The y-accessor from the datum
	function Y(d) {
		// console.log(yValue(d));
		return yScale(yValue(d));
	}

	chart.margin = function(_) {
		if (!arguments.length) return margin;
		margin = _;
		return chart;
	};

	chart.width = function(_) {
		if (!arguments.length) return width;
		width = _;
		return chart;
	};

	chart.height = function(_) {
		if (!arguments.length) return height;
		height = _;
		return chart;
	};

	chart.x = function(_) {
		if (!arguments.length) return xValue;
		xValue = _;
		return chart;
	};

	chart.y = function(_) {
		if (!arguments.length) return yValue;
		yValue = _;
		return chart;
	};

	chart.xLabel = function(_) {
		if (!arguments.length) return xLabelText;
		xLabelText = _;
		return chart;
	};

	chart.yLabel = function(_) {
		if (!arguments.length) return yLabelText;
		yLabelText = _;
		return chart;
	};

	chart.yLabelOffset = function(_) {
		if (!arguments.length) return yLabelOffsetPx;
		yLabelOffsetPx = _;
		return chart;
	};

	//Gets or sets the dispatcher we use for selection events
	chart.selectionDispatcher = function(_) {
		if (!arguments.length) return dispatcher;
		dispatcher = _;
		return chart;
	};

	// Given selected data from another visualization
	// select the relevant elements here (linking)
	chart.updateSelection = function(selectedData) {
		if (!arguments.length) return;

		filter = selectedData;

		// filter data
		filtered_data = filter_data(selectedData);

		//redraw
		redraw(filtered_data);
	};

	return chart;
}
