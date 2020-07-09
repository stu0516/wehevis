// Immediately Invoked Function Expression to limit access to our
// variables and prevent
((() => {

	Promise.all([
		d3.json("data/world.geojson"),
		d3.csv("data/filtered_isp_dataset_df.csv")
		]).then(draw);

	function draw(data){

		//geographical data to draw the countries
		geo_data = data[0]
		//data about the tests
		tests_data = data[1]

		const dispatchString = "selectionUpdated";

		//create line chart
		let timeSeries = linechart()
			.x(d => d.key)
			.xLabel("Date (Year/Month/Day)")
			.y(d =>	d.value.num)
			.yLabel("Total Number of Tests")
			.yLabelOffset(40)
			.selectionDispatcher(d3.dispatch(dispatchString))
			("#linechart", tests_data);

		//create world map
		let worldMap = worldmap()
			.selectionDispatcher(d3.dispatch(dispatchString))
			("#world", geo_data, tests_data);

		//create bar chart
		let groupedBarChart = groupedbarchart()
			.selectionDispatcher(d3.dispatch(dispatchString))
			("#groupbarchart", tests_data);

		//create pie chart
		let pieChart = piechart()
			.selectionDispatcher(d3.dispatch(dispatchString))
			("#piechart", tests_data);

		//create the button to clear all selections
		let overviewTable = overviewtable()
			.selectionDispatcher(d3.dispatch(dispatchString))
			("#overviewtable", tests_data);

		//create the dropdown for ISP selection
		let ispButton = ispselection()
			.selectionDispatcher(d3.dispatch(dispatchString))
			("#ispselection", tests_data);

		//update plots after selection on the world map
		worldMap.selectionDispatcher().on(`${dispatchString}.wm-to-ts`, timeSeries.updateSelection);
		worldMap.selectionDispatcher().on(`${dispatchString}.wm-to-bc`, groupedBarChart.updateSelection);
		worldMap.selectionDispatcher().on(`${dispatchString}.wm-to-pc`, pieChart.updateSelection);
		worldMap.selectionDispatcher().on(`${dispatchString}.wm-to-ib`, ispButton.updateSelection);

		//update plots after selection on the pie chart
		pieChart.selectionDispatcher().on(`${dispatchString}.pc-to-ts`, timeSeries.updateSelection);
		pieChart.selectionDispatcher().on(`${dispatchString}.pc-to-bc`, groupedBarChart.updateSelection);
		pieChart.selectionDispatcher().on(`${dispatchString}.pc-to-wm`, worldMap.updateSelection);
		pieChart.selectionDispatcher().on(`${dispatchString}.pc-to-ib`, ispButton.updateSelection);

		//update plots after brushing on the line chart
		timeSeries.selectionDispatcher().on(`${dispatchString}.ts-to-wm`, worldMap.updateSelection);
		timeSeries.selectionDispatcher().on(`${dispatchString}.ts-to-bc`, groupedBarChart.updateSelection);
		timeSeries.selectionDispatcher().on(`${dispatchString}.ts-to-pc`, pieChart.updateSelection);
		timeSeries.selectionDispatcher().on(`${dispatchString}.ts-to-ib`, ispButton.updateSelection);

		//update plots after selection on the bar chart
		groupedBarChart.selectionDispatcher().on(`${dispatchString}.bc-to-ts`, timeSeries.updateSelection);
		groupedBarChart.selectionDispatcher().on(`${dispatchString}.bc-to-pc`, pieChart.updateSelection);
		groupedBarChart.selectionDispatcher().on(`${dispatchString}.bc-to-wm`, worldMap.updateSelection);

		//return all plots to the initial state
		overviewTable.selectionDispatcher().on(`${dispatchString}.ot-to-ts`, timeSeries.updateSelection);
		overviewTable.selectionDispatcher().on(`${dispatchString}.ot-to-bc`, groupedBarChart.updateSelection);
		overviewTable.selectionDispatcher().on(`${dispatchString}.ot-to-pc`, pieChart.updateSelection);
		overviewTable.selectionDispatcher().on(`${dispatchString}.ot-to-wm`, worldMap.updateSelection);
		overviewTable.selectionDispatcher().on(`${dispatchString}.ot-to-ib`, ispButton.updateSelection);

		//update plots after the isp was selected
		ispButton.selectionDispatcher().on(`${dispatchString}.ib-to-ts`, timeSeries.updateSelection);
		ispButton.selectionDispatcher().on(`${dispatchString}.ib-to-bc`, groupedBarChart.updateSelection);
		ispButton.selectionDispatcher().on(`${dispatchString}.ib-to-pc`, pieChart.updateSelection);
		ispButton.selectionDispatcher().on(`${dispatchString}.ib-to-wm`, worldMap.updateSelection);

	}

})());
