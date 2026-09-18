/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit","sap/fe/core/buildingBlocks/templating/BuildingBlockSupport","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase","sap/fe/core/converters/MetaModelConverter","sap/fe/core/converters/annotations/DataField","sap/fe/core/converters/controls/Common/Form","sap/fe/core/converters/helpers/ID","sap/fe/core/helpers/BindingHelper","sap/fe/core/templating/DataModelPathHelper","sap/fe/macros/form/FormHelper","sap/ui/core/library","sap/ui/model/odata/v4/AnnotationHelper"],function(e,t,a,i,n,r,o,l,s,u,c,m,p){"use strict";var f,d,b,g,h,y,v,C,P,$,L,F,x,T,S,I,M,O,w,D,A,k,z,E,B,j,_,U,N,X,R;var G={};var H=m.TitleLevel;var Q=u.getContextRelativeTargetObjectPath;var V=s.UI;var q=l.getFormContainerID;var W=o.createFormDefinition;var J=r.hasIdentificationTarget;var K=r.hasFieldGroupTarget;var Y=n.getInvolvedDataModelObjects;var Z=a.xml;var ee=t.defineBuildingBlock;var te=t.blockEvent;var ae=t.blockAttribute;var ie=t.blockAggregation;var ne=e.resolveBindingString;var re=e.ifElse;var oe=e.getExpressionFromAnnotation;var le=e.equal;var se=e.compileExpression;function ue(e,t,a,i){a&&Object.defineProperty(e,t,{enumerable:a.enumerable,configurable:a.configurable,writable:a.writable,value:a.initializer?a.initializer.call(i):void 0})}function ce(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,me(e,t)}function me(e,t){return me=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},me(e,t)}function pe(e,t,a,i,n){var r={};return Object.keys(i).forEach(function(e){r[e]=i[e]}),r.enumerable=!!r.enumerable,r.configurable=!!r.configurable,("value"in r||r.initializer)&&(r.writable=!0),r=a.slice().reverse().reduce(function(a,i){return i(e,t,a)||a},r),n&&void 0!==r.initializer&&(r.value=r.initializer?r.initializer.call(n):void 0,r.initializer=void 0),void 0===r.initializer?(Object.defineProperty(e,t,r),null):r}function fe(e,t){throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform.")}let de=(f=ee({name:"Form",namespace:"sap.fe.macros.internal.OLD",publicNamespace:"sap.fe.macros.OLD",returnTypes:["sap.fe.macros.form.FormAPI"]}),d=ae({type:"string",isPublic:true,required:true}),b=ae({type:"sap.ui.model.Context",required:true,isPublic:true,expectedTypes:["EntitySet","NavigationProperty","Singleton","EntityType"]}),g=ae({type:"sap.ui.model.Context",isPublic:true,required:true,expectedAnnotationTypes:["com.sap.vocabularies.UI.v1.FieldGroupType","com.sap.vocabularies.UI.v1.CollectionFacet","com.sap.vocabularies.UI.v1.ReferenceFacet"],expectedTypes:["EntitySet","EntityType","Singleton","NavigationProperty"]}),h=ae({type:"array"}),y=ae({type:"boolean"}),v=ae({type:"boolean"}),C=ae({type:"string",isPublic:true}),P=ae({type:"sap.ui.core.TitleLevel",isPublic:true}),$=ae({type:"string"}),L=ae({type:"string"}),F=ae({type:"boolean",isPublic:true}),x=te(),T=ie({type:"sap.fe.macros.form.FormElement",isPublic:true,slot:"formElements",isDefault:true}),S=ae({type:"object",isPublic:true}),f(I=(M=function(e){function t(t,a,i){var n;n=e.call(this,t,a,i)||this;ue(n,"id",O,n);ue(n,"contextPath",w,n);ue(n,"metaPath",D,n);ue(n,"formContainers",A,n);ue(n,"useFormContainerLabels",k,n);ue(n,"partOfPreview",z,n);ue(n,"title",E,n);ue(n,"titleLevel",B,n);ue(n,"ariaLabelledBy",j,n);ue(n,"displayMode",_,n);ue(n,"visible",U,n);ue(n,"onChange",N,n);ue(n,"formElements",X,n);ue(n,"layout",R,n);n.designtime="sap/fe/macros/form/Form.designtime";if(n.metaPath&&n.contextPath&&(n.formContainers===undefined||n.formContainers===null)){const e=Y(n.metaPath,n.contextPath);const t={};let a=e.targetObject;let r=false;if(a&&a.$Type==="com.sap.vocabularies.UI.v1.FieldGroupType"){r=true;a={$Type:"com.sap.vocabularies.UI.v1.ReferenceFacet",Label:a.Label,Target:{$target:a,fullyQualifiedName:a.fullyQualifiedName,path:"",term:"",type:"AnnotationPath",value:Q(e)},annotations:{},fullyQualifiedName:a.fullyQualifiedName};if(n.formElements){t[a.Target.value]={fields:n.formElements}}}const o=n.getConverterContext(e,undefined,i,t);const l=W(a,se(n.visible),o);if(r){l.formContainers[0].annotationPath=n.metaPath.getPath()}n.formContainers=l.formContainers;n.useFormContainerLabels=l.useFormContainerLabels;n.facetType=a&&a.$Type}else{n.facetType=n.metaPath.getObject()?.$Type}if(n.metaPath&&n.contextPath){const e=Y(n.metaPath,n.contextPath);const t=n.getConverterContext(e,n.contextPath.getPath(),i,{});if(e.targetObject){const a=t.getManifestWrapper().getSections();let i;if(e.targetObject.ID&&a[e.targetObject.ID.toString()]!==undefined){i=a[e.targetObject.ID.toString()].layout}if(!i){const a=t.getManifestControlConfiguration(t.getRelativeAnnotationPath(e.targetObject?.fullyQualifiedName??"",e.targetEntityType));if(a?.layout){i=a.layout}}if(i){n.layout=i}}}if(!n.isPublic){n._apiId=n.createId("Form");n._contentId=n.id}else{n._apiId=n.id;n._contentId=`${n.id}-content`}if(n.displayMode!==undefined){n._editable=se(re(le(ne(n.displayMode,"boolean"),false),true,false))}else{n._editable=se(V.IsEditable)}return n}G=t;ce(t,e);var a=t.prototype;a.getDataFieldCollection=function e(t,a){const i=Y(a).targetObject;let n;let r;if(i.$Type==="com.sap.vocabularies.UI.v1.ReferenceFacet"){n=p.getNavigationPath(i.Target.value);r=i}else{const e=this.contextPath.getPath();let t=a.getPath();if(t.startsWith(e)){t=t.substring(e.length);if(t.charAt(0)==="/"){t=t.slice(1)}}n=p.getNavigationPath(t);r=t}const o=c.getFormContainerTitleLevel(this.title,this.titleLevel);const l=this.useFormContainerLabels&&i.Label?oe(i.Label):"";const s=(this.id!==undefined||r)&&r?q(r):undefined;return Z`
					<macro:FormContainer
					xmlns:macro="sap.fe.macros"
					${this.attr("id",s)}
					title="${l}"
					titleLevel="${o}"
					contextPath="${n?t.entitySet:this.contextPath}"
					metaPath="${a}"
					dataFieldCollection="${t.formElements}"
					navigationPath="${n}"
					visible="${t.isVisible}"
					displayMode="${this.displayMode}"
					onChange="${this.onChange}"
					actions="${t.actions}"
					designtimeSettings="${t.flexSettings?.designtime==="Default"||!t.flexSettings?.designtime?"sap/fe/macros/form/FormContainer.designtime":t.flexSettings.designtime}"
					useSingleTextAreaFieldAsNotes="${t.useSingleTextAreaFieldAsNotes}"
					hasUiHiddenAnnotation="${t.annotationHidden}"
				>
				<macro:formElements>
					<slot name="formElements" />
				</macro:formElements>
			</macro:FormContainer>`};a.getFormContainers=function e(){if(this.formContainers.length===0){return""}if(this.facetType?.includes("com.sap.vocabularies.UI.v1.CollectionFacet")){return this.formContainers.map((e,t)=>{if(e.isVisible){const a=this.contextPath.getModel().createBindingContext(e.annotationPath,this.contextPath);const i=a.getObject();if(i.$Type==="com.sap.vocabularies.UI.v1.ReferenceFacet"&&c.isReferenceFacetPartOfPreview(i,this.partOfPreview)){if(i.Target.$AnnotationPath.$Type==="com.sap.vocabularies.Communication.v1.AddressType"){return Z`<template:with path="formContainers>${t}" var="formContainer">
											<template:with path="formContainers>${t}/annotationPath" var="facet">
												<core:Fragment fragmentName="sap.fe.macros.form.AddressSection" type="XML" />
											</template:with>
										</template:with>`}return this.getDataFieldCollection(e,a)}}return""})}else if(this.facetType==="com.sap.vocabularies.UI.v1.ReferenceFacet"){return this.formContainers.map(e=>{if(e.isVisible){const t=this.contextPath.getModel().createBindingContext(e.annotationPath,this.contextPath);return this.getDataFieldCollection(e,t)}else{return""}})}return""};a.checkIfTextAreaIsAlone=function e(){if(this.formContainers.length===1){if(this.formContainers[0].formElements.length===1){const e=Y(this.contextPath.getModel().createBindingContext(this.formContainers[0].annotationPath,this.contextPath)).targetObject;let t;let a;if(e.$Type==="com.sap.vocabularies.UI.v1.FieldGroupType"){t=e}else if(K(e)){t=e?.Target?.$target}else if(J(e)){a=e?.Target?.$target}if(t?.Data.length===1){return t.Data[0]?.Value?.$target?.annotations?.UI?.MultiLineText?.valueOf()===true}if(a?.length===1){return a[0]?.Value?.$target?.annotations?.UI?.MultiLineText?.valueOf()===true}}}return false};a.getLayoutInformation=function e(t){switch(this.layout.type){case"ResponsiveGridLayout":return Z`<f:ResponsiveGridLayout adjustLabelSpan="${this.layout.adjustLabelSpan}"
													breakpointL="${this.layout.breakpointL}"
													breakpointM="${this.layout.breakpointM}"
													breakpointXL="${this.layout.breakpointXL}"
													columnsL="${t?1:this.layout.columnsL}"
													columnsM="${t?1:this.layout.columnsM}"
													columnsXL="${t?1:this.layout.columnsXL}"
													emptySpanL="${this.layout.emptySpanL}"
													emptySpanM="${this.layout.emptySpanM}"
													emptySpanS="${this.layout.emptySpanS}"
													emptySpanXL="${this.layout.emptySpanXL}"
													labelSpanL="${this.layout.labelSpanL}"
													labelSpanM="${this.layout.labelSpanM}"
													labelSpanS="${this.layout.labelSpanS}"
													labelSpanXL="${this.layout.labelSpanXL}"
													singleContainerFullSize="${this.layout.singleContainerFullSize}"
													backgroundDesign="${this.layout.backgroundDesign}" />`;case"ColumnLayout":default:return Z`<f:ColumnLayout
								columnsM="${t?1:this.layout.columnsM}"
								columnsL="${t?1:this.layout.columnsL}"
								columnsXL="${t?1:this.layout.columnsXL}"
								labelCellsLarge="${this.layout.labelCellsLarge}"
								emptyCellsLarge="${this.layout.emptyCellsLarge}"
								backgroundDesign="${this.layout.backgroundDesign}" />`}};a.getTemplate=function e(){const t=this.onChange&&this.onChange.replace("{","\\{").replace("}","\\}")||"";const a=this.metaPath.getPath();const i=this.contextPath.getPath();const n=this.checkIfTextAreaIsAlone();if(!this.visible){return""}else{return Z`<macro:FormAPI xmlns:macro="sap.fe.macros.form"
					xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
					xmlns:f="sap.ui.layout.form"
					xmlns:fl="sap.ui.fl"
					xmlns:dt="sap.ui.dt"
					xmlns:coreControls="sap.fe.core.controls"
					id="${this._apiId}"
					_formContentId="${this._contentId}"
					metaPath="${a}"
					titleLevel="${this.titleLevel}"
					contextPath="${i}"
					useFormContainerLabels="${this.useFormContainerLabels}">
					<macro:content>
						<f:Form
							fl:delegate='{
								"name": "sap/fe/macros/form/FormDelegate",
								"delegateType": "complete"
							}'
							dt:designtime="${this.designtime==="Default"?"sap/fe/macros/form/Form.designtime":this.designtime}"
							id="${this._contentId}"
							editable="${this._editable}"
							visible="${this.visible}"
							macrodata:navigationPath="${i}"
							macrodata:metaPath="${a}"
							macrodata:onChange="${t}"
							ariaLabelledBy="${this.ariaLabelledBy}"
						>
							${this.addConditionally(this.title!==undefined,Z`<f:title>
									<core:Title level="${this.titleLevel}" text="${this.title}" />
								</f:title>`)}
							<f:layout>
							${this.getLayoutInformation(n)}

							</f:layout>
							<f:formContainers>
								${this.getFormContainers()}
							</f:formContainers>
							<f:dependents>
								<coreControls:HideFormGroupAutomatically />
							</f:dependents>
						</f:Form>
					</macro:content>
			</macro:FormAPI>`}};return t}(i),O=pe(M.prototype,"id",[d],{configurable:true,enumerable:true,writable:true,initializer:null}),w=pe(M.prototype,"contextPath",[b],{configurable:true,enumerable:true,writable:true,initializer:null}),D=pe(M.prototype,"metaPath",[g],{configurable:true,enumerable:true,writable:true,initializer:null}),A=pe(M.prototype,"formContainers",[h],{configurable:true,enumerable:true,writable:true,initializer:null}),k=pe(M.prototype,"useFormContainerLabels",[y],{configurable:true,enumerable:true,writable:true,initializer:null}),z=pe(M.prototype,"partOfPreview",[v],{configurable:true,enumerable:true,writable:true,initializer:function(){return true}}),E=pe(M.prototype,"title",[C],{configurable:true,enumerable:true,writable:true,initializer:null}),B=pe(M.prototype,"titleLevel",[P],{configurable:true,enumerable:true,writable:true,initializer:function(){return H.Auto}}),j=pe(M.prototype,"ariaLabelledBy",[$],{configurable:true,enumerable:true,writable:true,initializer:null}),_=pe(M.prototype,"displayMode",[L],{configurable:true,enumerable:true,writable:true,initializer:null}),U=pe(M.prototype,"visible",[F],{configurable:true,enumerable:true,writable:true,initializer:function(){return true}}),N=pe(M.prototype,"onChange",[x],{configurable:true,enumerable:true,writable:true,initializer:null}),X=pe(M.prototype,"formElements",[T],{configurable:true,enumerable:true,writable:true,initializer:null}),R=pe(M.prototype,"layout",[S],{configurable:true,enumerable:true,writable:true,initializer:function(){return{type:"ColumnLayout",columnsM:3,columnsXL:6,columnsL:4,labelCellsLarge:12}}}),M))||I);G=de;return G},false);
//# sourceMappingURL=Form.block.js.map