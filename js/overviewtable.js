function overviewtable(){

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
        overview_selector;

    const dispatching = () => {

        // Get the name of our dispatcher's event
        let dispatchString = Object.getOwnPropertyNames(dispatcher._)[0];
        // Let other charts know about our selection
			dispatcher.call(dispatchString, this,  filter =  {isp: 'all', country:'all', time_start:new Date(2017, 12, 01), time_end:new Date(2020, 03, 01), app:'all',  diff:'all'});
    }

    //draw the 'clear all selections' button
	function chart(selector, data) {

        all_data = data
        overview_selector = selector

        svg = d3.select(selector)
            .append("input")
            .attr('type',"button")
            .attr('value', "Clear All Selections")
            .on('click',function(d){
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
        
    return chart;
}

