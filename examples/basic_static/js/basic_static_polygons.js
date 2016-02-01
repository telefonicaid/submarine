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

    // Color scale
    self.colorScale = d3.scale.linear().range(["#FFF","#00F"]).domain([0.4,1]).clamp(true);

    // submarine.maps callbacks
    self.callBacks = {
                    'polygon':{
                        'enter': function(selection){
                                selection.attr("d",self.mapChart.path).style("fill", function(d,i){
                                        return self.colorScale(self.mapData[d.id]);
                                    });
                        },

                        'zoom': function(selection){
                                selection.attr("d",self.mapChart.path);
                        },

                        'update': function(selection){
                                selection.attr("d",self.mapChart.path);
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
        d3.json(self.baseJUrl+self.dataFile, function(mapData){

            if(mapData!=null){
               self.mapData = mapData;
               self.renderFile(self.geoFile, "all");
            }
            else{
                self.myLog("Could not load file: "+self.baseJUrl+self.geoFile,1);
            }
        });
    });

    return self;
};
