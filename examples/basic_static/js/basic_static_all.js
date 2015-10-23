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

    // logging function w/level
    self.myLog = function(myString, level){

        if ((self.debugLevel != 0) && (level <= self.debugLevel)) {
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


    // submarine.maps callbacks
    self.callBacks = {
                    'point':{
                        'zoom':function(selection){
                                 // See 3rd paragraph of http://bost.ocks.org/mike/transition/#per-element
                                selection
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0]})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1]})
                                    .attr("r",function(d) { return self.mapChart.getRealPixels(d.properties.radius,d.geometry.coordinates[1]);})
                                .transition().duration(0)
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0]})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1]})
                                    .attr("r",function(d) { return self.mapChart.getRealPixels(d.properties.radius,d.geometry.coordinates[1]);});
                        },

                        'update': function(selection){
                                selection
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0]})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1]})
                                    .attr("r",function(d) { return self.mapChart.getRealPixels(d.properties.radius,d.geometry.coordinates[1]);})
                                .transition().duration(0)
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0]})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1]})
                                    .attr("r",function(d) { return self.mapChart.getRealPixels(d.properties.radius,d.geometry.coordinates[1]);});
                        },

                        'enter': function(selection){
                                selection
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0]})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1]})
                                    .attr("r",function(d) { return self.mapChart.getRealPixels(d.properties.radius,d.geometry.coordinates[1]);})
                                    .style("opacity",0.0)
                                .transition().duration(self.transTime)
                                    .style("opacity",1.0);
                        }
                    },

                    'polygon':{

                        'enter': function(selection){
                                selection.attr("d",self.mapChart.path).style("opacity",0.0).transition().duration(self.transTime).style("opacity",0.5);
                        },

                        'zoom': function(selection){
                                selection.attr("d",self.mapChart.path);
                        },

                        'update': function(selection){
                                selection.attr("d",self.mapChart.path);
                        }

                    },

                    'path':{

                        'zoom': function(selection){
                                selection.attr("d",self.mapChart.path).transition().duration(0).attr("d",self.mapChart.path);
                        },

                        'update': function(selection){
                                selection.attr("d",self.mapChart.path).transition().duration(0).attr("d",self.mapChart.path);
                        },
                        'enter': function(selection){
                                selection.attr("d",self.mapChart.path).style("opacity",0.0).transition().duration(self.transTime).style("opacity",0.5);
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
