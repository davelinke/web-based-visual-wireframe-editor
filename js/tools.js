/*
* Pinocchio Editor
* by David Linke Cesami
* licensed under a Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License.
* For more information visit pinocchio.us
*/


config.tools={
	addGuide:{
		id:'addGuide',
		isDefault:false,
		isActive:false,
		launcher:'menu_view',
		horizontal:{
			mousedown:function(a){
				a.scope.data.tools.addGuide.isActive = 'horizontal';
				console.log('hor md');
			},
			mouseup:function(a){
				console.log('hor mu');
				var s = a.scope.data;
				s.tools.addGuide.isActive = false;
			}
		},
		vertical:{
			mousedown:function(a){
				a.scope.data.tools.addGuide.isActive = 'vertical';
				console.log('ver md');
			},
			mouseup:function(a){
				a.scope.data.tools.addGuide.isActive = false;
				console.log('ver mu');
			}
		}
	},
	drawBox:{
		cursor:'crosshair',
		id:'drawBox',
		isDefault:true,
		isActive:false,
		launcher:'toolbar',
		label:'Draw Box',
		iconClass:'fa fa-square-o',
		isMoving:false,
		isDrawing:false,
		optionsTemplate:'',
		element:null,
		config:null,
		resetConfig:function(scope){
			scope.data.tools.drawBox.config = {
				areaClass:'draw-box',
				areaStyle:$.extend({
					left:'-10000px',
					top:'-10000px',
					width:'0',
					height:'0',
					lPx: -10000,
					tPx: -10000,
					wPx: 0,
					hPx: 0
				},scope.data.drawStyle)
			};
		},
		init:function($compile,scope){
			scope.data.tools.drawBox.resetConfig(scope);
			var
				html = '<div id="drawBoxBox" ng-class="data.tools.drawBox.config.areaClass" ng-style="data.tools.drawBox.config.areaStyle"></div>',
				elem = $compile(html)(scope),
				sElem = $compile(scope.data.tools.drawBox.optionsTemplate)(scope)
			;
			$('#canvas').append(elem);
			scope.data.tools.drawBox.element = elem;
			scope.data.tools.drawBox.optionsMenu = sElem;
		},
		destroy:function(scope){
			var da = scope.data.tools.drawBox;
			da.resetConfig(scope);
			if (da.element){
				da.element.remove();
				da.optionsMenu.remove();
			}

		},
		setUndo:function(args){
			//console.log('setting undo');
		},
		mousedown:function(args){
			args.scope.data.tools.drawBox.clickTouch(args);
		},
		touchstart:function(args){
			args.scope.data.tools.drawBox.clickTouch(args);
		},
		clickTouch:function(args){
			args.scope.data.tools.drawBox.resetConfig(args.scope);
			var
				s = args.scope.data,
				dac = s.tools.drawBox.config,
				e = args.event,
				canvas = $('#canvas'),
				lockedLayer = (s.selection.active.typeNum==2?s.fn.tree.selectParentLayer(s.tree.root.children):s.selection.active).locked
			;
			if(lockedLayer===false){
				args.scope.$apply(function(){
					if(e.target==canvas[0]){
						dac.areaStyle.left = e.offsetX + 'px';
						dac.areaStyle.lPx = e.offsetX;
						dac.areaStyle.top = e.offsetY + 'px';
						dac.areaStyle.tPx = e.offsetY;
						dac.initPos = {
							lPx: e.offsetX,
							tPx: e.offsetY
						};
						dac.areaStyle.width = 0;
						dac.areaStyle.wPx = 0;
						dac.areaStyle.height = 0;
						dac.areaStyle.hPx = 0;
						s.tools.drawBox.isDrawing = true;
					} else if (e.target.id=='workarea') {
						var o = canvas.offset();
						var x = e.pageX - o.left;
						var y = e.pageY - o.top;
						var dw = s.screen.wPx;
						var dh = s.screen.hPx;
						var xVal = (s.screen.overflow?x:(x>0?x:0));
						xVal = Math.floor(xVal>dw?dw:xVal);
						var yVal = (s.screen.overflow?y:(y>0?y:0));
						yVal = Math.floor(yVal>dh?dh:yVal);
						dac.areaStyle.left = xVal + 'px';
						dac.areaStyle.lPx = xVal;
						dac.areaStyle.top = yVal + 'px';
						dac.areaStyle.tPx = yVal;
						dac.initPos = {
							lPx: xVal,
							tPx: yVal
						};
						dac.areaStyle.width = 0;
						dac.areaStyle.wPx = 0;
						dac.areaStyle.height = 0;
						dac.areaStyle.hPx = 0;
						s.tools.drawBox.isDrawing = true;
					} else if (e.target.id=='drawBoxBox') {
						s.tools.drawBox.isMoving = true;
					}
				});
			}
		},
		mouseup:function(args){
			args.scope.data.tools.drawBox.isMoving = false;
			args.scope.data.tools.drawBox.finishSelect(args);
		},
		touchend:function(args){
			args.scope.data.tools.drawBox.isMoving = false;
			args.scope.data.tools.drawBox.finishSelect(args);
		},
		mouseleave:function(args){
		},
		finishSelect:function(args){
			// this fixes the issue of releasing the button outside the area and entering back without a mouseup event that wasn't tracked
			var
				e = args.event,
				s = args.scope.data,
				d = s.tools.drawBox,
				downFlag = (s.flags.mouseEvent =='mousedown' || s.flags.mouseEvent=='touchstart')?true:false,
				lockedLayer = (s.selection.active.typeNum==2?s.fn.tree.selectParentLayer(s.tree.root.children):s.selection.active).locked
			;
			if (!d.isMoving && !downFlag && lockedLayer===false){
				if(d.isDrawing){
					// go draw the box
					if ((d.config.areaStyle.wPx >0)&&(d.config.areaStyle.hPx >0)){
						var selectedLayer = args.scope.data.fn.tree.returnSelected(s.tree.root.children);
						if(!s.config.allowNestedElements){
							selectedLayer = (selectedLayer.type=='layer'?selectedLayer:args.scope.data.fn.tree.selectParentLayer(args.scope.data.tree.root.children));
							args.scope.data.fn.tree.toggleSelected({child:selectedLayer, data:args.scope.data});
						}
						console.log(d);
						var
							//determine the position relative to the parent
							plTop = selectedLayer.styles.normal.tPx,
							plLeft = selectedLayer.styles.normal.lPx,
							nlTop = d.config.areaStyle.tPx,
							nlLeft = d.config.areaStyle.lPx,
							nlOffset = s.fn.calculateOffset(s,selectedLayer,d.config.areaStyle)
						;
						selectedLayer.children.push({
							id:s.fn.tree.newLayerName({pre:args.scope.data.lang[args.scope.data.lang.act].element,data:args.scope.data}),
							type:'element',
							cursorClass:'',
							locked:false,
							visible:true,
							typeNum:2,
							children:[],
							styles:{
								'normal':$.extend({
									position:'absolute',
									left:nlOffset.left,
									lPx:nlOffset.lPx,
									top:nlOffset.top,
									tPx:nlOffset.tPx,
									width: d.config.areaStyle.width,
									wPx:d.config.areaStyle.wPx,
									height: d.config.areaStyle.height,
									hPx:d.config.areaStyle.hPx,
									overflow:'hidden',
									'white-space':'pre-wrap',
									opacity:1,
									'mix-blend-mode':'normal'
								},s.drawStyle)
							}
						});
					}

					d.isDrawing = false;
					d.resetConfig(args.scope);
				}
			}
		},
		mouseenter:function(args){
			args.scope.data.tools.drawBox.finishSelect(args);
		},
		mousemove:function(e,scope){
			scope.data.tools.drawBox.move(e,scope);
		},
		touchmove:function(e,scope){
			scope.data.tools.drawBox.move(e,scope);
		},
		move:function(e,scope){
			var
				downFlag = (scope.data.flags.mouseEvent =='mousedown' || scope.data.flags.mouseEvent=='touchstart')?true:false,
				lockedLayer = (scope.data.selection.active.typeNum==2?scope.data.fn.tree.selectParentLayer(scope.data.tree.root.children):scope.data.selection.active).locked
			;
			if (downFlag && lockedLayer===false){
				var
					canvas = $('#canvas'),
					s = scope.data,
					c = s.tools.drawBox.config,
					o = canvas.offset(),
					x = e.pageX - o.left,
					y = e.pageY - o.top,
					dw = s.screen.wPx,
					dh = s.screen.hPx,
					xVal = (s.screen.overflow?x:(x>0?x:0)),
					yVal = (s.screen.overflow?y:(y>0?y:0))
				;
				xVal = Math.floor(s.screen.overflow?xVal:(xVal>dw?dw:xVal));
				yVal = Math.floor(s.screen.overflow?yVal:(yVal>dh?dh:yVal));
				var
					leftVal = ((c.areaStyle.lPx < xVal)?c.areaStyle.lPx:xVal),
					topVal = ((c.areaStyle.tPx < yVal)?c.areaStyle.tPx:yVal),
					widthVal = Math.floor((c.areaStyle.lPx < xVal)?(xVal-c.areaStyle.lPx):(c.initPos.lPx-xVal)),
					heightVal = Math.floor((c.areaStyle.tPx < yVal)?(yVal-c.areaStyle.tPx):(c.initPos.tPx-yVal))
				;
				scope.$apply(function(){
					c.areaStyle.lPx = leftVal;
					c.areaStyle.left = leftVal + 'px';
					c.areaStyle.tPx = topVal;
					c.areaStyle.top = topVal + 'px';
					c.areaStyle.wPx = widthVal;
					c.areaStyle.width = widthVal + 'px';
					c.areaStyle.hPx = heightVal;
					c.areaStyle.height = heightVal + 'px';
				});
			}
		}
	},
	selection:{
	    cursor:'',
	    id:'selection',
	    isDefault:false,
	    isActive:false,
	    launcher:'toolbar',
	    label:'Select Element',
	    iconClass:'fa fa-mouse-pointer',
		optionsTemplate:'',
	    element:null,
	    init:function($compile,scope){
			$('#canvas,#guides').hide();
	    },
	    destroy:function(scope){
			$('#canvas,#guides').show();
	    },
	    setUndo:function(args){

	    },
		down:function(args){
			var
				s = args.scope,
				e = args.event,
				c = args.compile,
				t = s.data.tools.selection
			;
			t.element = s.data.fn.tree.searchElementById($(e.target).attr('ob-id'), s.data.tree.root.children);
			t.initPos = {
				lPx:e.offsetX,
				tPx:e.offsetY
			};
			if (!t.element) {
				var selectedLayer = s.data.fn.tree.selectParentLayer(s.data.tree.root.children);
				s.data.fn.tree.toggleSelected({child:selectedLayer,data:s.data});
			} else {
				var lockedLayer = ((t.element.typeNum==2)&&(s.data.fn.tree.selectParentLayer(s.data.tree.root.children).locked)?true:false);
				if ((t.element.locked === false)&&(lockedLayer===false)){
					s.data.fn.tree.toggleSelected({child:t.element,data:s.data});
					s.data.flags.resizeLeft = (e.offsetX<5)?true:false;
					s.data.flags.resizeTop = (e.offsetY<5)?true:false;
					s.data.flags.resizeRight = (e.offsetX>(t.element.styles.normal.wPx - 5))?true:false;
					s.data.flags.resizeBottom = (e.offsetY>(t.element.styles.normal.hPx - 5))?true:false;
				}
			}
			s.$apply();
		},
	    mousedown:function(args){
			args.scope.data.tools.selection.down(args);
	    },
		touchstart:function(args){
			args.scope.data.tools.selection.down(args);
		},
	    mouseup:function(args){
			//safe apply
			if (args.scope.$root.$$phase != '$apply' && args.scope.$root.$$phase != '$digest') args.scope.$apply();
	    },
		touchend:function(){},
	    mouseleave:function(args){
	    },
	    finishSelect:function(args){

	    },
	    mouseenter:function(args){

	    },
		move:function(e,scope){
			var
				s = scope.data,
				f = s.flags,
				c = s.tools.selection.element,
				cursorClass = '',
				h={},
				downFlag = (s.flags.mouseEvent=='mousedown'||s.flags.mouseEvent=='touchstart')?true:false
			;
			// set adequate cursor
			if (c && c.typeNum==2){
				if (e.offsetY<5) cursorClass +='n';
				if (e.offsetY>(c.styles.normal.hPx - 5)) cursorClass +='s';
				if (e.offsetX<5) cursorClass +='w';
				if (e.offsetX>(c.styles.normal.wPx - 5)) cursorClass +='e';
				c.cursorClass = cursorClass;
			}
			if (c && c.locked===false){
				//resize or move
				if ((c.typeNum==2) && downFlag){
					console.log(e);
					var
						leftPx = c.styles.normal.lPx,
						topPx = c.styles.normal.tPx
					;
					if(f.resizeLeft||f.resizeTop||f.resizeRight||f.resizeBottom){
						if (f.resizeLeft){
							var lVal = (!s.screen.overflow && e.originalEvent.movementX<0 && leftPx===0)?0:e.originalEvent.movementX;

							s.fn.modifiers.modifyElementArea(scope,'left',lVal);
							s.fn.modifiers.modifyElementArea(scope,'width',(lVal*-1));
						}
						if (f.resizeTop){
							var tVal = (!s.screen.overflow && e.originalEvent.movementY<0 && topPx===0)?0:e.originalEvent.movementY;

							s.fn.modifiers.modifyElementArea(scope,'top',tVal);
							s.fn.modifiers.modifyElementArea(scope,'height',(tVal*-1));
						}
						if (f.resizeRight){
							s.fn.modifiers.modifyElementArea(scope,'width',e.originalEvent.movementX);
						}
						if (f.resizeBottom){
							s.fn.modifiers.modifyElementArea(scope,'height',e.originalEvent.movementY);
						}
					} else {
						s.fn.modifiers.modifyElementArea(scope,'left',e.originalEvent.movementX);
						s.fn.modifiers.modifyElementArea(scope,'top',e.originalEvent.movementY);
					}
				}
			}
		},
	    mousemove:function(e,scope){
			scope.data.tools.selection.move(e,scope);
	    },
	    touchmove:function(e,scope){
			scope.data.tools.selection.move(e,scope);
	    }
	},
	eyedropper:{
		cursor:'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgdmlld0JveD0iMCAwIDE2IDE2IgogICBoZWlnaHQ9IjE2IgogICB3aWR0aD0iMTYiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgIGlkPSJzdmcyIgogICB2ZXJzaW9uPSIxLjEiPjxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTgiPjxyZGY6UkRGPjxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzCiAgICAgaWQ9ImRlZnM2Ij48Y2xpcFBhdGgKICAgICAgIGlkPSJjbGlwUGF0aDE4IgogICAgICAgY2xpcFBhdGhVbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoCiAgICAgICAgIGlkPSJwYXRoMTYiCiAgICAgICAgIGQ9Ik0gMCwxMiBIIDEyIFYgMCBIIDAgWiIgLz48L2NsaXBQYXRoPjwvZGVmcz48ZwogICAgIHRyYW5zZm9ybT0ibWF0cml4KDEuMzMzMzMzMywwLDAsLTEuMzMzMzMzMywwLDE2KSIKICAgICBpZD0iZzEwIj48ZwogICAgICAgaWQ9ImcxMiI+PGcKICAgICAgICAgY2xpcC1wYXRoPSJ1cmwoI2NsaXBQYXRoMTgpIgogICAgICAgICBpZD0iZzE0Ij48ZwogICAgICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEyLDIuMTQ2NSkiCiAgICAgICAgICAgaWQ9ImcyMCI+PHBhdGgKICAgICAgICAgICAgIGlkPSJwYXRoMjIiCiAgICAgICAgICAgICBzdHlsZT0iZmlsbDojMzczNTM1O2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTpub25lIgogICAgICAgICAgICAgZD0ibSAwLDAgYyAwLC0wLjU5MiAtMC4yMSwtMS4wOTggLTAuNjI5LC0xLjUxNyAtMC40MiwtMC40MiAtMC45MjYsLTAuNjI5IC0xLjUxNywtMC42MjkgLTAuNTkyLDAgLTEuMDk1LDAuMjA5IC0xLjUxLDAuNjI5IGwgLTEuNDkzLDEuNTA2IC0wLjY5NywtMC42OTYgQyAtNS44OTEsLTAuNzUyIC01Ljk0MiwtMC43NzMgLTYsLTAuNzczIGMgLTAuMDU4LDAgLTAuMTA5LDAuMDIxIC0wLjE1NCwwLjA2NiBsIC0xLjQwNywxLjQwNiBjIC0wLjA0NCwwLjA0NSAtMC4wNjYsMC4wOTYgLTAuMDY2LDAuMTU1IDAsMC4wNTggMC4wMjIsMC4xMDkgMC4wNjYsMC4xNTQgbCAwLjcwNCwwLjcwMyAtNC4wMzksNC4wMzggYyAtMC4xNjQsMC4xNjUgLTAuMjQ3LDAuMzY2IC0wLjI0NywwLjYwMyBWIDcuNzExIEwgLTEyLDkuNDI1IGwgMC40MjksMC40MjkgMS43MTQsLTAuODU4IGggMS4zNTkgYyAwLjIzNiwwIDAuNDM4LC0wLjA4MiAwLjYwMiwtMC4yNDcgbCA0LjAzOSwtNC4wMzggMC43MDMsMC43MDMgQyAtMy4xMDksNS40NTggLTMuMDU5LDUuNDggLTMsNS40OCBjIDAuMDU5LDAgMC4xMDksLTAuMDIyIDAuMTU0LC0wLjA2NiBsIDEuNDA3LC0xLjQwNiBjIDAuMDQ0LC0wLjA0NSAwLjA2NiwtMC4wOTYgMC4wNjYsLTAuMTU0IDAsLTAuMDU5IC0wLjAyMiwtMC4xMSAtMC4wNjYsLTAuMTU1IEwgLTIuMTM3LDMuMDAzIC0wLjYyOSwxLjUxIEMgLTAuMjEsMS4wOTUgMCwwLjU5MiAwLDAiIC8+PC9nPjxnCiAgICAgICAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMi4xNDI2LDguNTcxMykiCiAgICAgICAgICAgaWQ9ImcyNCI+PHBhdGgKICAgICAgICAgICAgIGlkPSJwYXRoMjYiCiAgICAgICAgICAgICBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTpub25lIgogICAgICAgICAgICAgZD0iTSAwLDAgMy44NTcsLTMuODU3IDUuMTQzLC0yLjU3MSAxLjI4NiwxLjI4NiBIIDAgWiIgLz48L2c+PC9nPjwvZz48L2c+PC9zdmc+), auto',
	    id:'eyedropper',
	    isDefault:false,
	    isActive:false,
	    launcher:'toolbar',
	    label:'Eyedropper',
	    iconClass:'fa fa-eyedropper',
		optionsTemplate:'',
	    element:null,
	    init:function($compile,scope){
			$('#canvas,#guides').hide();
	    },
	    destroy:function(scope){
			$('#canvas,#guides').show();
	    },
	    setUndo:function(args){

	    },
		down:function(args){
			var
				s = args.scope,
				e = args.event,
				c = args.compile,
				t = s.data.tools.eyedropper
			;
			t.element = s.data.fn.tree.searchElementById($(e.target).attr('ob-id'), s.data.tree.root.children);

			if (t.element.typeNum==2) {
				var style = angular.extend({}, t.element.styles.normal);
				delete style.hPx;
				delete style.height;
				delete style.lPx;
				delete style.left;
				delete style.position;
				delete style.tPx;
				delete style.top;
				delete style.wPx;
				delete style.width;
				console.log(style);
				if(s.data.selection.active.typeNum==2){
					s.data.selection.active.styles[s.data.flags.elementState] = angular.extend({},s.data.selection.active.styles[s.data.flags.elementState],style);
				} else {
					s.data.drawStyle['background-color'] = style['background-color'];
					s.data.drawStyle['border-color'] = style['border-color'];
					s.data.drawStyle['border-style'] = style['border-style'];
					s.data.drawStyle['border-width'] = style['border-width'];
				}
			}
		},
	    mousedown:function(args){
			args.scope.data.tools.eyedropper.down(args);
	    },
		touchstart:function(args){
			args.scope.data.tools.eyedropper.down(args);
		},
	    mouseup:function(args){},
		touchend:function(){},
	    mouseleave:function(args){},
	    finishSelect:function(args){},
	    mouseenter:function(args){},
	    mousemove:function(e,scope){},
	    touchmove:function(e,scope){}
	}
};
