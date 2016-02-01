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

        if ((self.debugLevel!=0)&&(level<=self.debugLevel)){
            console.log(myString);
        }
    };


    // Renders a file into a map viz layer
    self.renderMarkers = function(fileName,layerName){

        d3.json(self.baseJUrl+fileName, function(markerData){

            if(markerData!=null) {

                self.mapChart.showMarkerLayer("layer1");

                    self.mapChart.initMarkerLayer("layer1",markerData,
                        function(d,i){
                            return "redMarker";
                        }, function(d,i){

                            var catInfo = [];
                            for(var j=0;j< d.properties.cats.length;j++) {
                                catInfo.push(d.properties.cats[j]);
                            }

                            return d.properties.name + "</br>" + d.properties.address + "</br>" + catInfo.join(", ");
                        },
                        { showCoverageOnHover: false }
                    );

                // self.mapChart.removeMarkerLayer("layer1");
                self.mapChart.showMarkerLayer("layer1");
            }
            else {
                self.myLog("Could not load file: "+self.baseJUrl+self.dataFile,1);
            }
        });
    };


    // ... On document ready ...
    $(document).ready(function()
    {
        // Insert callback maps onto vizOptions
        self.vizOptions['callBackDict'] = {};

        // Instantiate mapChart
        self.mapChart = submarine.maps(self.idName, self.className, self.vizOptions);

        // Load marker definitions and render markers
        d3.json(self.baseJUrl+self.markerDefFile, function(defData){

            if(defData!=null)
            {
                // Init markerdata
                self.mapChart.initMarkers(defData);

                // Render dataFile
                self.renderMarkers(self.dataFile, "all");
            }
            else
            {
                self.myLog("Could not load file: "+self.baseJUrl+self.markerDefFile,1);
            }
        });

    });

    return self;
};
