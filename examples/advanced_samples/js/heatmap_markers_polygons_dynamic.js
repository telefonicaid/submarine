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
    self.dimension = {};

    // logging function w/level
    self.myLog = function(myString, level){
        if ((self.debugLevel!=0)&&(level<=self.debugLevel))
        {
            console.log(myString);
        }
    };

    self.getHeatValue = function(feature){
        return 1;
    };

    self.getAFile = function (file, key, fileStack, numKeys, callBack)
    {
        d3.json(self.baseJUrl+file, function(myData){

            if(myData!=null){

                fileStack[key] = myData;

                if(Object.keys(fileStack).length == numKeys)
                {
                    callBack();
                }
            }
            else
            {
                self.myLog("Could not load file: "+self.baseJUrl+file,1);
            }
        });
    };

    self.getFiles = function(fileNames, callBack){

        self.myFiles = {};
        self.layers = [];

        for(var key in fileNames)
        {

            var fileName = fileNames[key];
            self.layers.push(key);
            self.getAFile(fileName, key, self.myFiles, Object.keys(fileNames).length, callBack);
        }
    };

    // ... On document ready ...
    $(document).ready(function()
    {
        // Layout w/ radio button
        var radioHtml="";
        var first = true;

        for(var key in self.dataFiles)
        {
            if(first)
            {
                radioHtml+= '<option selected value="' + key +'">' + key + "</option>";
                first = false;
                self.dimension.heat = key;
                self.dimension.markers = key;
            }
            else
            {
                radioHtml+= '<option value="' + key +'">' + key + "</option>";

            }
        }

        var optionsHtml =
            '<div class="infoTitle">Opciones</div>'+
                '<div class="infoContent">'+
                    '<span class="optionsLegend">Capa de heatmap</span>'+
                        '<div>' +
                            '<form style="padding-top:10px;">'+
                            '<select id="dimensionHeat" >'+ radioHtml +
                            '</select>' +
                            '</form>'+
                        '</div>'+
                '</div>'+
                '<div class="infoContent">'+
                    '<span class="optionsLegend">Capa de markers</span>'+
                        '<div>' +
                            '<form style="padding-top:10px;">'+
                            '<select id="dimensionMarkers" >'+ radioHtml +
                            '</select>' +
                            '</form>'+
                        '</div>'+
                '</div>'+
            '</div>';

        self.optionsBox = d3.select("body").append("div")
            .attr("id","optionsBox")
            .html(optionsHtml)
            .attr("class", "optionsBox");


        $('#dimensionHeat').change(function(){
            self.dimension.heat = this.value;

            for(var i=0; i < self.layers.length; i++)
            {
                var layer = self.layers[i];
                self.mapChart.removeHeatmapLayer(layer);
            }

            self.mapChart.showHeatmapLayer(self.dimension.heat);
        });

        $('#dimensionMarkers').change(function(){
            self.dimension.markers = this.value;

            for(var i=0; i < self.layers.length; i++)
            {
                var layer = self.layers[i];
                self.mapChart.removeMarkerLayer(layer);
            }

            self.mapChart.showMarkerLayer(self.dimension.markers);
        });

        self.colorScale = d3.scale.linear().range(["#d8b365","#f5f5f5","#5ab4ac"]).domain([0,50,150.0]).clamp(true);

        // submarine.maps callbacks
        self.callBacks = {
                        'polygon':{
                            'enter': function(selection){
                                    selection.attr("d",self.mapChart.path).style("fill", function(d,i){
                                            return self.colorScale(d.properties.indice);
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

        self.idCallBacks =
        {
            'polygon': function (d,i) { return d.properties.cartodb_id;}
        };

        // Insert callback maps onto vizOptions
        self.vizOptions['callBackDict'] = self.callBacks;
        self.vizOptions['idCallBackDict'] = self.idCallBacks;

        // Instantiate mapChart
        self.mapChart = submarine.maps(self.idName, self.className, self.vizOptions);

        self.getFiles(self.dataFiles, function(){

            // Now, in self.myFiles: key --> layer; content --> geojson
            for(var key in self.myFiles)
            {
                var layer = key;
                var geoJ = self.myFiles[layer];

                self.mapChart.initHeatmapLayer(layer,{
					// radius could be absolute or relative
					// absolute: radius in meters, relative: radius in pixels
					radius: { value: self.heatRadii[layer], absolute: true },
			        //radius: { value: 20, absolute: false },
					opacity: 0.8,
					gradient: {
						0.45: "rgb(0,0,255)",
						0.55: "rgb(0,255,255)",
						0.65: "rgb(0,255,0)",
						0.95: "yellow",
						1.0: "rgb(255,0,0)"
					}
				    }, geoJ, self.getHeatValue);
            }

            // Load marker definitions and render markers
            d3.json(self.baseJUrl+self.markerDefFile, function(defData){

                if(defData!=null)
                {
                    // Init markerdata
                    self.mapChart.initMarkers(defData);

                    for(var key in self.myFiles)
                    {
                        var layer = key
                        var geoJ = self.myFiles[layer];

                        self.mapChart.initMarkerLayerCluster(layer,geoJ, function(d,i){
                            if(layer=="cultura")
                            {
                                return "book";
                            }
                            else
                            {
                                return "default";
                            }
                        }, function(d,i){

                                var catInfo = [];

                                for(var j=0;j< d.properties.cats.length;j++)
                                {
                                    catInfo.push(d.properties.cats[j]);
                                }

                                return d.properties.name + "</br>" + d.properties.address + "</br>" + catInfo.join(", ");
                            }
                            , {showCoverageOnHover: false});
                    }

                    // Load polygon geojson
                    d3.json(self.baseJUrl+self.polFile, function(polData){

                        if(polData!=null)
                        {
                            self.polData = polData;

                            // add layer and render polygons...
                            // self.mapChart.addLayer("polygons");
                            // self.mapChart.render(self.polData,"polygons");

                            // And finally render heatmap + markers
                            self.mapChart.showMarkerLayer(self.dimension.markers);
                            self.mapChart.showHeatmapLayer(self.dimension.heat);

                        }
                        else
                        {
                            self.myLog("Could not load file: "+self.baseJUrl+self.polFile,1);
                        }
                    });
                }
                else
                {
                    self.myLog("Could not load file: "+self.baseJUrl+self.markerDefFile,1);
                }
            });
        });
    });

    return self;
};
