// thooClock, a jQuery Clock with alarm function
// by Thomas Haaf aka thooyork, http://www.smart-sign.com
// Twitter: @thooyork
// Version 0.9.20
// Copyright (c) 2013 thooyork

// MIT License, http://opensource.org/licenses/MIT


(function( $ ) {

	$.thooClock = function(element, options) {

		var cnv,
			ctx,
			timerId;

		var defaults = {
			size:250,
			dialColor:'#000000',
			dialBackgroundColor:'transparent',
			secondHandColor:'#F3A829',
			minuteHandColor:'#222222',
			hourHandColor:'#222222',
			alarmHandColor:'#FFFFFF',
			alarmHandTipColor:'#026729',
			hourCorrection:'+0',
			alarmCount:1,
			showNumerals:true
		};

		var thooClock = this;

		var settings = {};

		var $element = $(element),
			element = element;

		thooClock.init = function() {
			settings = $.extend({}, defaults, options);

			//listener
			if(settings.onAlarm !== undefined){
				$element.on('onAlarm', function(e){
					settings.onAlarm();
					e.preventDefault();
					e.stopPropagation();
				});
			}

			if(settings.onEverySecond !== undefined){
				$element.on('onEverySecond', function(e){
					settings.onEverySecond();
					e.preventDefault();
				});
			}

			if(settings.offAlarm !== undefined){
				$element.on('offAlarm', function(e){
					settings.offAlarm();
					e.stopPropagation();
					e.preventDefault();
				});
			}

			cnv = document.createElement('canvas');
			ctx = cnv.getContext('2d');

			cnv.width = settings.size;
			cnv.height = settings.size;

			//append canvas to element
			$(cnv).appendTo(element);

			radius = parseInt(settings.size / 2, 10);
			//translate 0,0 to center of circle:
			ctx.translate(radius, radius); 

			startClock(0,0);
		}

		//set alarmtime from outside:
		thooClock.setAlarm = function(newtime) {
			var thedate;
			if(newtime instanceof Date){
				// keep date object
				thedate = newtime;
			} else {
				//convert from string formatted like hh[:mm[:ss]]]
				var arr = newtime.split(':');
				thedate = new Date();
				for (var i = 0; i < 3 ; i++){
					//force to int
					arr[i] = Math.floor(arr[i]);
					//check if NaN or invalid min/sec
					if (arr[i] !== arr[i] || arr[i] > 59) arr[i] = 0;
					//no more than 24h
					if (i == 0 && arr[i] > 23) arr[i] = 0;
				}
				thedate.setHours(arr[0], arr[1], arr[2]);
			}
			settings.alarmTime = thedate;   
		};

		thooClock.clearAlarm = function() {
			settings.alarmTime = undefined;
			$element.trigger('offAlarm');
		};

		thooClock.setSize = function(newSize) {
			settings.size = newSize;

			cnv.width = settings.size;
			cnv.height = settings.size;

			radius = parseInt(settings.size / 2, 10);
			//translate 0,0 to center of circle:
			ctx.translate(radius, radius); 

			if (timerId !== undefined) {
				clearTimeout(timerId);
			}

			startClock(0,0);
		};


		var toRadians = function(deg) {
			return ( Math.PI / 180 ) * deg;
		}

		var drawDial = function(color, bgcolor) {
			var dialRadius,
				dialBackRadius,
				i,
				ang,
				sang,
				cang,
				sx,
				sy,
				ex,
				ey,
				nx,
				ny,
				text,
				textSize,
				textWidth,
				brandtextWidth,
				brandtextWidth2;

			dialRadius = parseInt(radius-(settings.size/50), 10);
			dialBackRadius = radius-(settings.size/400);

			ctx.beginPath();
			ctx.arc(0,0,dialBackRadius,0,360,false);
			ctx.fillStyle = bgcolor;
			ctx.fill();

			for (i=1; i<=60; i+=1) {
				ang=Math.PI/30*i;
				sang=Math.sin(ang);
				cang=Math.cos(ang);
				//hour marker/numeral
				if (i % 5 === 0) {
					ctx.lineWidth = parseInt(settings.size/50,10);
					sx = sang * (dialRadius - dialRadius/9);
					sy = cang * -(dialRadius - dialRadius/9);
					ex = sang * dialRadius;
					ey = cang * - dialRadius;
					nx = sang * (dialRadius - dialRadius/4.2);
					ny = cang * -(dialRadius - dialRadius/4.2);
					text = i/5;
					ctx.textBaseline = 'middle';
					textSize = parseInt(settings.size/13,10);
					ctx.font = '100 ' + textSize + 'px helvetica';
					textWidth = ctx.measureText (text).width;
					ctx.beginPath();
					ctx.fillStyle = color;

					if(settings.showNumerals){
						ctx.fillText(text,nx-(textWidth/2),ny);
					}
				//minute marker
				} else {
					ctx.lineWidth = parseInt(settings.size/100,10);
					sx = sang * (dialRadius - dialRadius/20);
					sy = cang * -(dialRadius - dialRadius/20);
					ex = sang * dialRadius;
					ey = cang * - dialRadius;
				}

				ctx.beginPath();
				ctx.strokeStyle = color;
				ctx.lineCap = "round";
				ctx.moveTo(sx,sy);
				ctx.lineTo(ex,ey);
				ctx.stroke();
			} 

			if(settings.brandText !== undefined){
				ctx.font = '100 ' + parseInt(settings.size/28,10) + 'px helvetica';
				brandtextWidth = ctx.measureText (settings.brandText).width;
				ctx.fillText(settings.brandText,-(brandtextWidth/2),(settings.size/6)); 
			}

			if(settings.brandText2 !== undefined){
				ctx.textBaseline = 'middle';
				ctx.font = '100 ' + parseInt(settings.size/44,10) + 'px helvetica';
				brandtextWidth2 = ctx.measureText (settings.brandText2).width;
				ctx.fillText(settings.brandText2,-(brandtextWidth2/2),(settings.size/5)); 
			}
		}

		var twelvebased = function(hour) {
			if(hour >= 12){
				hour = hour - 12;
			}
			return hour;
		}

		var drawHand = function(length) {
			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.lineTo(0, length * -1);
			ctx.stroke();
		}

		var drawSecondHand = function(seconds, color) {
			var shlength = (radius)-(settings.size/40);
			
			ctx.save();
			ctx.lineWidth = parseInt(settings.size/150,10);
			ctx.lineCap = "round";
			ctx.strokeStyle = color;
			ctx.rotate( toRadians(seconds * 6));

			ctx.shadowColor = 'rgba(0,0,0,.5)';
			ctx.shadowBlur = parseInt(settings.size/80,10);
			ctx.shadowOffsetX = parseInt(settings.size/200,10);
			ctx.shadowOffsetY = parseInt(settings.size/200,10);

			drawHand(shlength);

			//tail of secondhand
			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.lineTo(0, shlength/15);
			ctx.lineWidth = parseInt(settings.size/30,10);
			ctx.stroke();

			//round center
			ctx.beginPath();
			ctx.arc(0, 0, parseInt(settings.size/30,10), 0, 360, false);
			ctx.fillStyle = color;

			ctx.fill();
			ctx.restore();
		}

		var drawMinuteHand = function(minutes, color) {
			var mhlength = settings.size/2.2;
			ctx.save();
			ctx.lineWidth = parseInt(settings.size/50,10);
			ctx.lineCap = "round";
			ctx.strokeStyle = color;
			ctx.rotate( toRadians(minutes * 6));

			ctx.shadowColor = 'rgba(0,0,0,.5)';
			ctx.shadowBlur = parseInt(settings.size/50,10);
			ctx.shadowOffsetX = parseInt(settings.size/250,10);
			ctx.shadowOffsetY = parseInt(settings.size/250,10);

			drawHand(mhlength);
			ctx.restore();
		}

		var drawHourHand = function(hours, color) {
			var hhlength = settings.size/3;
			ctx.save();
			ctx.lineWidth = parseInt(settings.size/25, 10);
			ctx.lineCap = "round";
			ctx.strokeStyle = color;
			ctx.rotate( toRadians(hours * 30));

			ctx.shadowColor = 'rgba(0,0,0,.5)';
			ctx.shadowBlur = parseInt(settings.size/50, 10);
			ctx.shadowOffsetX = parseInt(settings.size/300, 10);
			ctx.shadowOffsetY = parseInt(settings.size/300, 10);

			drawHand(hhlength);
			ctx.restore();
		}

		var timeToDecimal = function(time) {
				var h,
					m;
				if(time !== undefined){
					h = twelvebased(time.getHours());
					m = time.getMinutes();
				}
				return parseInt(h,10) + (m/60);
			}

		var drawAlarmHand = function(alarm, color, tipcolor) {
			var ahlength = settings.size/2.4;

			ctx.save();
			ctx.lineWidth = parseInt(settings.size/30, 10);
			ctx.lineCap = "butt";
			ctx.strokeStyle = color;

			//decimal equivalent to hh:mm
			alarm = timeToDecimal(alarm);
			ctx.rotate( toRadians(alarm * 30));

			ctx.shadowColor = 'rgba(0,0,0,.5)';
			ctx.shadowBlur = parseInt(settings.size/55, 10);
			ctx.shadowOffsetX = parseInt(settings.size/300, 10);
			ctx.shadowOffsetY = parseInt(settings.size/300, 10);

			//drawHand(ahlength);

			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.lineTo(0, (ahlength-(settings.size/10)) * -1);
			ctx.stroke();

			ctx.beginPath();
			ctx.strokeStyle = tipcolor;
			ctx.moveTo(0, (ahlength-(settings.size/10)) * -1);
			ctx.lineTo(0, (ahlength) * -1);
			ctx.stroke();

			//round center
			ctx.beginPath();
			ctx.arc(0, 0, parseInt(settings.size/24, 10), 0, 360, false);
			ctx.fillStyle = color;
			ctx.fill();
			ctx.restore();
		}

		var numberCorrection = function(num) {
			if(num !== '+0' && num !== ''){
				if(num.charAt(0) === '+'){
					//addNum
					return + num.charAt(1);
				} else {
					//subNum
					return - num.charAt(1);
				}
			} else {
				return 0;
			}
		}

		var startClock = function(x,y) {
			var theDate,
				s,
				m,
				hours,
				mins,
				h,
				exth,
				extm,
				allExtM,
				allAlarmM,
				atime;

			theDate = new Date();
			s = theDate.getSeconds();
			mins = theDate.getMinutes();
			m = mins + (s/60);
			hours = theDate.getHours();
			h = twelvebased(hours + numberCorrection(settings.hourCorrection)) + (m/60);

			ctx.clearRect(-radius,-radius,settings.size,settings.size);

			drawDial(settings.dialColor, settings.dialBackgroundColor);

			if(settings.alarmTime !== undefined){
				drawAlarmHand(settings.alarmTime, settings.alarmHandColor, settings.alarmHandTipColor);
			}
			drawHourHand(h, settings.hourHandColor);
			drawMinuteHand(m, settings.minuteHandColor);
			drawSecondHand(s, settings.secondHandColor);

			//trigger every second custom event
			y+=1;
			if(y===1){
				$element.trigger('onEverySecond');
				y=0;
			}

			if(settings.alarmTime !== undefined){
				allExtM = (settings.alarmTime.getHours()*60*60) + (settings.alarmTime.getMinutes() *60) + settings.alarmTime.getSeconds();
			}

			allAlarmM = (hours*60*60) + (mins*60) + s;

			//set alarm loop counter
			//if(h >= timeToDecimal(twelvebased(settings.alarmTime)){

			//alarmMinutes greater than passed Minutes;
			if(allAlarmM >= allExtM){
				x+=1; 
			}
			//trigger alarm for as many times as i < alarmCount
			if(x <= settings.alarmCount && x !== 0){
				$element.trigger('onAlarm');
			}
			var synced_delay = 1000 - ((new Date().getTime()) % 1000);
			timerId = setTimeout(function(){startClock(x,y);},synced_delay);
		}

		thooClock.init();
	}

	$.fn.thooClock = function(options) {

		return this.each(function() {
			if (undefined == $(this).data('thooClock')) {
				var plugin = new $.thooClock(this, options);
				$(this).data('thooClock', plugin);
			}
		});

	}

}(jQuery));