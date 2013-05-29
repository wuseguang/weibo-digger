Array.prototype.max = function() {
  return Math.max.apply(null, this); // <-- passing null as the context
};
Array.prototype.min = function() {
  return Math.min.apply(null, this); // <-- passing null as the context
};
Array.prototype.sum = function() {
var count=0;
  for(var i=0;i<this.length;i++) // <-- passing null as the context
     count+=this[i];
     return count;
};
diggerFactory={
    ore:null,
    context:null,
    currentDigger:null,
    digger:function(){
        if(arguments.length>0)currentDigger=this[this.ore.pageType.type][arguments[0]];
        return currentDigger.digger(this.ore)
    },
    widgetGenerator:{
        slider:function(){}
    },
    web:[],
    home:[],
    blog:[
        {
            type:"pie,multiBarHorizontalChart,bar",
            name:"评论数分布",
            digger:function(){
                var plotData=diggerFactory
                .wordCount(diggerFactory.ore.data,"nm")
                .reverse();
                var comboboxData=[1,2,3,4,5,6,7,8,9,10].map(function(i){return {text:i+"条记录",value:i}});
                comboboxData[0].selected=true;
                var pieInfo=function(max){
                    return{
                    slider:{
                                label:"前n名：",name:"firstN",
                                data:{
                                    min:1,
                                    max:plotData.length>max?max:plotData.length,
                                    value:plotData.length>5?5:plotData.length,
                                    tipFormatter:function(d){return d+"人"}
                                }
                            }
                }
                
                };
                var multiBarData=pieInfo(20);
                //multiBarData.otherData=otherData;
                //multiBarData.names=["评论数","关注数","粉丝数","博文数"];
                return {
                    data:plotData,
                    plotInfo:{
                        pie:pieInfo(12),
                        multiBarHorizontalChart:pieInfo(20),
                        bar:{
                            start:0,
                            combobox:{
                                label:"间隔：",name:"duration",data:comboboxData
                            },
                            slider:{
                                label:"统计前n条：",name:"firstN",data:{
                                    min:1,max:plotData.length,value:plotData.length,
                                    tipFormatter:function(d){return "前"+d+"条"}
                                }
                            },
                            xFormat:function(d){return d}
                        }
                        
                    }
                    //xFormat:function(d){}
                }
            }
        },
        {
            type:"bar",
            name:"评论时序图",
            digger:function(){
                var ore=diggerFactory.ore;
                var postTime=new Date(ore.blogTime);
                var startDate=new Date(postTime.getFullYear(),postTime.getMonth(),postTime.getDate()).getTime();
                
                var values=ore.data.map(function(d){
                    return {key:d.time,value:1};
                });
                values.sort(function(a,b){return a.key-b.key});
                return {
                data:values,
                plotInfo:{
                    bar:{
                        start:startDate,
                        combobox:{
                            label:"间隔：",name:"duration",
                            data:[
                                {text:"间隔10分钟",value:10*60000},
                                {text:"间隔15分钟",value:15*60000},
                                {text:"间隔1小时",value:60*60000,selected:true},
                                {text:"间隔6小时",value:6*60*60000,selected:true},
                                {text:"间隔1天",value:60*24*60000}]
                        },
                        slider:{
                                label:"统计前n条：",name:"firstN",data:{
                                    min:1,max:values.length,value:values.length,
                                    tipFormatter:function(d){return "前"+d+"条"}
                                }
                            },
                        xFormat:function(d){
                            var date=new Date(startDate+d);
                            return date.getDate()+"/"+date.getHours()+":"+date.getMinutes()  
                        }
                    }
                }
                
                }
            }
        }
    ],
    mapReduce:function (data,theRule){
        var result={};
        var isNumber=typeof theRule.mapper(data[0]).key=="number";
        for(var i=0;i<data.length;i++){
            var item=theRule.mapper(data[i]);
            item.key="key"+item.key;
            if(typeof(result[item.key])=="undefined")
                result[item.key]=[];
            result[item.key].push(item.value);
        }
        var result2=[];
        for(var it in result){
            if(/^[key]/.test(it)&&result[it] instanceof Array){
                var key=isNumber?parseFloat(it.slice(3)):it.slice(3);
                result2.push(theRule.reducer({key:key,value:result[it]}))
            }
        }
        if(typeof result2[0].key=="number")result2.sort(function(a,b){return a.key-b.key});
        else if(typeof result2[0].value=="number")result2.sort(function(a,b){return a.value-b.value});
        return result2;
    },
    wordCount:function(d,keyField){
        var mapper=function(data){
            return {key:data[keyField],value:typeof data.value=="undefined"?1:data.value};
        };
        var reducer=function(data){
            var sum=0;
            for(var i=0;i<data.value.length;i++)sum=sum+data.value[i];
            return {key:data.key,value:sum};
            
        };
        return this.mapReduce(d,{mapper:mapper,reducer:reducer});
    }
}

diggerFactory.blog.push({
    type:"scatterChart",
    name:"评论者属性",
    digger:function(){
        var oldData=diggerFactory.ore.data;
        var context=diggerFactory.context;
        var nmCount=diggerFactory.wordCount(oldData,"nm");
        var data=[];
        //console.log("context:"+jsonToString(context));
        //console.log("nmCount:"+jsonToString(nmCount));
        for(var i=0;i<nmCount.length;i++){
            var d=nmCount[i];
            console.log("d:"+jsonToString(d));
            if(typeof context[d.key]=="undefined")continue;
            var user=context[d.key];
            data.push({key:d.key,values:[user.attention,user.fans,user.blogNum,d.value]})
        }
       // console.log("data",jsonToString(data));
        var result={data:data,plotInfo:{scatterChart:{}}};
        result.plotInfo.scatterChart.combobox={
                 label:"统计属性：",name:"vs",
            data:[
                {text:"评论数vs关注数",value:"3-0",selected:true},
                {text:"评论数vs粉丝数",value:"3-1"},
                {text:"评论数vs博文数",value:"3-2"},
                {text:"关注数vs粉丝数",value:"0-1"},
                {text:"粉丝数vs博文数",value:"1-2"}
            ]
            }
        return result;
    }
})

