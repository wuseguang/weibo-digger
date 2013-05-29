// dataSourceConfig.js - weiboStatistics's module
// author: 五色光
var dataSourceConfig={
    home:[
        [/http:\/\/t\.sohu\.com\/home.*/,/http:\/\/t\.sohu\.com\/u\/\d+.*/,/http:\/\/t\.sohu\.com\/home.*/,/http:\/\/t\.sohu\.com\/people.*/]
        ],
    blog:[
        [/.*t\.sohu\.com\/m\/[\d]{10}/,/.*t\.sohu\.com\/preExpr\/m\/[\d]{10}/],
        
        [/.*weibo\.com\/\d{10}\/[A-Za-z0-9]{9}/]
        ],
    webs:[{key:"sina",name:"搜狐微博"},{key:"sina",name:"新浪微博"}]
}
function getPageType(url){
    //home
    for(var i=0;i<dataSourceConfig.home.length;i++){
        var patternList=dataSourceConfig.home[i];
        for(var j=0;j<patternList.length;j++){
            if(patternList[j].test(url))return {index:i,type:"home",web:dataSourceConfig.webs[i]}
        }
    }
    for(var i=0;i<dataSourceConfig.blog.length;i++){
        var patternList=dataSourceConfig.blog[i];
        for(var j=0;j<patternList.length;j++){
            if(patternList[j].test(url))return {index:i,type:"blog",web:dataSourceConfig.webs[i]}
        }
    }
    return null;
}
function initDataSource(){
    var dataSource={};
    var webs=dataSourceConfig.webs;
    for(var i=0;i<webs.length;i++)dataSource[webs[i].key]={home:{},blog:{},context:{}};
    return dataSource;
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
exports.getPageType=getPageType;
exports.initDataSource=initDataSource;
exports.jsonToString=jsonToString;

