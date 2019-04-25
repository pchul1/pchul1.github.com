var _ExampleOpenlayers = function () {
    
	// public functions
    return {
    	  
        init: function () {
//        	$.getScript( daumSDKURL, function( data, textStatus, jqxhr ) {
//        		if(console){
//        			console.log('Kakao is READY');
//        		}
//        	});
        	var me = this;
        	return me;
        },
        searchPlace: function(param){
        	if(param){
        		return searchPlace(param);
        	}
        },
        searchRoad: function(param){
        	if(param){
        		return searchRoad(param);
        	}
        },
        searchAll: function(param){
        	if(param){
        		return searchAll(param);
        	}
        }
    
    }; 
}();
