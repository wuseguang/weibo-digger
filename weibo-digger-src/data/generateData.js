// dataSourceConfig.js - weiboStatistics's module
// author: 五色光
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
function dateFormat(time){var date=new Date(time);return date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()}
jQuery.fn.justText = function() {
    return $(this).clone()
    		.children()
			.remove()
			.end()
			.text();
};
function extractData(paramList,generator,dataReady){
    var count=paramList.length;
    var data=[];
    for(var i=0;i<paramList.length;i++){
        (function(param)
        {var url=generator.generateUrl(param);
         $.ajax({
                url: url,
                type: "GET",
                dataType: "json",
                timeout: 60000,
                success: function(json){
                    data=data.concat(generator.processJSON(json,param));
                },
                complete:function(){
                    count=count-1;
                    self.port.emit("update-progress",{progress:paramList.length-count,total:paramList.length});
                    if(count>0)return;
                    dataReady(data);
                }
            })//end ajax
            
        })(paramList[i])
    }
}
pageType=null;
currentGenerator=null;
self.port.on("set-pageType",function(pt){
   // console.log("old-pageType",jsonToString(pageType))
   // console.log("new-pageType",jsonToString(pt))
    pageType=pt;
    currentGenerator=generatorFactory[pageType.index][pageType.type];
   // console.log("currentGenerator1:"+currentGenerator)
    
});
function unicode(value){
    var preStr='%u';
    var cnReg=/[\u0391-\uFFE5]/gm;
    if(cnReg.test(value)){
        var ret=value.replace(cnReg,function(str){
            return preStr+str.charCodeAt(0).toString(16)
        });return ret}
    else return value;
}
var generatorFactory=[
    {
        name:"搜狐微博",
        home:{
            getBlogerName:function(){return "匿名"},
            getID:function(){return 0},
            getPageNum:function(){return 0},
            getOnePageData:function(pageID){return null}
        },
        userInfoGenerator:{
            generateUrl:function(userName){return "http://t.sohu.com/vcard?nm="+unicode(userName.trim())},
            processJSON: function(json,userName){
                var div=$("<div></div").append(json.data.body);
                var values=div.find(".nexus a").map(function(d){return parseInt($(this).text())});
                var item={attention:values[0],fans:values[1],blogNum:values[2]};
                //console.log("userData:"+jsonToString(item));
                return {id:userName,data:item}
                }
        },
        blog:{
            getBlogerName:function(){return $("#username a").first().text()},
            getBlogTime:function(){
                var d=$(".tm").first().attr("title").match(/\d+/gi).map(function(d){return parseInt(d)});
                return new Date(d[0],d[1]-1,d[2],d[3],d[4]).getTime();
            },
            getID:function(){return location.href.match(/[\d]{10}/gi)[0]},
            generateUrl:function(page){return "http://t.sohu.com/reply/replyNew?msgid="+this.getID()+"&pageNo="+page},
            processJSON:function(json,page){
                var processTime=function(timeStr){
                    var now=new Date();
                    var r=[now.getFullYear(),now.getMonth(),now.getDate,now.getHours,now.getMinutes].reverse();
                    var d=timeStr.match(/\d+/gi).map(function(dd){return parseInt(dd)}).reverse();
                    if(d.length==3){//年月日
                        d.reverse()
                        d[1]=d[1]-1;
                        d.push(0);d.push[0];
                        d.reverse()
                    }else if(d.length==4){//月日时分
                        d[3]=d[3]-1;
                    }else if(d.length==2){//时分
                        if(/\u6628\u5929/.test(timeStr))d.push(now.getDate()-1);//昨天
                        else d.push(now.getDate()-2);// 前天
                    }else if(d.length==1){
                        if(/\u5c0f\u65f6/.test(timeStr)){//小时
                            return now.getTime()-d[0]*60*60*1000;
                        }else if(/\u5206\u949f/.test(timeStr)){//分钟
                            return now.getTime()-d[0]*60*1000;
                        }
                        return now.getTime()-d*1000;//秒
                    }
                    for(var i=0;i<d.length;i++){
                        r[i]=d[i];
                    }
                    return new Date(r[4],r[3],r[2],r[1],r[0]).getTime();
                };//end processTime function
                    var body=json.data.body;
                    var result=[];
                    $("<div></div>").append(body).find(".twi").each(function(){
                    var item={};
                    item.nm=$(this).find(".nm").first().text().trim();
                    var cmt=$(this).find(".ugc").first().text().trim();
                    item.cmtLen=cmt.length;
                    item.cmtType=0;
                    if(/^[\u8f6c\u53d1]/.test(cmt))item.cmtType=1;//zhuan fa
                    else if(/^[\u56de\u590d]/.test(cmt))item.cmtType=2;//hui fu
                    var time=$(this).find(".tm").first().text().trim();
                    item.time=processTime(time);
                    result.push(item);
                });
                    return result;
            },
            getPageNum:function(){
                if($(".page").length>0)
                    return parseInt($(".page").first().find("em").text().match(/[\d]+/gi));
                return 1;
            }
            
        }//blog end
    }//sohu end
];
generatorFactory.push({
    name:"新浪微博",
    home:{},
    userInfoGenerator:{
            generateUrl:function(userName){return "http://weibo.com/aj/user/cardv5?name="+userName},
            processJSON: function(json,userName){
                var div=$("<div></div").append(json.data);
                var values=div.find(".userdata li:not([class])").map(function(d){
                    var str=$(this).justText();
                    var n=parseInt(str.match(/\d+/)[0]);
                    if(str.indexOf("万"))n=n*10000
                    return n                    
                });
                var item={attention:values[0],fans:values[1],blogNum:values[2]};
                //console.log("userData:"+jsonToString(item));
                return {id:userName,data:item}
            }

        },
    blog:{
         getBlogerName:function(){return $(".name:first").text()},
        getBlogTime:function(){return parseInt($(".WB_from [date]:first").attr("date"))},
        getID:function(){return $(".WB_detail [mid]:first").attr("mid")},
        getPageNum:function(){
            var NumDom=$(".W_pages_minibtn .page:last");
            return NumDom.length==0?1:parseInt(NumDom.text())
            },
        generateUrl:function(page){return url="http://weibo.com/aj/comment/big?id="+this.getID()+"&page="+page},
        processJSON:function(json,page){
            console.log("得到数据:"+url);
            var result=[];
            $("<div></div>").append(json.data.html).find("dl").each(function(){
                    var now=new Date();
                    var dateList=[now.getMinutes(),now.getHours(),now.getDate(),now.getMonth(),now.getFullYear()];
                    var item={};
                    item.nm=$(this).find("dd a[usercard]:first").text();
                    var cmt=$(this).find("dd").justText().trim();
                    item.cmtLen=cmt.length;
                    item.cmtType=0;
                    item.time=now.getTime();
                    var timeStr=$(this).find("dd .S_txt2").text();
                    var d=timeStr.match(/\d+/gi).reverse().map(function(d){return parseInt(d)});
                    if(d.length>3)d[3]=d[3]-1;
                    //console.log(d+"-"+timeStr+timeStr.indexOf("分"));
                    if(d.length==1){
                        var a=timeStr.indexOf("分")>-1?d[0]*60:d[0];
                        //console.log(a);
                        item.time=item.time-a*1000;
                    }else
                        {
                            for(var i=0;i<d.length;i++)dateList[i]=d[i];
                            item.time=new Date(dateList[4],dateList[3],dateList[2],dateList[1],dateList[0]).getTime();
                        }
                    result.push(item);
                });
        return result;
                //console.log("result:"+jsonToString(result));                
    }
        
    }
});//sina end
generatorFactory.push({
    name:"天涯论坛",
    home:{},
    blog:{}
})
//events
self.port.on("get-id",function(){
    var id=currentGenerator.getID();
    //console.log("now-pageType:"+jsonToString(pageType))
    self.port.emit("dataID",{id:id,pageType:pageType});
});
self.port.on("get-context",function(userNames){
    //console.log("currentGenerator2:"+currentGenerator)
    var generator=generatorFactory[pageType.index];
    extractData(userNames,generator.userInfoGenerator,function(data){
            self.port.emit("user-info",{users:data,pageType:pageType,id:currentGenerator.getID()})
        }
    ) 
})
self.port.on("get-data",function(){
    var generator=generatorFactory[pageType.index][pageType.type];
    var pageNum=generator.getPageNum();
    self.port.emit("reset-progress",pageNum);
    var paramList=[];
    for(var i=1;i<=pageNum;i++)paramList.push(i);
    extractData(paramList,generator,function(data){
            if(pageType.type=="blog")
            {
            var users=$.unique(data.map(function(d){return d.nm}));
            self.port.emit("data-info",{
                    id:generator.getID(),
                    blogTime:generator.getBlogTime(),
                    blogerName:generator.getBlogerName(),
                    pageNum:pageNum,
                    pageType:pageType,
                    data:data,
                    users:users,
                    displayString:[
                            {name:"网站：",value:pageType.web.name},
                            {name:"博主",value:generator.getBlogerName()},
                            {name:"发表时间",value:dateFormat(generator.getBlogTime())},
                            {name:"总页数",value:pageNum},
                            {name:"总评论数",value:data.length},
                            {name:"总人数",value:users.length},
                            {name:"网址",value:location.href}
                            ]       
            })
            }else if(pageType.type=="home"){
                 self.port.emit("data-info",{
                    id:generator.getID(),
                    blogerName:generator.getBlogerName(),
                    pageNum:pageNum,
                    pageType:pageType,
                    data:data,
                    displayString:[
                            {name:"博主",value:generator.getBlogerName()},
                            {name:"总页数",value:pageNum},
                            {name:"博文总数",value:data.length}
                            ]
                
                        
            });
            }//end home
        }//end data ready
    )//end extract data
  
})//end get-data



