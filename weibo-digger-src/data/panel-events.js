addon.port.on("reset-progress",function(total){
    d3.select("#progressChart")
        .datum([[{key:"progress",y:0},{key:"remain",y:total}]])
        .transition().duration(500)
        .attr('width', progressWidth)
        .attr('height', progressHeight)
        .call(progressChart);
    $("#progressState").text("0/"+total);
})
addon.port.on("update-progress",function(value){
    d3.select("#progressChart")
        .datum([[{key:"progress",y:value.progress},{key:"remain",y:value.total-value.progress}]])
        .transition().duration(500)
        .attr('width', progressWidth)
        .attr('height', progressHeight)
        .call(progressChart);
    $("#progressState").text(value.progress+"/"+value.total);
})
addon.port.on("show-chart",function(d){
     $("#refresh-button").unbind("click");
    if(d==null||d.data==null){
        $("#top-div").text("此网页没有相关内容！");
        $("#refresh-button").click(function(){
            alert("此网页没有数据！")
            return false;
    })
        return;
    }
    diggerFactory.ore=d.data;
    diggerFactory.context=d.context;
    //console.log("context:"+jsonToString(d.context));
    showActionBoard();
     var msg=$("#msginfo").empty();
     var displayList=d.data.displayString;
    for(var i=0;i<displayList.length;i++){
        msg.append(displayList[i].name+"("+displayList[i].value+")<br/>");
    }
    $("#refresh-button").linkbutton().click(function(){
            addon.port.emit("update-data",{pageType:d.data.pageType,diggerIndex:d.diggerIndex});
    })
    doDig(d.diggerIndex,null);
});