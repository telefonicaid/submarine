var submarine = submarine || {'version':0.9.0, 'controller':{}, 'viz': {} ,'extras': {} };

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
    self.renderFile = function(fileName,layerName){

        d3.json(self.baseJUrl+fileName, function(mapData){

            if(mapData!=null){
               self.mapChart.render(mapData,layerName);

            }
            else{
                self.myLog("Could not load file: "+self.baseJUrl+self.dataFile,1);
            }
        });
    };

    // submarine_maps callbacks
    self.callBacks = {
                    'point':{
                        'zoom':function(selection){
                                selection
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0]})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1]})
                                    .attr("r",function(d) { return self.mapChart.getRealPixels(self.pointRadius ,d.geometry.coordinates[1]);});

                        },

                        'enter': function(selection){
                                selection
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0]})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1]})
                                    .style("fill", function(d){ return self.colorScale(d.properties.state)})
                                    .attr("r",function(d) { return self.mapChart.getRealPixels(self.pointRadius ,d.geometry.coordinates[1]);});
                        }
                    }
    };

    // ... On document ready ...
    $(document).ready(function()
    {
        // Insert callback maps onto vizOptions
        self.vizOptions['callBackDict'] = self.callBacks;

        // Instantiate mapChart
        self.mapChart = submarine.maps(self.idName, self.className, self.vizOptions);

        // Add a layer for everything, to keep the example simple
        self.mapChart.addLayer("all");

        // Render dataFile
        self.renderFile(self.dataFile, "all");

    });

    return self;
};
