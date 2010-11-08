/*
---
name: Picker
description: Creates a Picker
authors: Arian Stolwijk
requires: [Core/Element.Dimensions, Core/Fx.Tween, Core/Fx.Transitions]
provides: Picker
...
*/


var Picker = new Class({

	Implements: [Options, Events],

	options: {/*
		onShow: function(){},
		onOpen: function(){},
		onHide: function(){},
		onClose: function(){},*/

		pickerClass: 'datepicker',
		inject: null,
		animationDuration: 400,
		useFadeInOut: true,
		positionOffset: {x: 0, y: 0},
		pickerPosition: 'right',
		draggable: true,
		showOnInit: true
	},

	initialize: function(options){
		this.setOptions(options);
		this.constructPicker();
		if (this.options.showOnInit) this.show();
	},

	constructPicker: function(){
		var options = this.options;

		var picker = this.picker = new Element('div', {
			'class': options.pickerClass,
			styles: {opacity: 0, left: 0, top: 0}
		}).inject(options.inject || document.body);

		if (this.options.useFadeInOut){
			this.picker.set('tween', {
				duration: this.options.animationDuration,
				link: 'cancel'
			});
		}

		// Build the header
		var header = this.header = new Element('div.header').inject(picker);

		this.closeButton = new Element('div.closeButton[text=x]')
			.addEvent('click', this.close.pass(false, this))
			.inject(header);

		this.previous = new Element('div.previous[html=&#171;]').inject(header);
		this.next = new Element('div.next[html=&#187;]').inject(header);

		var title = this.title = new Element('div.title').inject(header);
		this.titleText = new Element('div.titleText').inject(title);

		// Build the body of the picker
		var body = this.body = new Element('div.body').inject(picker);

		// oldContents and newContents are used to slide from the old content to a new one.
		var bodysize = this.bodysize = body.getSize();

		this.pickersize = picker.getSize();
		picker.setStyle('display', 'none');

		var slider = this.slider = new Element('div', {
			styles: {
				position: 'absolute',
				top: 0,
				left: 0,
				width: 2 * bodysize.x,
				height: bodysize.y
			}
		}).set('tween', {
			duration: options.animationDuration,
			transition: Fx.Transitions.Quad.easeInOut
		}).inject(body);

		this.oldContents = new Element('div', {
			styles: {
				position: 'absolute',
				top: 0,
				left: bodysize.x,
				width: bodysize.x,
				height: bodysize.y
			}
		}).inject(slider);

		this.newContents = new Element('div', {
			styles: {
				position: 'absolute',
				top: 0,
				left: 0,
				width: bodysize.x,
				height: bodysize.y
			}
		}).inject(slider);

		// IFrameShim for select fields in IE
		var shim = this.shim = new IframeShim(this.picker);

		// Dragging
		if (options.draggable && typeOf(picker.makeDraggable) == 'function'){
			this.dragger = picker.makeDraggable({
				onDrag: function(){
					shim.position();
				}
			});
			picker.setStyle('cursor', 'move');
		}

		this.addEvent('open', function(){
			this.picker.setStyle('display', 'block');
			this.shim.show.delay(1, this.shim);
		}.bind(this), true);

		this.addEvent('hide', function(){
			this.picker.setStyle('display', 'none');
			this.shim.hide();
		}.bind(this), true);

	},

	open: function(noFx){
		if (this.opened == true) return this;
		this.opened = true;
		this.fireEvent('open');
		if (this.options.useFadeInOut && !noFx){
			this.picker.fade('in').get('tween').chain(function(){
				this.fireEvent('show');
			}.bind(this));
		} else{
			this.picker.setStyle('opacity', 1);
			this.fireEvent('show');
		}
		return this;
	},

	show: function(){
		return this.open(true);
	},

	close: function(noFx){
		if (this.opened == false) return this;
		this.opened = false;
		this.fireEvent('close');
		if (this.options.useFadeInOut && !noFx){
			this.picker.fade('out').get('tween').chain(function(){
				this.fireEvent('hide');
			}.bind(this));
		} else {
			this.picker.setStyle('opacity', 0);
			this.fireEvent('hide');
		}
		return this;
	},

	hide: function(){
		return this.close(true);
	},

	toggle: function(){
		return this[(this.opened == true ? 'close' : 'open')]();
	},

	destroy: function(){
		this.picker.destroy();
		this.shim.destroy();
	},

	position: function(x, y){
		if (typeOf(x) == 'element'){
			var element = x,
				where = y || this.options.pickerPosition;

			var elementCoords = element.getCoordinates();
			x = (where == 'left') ? x = elementCoords.left - this.bodysize.x
				: elementCoords.right
			y = elementCoords.top;
		}
		var offset = this.options.positionOffset,
			scrollSize = document.getScrollSize(),
			pickersize = this.pickersize;
		var position = {
			left: x + offset.x,
			top: y + offset.y
		};

		if (position.left < 0) position.left = 0;
		if (position.top < 0) position.top = 0;
		if ((position.left + pickersize.x) > scrollSize.x) position.left = scrollSize.x - pickersize.x;
		if ((position.top + pickersize.y) > scrollSize.y) position.top = scrollSize.y - pickersize.y;

		this.picker.setStyles(position);
		this.shim.position();
		return this;
	},

	setContent: function(){
		var content = Array.from(arguments), fx;

		if (['right', 'left', 'fade'].contains(content[1]))fx = content[1];
		if (content.length == 1 || fx) content = content[0];

		// swap contents so we can fill the newContents again and animate
		var old = this.oldContents;
		this.oldContents = this.newContents;
		this.newContents = old;
		this.newContents.empty();

		var type = typeOf(content);
		if (['string', 'number'].contains(type)) this.newContents.set('text', content);
		else this.newContents.adopt(content);

		if (fx){
			this.fx(fx);
		} else {
			this.slider.setStyle('left', 0);
			this.oldContents.setStyles({left: 0, opacity: 0});
			this.newContents.setStyles({left: 0, opacity: 1});
		}
		return this;
	},

	fx: function(fx){
		var oldContents = this.oldContents,
			newContents = this.newContents,
			slider = this.slider,
			bodysize = this.bodysize;
		if (fx == 'right'){
			oldContents.setStyles({left: 0, opacity: 1});
			newContents.setStyles({left: bodysize.x, opacity: 1});
			slider.setStyle('left', 0).tween('left', 0, -bodysize.x);
		} else if (fx == 'left'){
			oldContents.setStyles({left: bodysize.x, opacity: 1});
			newContents.setStyles({left: 0, opacity: 1});
			slider.setStyle('left', -bodysize.x).tween('left', -bodysize.x, 0);
		} else if (fx == 'fade'){
			slider.setStyle('left', 0);
			oldContents.setStyle('left', 0).set('tween', {
				duration: this.options.animationDuration / 2
			}).tween('opacity', 1, 0).get('tween').chain(function(){
				oldContents.setStyle('left', bodysize.x);
			});
			newContents.setStyles({opacity: 0, left: 0}).set('tween', {
				duration: this.options.animationDuration
			}).tween('opacity', 0, 1);
		}
	},

	toElement: function(){
		return this.picker;
	},

	// Control the elements in the header

	setTitle: function(text){
		this.titleText.set('text', text);
		return this;
	},

	setTitleEvent: function(fn){
		this.titleText.removeEvents('click');
		if (fn) this.titleText.addEvent('click', fn);
		this.titleText.setStyle('cursor', fn ? 'pointer' : 'none');
		return this;
	},

	hidePrevious: function($next, $show){
		this[$next ? 'next' : 'previous'].setStyle('display', $show ? 'block' : 'none');
		return this;
	},

	showPrevious: function($next){
		return this.hidePrevious($next, true);
	},

	setPreviousEvent: function(fn, $next){
		this[$next ? 'next' : 'previous'].removeEvents('click');
		if (fn) this[$next ? 'next' : 'previous'].addEvent('click', fn);
		return this;
	},

	hideNext: function(){
		return this.hidePrevious(true);
	},

	showNext: function(){
		return this.showPrevious(true);
	},

	setNextEvent: function(fn){
		return this.setPreviousEvent(fn, true);
	}

});
