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
submarine.controller.basicDynamic = function(idName, className, options){

    // Instance reference
    var self = {};

    // Copy options object to self
    for (key in options){
        self[key] = options[key];
    }

    self.idName = idName;
    self.className = className;
    self.parentSelect = "#"+self.idName;
    self.sliderFrame = 0;

    // InitialDate
    self.initMoment = moment(self.dateBegin, "YYYYMMDD");

    self.nowMoment = self.initMoment.clone();
    self.dateLookup = self.dateBegin;

    // Radius scale
    self.radiusSize = 200;
    self.rScale = d3.scale.sqrt().domain([0,300]).range([0,500]);

    // Component dimension
    self.dimension = "SO2";

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

    self.getSizeValue = function(d,i)
    {
        if((self.mapData[self.dateLookup]) && (self.mapData[self.dateLookup][d.id]))
        {
            var value = self.mapData[self.dateLookup][d.id][self.dimension];

            if(!isNaN(value))
            {
                return self.sizeScales[self.dimension](value);
            }
            else
            {
                return 0.5;
            }
        }
        else
        {
            return 0.5;
        }
    };

    self.getValue = function(d,i)
    {
        if((self.mapData[self.dateLookup]) && (self.mapData[self.dateLookup][d.id]))
        {
            var value = self.mapData[self.dateLookup][d.id][self.dimension];

            if(!isNaN(value))
            {
                return value;
            }
            else
            {
                return -10000;
            }
        }
        else
        {
            return -10000;
        }
    };

    self.isThereValue = function(d,i)
    {
        if((self.mapData[self.dateLookup]) && (self.mapData[self.dateLookup][d.id]))
        {
            var value = self.mapData[self.dateLookup][d.id][self.dimension];

            if(!isNaN(value))
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        else
        {
            return false;
        }
    };

    // submarine.maps callbacks
    self.callBacks = {
                    'point':{
                        'zoom':function(selection){
                                selection.transition().duration(0)
                                    .attr("cx",function(d) {return self.mapChart.project(d.geometry.coordinates)[0];})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1];})
                                    .attr("r",function(d,i) {
                                        return self.mapChart.getRealPixels(self.getSizeValue(d,i)*self.radiusSize, d.geometry.coordinates[1]);
                                    });
                        },

                        'enter': function(selection){
                                selection
                                    .attr("cx",function(d) {return self.mapChart.project(d.geometry.coordinates)[0];})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1];})
                                    .style("fill", function(d,i){
                                        return self.isThereValue(d,i)? self.valueColor:self.notValueColor;
                                        })
                                    .attr("r",function(d,i) {
                                        return self.mapChart.getRealPixels(self.getSizeValue(d,i)*self.radiusSize, d.geometry.coordinates[1]);
                                    });

                        },
                        'update': function(selection){
                                selection.transition().ease("linear").duration(self.transTime)
                                .style("fill", function(d,i){return self.isThereValue(d,i)? self.valueColor:self.notValueColor;})
                                .attr("r",function(d,i) {
                                    return self.mapChart.getRealPixels(self.getSizeValue(d,i)*self.radiusSize, d.geometry.coordinates[1]);
                                });
                        },
                        'over': function(d,i)
                        {
                            var myHtml ="Estacion num "+ d.id+": "+ d.properties.name;
                            var value = self.getValue(d,i);

                            value = value!=-10000? value: "No hay dato";
                            myHtml+="</br>Valor de "+ self.dimension+" : "+ value;
                            self.mapChart.tooltip.html(myHtml);
                            self.mapChart.tooltip.style("opacity",1.0);
                        },
                        'out': function(d,i)
                        {
                            self.mapChart.tooltip.style("opacity",0.0);
                        }
                    }
    };

    // ... On document ready ...
    $(document).ready(function()
    {

        // Html layout with slider
        var optionsHtml =
            '<div class="infoTitle">Opciones</div>'+
                '<div class="infoContent" style="width:300px;float:left;">'+
                    '<span class="optionsLegend" style="float:right">Fecha</span>'+
                    '<div id="play" class="play"></div>'+
                    '<div class="layoutSlider"><input id="SliderSingle" type="slider" name="time" value="0" style="display: none;"></div>'+
                '</div>'+
                '<div class="infoContent" style="width:100px;float:left;">'+
                    '<span class="optionsLegend" style="float:right">Componente</span>'+
                        '<div>' +
                            '<form style="clear:both;padding-top:20px;">'+
                            '<select id="dimension" style="float:right;">'+
                                '<option selected value="SO2">SO2</option>'+
                                '<option value="PM10">PM10</option>'+
                                '<option value="NO2">NO2</option>'+
                                '<option value="CO">CO</option>'+
                                '<option value="O3">O3</option>'+
                                '<option value="SH2">SH2</option>'+
                            '</select>' +
                            '</form>'+
                        '</div>'+
                '</div>'+
            '</div>';

        self.optionsBox = d3.select("body").append("div")
            .attr("id","optionsBox")
            .html(optionsHtml)
            .attr("class", "optionsBox");

        $('#dimension').change(function(){
            self.dimension = this.value;
            self.mapChart.updateValues(["all"]);
        });

        // Slider callback and declaration
        self.changeSliderCallBack = function (value){
            self.sliderFrame = value;
            var addedDays = value;
            var myMoment = self.initMoment.clone().add('days',addedDays);
            self.nowMoment = myMoment.clone();
            self.dateLookup = myMoment.format("YYYYMMDD");
            self.mapChart.updateValues(["all"]);
        };

        self.mySlider = submarine.extras.genericSlider({
            sliderId: 'SliderSingle',
            playId: 'play',
            from: 0,
            to: ((self.numDays)-1),
            pathToImages: self.pathToImages,
            step: 1,
            interval: self.timerInterval,
            skin: "round_plastic",
            calculate: function( value ){
                var addedDays = value;
                var myMoment = self.initMoment.clone().add('days',addedDays);
                return myMoment.format("DD/MM/YYYY, dddd");
            },
            callback: self.changeSliderCallBack
        });

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

                    self.myLog("Could not load file: "+self.baseJUrl+self.mapData,1);
                }
        });
    });

    return self;
};
