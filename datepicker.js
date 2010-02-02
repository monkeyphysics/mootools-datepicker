/**
 * datepicker.js - MooTools Datepicker class
 * @version 1.16
 * 
 * by MonkeyPhysics.com
 *
 * Source/Documentation available at:
 * http://www.monkeyphysics.com/mootools/script/2/datepicker
 * 
 * --
 * 
 * Smoothly animating, very configurable and easy to install.
 * No Ajax, pure Javascript. 4 skins available out of the box.
 * 
 * --
 *
 * Some Rights Reserved
 * http://creativecommons.org/licenses/by-sa/3.0/
 * 
 */

var DatePicker = new Class({
	
	Implements: [Options, Events],
	
	// working date, which we will keep modifying to render the calendars
	d: '',
	
	// just so that we need not request it over and over
	today: '',
	
	// current user-choice in date object format
	choice: {}, 
	
	// size of body, used to animate the sliding
	bodysize: {}, 
	
	// to check availability of next/previous buttons
	limit: {}, 
	
	// element references:
	attachTo: null,    // selector for target inputs
	picker: null,      // main datepicker container
	slider: null,      // slider that contains both oldContents and newContents, used to animate between 2 different views
	oldContents: null, // used in animating from-view to new-view
	newContents: null, // used in animating from-view to new-view
	input: null,       // original input element (used for input/output)
	visual: null,      // visible input (used for rendering)
	
	options: { 
		pickerClass: 'datepicker',
		days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		dayShort: 2,
		monthShort: 3,
		startDay: 1, // Sunday (0) through Saturday (6) - be aware that this may affect your layout, since the days on the right might have a different margin
		timePicker: false,
		timePickerOnly: false,
		yearPicker: true,
		yearsPerPage: 20,
		format: '%d-%m-%Y',
		allowEmpty: true,
		animationDuration: 400,
		useFadeInOut: !Browser.Engine.trident, // dont animate fade-in/fade-out for IE
		startView: 'month', // allowed values: {time, month, year, decades}
		positionOffset: { x: 0, y: 0 },
		minDate: null, // { date: '[date-string]', format: '[date-string-interpretation-format]' }
		maxDate: null, // same as minDate
		debug: false,
		toggleElements: null,
		draggable: true,
		
		// and some event hooks:
		onShow: $empty,   // triggered when the datepicker pops up
		onClose: $empty,  // triggered after the datepicker is closed (destroyed)
		onSelect: $empty  // triggered when a date is selected
	},
	
	initialize: function(attachTo, options) {
		this.attachTo = attachTo;
		this.setOptions(options).attach();
		if (this.options.timePickerOnly) {
			this.options.timePicker = true;
			this.options.startView = 'time';
		}
		this.formatMinMaxDates();
		document.addEvent('mousedown', this.close.bind(this));
	},
	
	formatMinMaxDates: function() {
		if (this.options.minDate && this.options.minDate.inputFormat) {  //cbaxter changed minDate.format for minDate.inputFormat to address issues when implemented with MooTools.Date extension due to date.format() being confused with date.format string
			this.options.minDate = this.unformat(this.options.minDate.date, this.options.minDate.inputFormat);
		}
		if (this.options.maxDate && this.options.maxDate.inputFormat) {
			this.options.maxDate = this.unformat(this.options.maxDate.date, this.options.maxDate.inputFormat);
			this.options.maxDate.setHours(23);
			this.options.maxDate.setMinutes(59);
			this.options.maxDate.setSeconds(59);
		}
	},
	
	attach: function() {
		// toggle the datepicker through a separate element?
		if ($chk(this.options.toggleElements)) {
			var togglers = $$(this.options.toggleElements);
			document.addEvents({
				'keydown': function(e) {
					if (e.key == "tab") {
						this.close(null, true);
					}
				}.bind(this)
			});
		};
		
		// attach functionality to the inputs		
		$$(this.attachTo).each(function(item, index) {
			
			// never double attach
			if (item.retrieve('datepicker')) return;
			
			// determine starting value(s)
			if ($chk(item.get('value'))) {
				var init_val = this.format(this.unformat(item.get('value'),this.options.format), this.options.format);
			} else if (!this.options.allowEmpty) {
				var init_val = this.format(new Date(), this.options.format);
			} else {
				var init_val = '';
			}
			
			
			item.store('datepicker', true); // to prevent double attachment...
			
			// events
			if ($chk(this.options.toggleElements)) {
				togglers[index]
					.setStyle('cursor', 'pointer')
					.addEvents({
						'click': function(e) {
							this.onFocus(item);
						}.bind(this)
					});
			} else {
				item.addEvents({
					'keydown': function(e) {
						if (this.options.allowEmpty && (e.key == "delete" || e.key == "backspace")) {
							item.set('value', '');
							this.close(null, true);
						} else if (e.key == "tab") {
							this.close(null, true);
						} else {
							e.stop();
						}
					}.bind(this),
					'focus': function(e) {
						this.onFocus(item);
					}.bind(this)
				});
			}
		}.bind(this));
	},
	
	onFocus: function(input) {
		var input_date, d = input.getCoordinates();
		
		if ($chk(input.get('value'))) {
			input_date = this.unformat(input.get('value'),this.options.format).valueOf();
		} else {
			input_date = new Date();
			if ($chk(this.options.maxDate) && input_date.valueOf() > this.options.maxDate.valueOf()) {
				input_date = new Date(this.options.maxDate.valueOf());
			}
			if ($chk(this.options.minDate) && input_date.valueOf() < this.options.minDate.valueOf()) {
				input_date = new Date(this.options.minDate.valueOf());
			}
		}
		
		this.input = input;
		this.show({ left: d.left + this.options.positionOffset.x, top: d.top + d.height + this.options.positionOffset.y }, input_date);
		this.fireEvent('show');
	},
	
	dateToObject: function(d) {
		return {
			year: d.getFullYear(),
			month: d.getMonth(),
			day: d.getDate(),
			hours: d.getHours(),
			minutes: d.getMinutes(),
			seconds: d.getSeconds()
		};
	},
	
	dateFromObject: function(values) {
		var d = new Date();
		d.setDate(1);
		['year', 'month', 'day', 'hours', 'minutes', 'seconds'].each(function(type) {
			var v = values[type];
			if (!$chk(v)) return;
			switch (type) {
				case 'day': d.setDate(v); break;
				case 'month': d.setMonth(v); break;
				case 'year': d.setFullYear(v); break;
				case 'hours': d.setHours(v); break;
				case 'minutes': d.setMinutes(v); break;
				case 'seconds': d.setSeconds(v); break;
			}
		});
		return d;
	},
	
	show: function(position, timestamp) {
		this.formatMinMaxDates();
		if ($chk(timestamp)) {
			this.d = new Date(timestamp);
		} else {
			this.d = new Date();
		}
		this.today = new Date();
		this.choice = this.dateToObject(this.d);
		this.mode = (this.options.startView == 'time' && !this.options.timePicker) ? 'month' : this.options.startView;
		this.render();
		this.position({x: position.left, y: position.top});
		
		if(this.options.draggable && $type(this.picker.makeDraggable) == 'function') {
      this.dragger = this.picker.makeDraggable();
      this.picker.setStyle('cursor', 'move');
    }
    
    if(Browser.Engine.trident) this.shim();
	},

	shim: function() {				
		var coords = this.picker.setStyle('zIndex', 1000).getCoordinates();
		this.frame = new Element('iframe', {
			src: 'javascript:false;document.write("");',
			styles: {
				position: 'absolute',
				zIndex: 999,
				height: coords.height, width: coords.width,
				left: coords.left, top: coords.top
			}
		}).inject(document.body);
		this.frame.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)';
    
    this.addEvent('close', function() {this.destroy()}.bind(this.frame));
    
    if(this.options.draggable) {
      this.dragger.addEvent('drag', function() {
          var coords = this.picker.getCoordinates();
					this.frame.setStyles({left: coords.left, top: coords.top});
      }.bind(this));
    }
	},

	position: function(p) {
		var w = window.getSize(),
			s = window.getScroll(),
			d = this.picker.getSize(),
			max_y = (w.y + s.y) - d.y,
			max_x = (w.x + s.x) - d.x,
			i = this.input.getCoordinates();
			
		if(p.x > max_x) p.x = i.right - this.options.positionOffset.x - d.x;
		if(p.y > max_y) p.y = i.top - this.options.positionOffset.y - d.y;
		
		this.picker.setStyles({left: p.x, top: p.y});
	},
		
	render: function(fx) {
		if (!$chk(this.picker)) {
			this.constructPicker();
		} else {
			// swap contents so we can fill the newContents again and animate
			var o = this.oldContents;
			this.oldContents = this.newContents;
			this.newContents = o;
			this.newContents.empty();
		}
		
		// remember current working date
		var startDate = new Date(this.d.getTime());
		
		// intially assume both left and right are allowed
		this.limit = { right: false, left: false };
		
		// render! booty!
		if (this.mode == 'decades') {
			this.renderDecades();
		} else if (this.mode == 'year') {
			this.renderYear();
		} else if (this.mode == 'time') {
			this.renderTime();
			this.limit = { right: true, left: true }; // no left/right in timeview
		} else {
			this.renderMonth();
		}
		
		this.picker.getElement('.previous').setStyle('visibility', this.limit.left ? 'hidden' : 'visible');
		this.picker.getElement('.next').setStyle('visibility', this.limit.right ? 'hidden' : 'visible');
		this.picker.getElement('.titleText').setStyle('cursor', this.allowZoomOut() ? 'pointer' : 'default');
		
		// restore working date
		this.d = startDate;
		
		// if ever the opacity is set to '0' it was only to have us fade it in here
		// refer to the constructPicker() function, which instantiates the picker at opacity 0 when fading is desired
		if (this.picker.getStyle('opacity') == 0) {
			this.picker.tween('opacity', 0, 1);
		}
		
		// animate
		if ($chk(fx)) this.fx(fx);
	},
	
	fx: function(fx) {
		if (fx == 'right') {
			this.oldContents.setStyles({ left: 0, opacity: 1 });
			this.newContents.setStyles({ left: this.bodysize.x, opacity: 1 });
			this.slider.setStyle('left', 0).tween('left', 0, -this.bodysize.x);
		} else if (fx == 'left') {
			this.oldContents.setStyles({ left: this.bodysize.x, opacity: 1 });
			this.newContents.setStyles({ left: 0, opacity: 1 });
			this.slider.setStyle('left', -this.bodysize.x).tween('left', -this.bodysize.x, 0);
		} else if (fx == 'fade') {
			this.slider.setStyle('left', 0);
			this.oldContents.setStyle('left', 0).set('tween', { duration: this.options.animationDuration / 2 }).tween('opacity', 1, 0);
			this.newContents.setStyles({ opacity: 0, left: 0}).set('tween', { duration: this.options.animationDuration }).tween('opacity', 0, 1);
		}
	},
	
	constructPicker: function() {
		this.picker = new Element('div', { 'class': this.options.pickerClass }).inject(document.body);
		if (this.options.useFadeInOut) {
			this.picker.setStyle('opacity', 0).set('tween', { duration: this.options.animationDuration });
		}
		
		var h = new Element('div', { 'class': 'header' }).inject(this.picker);
		var titlecontainer = new Element('div', { 'class': 'title' }).inject(h);
		new Element('div', { 'class': 'previous' }).addEvent('click', this.previous.bind(this)).set('text', '«').inject(h);
		new Element('div', { 'class': 'next' }).addEvent('click', this.next.bind(this)).set('text', '»').inject(h);
		new Element('div', { 'class': 'closeButton' }).addEvent('click', this.close.bindWithEvent(this, true)).set('text', 'x').inject(h);
		new Element('span', { 'class': 'titleText' }).addEvent('click', this.zoomOut.bind(this)).inject(titlecontainer);
		
		var b = new Element('div', { 'class': 'body' }).inject(this.picker);
		this.bodysize = b.getSize();
		this.slider = new Element('div', { styles: { position: 'absolute', top: 0, left: 0, width: 2 * this.bodysize.x, height: this.bodysize.y }})
					.set('tween', { duration: this.options.animationDuration, transition: Fx.Transitions.Quad.easeInOut }).inject(b);
		this.oldContents = new Element('div', { styles: { position: 'absolute', top: 0, left: this.bodysize.x, width: this.bodysize.x, height: this.bodysize.y }}).inject(this.slider);
		this.newContents = new Element('div', { styles: { position: 'absolute', top: 0, left: 0, width: this.bodysize.x, height: this.bodysize.y }}).inject(this.slider);
	},
	
	renderTime: function() {
		var container = new Element('div', { 'class': 'time' }).inject(this.newContents);
		
		if (this.options.timePickerOnly) {
			this.picker.getElement('.titleText').set('text', 'Select a time');
		} else {
			this.picker.getElement('.titleText').set('text', this.format(this.d, 'j M, Y'));
		}
		
		new Element('input', { type: 'text', 'class': 'hour' })
			.set('value', this.leadZero(this.d.getHours()))
			.addEvents({
				mousewheel: function(e) {
					var i = e.target, v = i.get('value').toInt();
					i.focus();
					if (e.wheel > 0) {
						v = (v < 23) ? v + 1 : 0;
					} else {
						v = (v > 0) ? v - 1 : 23;
					}
					i.set('value', this.leadZero(v));
					e.stop();
				}.bind(this)
			})
			.set('maxlength', 2)
			.inject(container);
			
		new Element('input', { type: 'text', 'class': 'minutes' })
			.set('value', this.leadZero(this.d.getMinutes()))
			.addEvents({
				mousewheel: function(e) {
					var i = e.target, v = i.get('value').toInt();
					i.focus();
					if (e.wheel > 0) {
						v = (v < 59) ? v + 1 : 0;
					} else {
						v = (v > 0) ? v - 1 : 59;
					}
					i.set('value', this.leadZero(v));
					e.stop();
				}.bind(this)
			})
			.set('maxlength', 2)
			.inject(container);
		
		new Element('div', { 'class': 'separator' }).set('text', ':').inject(container);
		
		new Element('input', { type: 'submit', value: 'OK', 'class': 'ok' })
			.addEvents({
				click: function(e) {
					e.stop();
					this.select($merge(this.dateToObject(this.d), { hours: this.picker.getElement('.hour').get('value').toInt(), minutes: this.picker.getElement('.minutes').get('value').toInt() }));
				}.bind(this)
			})
			.set('maxlength', 2)
			.inject(container);
	},
	
	renderMonth: function() {
		var month = this.d.getMonth();
		
		this.picker.getElement('.titleText').set('text', this.options.months[month] + ' ' + this.d.getFullYear());
		
		this.d.setDate(1);
		while (this.d.getDay() != this.options.startDay) {
			this.d.setDate(this.d.getDate() - 1);
		}
		
		var container = new Element('div', { 'class': 'days' }).inject(this.newContents);
		var titles = new Element('div', { 'class': 'titles' }).inject(container);
		var d, i, classes, e, weekcontainer;

		for (d = this.options.startDay; d < (this.options.startDay + 7); d++) {
			new Element('div', { 'class': 'title day day' + (d % 7) }).set('text', this.options.days[(d % 7)].substring(0,this.options.dayShort)).inject(titles);
		}
		
		var available = false;
		var t = this.today.toDateString();
		var currentChoice = this.dateFromObject(this.choice).toDateString();
		
		for (i = 0; i < 42; i++) {
			classes = [];
			classes.push('day');
			classes.push('day'+this.d.getDay());
			if (this.d.toDateString() == t) classes.push('today');
			if (this.d.toDateString() == currentChoice) classes.push('selected');
			if (this.d.getMonth() != month) classes.push('otherMonth');
			
			if (i % 7 == 0) {
				weekcontainer = new Element('div', { 'class': 'week week'+(Math.floor(i/7)) }).inject(container);
			}
			
			e = new Element('div', { 'class': classes.join(' ') }).set('text', this.d.getDate()).inject(weekcontainer);
			if (this.limited('date')) {
				e.addClass('unavailable');
				if (available) {
					this.limit.right = true;
				} else if (this.d.getMonth() == month) {
					this.limit.left = true;
				}
			} else {
				available = true;
				e.addEvent('click', function(e, d) {
					if (this.options.timePicker) {
						this.d.setDate(d.day);
						this.d.setMonth(d.month);
						this.mode = 'time';
						this.render('fade');
					} else {
						this.select(d);
					}
				}.bindWithEvent(this, { day: this.d.getDate(), month: this.d.getMonth(), year: this.d.getFullYear() }));
			}
			this.d.setDate(this.d.getDate() + 1);
		}
		if (!available) this.limit.right = true;
	},
	
	renderYear: function() {
		var month = this.today.getMonth();
		var thisyear = this.d.getFullYear() == this.today.getFullYear();
		var selectedyear = this.d.getFullYear() == this.choice.year;
		
		this.picker.getElement('.titleText').set('text', this.d.getFullYear());
		this.d.setMonth(0);
		if ($chk(this.options.minDate) {
			this.d.decrement('month',1)
			this.d.set('date',this.d.get('lastdayofmonth'));
			if (this.limited('month')) {
				this.limit.left = true;
			}
			this.d.increment('month',1)
		}
		this.d.set('date',this.d.get('lastdayofmonth'))		
		var i, e;
		var available = false;
		var container = new Element('div', { 'class': 'months' }).inject(this.newContents);
		
		for (i = 0; i <= 11; i++) {
			e = new Element('div', { 'class': 'month month'+(i+1)+(i == month && thisyear ? ' today' : '')+(i == this.choice.month && selectedyear ? ' selected' : '') })
			.set('text', this.options.monthShort ? this.options.months[i].substring(0, this.options.monthShort) : this.options.months[i]).inject(container);
			
			if (this.limited('month')) {
				e.addClass('unavailable');
				if (available) {
					this.limit.right = true;
				} else {
					this.limit.left = true;
				}
			} else {
				available = true;
				e.addEvent('click', function(e, d) {
					this.d.setDate(1);
					this.d.setMonth(d);
					this.mode = 'month';
					this.render('fade');
				}.bindWithEvent(this, i));
			}
			this.d.increment('month',1)
			this.d.set('date',this.d.get('lastdayofmonth'))
		}
		if (!available) this.limit.right = true;
	},
	
	renderDecades: function() {
		// start neatly at interval (eg. 1980 instead of 1987)
		while (this.d.getFullYear() % this.options.yearsPerPage > 0) {
			this.d.setFullYear(this.d.getFullYear() - 1);
		}

		this.picker.getElement('.titleText').set('text', this.d.getFullYear() + '-' + (this.d.getFullYear() + this.options.yearsPerPage - 1));
		
		var i, y, e;
		var available = false;
		var container = new Element('div', { 'class': 'years' }).inject(this.newContents);
		
		if ($chk(this.options.minDate) && this.d.getFullYear() <= this.options.minDate.getFullYear()) {
			this.limit.left = true;
		}
		
		for (i = 0; i < this.options.yearsPerPage; i++) {
			y = this.d.getFullYear();
			e = new Element('div', { 'class': 'year year' + i + (y == this.today.getFullYear() ? ' today' : '') + (y == this.choice.year ? ' selected' : '') }).set('text', y).inject(container);
			
			if (this.limited('year')) {
				e.addClass('unavailable');
				if (available) {
					this.limit.right = true;
				} else {
					this.limit.left = true;
				}
			} else {
				available = true;
				e.addEvent('click', function(e, d) {
					this.d.setFullYear(d);
					this.mode = 'year';
					this.render('fade');
				}.bindWithEvent(this, y));
			}
			this.d.setFullYear(this.d.getFullYear() + 1);
		}
		if (!available) {
			this.limit.right = true;
		}
		if ($chk(this.options.maxDate) && this.d.getFullYear() >= this.options.maxDate.getFullYear()) {
			this.limit.right = true;
		}
	},
	
	limited: function(type) {
		var cs = $chk(this.options.minDate);
		var ce = $chk(this.options.maxDate);
		if (!cs && !ce) return false;
		
		switch (type) {
			case 'year':
				return (cs && this.d.getFullYear() < this.options.minDate.getFullYear()) || (ce && this.d.getFullYear() > this.options.maxDate.getFullYear());
				
			case 'month':
				// todo: there has got to be an easier way...?
				var ms = ('' + this.d.getFullYear() + this.leadZero(this.d.getMonth())).toInt();
				return cs && ms < ('' + this.options.minDate.getFullYear() + this.leadZero(this.options.minDate.getMonth())).toInt()
					|| ce && ms > ('' + this.options.maxDate.getFullYear() + this.leadZero(this.options.maxDate.getMonth())).toInt()
				
			case 'date':
				return (cs && this.d < this.options.minDate) || (ce && this.d > this.options.maxDate);
		}
	},
	
	allowZoomOut: function() {
		if (this.mode == 'time' && this.options.timePickerOnly) return false;
		if (this.mode == 'decades') return false;
		if (this.mode == 'year' && !this.options.yearPicker) return false;
		return true;
	},
	
	zoomOut: function() {
		if (!this.allowZoomOut()) return;
		if (this.mode == 'year') {
			this.mode = 'decades';
		} else if (this.mode == 'time') {
			this.mode = 'month';
		} else {
			this.mode = 'year';
		}
		this.render('fade');
	},
	
	previous: function() {
		if (this.mode == 'decades') {
			this.d.setFullYear(this.d.getFullYear() - this.options.yearsPerPage);
		} else if (this.mode == 'year') {
			this.d.setFullYear(this.d.getFullYear() - 1);
		} else if (this.mode == 'month') {
			this.d.setDate(1);
			this.d.setMonth(this.d.getMonth() - 1);
		}
		this.render('left');
	},
	
	next: function() {
		if (this.mode == 'decades') {
			this.d.setFullYear(this.d.getFullYear() + this.options.yearsPerPage);
		} else if (this.mode == 'year') {
			this.d.setFullYear(this.d.getFullYear() + 1);
		} else if (this.mode == 'month') {
			this.d.setDate(1);
			this.d.setMonth(this.d.getMonth() + 1);
		}
		this.render('right');
	},
	
	close: function(e, force) {
		if (!$(this.picker)) return;
		var clickOutside = ($chk(e) && e.target != this.picker && !this.picker.hasChild(e.target) && e.target != this.visual);
		if (force || clickOutside) {
			if (this.options.useFadeInOut) {
				this.picker.set('tween', { duration: this.options.animationDuration / 2, onComplete: this.destroy.bind(this) }).tween('opacity', 1, 0);
			} else {
				this.destroy();
			}
		}
	},
	
	destroy: function() {
		this.picker.destroy();
		this.picker = null;
		this.fireEvent('close');
	},
	
	select: function(values) {
		this.choice = $merge(this.choice, values);
		var d = this.dateFromObject(this.choice);
		this.input.set('value', this.format(d, this.options.format));
		this.fireEvent('select', this, [d]);
		
		this.close(null, true);
	},
	
	leadZero: function(v) {
		return v < 10 ? '0'+v : v;
	},
	
	format: function(t, format) {
		return new Date(t).format(format);
	},
	
	unformat: function(t,format) {
		Date.defineParser(format);
		t = Date.parse(t);
		
		if(!t.isValid()) {
			t = new Date();
		}
		
		t = (t.get('year') < 1900) ? new Date() : t;
		
		return t;
	}
});
