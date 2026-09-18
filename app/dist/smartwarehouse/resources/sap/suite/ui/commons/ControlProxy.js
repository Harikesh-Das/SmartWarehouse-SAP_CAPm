/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["./library","sap/ui/core/Control","sap/ui/core/Core","sap/ui/core/Element"],function(t,o,e,s){"use strict";var a=o.extend("sap.suite.ui.commons.ControlProxy",{metadata:{library:"sap.suite.ui.commons",association:{control:{type:"sap.ui.core.Control",multiple:false}}},renderer:{apiVersion:2,render(t,o){var e=o.getAssociation("control"),a=s.getElementById(e);t.renderControl(a)}}});a.prototype.setAssociation=function(t,e){o.prototype.setAssociation.apply(this,arguments);var a=this.getAssociation("control"),r=s.getElementById(a);if(r&&Array.isArray(this.aCustomStyleClasses)){this.aCustomStyleClasses.forEach(function(t){r.addStyleClass(t)})}};a.prototype.addStyleClass=function(t){o.prototype.addStyleClass.apply(this,arguments);var e=this.getAssociation("control"),a=s.getElementById(e);if(a){a.addStyleClass(t)}};return a});
//# sourceMappingURL=ControlProxy.js.map