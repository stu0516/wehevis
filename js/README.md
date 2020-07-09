# JS code


*visualization.js* is the code for the main functionality.

*worldmap.js* is the code for world/country map.

*groupedbarchart.js* is the code for grouped bar chart.

*linechart.js* is the code for linechart.

*piechart.js* is the code for pie chart.

*ispselection.js* is the code for ISP selection.

*overviewtable.js* is the code for button.

*reference_code_only* will be removed later.


We recommend you separate the implementation details for individual
visualizations using the [Reusable
Charts](https://bost.ocks.org/mike/chart/) framework Mike Bostock
advocates. Broadly this means implementing visualizations as closures
with getter-setter methods. This can be further extended to [making
updatable
charts](https://www.toptal.com/d3-js/towards-reusable-d3-js-charts).
