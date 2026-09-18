/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/templating/BuildingBlockSupport","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase"],function(e,t,r){"use strict";var i,n,a,o,l,u,c,s,m,f,p,g,b;var d={};var h=t.xml;var y=e.defineBuildingBlock;var v=e.blockAttribute;var P=e.blockAggregation;function O(e,t,r,i){r&&Object.defineProperty(e,t,{enumerable:r.enumerable,configurable:r.configurable,writable:r.writable,value:r.initializer?r.initializer.call(i):void 0})}function w(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,C(e,t)}function C(e,t){return C=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},C(e,t)}function z(e,t,r,i,n){var a={};return Object.keys(i).forEach(function(e){a[e]=i[e]}),a.enumerable=!!a.enumerable,a.configurable=!!a.configurable,("value"in a||a.initializer)&&(a.writable=!0),a=r.slice().reverse().reduce(function(r,i){return i(e,t,r)||r},a),n&&void 0!==a.initializer&&(a.value=a.initializer?a.initializer.call(n):void 0,a.initializer=void 0),void 0===a.initializer?(Object.defineProperty(e,t,a),null):a}function k(e,t){throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform.")}let B=(i=y({name:"CustomFragment",namespace:"sap.fe.macros.fpm"}),n=v({type:"string",required:true}),a=v({type:"sap.ui.model.Context",required:false}),o=v({type:"string",required:true}),l=v({type:"boolean"}),u=P({type:"sap.ui.core.CustomData",slot:"childCustomData"}),i(c=(s=function(e){function t(t,r,i){var n;n=e.call(this,t,r,i)||this;O(n,"id",m,n);O(n,"contextPath",f,n);O(n,"fragmentName",p,n);O(n,"isPartOfPreview",g,n);O(n,"childCustomData",b,n);return n}d=t;w(t,e);var r=t.prototype;r.getTemplate=function e(){const t=this.fragmentName+"-JS".replace(/\//g,".");const r=this.childCustomData;const i={};let n=r?.firstElementChild;while(n){const e=n.getAttribute("key");if(e!==null){i[e]=n.getAttribute("value")}n=n.nextElementSibling}if(this.isPartOfPreview!==undefined){i["isPartOfPreview"]=this.isPartOfPreview.toString()}return h`<macros:CustomFragmentFragment
			xmlns:compo="http://schemas.sap.com/sapui5/extension/sap.ui.core.xmlcomposite/1"
			xmlns:macros="sap.fe.macros.fpm"
			fragmentName="${t}"
			${this.attr("childCustomData",Object.keys(i).length?JSON.stringify(i):undefined)}
			id="${this.id}"
			type="CUSTOM"
			contextPath="${this.contextPath?.getPath()}"
		>
			<compo:fragmentContent>
				<core:FragmentDefinition>
					<core:Fragment fragmentName="${this.fragmentName}" type="XML"/>
				</core:FragmentDefinition>
			</compo:fragmentContent>
		</macros:CustomFragmentFragment>`};return t}(r),m=z(s.prototype,"id",[n],{configurable:true,enumerable:true,writable:true,initializer:null}),f=z(s.prototype,"contextPath",[a],{configurable:true,enumerable:true,writable:true,initializer:null}),p=z(s.prototype,"fragmentName",[o],{configurable:true,enumerable:true,writable:true,initializer:null}),g=z(s.prototype,"isPartOfPreview",[l],{configurable:true,enumerable:true,writable:true,initializer:null}),b=z(s.prototype,"childCustomData",[u],{configurable:true,enumerable:true,writable:true,initializer:null}),s))||c);d=B;return d},false);
//# sourceMappingURL=CustomFragment.block.js.map