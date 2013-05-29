blogMap={};
homeMap={};
var dataSourceConfig=require("./dataSourceConfig");
dataSource=dataSourceConfig.initDataSource();
var data = require("sdk/self").data;

var panel = require("sdk/panel").Panel({
  width: 700,
  height: 500,
  contentURL: data.url("panel.html")
  //contentScriptFile: data.url("get-text.js")
});
function updateAndShow(pageType,diggerIndex){
        var worker=require("sdk/tabs").activeTab.attach({
            contentScriptFile: [data.url("ui/jquery-1.8.0.min.js"),data.url("generateData.js")]
            });
        worker.port.emit("set-pageType",pageType);
        worker.port.on("data-info",function(dataInfo){
                var pageType=dataInfo.pageType;
                dataSource[pageType.web.key][pageType.type][dataInfo.id]=dataInfo;
                var userNames=dataInfo.users;
                var usersInfo={};
                var newUsers=[];
                var context=dataSource[pageType.web.key].context;
                for(var i=0;i<userNames.length;i++){
                    if(typeof context[userNames[i]]=="undefined")newUsers.push(userNames[i])
                    else usersInfo[userNames[i]]=context[userNames[i]];
                }
                if(newUsers.length==0)
                panel.port.emit('show-chart',{data:dataInfo,diggerIndex:diggerIndex,context:context});
                else {
                    worker.port.emit("get-context",newUsers);
                    panel.port.emit("reset-progress",newUsers.length)
                }
        })
        worker.port.on("reset-progress",function(total){panel.port.emit("reset-progress",total);});
        worker.port.on("update-progress",function(value){panel.port.emit("update-progress",value);});
        worker.port.on("user-info",function(info){
            var users=info.users;var pageType=info.pageType;
            for(var i=0;i<users.length;i++){
                dataSource[pageType.web.key].context[users[i].id]=users[i].data;
            }
            panel.port.emit("show-chart",{
                data:dataSource[pageType.web.key][pageType.type][info.id],
                diggerIndex:diggerIndex,
                context:dataSource[pageType.web.key].context
            })
        })
        worker.port.emit("get-data",pageType);
    }

// Create a widget, and attach the panel to it, so the panel is
// shown when the user clicks the widget.
require("sdk/widget").Widget({
  label: "Text entry",
  id: "text-entry",
  contentURL: data.url("logo.jpg"),//"http://www.mozilla.org/favicon.ico",
  panel:panel,
  onClick: function() {
    var activeTab=require("sdk/tabs").activeTab;
    var url= activeTab.url;
    var pageType=dataSourceConfig.getPageType(url);
    if(pageType==null){panel.port.emit("show-chart",null);return} 
    var worker=activeTab.attach({
            contentScriptFile: [data.url("jquery-1.7.2.min.js"),data.url("generateData.js")]
            })
    worker.port.on("dataID",function(idInfo){
        console.log("receive-pageType:"+dataSourceConfig.jsonToString(idInfo.pageType));
        var pageType=idInfo.pageType;
        var dataType=idInfo.pageType.type;
        var id=idInfo.id;
        if(typeof dataSource[pageType.web.key][pageType.type][id]!="undefined")
            panel.port.emit('show-chart',{data:dataSource[pageType.web.key][pageType.type][id],context:dataSource[pageType.web.key].context,diggerIndex:0});
        else
            updateAndShow(idInfo.pageType,0);   
        });
    
        worker.port.emit("set-pageType",pageType);
        worker.port.emit("get-id");
  }
});
 
panel.port.on("update-data",function(info){
    updateAndShow(info.pageType,info.diggerIndex);
})
 
