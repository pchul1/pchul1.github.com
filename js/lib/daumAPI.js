var _DaumAPI = function () {
	
//	var daumSDKURL = 'https://developers.kakao.com/sdk/js/kakao.min.js';
	
	var apiURI = 'https://dapi.kakao.com/v2/local/search/{type}.json';
	
	var apiKey = 'f6fdc6003e04682bdd12a69b9407c2b3';
	
	var method = 'GET';
	
	var daumMapResolutions = [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25];
    var daumMapExtent      = [-30000, -60000, 494288, 988576];
    var daumMapProjectionCode = 'EPSG:5181';
    var daumMapProjection = new ol.proj.Projection({
        code: daumMapProjectionCode,
        extent: daumMapExtent,
        units: 'm'
    });
    
    var WGS84 = 'EPSG:4326';
    
    var DAUM_ROAD_VIEW_FLAG = false;
    
    var roadViewDiv = 'daumRoadView';
    var mapDiv = 'map';
    
	var categoryGroupCode = {
								MT1:{code:'MT1',name:'대형마트'},
								CS2:{code:'CS2',name:'편의점'},
								PS3:{code:'PS3',name:'어린이집, 유치원 '},
								SC4:{code:'SC4',name:'학교'},
								AC5:{code:'AC5',name:'학원'},
								PK6:{code:'PK6',name:'주차장'},
								OL7:{code:'OL7',name:'주유소, 충전소'},
								SW8:{code:'SW8',name:'지하철역'},
								BK9:{code:'BK9',name:'은행'},
								CT1:{code:'CT1',name:'문화시설'},
								AG2:{code:'AG2',name:'중개업소'},
								PO3:{code:'PO3',name:'공공기관'},
								AT4:{code:'AT4',name:'관광명소'},
								AD5:{code:'AD5',name:'숙박'},
								FD6:{code:'FD6',name:'음식점'},
								CE7:{code:'CE7',name:'카페'},
								HP8:{code:'HP8',name:'병원'},
								PM9:{code:'PM9',name:'약국'}
							};
							
	var searchPlace = function(parameter){
		return $.ajax({
				  	url : apiURI.replace('{type}', 'keyword'),
				  	data:parameter,
				  	headers : { 'Authorization' : 'KakaoAK '+apiKey},
				  	type : method,
				  	contentType: "application/x-www-form-urlencoded; charset=UTF-8",
				});
	}
	var searchRoad = function(parameter){
		return $.ajax({
				  	url : apiURI.replace('{type}', 'address'),
				  	data: parameter,
				  	headers : { 'Authorization' : 'KakaoAK '+apiKey},
				  	type : method,
				  	contentType: "application/x-www-form-urlencoded; charset=UTF-8",
				});
	}
	var searchAll = function(parameter){
		return $.when(searchPlace(parameter), searchRoad(parameter));
	}

	var setEvent = function(){
		_MapEventBus.on(_MapEvents.show_daum_map_base_layer, function(event, param){
			showDaumBaseMap(param.coreMap, param.projection, param.baseMapType);
		});
		
		_MapEventBus.on(_MapEvents.show_daum_map_road_layer, function(event, param){
			showDaumRoadViewMap(param.coreMap, param.projection, param.baseMapType);
		});
		
		_MapEventBus.on(_MapEvents.clear_other_base_layer, function(event, param){
			clearLayers(param.coreMap, param.type);
		});
	}
	
	var clearLayers = function(coreMap, type){
		if(type != 'DAUM'){
			var daumMapLayer = coreMap.getLayerForName('daumBaseMapLayer');
			var daumRoadViewMapLayer = coreMap.getLayerForName('daumRoadViewMapLayer');
			
			if(daumMapLayer){
				daumMapLayer.setVisible(false);
			}
			
			if(daumRoadViewMapLayer){
				daumRoadViewMapLayer.setVisible(false);
			}
		}
	}
	
	var showDaumRoadViewMap = function(coreMap, currentProjection){
		
		var daumRoadViewMapLayer = coreMap.getLayerForName('daumRoadViewMapLayer');
		if(daumRoadViewMapLayer){
			var isVisible = daumRoadViewMapLayer.getVisible();
			
			daumRoadViewMapLayer.setVisible(!isVisible);
			if(isVisible){
				_MapEventBus.off(_MapEvents.map_singleclick, roadViewClicked );
			}else{
				_MapEventBus.on(_MapEvents.map_singleclick, roadViewClicked );
			} 
			
			return;
		}
		
		var daumRoadViewMapLayer = new ol.layer.Tile({
			preload: Infinity,
            title : 'Daum Road View Map',
            visible : true,
            type : 'base',
            source : new ol.source.XYZ({
                projection: daumMapProjection,
                minZoom: 0,
                maxZoom: daumMapResolutions.length - 1,
                tileGrid: new ol.tilegrid.TileGrid({
                    origin: [daumMapExtent[0], daumMapExtent[1]],
                    resolutions: daumMapResolutions
                }),
                tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                    if (tileCoord == null) return undefined;
                    var s = Math.floor(Math.random() * 4);  // 0 ~ 3
                    var z = daumMapResolutions.length - tileCoord[0];
                    var x = tileCoord[1];
                    var y = tileCoord[2];
                    	
                    return './proxy.jsp?https://map'+s+'.daumcdn.net/map_roadviewline/7.00/L'+z+'/'+y+'/'+x+'.png';
                },
				crossOrigin: 'Anonymous'
            }),
            name: 'daumRoadViewMapLayer'
        });
		
		_MapEventBus.trigger(_MapEvents.map_addLayer, daumRoadViewMapLayer);
		
		_MapEventBus.on(_MapEvents.map_singleclick, roadViewClicked );
	}
	
	var requestFlashPermission = function() {
		
	    var iframe = document.createElement('a');
	    iframe.href = 'https://get.adobe.com/flashplayer';
	    iframe.target = '_blank';
	    
	    document.body.appendChild(iframe);
	    iframe.click();
	    
	    document.body.removeChild(iframe);
 	}

	var roadViewClicked = function(event, param){
		var roadviewContainer = document.getElementById(roadViewDiv); //로드뷰를 표시할 div
		var roadview;
		
		try{
			roadview = new daum.maps.Roadview(roadviewContainer); //로드뷰 객체
		}catch(e){
			if(e.message.indexOf('Flash Player') > -1){
				requestFlashPermission();
				return;
			}
		}
		var roadviewClient = new daum.maps.RoadviewClient(); //좌표로부터 로드뷰 파노ID를 가져올 로드뷰 helper객체
		
		var roadViewCoordnate = ol.proj.transform(param.result.coordinate, daumMapProjectionCode, WGS84);
		
		var position = new daum.maps.LatLng(roadViewCoordnate[1], roadViewCoordnate[0]);
		 
		$('#'+roadViewDiv).width($('#'+mapDiv).width());
		$('#'+roadViewDiv).height($('#'+mapDiv).height());
		$('#'+roadViewDiv).show();
		
		// 특정 위치의 좌표와 가까운 로드뷰의 panoId를 추출하여 로드뷰를 띄운다.
		roadviewClient.getNearestPanoId(position, 50, function(panoId) {
			roadview.setPanoId(panoId, position); //panoId와 중심좌표를 통해 로드뷰 실행
		});
		
		DAUM_ROAD_VIEW_FLAG = true;
		
		$(document).keyup(function(e) {
		     if (e.keyCode == 27) { // escape key maps to keycode `27`
		    	 DAUM_ROAD_VIEW_FLAG = false;
		    	 $('#'+roadViewDiv).hide();
		    }
		});
	}
	
	var showDaumBaseMap = function(coreMap, currentProjection, baseMapType){
		
		if(baseMapType == 'DAUM'){
			var daumMapLayer = coreMap.getLayerForName('daumBaseMapLayer');
			if(daumMapLayer){
				daumMapLayer.setVisible(true);
			}
			return; 
		}
		var centerCoordnate = coreMap.getView().getCenter()
		var daumMapCenterCoordnate = ol.proj.transform(centerCoordnate, currentProjection, daumMapProjectionCode);
		
		_MapEventBus.trigger(_MapEvents.map_view_changed, {
			enableRotation : false, // 모바일에서 투터치로 지도가 회전되는 것 막음
			rotation : 0,
			projection: daumMapProjection,
			minZoom: 0,
            maxZoom: daumMapResolutions.length - 1,
            center : daumMapCenterCoordnate,
            zoom : coreMap.getView().getZoom()-5
		});
		
		var daumBaseMapLayer = new ol.layer.Tile({
			preload: Infinity,
            title : 'Daum Street Map',
            visible : true,
            type : 'base',
            source : new ol.source.XYZ({
                projection: daumMapProjection,
                minZoom: 0,
                maxZoom: daumMapResolutions.length - 1,
                tileGrid: new ol.tilegrid.TileGrid({
                    origin: [daumMapExtent[0], daumMapExtent[1]],
                    resolutions: daumMapResolutions
                }),
                tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                    if (tileCoord == null) return undefined;
                    var s = Math.floor(Math.random() * 4);  // 0 ~ 3
                    var z = daumMapResolutions.length - tileCoord[0];
                    var x = tileCoord[1];
                    var y = tileCoord[2];
                    return './proxy.jsp?https://map'+s+'.daumcdn.net/map_2d/1904fls/L'+z+'/'+y+'/'+x+'.png';
                },
				crossOrigin: 'Anonymous'
            }),
            name: 'daumBaseMapLayer'
        });
		
		_MapEventBus.trigger(_MapEvents.map_addLayer, daumBaseMapLayer);
	}
	
    // public functions
    return {
    	  
        init: function (param) {
        	mapDiv = param.mapDiv;
        	roadViewDiv = param.roadViewDiv;
        	setEvent();
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
