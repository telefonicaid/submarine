var submarine = submarine || {'version':0.9, 'controller':{}, 'viz': {} ,'extras': {} };

// Controller example for rendering a geoJSON into HTML5 id 'idName'.
// 'className' is the CSS class of the 'idName'

// Options is an object w/ the following properties:
// - baseJUrl: relative path to geoJSON file (mandatory)
// - dataFile: Name of geoJSON file (mandatory)
// - transTime: Transition time between d3.js transitions
// - debugLevel: Debug depth control for self.myLog
// - vizOptions passed to submarine.maps. See source & README of this component for details

// Example callbacks to pass to submarine.maps are provided.
// Keep in mind that in this example, points are drawn as circles, with radius proportional to geoJSON property 'radius'
submarine.controller.basicStatic = function(idName, className, options){

    // Instance reference
    var self = {};

    // Copy options object to self
    for (key in options){
        self[key] = options[key];
    }

    self.idName = idName;
    self.className = className;
    self.parentSelect = "#"+self.idName;

    self.pointRadius = 5000;
    self.colorScale = d3.scale.category10();

    // logging function w/level
    self.myLog = function(myString, level){
        if ((self.debugLevel!=0)&&(level<=self.debugLevel))
        {
            console.log(myString);
        }
    };


    // Renders a file into a map viz layer
    self.getHeatmap = function(fileName){

        d3.json(self.baseJUrl+fileName, function(heatMapData){

            if(heatMapData!=null){

                self.mapChart.initHeatmapLayer('first',{
				    // radius could be absolute or relative
				    // absolute: radius in meters, relative: radius in pixels
				    radius: { value: 30, absolute: true },
				    opacity: 0.8,
				    gradient: {
				    	0.45: "rgb(0,0,255)",
				    	0.55: "rgb(0,255,255)",
				    	0.65: "rgb(0,255,0)",
				    	0.95: "yellow",
				    	1.0: "rgb(255,0,0)"
				    }
			     }, heatMapData, function(d,i){return 1;}
                );

                self.mapChart.initHeatmapLayer('second',{
				    // radius could be absolute or relative
				    // absolute: radius in meters, relative: radius in pixels
				    radius: { value: 30, absolute: true },
				    opacity: 0.8,
				    gradient: {
				    	0.45: "rgb(0,0,255)",
				    	0.55: "rgb(0,255,255)",
				    	0.65: "rgb(0,255,0)",
				    	0.95: "purple",
				    	1.0: "rgb(255,0,0)"
				    }
			     }, heatMapData, function(d,i){return 1;}
                );
            }
            else{
                self.myLog("Could not load file: "+self.baseJUrl+self.dataFile,1);
            }
        });
    };


    // ... On document ready ...
    $(document).ready(function()
    {
        // Insert callback maps onto vizOptions
        self.vizOptions['callBackDict'] = self.callBacks;

        // Instantiate mapChart
        self.mapChart = submarine.maps(self.idName, self.className, self.vizOptions);

        // Add a layer for everything, to keep the example simple
        self.getHeatmap(self.dataFile);

        // And now, animate between the two layers
        var count = 0;
        function myTimeoutFunction()
        {
            count++;
            if(count%2==0)
            {
                self.mapChart.removeHeatmapLayer('first');
                self.mapChart.showHeatmapLayer('second');
            }
            else
            {
                self.mapChart.removeHeatmapLayer('second');
                self.mapChart.showHeatmapLayer('first');
            }
        }

        setInterval(myTimeoutFunction, 500);
    });

    return self;
};
