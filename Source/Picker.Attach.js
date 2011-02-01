/*
---
name: Picker.Attach
description: Adds attach and detach methods to the Picker, to attach it to element events
authors: Arian Stolwijk
requires: [Picker, Core/Element.Event]
provides: Picker.Attach
...
*/


Picker.Attach = new Class({

	Extends: Picker,

	options: {/*
		onAttachedEvent: function(event){},

		toggleElements: null, // deprecated
		toggle: null, // When set it deactivate toggling by clicking on the input */
		showOnInit: false
	},

	initialize: function(attachTo, options){
		this.parent(options);

		this.attachedEvents = [];
		this.attachedElements = [];
		this.toggles = [];
		this.inputs = [];

		var documentEvent = function(event){
			if (this.attachedElements.contains(event.target)) return null;
			this.close();
		}.bind(this);
		var document = this.picker.getDocument().addEvent('click', documentEvent);

		var preventPickerClick = function(event){
			event.stopPropagation();
			return false;
		};
		this.picker.addEvent('click', preventPickerClick);

		// Support for deprecated toggleElements
		if (this.options.toggleElements) this.options.toggle = document.getElements(this.options.toggleElements);

		this.attach(attachTo, this.options.toggle);
	},

	attach: function(attachTo, toggle){
		if (typeOf(attachTo) == 'string') attachTo = document.id(attachTo);
		if (typeOf(toggle) == 'string') toggle = document.id(toggle);

		var elements = Array.from(attachTo),
			toggles = Array.from(toggle),
			allElements = [].append(elements).combine(toggles),
			self = this;

		var eventWrapper = function(fn, element){
			return function(event){
				if (event.type == 'keydown' && ['tab', 'esc'].contains(event.key) == false) return false;
				if (event.target.get('tag') == 'a') event.stop();
				self.fireEvent('attachedEvent', [event, element]);
				self.position(element);
				fn();
			};
		};

		allElements.each(function(element, i){

			// The events are already attached!
			if (self.attachedElements.contains(element)) return null;

			var tag = element.get('tag');

			var events = {};
			if (tag == 'input'){
				// Fix in order to use togglers only
				if (!toggles.length){
					events = {
						focus: eventWrapper(self.open.bind(self), element),
						keydown: eventWrapper(self.close.bind(self), element),
						click: eventWrapper(self.open.bind(self), element)
					};
				}
				self.inputs.push(element);
			} else {
				if (toggles.contains(element)){
					self.toggles.push(element);
					events.click = eventWrapper(self.toggle.bind(self), element);
				} else {
					events.click = eventWrapper(self.open.bind(self), element);
				}
			}
			element.addEvents(events);
			self.attachedElements.push(element);
			self.attachedEvents.push(events);
		});
		return this;
	},

	detach: function(attachTo, toggle){
		if (typeOf(attachTo) == 'string') attachTo = document.id(attachTo);
		if (typeOf(toggle) == 'string') toggle = document.id(toggle);

		var elements = Array.from(attachTo),
			toggles = Array.from(toggle),
			allElements = [].append(elements).combine(toggles),
			self = this;

		if (!allElements.length) allElements = self.attachedElements;

		allElements.each(function(element){
			var i = self.attachedElements.indexOf(element);
			if (i < 0) return null;

			var events = self.attachedEvents[i];
			element.removeEvents(events);
			delete self.attachedEvents[i];
			delete self.attachedElements[i];

			var toggleIndex = self.toggles.indexOf(element);
			if (toggleIndex != -1) delete self.toggles[toggleIndex];

			var inputIndex = self.inputs.indexOf(element);
			if (toggleIndex != -1) delete self.inputs[inputIndex];

		});
		return this;
	},

	destroy: function(){
		this.detach();
		this.parent();
	}

});
