chartRender={
    width:350,
    height:350,
    currentRender:null,
    displayBoard:"#displayBoard",
    //给定渲染数据，渲染类型，渲染参数和渲染画布进行画布渲染;
    setCurrentRender:function(type){this.currentRender=this[type]},
    updateChart:function(){
        var options={};
        $(".options-widget").each(function(){
                console.log("name:"+$(this).attr("name")+"-value:"+$(this).attr("value"));
                 options[$(this).attr("name")]=$(this).attr("value");
            });
        $("#svg1").empty();
        nv.addGraph(function(){
            var chart=chartRender.currentRender.getChart()
            .width(chartRender.width)
            .height(chartRender.height);
            var finalData=chartRender.currentRender.update(options);
            d3.select("#svg1")
                .datum(finalData)
                .transition().duration(1200)
                .attr('width', chartRender.width)
                .attr('height', chartRender.height)
                .call(chart);
        //$("#footer").text(jsonToString(finalData)); 
            $("#popChart").data("plotInfo",{chart:chart,data:finalData});
            return chart
        })
        
    },
    initOptionsBoard:function(){
        var board=$("#optionsBoard");
        board.empty();
        //console.log("type:"+this.currentRender.type+" ifFun:"+typeof this.currentRender.getOptionsBoard);
        var widgets=this.currentRender.createOptionsBoard.split(",");
        for(var i=0;i<widgets.length;i++)
            {
                var widgetType=widgets[i];
                this.optionsWidgetFactory(board,this.currentRender.plotData.plotInfo[widgetType])[widgetType]();   
            }
        //this.currentRender.createOptionsBoard(board);
        //board.append("<hr/>");
        //$(".options-widget").on($(this).attr("onEvent"),function(){chartRender.updateChart()});
        chartRender.updateChart();  
    },
    optionsWidgetFactory:function(container,info){//label min max value name tipFormatter
            var table=$("<table></table>").appendTo(container);
            var tr=$("<tr></tr>").appendTo(table);
            $("<td></td>").text(info.label).appendTo(tr);
            var td=$("<td></td>").appendTo(tr);
            var onChange=function(value){
                    $(this).attr("value",value);
                    chartRender.updateChart();
            }
            //console.log("name-"+info.name);
            var silder=function(){
                $("<div class='options-widget'></div>").appendTo(td)
                .slider({
                width:270,
                height:5,
                rule:[info.data.min,'|',Math.floor((info.data.max+info.data.min)/2),'|',info.data.max],
                showTip:true,
                onSlideEnd:function(value){onChange(value)}  
                }).slider(info.data).attr({name:info.name,value:info.data.value})
            };
            var combobox=function(){
                var value=info.data[0].value;
                for(var i=0;i<info.data.length;i++){
                    if(typeof info.data[i].selected=="undefined")continue;
                    value=info.data[i].value;
                    break;
                }
                $("<input></input").appendTo(td)
                .combobox({
                data:info.data,
                textField:"text",
                valueField:"value",
                onSelect:function(record){
                    $(this).attr("value",record.value);
                    chartRender.updateChart();
                }
                }).attr({name:info.name,value:value,"class":"options-widget"})
            }
        return {slider:silder,combobox:combobox}    
        },
    pie:{
        name:"饼图",
        chart:null,
        plotData:null,
        createOptionsBoard:"slider",
        getChart:function(){
            if(this.chart!=null)return this.chart;
            var chart = nv.models.pieChart()
            .x(function(d) { return d.key })
            .y(function(d) { return d.value })
        //.showLabels(false)
            .values(function(d) { return d })
            .color(d3.scale.category10().range())
            
            chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });
            this.chart=chart;
            return chart;
        },
        update:function(args){
            var size=parseInt(args.firstN);
            return [this.plotData.data.slice(0,size)];
        }
        
    },   
    bar:{
        name:"直方图",
        chart:null,
        plotData:null,
        createOptionsBoard:"combobox,slider",
        getChart:function(){
            if(this.chart!=null)return this.chart;
            var chart = nv.models.linePlusBarChart()
          .margin({top: 30, right: 60, bottom: 50, left: 70})
          .x(function(d) {return d[0] })
          .y(function(d) { return d[1] })
          .color(d3.scale.category10().range());

            chart.xAxis
        .showMaxMin(false);
        
        //console.log("xFormat:"+typeof this.plotData.plotInfo.xFormat);
        chart.bars.forceY([0]);

        nv.utils.windowResize(chart.update);
        this.chart=chart;

        return chart;

        },
        update:function(options){
            var duration=options.duration;
            var to=options.firstN;
            var data=this.plotData.data;
            var start=this.plotData.plotInfo.start;
            var valueType=typeof data[0].key=="number"?"key":"value";
            //console.log("startDate:"+new Date(start).toString())
            var newData=data.slice(0,to).map(function(d){
                //console.log("time:"+new Date(d.key).toString())
                var end=d[valueType];
                var span=Math.floor((end-start)/duration)*duration;
                    return {key:span,value:valueType=="key"?d.value:1};
            });
            var values=diggerFactory.wordCount(newData,"key");
            values=values.map(function(d){return [d.key,d.value];});
            this.chart.xAxis.tickFormat(this.plotData.plotInfo.xFormat);
            //console.log("柱状图数据:"+jsonToString(values))
            return [
                {
                    key:"柱状图",bar:true,values:values
                },
                {
                    key:"线图",values:values
                }
            ]
        }
    
    }
};
chartRender.multiBarHorizontalChart={
    name:"排行榜",
        chart:null,
        plotData:null,
        createOptionsBoard:"slider",
        getChart:function(){
            if(this.chart!=null)return this.chart;
            var chart = nv.models.multiBarHorizontalChart()
            .x(function(d) { return d.key })
            .y(function(d) { return d.value })
            .showValues(true)
            .tooltips(false)
            .showControls(false);
            chart.yAxis.tickFormat(d3.format('f'));
            this.chart=chart;
            return chart;
        },
        update:function(args){
            var size=parseInt(args.firstN);
            var values=this.plotData.data.slice(0,size);
            var marginLeft=values.map(function(d){return d.key.length}).max()*12;
            this.chart.margin({left:marginLeft});
            var finalData=[{key:"排行榜",values:values}]; 
            return finalData;
        }
};
chartRender.scatterChart={
    name:"点状图",
    chart:null,
/*
    data:[{key:***,values[,,,]},]
    plotInfo:
        combobox:[{text:"a-b",value:"0-1"}]
*/
    plotData:null,
    createOptionsBoard:"combobox",
    getChart:function(){
            if(this.chart!=null)return this.chart;
            var chart = nv.models.scatterChart()
                .showDistX(true)
                .showDistY(true)
                .color(d3.scale.category10().range());

        chart.xAxis.tickFormat(d3.format('f'));
        chart.yAxis.tickFormat(d3.format('f'));
        nv.utils.windowResize(chart.update);
        this.chart=chart;
        return chart;
        },
    update:function(options){
        var vs=options.vs;
        var combox=this.plotData.plotInfo.combobox.data;
        var group=$.grep(combox,function(d){return d.value==vs})[0].text;
        vs=vs.match(/\d+/g).map(function(d){return parseInt(d)});
        var data=this.plotData.data;
        var finalData={key:group};
        finalData.values=data.map(function(d){
            return{x:d.values[vs[0]],y:d.values[vs[1]],size:1}
        })
        //console.log("finalData:"+jsonToString(finalData))
        return [finalData];
    }
    
}
function jsonToString (obj){   
        var THIS = this;    
        switch(typeof(obj)){   
            case 'string':   
                return '"' + obj.replace(/(["\\])/g, '\\$1') + '"';   
            case 'array':   
                return '[' + obj.map(THIS.jsonToString).join(',') + ']';   
            case 'object':   
                 if(obj instanceof Array){   
                    var strArr = [];   
                    var len = obj.length;   
                    for(var i=0; i<len; i++){   
                        strArr.push(THIS.jsonToString(obj[i]));   
                    }   
                    return '[' + strArr.join(',') + ']';   
                }else if(obj==null){   
                    return 'null';   
  
                }else{   
                    var string = [];   
                    for (var property in obj) string.push(THIS.jsonToString(property) + ':' + THIS.jsonToString(obj[property]));   
                    return '{' + string.join(',') + '}';   
                }   
            case 'number':   
                return obj;   
            case false:   
                return obj;   
        }   
    }
//init actions
function doDig(diggerIndex,chartType){
    var digger=diggerFactory[diggerFactory.ore.pageType.type][diggerIndex];
    if(chartType==null)chartType=digger.type.split(",")[0];
    chartRender.setCurrentRender(chartType);
    var result=digger.digger();
    chartRender.currentRender.plotData={data:result.data,plotInfo:result.plotInfo[chartType]};
    //console.log("plotData"+jsonToString(chartRender.currentRender.plotData))
    chartRender.initOptionsBoard();
    $("#chart-panel").panel("setTitle",digger.name);
}
function initActionBoard(){
    var actionID="#actionBoard";
    var onClick=function(){
            var diggerIndex=$(this).attr("diggerIndex");
            var chartType=$(this).attr("chartType");
            doDig(diggerIndex,chartType);
        };
    var types=["blog","home","web"];
    for(var j=0;j<types.length;j++){
    var type=types[j];
    for(var i=0;i<diggerFactory[type].length;i++){
        var digger=diggerFactory[type][i];
        var a=$("<a></a>").text(digger.name).attr({"class":type+"-action-widget"});
        var chartType=digger.type.split(",");
        if(chartType.length==1)
            a.attr({diggerIndex:i,chartType:chartType[0]})
                .linkbutton().click(onClick).appendTo(actionID);
        else if(chartType.length>1){
            var mainMenu=$("<div></div>");
            for(var j=0;j<chartType.length;j++){
                $("<div></div>")
                .attr({diggerIndex:i,chartType:chartType[j]})
                .text(chartRender[chartType[j]].name)
                .click(onClick).appendTo(mainMenu);
            }
            a.splitbutton({menu:mainMenu,plain:false}).appendTo(actionID);    
        }
    }
}

}
initActionBoard();
function showActionBoard(){
    $("#actionBoard").children().hide();
    if(diggerFactory.ore.pageType.type=="blog"){
        $(".home-action-widget").hide();
        $(".blog-action-widget").show();
    }else
        {
            $(".home-action-widget").show();
            $(".blog-action-widget").hide();
        }
}

progressWidth=60;
progressHeight=60;
progressChart=null;
nv.addGraph(function(){
    progressChart=nv.models.pie()
        .values(function(d) { return d })
        .width(progressWidth)
        .height(progressHeight);
    d3.select("#progressChart")
        .datum([[{key:"progress",y:0},{key:"remain",y:1}]])
      .transition().duration(1200)
        .attr('width', progressWidth)
        .attr('height', progressHeight)
        .call(progressChart);
    return progressChart;
});

function showPopChart(){
    $("#popChart svg").empty();
    var plotInfo=$("#popChart").data("plotInfo");
    $("#popChart").dialog({
            title:"弹出图表",
            width: 400,  
            height: 300,  
            closed: false,
            modal: true,
            resizable:true,
            onResize:function(width,height){
                plotInfo.chart.width(width).height(height);
                d3.select("#popChart svg")
                .datum(plotInfo.data)
                .transition().duration(1200)
                .attr('width', width)
                .attr('height', height)
                .call(plotInfo.chart);
            }
        })
}