MooTools-DatePicker
===================

Smoothly animating, very configurable and easy to install.
No Ajax, pure Javascript. 4 skins available out of the box.

This is a port of [MonkeyPhysics datepicker](http://www.monkeyphysics.com/mootools/script/2/datepicker) so thank him for the 
this great plugin. Also thanks to MadmanMonty, marfillaster and eerne for their changes

![Screenshot](http://github.com/arian/mootools-datepicker/raw/master/screenshot.png)

How to use
----------

Below you will find a description and some docs how you can use the datepicker.
Also note that this version (1.50beta1) is not final yet, but it should work well.
If you find anything, please create a ticket at github or fork and fix it!

## Initialize

### Syntax

	#JS
	var dp = new DatePicker([element, options]);

### Arguments

1. element: (*element*,*string*,*array*, optional) The element(s) to attach the datepicker to
2. options: (*object*, optional) The options object

### Examples

	#JS
	new DatePicker('inputField');
	
	new DatePicker($$('input.date'));
	
	new DatePicker(document.id('inputField'),{
		timePicker: true,
		pickerClass: 'datepicker_jqui'		
	});

### Options

Check out the options at this page: [MonkeyPhysics datepicker](http://www.monkeyphysics.com/mootools/script/2/datepicker)

- toggle: (*element*,*string*,*array*) Toggle your datepicker by clicking another element. 

#### Note
- toggleElements is deprecated, use toggle instead
- You only have to set *format* if you do not want to use the same format defined by MooTools.lang
- if you use a custom format, be sure you use [Date.defineParser()](http://mootools.net/docs/more/Native/Date#Date:defineParser) otherwise your default date will not parse correctly
- Carefull with draggable, it caused some trouble for me, but works great on the Test page.

### Events

- show - triggered when the datepicker pops up
- close - triggered after the datepicker is closed (destroyed)
- select - triggered when a date is selected
- next - triggered when changing to next month
- previous - triggered when changing to previous month


## DatePicker.attach

A method to attach the datepicker to input field(s)

### Syntax

	#JS
	dp.attach(element[,toggle]);
	
### Arguments

1. element: (*element*,*string*,*array*) The element to attach the datepicker to 
2. toggle: (*element*,*string*,*array*, optional) If you want to use a toggle element

## DatePicker.detach

Detach the picker from the input field

### Syntax

	#JS
	dp.detach(element);
	
### Arguments

1. element: (*element*,*string*,*array*) The element to detach the datepicker from

## DatePicker.show

A method to show the datepicker manually

### Syntax 

	#JS
	dp.show(element[,toggle,timestamp])

### Arguments

1. element: (*element*,*string*) The input field 
2. toggle: (*element,*string*, optional) The toggle element (the picker will use the position of the toggle element)
3. timestamp: (*Date*,*number*, optional) A date object or a timestamp.

## DatePicker.close

A method to close the picker. You do not need link this to a link or something (because if you click anywhere but the picker, it will already close), 
This method is there to close the picker for example with a delay, or an Ajax Event or something.

### Syntax

	#JS
	dp.close();




## MooTools.lang

This plugin supports MooTools.lang, so you can use the datepicker in your own language.

	#JS
	MooTools.lang.setLanguage("nl-NL");
	new DatePicker('.demo');

#### Note
- If you use more than one language on your page, things might get messed up (for example Date Parsing)
