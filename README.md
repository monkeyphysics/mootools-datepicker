MooTools-DatePicker
===============

Smoothly animating, very configurable and easy to install.
No Ajax, pure Javascript. 4 skins available out of the box.

This is a port of [MonkeyPhysics datepicker](http://www.monkeyphysics.com/mootools/script/2/datepicker) so thank him for the 
this great plugin. Also thanks to MadmanMonty, marfillaster and eerne for their changes

![Screenshot](http://github.com/arian/mootools-datepicker/raw/master/screenshot.png)

How to use
----------

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

## DatePicker.attach

A method to attach the datepicker to input field(s)

### Syntax

	#JS
	dp.attach(element[,toggle]);
	
### Arguments

1. element: (*element*,*string*,*array*) The element to attach the datepicker to 
2. toggle: (*element*,*string*,*array*, optional) If you want to use a toggle element

## DatePicker.detach

### Syntax

	#JS
	dp.detach(element);
	
### Arguments

1. element: (*element*,*string*,*array*) The element to detach the datepicker from

## DatePicker.show

## Syntax 

	#JS
	dp.show(element[,toggle,timestamp])

1. element: (*element*,*string*) The input field 
2. toggle: (*element,*string*, optional) The toggle element
3. timestamp: (*Date*,*number*, optional) A date object or a timestamp.
where the input-target-selector naturally is a MooTools selector (eg. .datepickers or #great_picker). The datepicker will be effective for all selected input elements. Usage examples are given at the bottom of this document.

### MooTools.lang

This plugin supports MooTools.lang, so you can use the datepicker in your own language.

	#JS
	MooTools.lang.setLanguage("nl-NL");
	new DatePicker('.demo');

For more options: checkout [MonkeyPhysics datepicker](http://www.monkeyphysics.com/mootools/script/2/datepicker)