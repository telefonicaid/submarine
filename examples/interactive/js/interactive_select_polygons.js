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
submarine.controller.interactiveMap = function(idName, className, options){

    // Instance reference
    var self = {};

    // Copy options object to self
    for (key in options){
        self[key] = options[key];
    }

    self.idName = idName;
    self.className = className;
    self.parentSelect = "#"+self.idName;

    // Dimension control variable, initially set to pollution ("P" on 'dimension' select box values)
    self.dimension = "P";

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


    // Color scales
    self.colorScalePollution = d3.scale.linear().range(["#FFF","#00F"]).domain([0.4,1]).clamp(true);
    self.colorScaleCrime = d3.scale.linear().range(["#FFF","#F00"]).domain([0,0.5]).clamp(true);

    // submarine.maps callbacks
    self.callBacks = {
                    'polygon':{
                        'enter': function(selection){
                                selection.attr("d",self.mapChart.path).style("fill", function(d,i){

                                        // Choose color scale and data based on combo select
                                        if(self.dimension=="P"){
                                            return self.colorScalePollution(self.mapDataPollution[d.id]);
                                        }
                                        else{
                                            if(self.dimension=="C")
                                            {
                                                return self.colorScaleCrime(self.mapDataCrime[d.id]);
                                            }
                                            else
                                            {
                                                return "#000";
                                            }
                                        }

                                    });
                        },

                        'zoom': function(selection){
                                selection.attr("d",self.mapChart.path);
                        },

                        'update': function(selection){

                                selection.attr("d",self.mapChart.path).style("fill", function(d,i){

                                        // Choose color scale and data based on combo select

                                        if(self.dimension=="P"){

                                            return self.colorScalePollution(self.mapDataPollution[d.id]);
                                        }
                                        else{

                                            if(self.dimension=="C"){
                                                return self.colorScaleCrime(self.mapDataCrime[d.id]);

                                            }
                                            else{

                                                return "#000";
                                            }
                                        }
                                    });
                        }
                    }
    };

    // ... On document ready ...
    $(document).ready(function()
    {

        // Html layout with select box for pollution/crime selection
        var optionsHtml =
            '<div class="infoTitle">Options</div>'+
                '<div class="infoContent">'+
                    '<span class="optionsLegend">Select dimension</span>'+
                        '<form>'+
                        '<select id="dimension">'+
                            '<option selected value="P">Pollution</option>'+
                            '<option value="C">Crime</option>'+
                        '</select>' +
                        '</form>'+
                '</div>'+
            '</div>';

        // Insert options into html
        self.optionsBox = d3.select("body").append("div")
            .attr("id","optionsBox")
            .html(optionsHtml)
            .attr("class", "optionsBox");

        // Bing change event to combo change
        $('#dimension').change(function(){
            self.dimension = this.value;
            self.mapChart.updateValues(["all"]);
        });

        // Insert callback maps onto vizOptions
        self.vizOptions['callBackDict'] = self.callBacks;

        // Instantiate mapChart
        self.mapChart = submarine.maps(self.idName, self.className, self.vizOptions);

        // Add a layer for everything, to keep the example simple
        self.mapChart.addLayer("all");

        // Render geoFile, loading first data from pollution & crime. Note the nested callbacks
        d3.json(self.baseJUrl+self.dataFilePollution, function(mapDataPollution){

            if(mapDataPollution!=null){

               self.mapDataPollution = mapDataPollution;

                d3.json(self.baseJUrl+self.dataFileCrime, function(mapDataCrime){

                    if(mapDataCrime!=null)
                    {
                        self.mapDataCrime = mapDataCrime;
                        self.renderFile(self.geoFile, "all");
                    }
                    else
                    {
                        self.myLog("Could not load file: "+self.baseJUrl+self.dataFileCrime,1);
                    }
                });
            }
            else{
                self.myLog("Could not load file: "+self.baseJUrl+self.dataFilePollution,1);
            }
        });
    });
    return self;
};
