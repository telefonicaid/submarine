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

    self.isLoadedConfig = function(config)
    {
        var loaded = true;

        for (var type in config)
        {
            for (var entry in config[type])
            {
                if(config[type][entry]['content']==null)
                {
                    loaded = false;
                }
            }
        }

        return loaded;
    };

    self.getAFile = function (file, type, entry, config, callBack)
    {
        d3.json(self.baseJUrl+file, function(myData){

            if(myData!=null)
            {
                config[type][entry]['content'] = myData;

                if (self.isLoadedConfig(config))
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

    self.getFiles = function(config, callBack)
    {
        for(var type in config)
        {
            for(var entry in config[type])
            {
                self.getAFile(config[type][entry]['file'], type, entry, config,callBack);
            }
        }
    };

    // ... On document ready ...
    $(document).ready(function()
    {
        // Layout w/ radio button
        self.optionsHtml = {'heatmaps': "", 'markers': "", 'polygons': ""};
        self.dimension = {};
        self.visibility = {};

        for(var option in self.optionsHtml)
        {
            var first = true;

            for(var key in self.config[option])
            {
                if(first)
                {
                    self.optionsHtml[option]+= '<option selected value="' + key +'">' + key + "</option>";
                    first = false;

                    self.dimension[option] = key;
                    self.visibility[option] = true;
                }
                else
                {
                    self.optionsHtml[option]+= '<option value="' + key +'">' + key + "</option>";
                }
            }
        }

        var optionsHtml =
            '<div class="infoTitle">Opciones</div>'+
                '<div class="infoContent">'+
                    '<span class="optionsLegend">Capa de heatmap</span>'+
                        '<div>' +
                            '<form style="padding-top:10px;">'+
                            '<select id="dimensionHeat" >'+ self.optionsHtml.heatmaps +
                            '</select>' +
                            '</form>'+
                        '</div>'+
                '</div>'+
                '<div class="infoContent">'+
                    '<span class="optionsLegend">Capa de markers</span>'+
                        '<div>' +
                            '<form style="padding-top:10px;">'+
                            '<select id="dimensionMarkers" >'+ self.optionsHtml.markers +
                            '</select>' +
                            '</form>'+
                        '</div>'+
                '</div>'+
                '<div class="infoContent">'+
                    '<span class="optionsLegend">Capa de poligonos</span>'+
                        '<div>' +
                            '<form style="padding-top:10px;">'+
                            '<select id="dimensionPolygons" >'+ self.optionsHtml.polygons +
                            '</select>' +
                            '</form>'+
                        '</div>'+
                '</div>'+
                '<div class="infoContentHorizontal">'+
                    '<span class="optionsLegend">Visibilidad</span>'+
                        '<div>' +
                            '<form style="padding-top:10px;">'+
                            '<input id="visibilityHeat" type="checkbox" value="heatmaps" checked> Heatmap'+
                            '<input id="visibilityMarkers" type="checkbox" value="markers" checked> Markers'+
                            '<input id="visibilityPolygons" type="checkbox" value="polygons" checked> Polygons'+
                            '</form>'+
                        '</div>'+
                '</div>'+
            '</div>';

        self.optionsBox = d3.select("body").append("div")
            .attr("id","optionsBox")
            .html(optionsHtml)
            .attr("class", "optionsBox");

        $('#dimensionHeat').change(function(){

            self.dimension.heatmaps = this.value;

            if(self.visibility.heatmaps)
            {
                for (var layer in self.config['heatmaps'])
                {

                    if(layer==self.dimension['heatmaps'])
                    {
                        self.mapChart.showHeatmapLayer(layer);
                    }
                    else
                    {
                        self.mapChart.removeHeatmapLayer(layer);
                    }
                }
            }
        });

        $('#dimensionMarkers').change(function(){

            self.dimension.markers = this.value;

            if(self.visibility.markers)
            {
                for (var layer in self.config['markers'])
                {
                    if(layer==self.dimension['markers'])
                    {
                        self.mapChart.showMarkerLayer(layer);
                    }
                    else
                    {
                        self.mapChart.removeMarkerLayer(layer);
                    }
                }
            }
        });

        $('#dimensionPolygons').change(function(){

            self.dimension.polygons = this.value;

            if(self.visibility.polygons)
            {

                for (var entry in self.config['polygons'])
                {
                    if(entry==self.dimension['polygons'])
                    {
                        self.mapChart.layerAttr(entry,"visibility", "visible");
                    }
                    else
                    {
                        self.mapChart.layerAttr(entry,"visibility", "hidden");
                    }
                }
            }
        });

        $('#visibilityHeat').change(function(){

            self.visibility.heatmaps = $(this).attr("checked") ? true : false;

            if($(this).attr("checked"))
            {
                    self.mapChart.showHeatmapLayer(self.dimension['heatmaps']);
            }
            else
            {
                    self.mapChart.removeHeatmapLayer(self.dimension['heatmaps']);
            }
        });

        $('#visibilityMarkers').change(function(){

            self.visibility.markers = $(this).attr("checked") ? true : false;

            if($(this).attr("checked"))
            {
                 self.mapChart.showMarkerLayer(self.dimension['markers']);
            }
            else
            {
                 self.mapChart.removeMarkerLayer(self.dimension['markers']);
            }
        });

        $('#visibilityPolygons').change(function(){

            self.visibility.polygons = $(this).attr("checked") ? true : false;

            if($(this).attr("checked"))
            {
                self.mapChart.layerAttr(self.dimension['polygons'],"visibility", "visible");
            }
            else
            {
                self.mapChart.layerAttr(self.dimension['polygons'],"visibility", "hidden");
            }
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
            'polygon': function (d,i,layerName) { console.log(layerName); return d.properties.cartodb_id;}
        };

        // Insert callback maps onto vizOptions
        self.vizOptions['callBackDict'] = self.callBacks;
        self.vizOptions['idCallBackDict'] = self.idCallBacks;

        // Instantiate mapChart
        self.mapChart = submarine.maps(self.idName, self.className, self.vizOptions);

        self.getFiles(self.config, function(){

                    for (var entry in self.config['polygons'])
                    {
                        // Add layer name 'entry'
                        self.mapChart.addLayer(entry);

                        // Choose visibility based on self.dimension
                        if(entry==self.dimension['polygons'])
                        {
                            self.mapChart.layerAttr(entry,"visibility", "visible");
                        }
                        else
                        {
                            self.mapChart.layerAttr(entry,"visibility", "hidden");
                        }

                        // Finally render stored geoJSON filled by getAFile
                        self.mapChart.render(self.config['polygons'][entry]['content'],entry);
                    }

                    for (var entry in self.config['heatmaps'])
                    {
                            var layer = entry;
                            var geoJ = self.config['heatmaps'][layer]['content'];

                            self.mapChart.initHeatmapLayer(layer,self.config['heatmaps'][layer]['options'], geoJ, self.config['heatmaps'][layer]['heatValue']);

                            if(layer==self.dimension['heatmaps'])
                            {
                                self.mapChart.showHeatmapLayer(layer);
                            }
                    }

                    // Load marker definitions and render markers
                    d3.json(self.baseJUrl+self.markerDefFile, function(defData){

                        if(defData!=null)
                        {
                            // Init markerdata
                            self.mapChart.initMarkers(defData);

                            for(var layer in self.config['markers'])
                            {
                                var geoJ = self.config['markers'][layer]['content'];

                                if(self.config['markers'][layer]['clustering'])
                                {
                                    self.mapChart.initMarkerLayerCluster(layer,geoJ,
                                                                         self.config['markers'][layer]['iconSelect'],
                                                                         self.config['markers'][layer]['tooltipContent'],
                                                                         self.config['markers'][layer]['options']);
                                }
                                else
                                {
                                    self.mapChart.initMarkerLayer(layer,geoJ,
                                                                  self.config['markers'][layer]['iconSelect'],
                                                                  self.config['markers'][layer]['tooltipContent'],
                                                                  self.config['markers'][layer]['options']);
                                }
                                if(layer == self.dimension['markers'])
                                {
                                    self.mapChart.showMarkerLayer(layer);
                                }
                            }
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
