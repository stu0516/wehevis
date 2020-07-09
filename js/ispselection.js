function ispselection(){

    let margin = {
		top: 10,
		left: 50,
		right: 30,
		bottom: 15
	},
        width = 200 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom,

        dispatcher,
        all_data,
		select,
		filter = {isp: 'all', country:'all', time_start:new Date(2017, 12, 01), time_end:new Date(2020, 03, 01), app:'all',  diff:'all'};

    const dispatching = () => {

        // Get the name of our dispatcher's event
		let dispatchString = Object.getOwnPropertyNames(dispatcher._)[0];
		
        // Let other charts know about our selection
        dispatcher.call(dispatchString, this, filter);
    }

	function onlyUnique(value, index, self) { 
		return self.indexOf(value) === index;
	}
	//adding the dropdown with the list of isps 
	function chart(selector, data) {

        all_data = data;
		isp_selector = selector;

		let isps = ['all']

		isps = isps.concat(data.map(d => d.carrier_name).filter(onlyUnique).sort())

		select = d3.select(selector);


		select
			.selectAll('option')
			.data(isps)
			.enter()
			.append('option')
			.text(function (d) { return d; }) 
			.attr("value", function (d) { return d; });
			
		select
			.on('change', function(d, i){
				filter.isp = this.value;
				dispatching();
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
		if (!arguments.length) return;
		
		filter = selectedData;
		select.property('value', selectedData.isp);

    };
    
    return chart;
}























































