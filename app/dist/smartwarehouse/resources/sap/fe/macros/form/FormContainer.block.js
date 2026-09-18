/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/templating/BuildingBlockSupport","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase","sap/fe/core/converters/MetaModelConverter","sap/fe/core/converters/controls/Common/Form","sap/fe/core/helpers/StableIdHelper","sap/fe/core/templating/DataModelPathHelper","sap/fe/core/templating/UIFormatters","../CommonHelper","../field/FieldTemplating","./FormHelper"],function(e,t,i,a,n,o,r,l,s,m,d){"use strict";var c,u,f,p,h,g,b,F,$,x,y,P,E,v,O,C,M,B,w,I,D,L,T,k,A,S,H,j,z,V,U,N,G,R,Q;var q={};var W=m.getVisibleExpression;var _=l.isMultiValueField;var K=l.getRequiredExpressionForConnectedDataField;var X=r.getContextRelativeTargetObjectPath;var J=r.enhanceDataModelPath;var Y=n.createFormDefinition;var Z=a.getInvolvedDataModelObjects;var ee=t.xml;var te=e.defineBuildingBlock;var ie=e.blockEvent;var ae=e.blockAttribute;var ne=e.blockAggregation;function oe(e,t,i,a){i&&Object.defineProperty(e,t,{enumerable:i.enumerable,configurable:i.configurable,writable:i.writable,value:i.initializer?i.initializer.call(a):void 0})}function re(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,le(e,t)}function le(e,t){return le=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},le(e,t)}function se(e,t,i,a,n){var o={};return Object.keys(a).forEach(function(e){o[e]=a[e]}),o.enumerable=!!o.enumerable,o.configurable=!!o.configurable,("value"in o||o.initializer)&&(o.writable=!0),o=i.slice().reverse().reduce(function(i,a){return a(e,t,i)||i},o),n&&void 0!==o.initializer&&(o.value=o.initializer?o.initializer.call(n):void 0,o.initializer=void 0),void 0===o.initializer?(Object.defineProperty(e,t,o),null):o}function me(e,t){throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform.")}let de=(c=te({name:"FormContainer",namespace:"sap.fe.macros"}),u=ae({type:"string"}),f=ae({type:"sap.ui.model.Context",required:true,isPublic:true,expectedTypes:["EntitySet","NavigationProperty","EntityType","Singleton"]}),p=ae({type:"sap.ui.model.Context"}),h=ae({type:"sap.ui.model.Context",isPublic:true,required:true}),g=ae({type:"array"}),b=ae({type:"boolean"}),F=ae({type:"string"}),$=ae({type:"sap.ui.core.TitleLevel",isPublic:true}),x=ae({type:"string"}),y=ae({type:"string"}),P=ae({type:"boolean"}),E=ae({type:"string"}),v=ae({type:"array"}),O=ae({type:"boolean"}),C=ne({type:"sap.fe.macros.form.FormElement"}),M=ie(),c(B=(w=function(e){function t(t,i,a){var n;n=e.call(this,t)||this;oe(n,"id",I,n);oe(n,"contextPath",D,n);oe(n,"entitySet",L,n);oe(n,"metaPath",T,n);oe(n,"dataFieldCollection",k,n);oe(n,"displayMode",A,n);oe(n,"title",S,n);oe(n,"titleLevel",H,n);oe(n,"navigationPath",j,n);oe(n,"visible",z,n);oe(n,"hasUiHiddenAnnotation",V,n);oe(n,"designtimeSettings",U,n);oe(n,"actions",N,n);oe(n,"useSingleTextAreaFieldAsNotes",G,n);oe(n,"formElements",R,n);oe(n,"onChange",Q,n);n.entitySet=n.contextPath;if(n.formElements&&Object.keys(n.formElements).length>0){const e=Z(n.metaPath,n.contextPath);const t={};let i=e.targetObject;i={$Type:"com.sap.vocabularies.UI.v1.ReferenceFacet",Label:i?.Label,Target:{$target:i,fullyQualifiedName:i?.fullyQualifiedName,path:"",term:"",type:"AnnotationPath",value:X(e)},annotations:{},fullyQualifiedName:i?.fullyQualifiedName};t[i.Target.value]={fields:n.formElements};const o=n.getConverterContext(e,undefined,a,t);const r=Y(i,"true",o);n.dataFieldCollection=r.formContainers[0].formElements;if(r.formContainers[0].flexSettings?.designtime){n.designtimeSettings=r.formContainers[0].flexSettings.designtime==="Default"?"sap/fe/macros/form/FormContainer.designtime":r.formContainers[0].flexSettings.designtime}}n.contentId=a.viewId;return n}q=t;re(t,e);var i=t.prototype;i.getTemplate=function e(){const t=this.id?o.generate([this.id,"FormActionsToolbar"]):undefined;const i=Z(this.contextPath,this.metaPath);const a=d.generateBindingExpression(this.navigationPath,i);let n="";if(this.title&&this.title.length>0){n=ee`<f:title>
				<core:Title level="${this.titleLevel}" text="${this.title}" />
			</f:title>`}return ee`
		<f:FormContainer
			xmlns="sap.m"
			xmlns:f="sap.ui.layout.form"
			xmlns:macro="sap.fe.macros"
			xmlns:macroForm="sap.fe.macros.form"
			xmlns:internalMacro="sap.fe.macros.internal"
			xmlns:core="sap.ui.core"
			xmlns:controls="sap.fe.macros.controls"
			xmlns:dt="sap.ui.dt"
			xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			xmlns:fpm="sap.fe.macros.fpm"
			xmlns:template="http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1"
			template:require="{
				MODEL: 'sap/ui/model/odata/v4/AnnotationHelper',
				ID: 'sap/fe/core/helpers/StableIdHelper',
				COMMON: 'sap/fe/macros/CommonHelper',
				FORM: 'sap/fe/macros/form/FormHelper',
				UI: 'sap/fe/core/templating/UIFormatters',
				DataField: 'sap/fe/core/templating/DataFieldFormatters',
				FieldTemplating: 'sap/fe/macros/field/FieldTemplating',
				Property: 'sap/fe/core/templating/PropertyFormatters',
				FIELD: 'sap/fe/macros/field/FieldHelper',
				MACRO: 'sap/fe/macros/MacroTemplating'
			}"

			core:require="{FormContainerRuntime: 'sap/fe/macros/form/FormContainerAPI'}"
			dt:designtime="${this.designtimeSettings}"
			id="${this.id||undefined}"
			visible="${this.visible}"
			macrodata:navigationPath="${this.navigationPath}"
			macrodata:etName="${this.contextPath.getObject("./@sapui.name")}"
			macrodata:UiHiddenPresent="${this.hasUiHiddenAnnotation}"
		>

			${n}
			<template:if test="${this.actions}">
				<template:then>
					<f:toolbar>
						<OverflowToolbar
							id="${t}"
							${this.attr("binding",a)}
						>
							<Title level="${this.titleLevel}" text="${this.title}" />
							<ToolbarSpacer />
							<template:repeat list="{actions>}" var="action">
								<core:Fragment fragmentName="sap.fe.macros.form.FormActionButtons" type="XML" />
							</template:repeat>
						</OverflowToolbar>
					</f:toolbar>
				</template:then>
			</template:if>

			<f:dependents>
				<macroForm:FormContainerAPI formContainerId="${this.id}" showDetails="{internal>showDetails}" />
			</f:dependents>

			<f:formElements>
				${this.getTemplatedFormElements()}
			</f:formElements>

		</f:FormContainer>`};i.getTemplatedFormElements=function e(){return ee`
			<template:with path="dataFieldCollection>" var="formElements">
				${this.getInnerTemplatedFormElements()}
			</template:with>`};i.getInnerTemplatedFormElements=function e(){let t="";if(this.dataFieldCollection&&this.dataFieldCollection.length>0){const e=this.dataFieldCollection.find(e=>!!e.annotationPath);let i="";const a=this.id?.includes("HeaderFacet::FormContainer")===true;let n="undefined";if(this.id){if(a){n=`${this.id}::FormElement`;i=`${this.id}::FormElement`}else{n=`${o.generate([this.id,"FormElement",this.dataFieldCollection[0].key])}`;i=`${o.generate([this.id,"FormElement",this.dataFieldCollection[0].key])}`}}if(e?.annotationPath){const a=Z(this.contextPath.getModel().createBindingContext(e?.annotationPath||""));const r=d.generateBindingExpression(this.navigationPath,a);const l=a?.targetObject?.annotations?.UI?.AdaptationHidden?"not-adaptable-tree":"sap/fe/macros/form/FormElement.designtime";t=ee`
					<template:with path="formElements>0/annotationPath" var="dataPoint">
						<f:FormElement
							dt:designtime="${l}"
							id="${n}"
							label="{dataPoint>@@FIELD.computeLabelText}"
							visible="${W(a)}"
							${this.attr("binding",r)}
						>
							<f:fields>
								<macro:Field
									idPrefix="${i}"
									vhIdPrefix="${this.id?o.generate([this.id,"FieldValueHelp"]):""}"
									contextPath="${this.entitySet?.getPath()}"
									metaPath="${this.dataFieldCollection[0].annotationPath}"
									editMode="${this.displayMode===true?"Display":undefined}"
									onChange="${this.onChange}"
								>
									<formatOptions textAlignMode="Form" showEmptyIndicator="true" />
								</macro:Field>
							</f:fields>
						</f:FormElement>
					</template:with>

			`}}const i=ee`
			<template:with path="formElements>0/annotationPath" var="metaPath">
				<f:FormElement
					dt:designtime="{= \${metaPath>./@com.sap.vocabularies.UI.v1.AdaptationHidden} ? 'not-adaptable-tree' :  'sap/fe/macros/form/FormElement.designtime' }"
					binding="{= FORM.generateBindingExpression(\${this.navigationPath},\${contextPath>@@UI.getDataModelObjectPath})}"
				>
				<f:label>
					<Label
						text="{metaPath>fn/$Path@com.sap.vocabularies.Common.v1.Label}"
						visible="{= FieldTemplating.getVisibleExpression(\${dataField>@@UI.getDataModelObjectPath})}"
					>
					<layoutData>
						<f:ColumnElementData cellsLarge="12" />
					</layoutData>
				</Label>
				</f:label>
					<f:fields>
						<macro:Contact
							metaPath="{metaPath>@@COMMON.getMetaPath}"
								contextPath="{contextPath>@@COMMON.getMetaPath}"
								visible="true"
							/>
					</f:fields>
				</f:FormElement>
			</template:with>`;return ee`
			<template:if test="{= \${formElements>0/annotationPath}.indexOf('com.sap.vocabularies.UI.v1.DataPoint') > -1 }">
				<template:then>
					${t}
				</template:then>
				<template:elseif
					test="{= \${formElements>0/annotationPath}.indexOf('com.sap.vocabularies.Communication.v1.Contact') > -1 }"
				>
					${i}
				</template:elseif>
				<template:else>
					${this.getDataFieldsForAnnotations()}
				</template:else>
			</template:if>`};i.getConnectedFieldsFormElement=function e(t){let i="";let a=t.connectedFields?[...t.connectedFields]:[];if(a.length>1){const e=a[0].originalTemplate||"";const t=Array.from(e.matchAll(/\{([^}]+)\}/g)).map(e=>String(e[1]).trim()).filter(e=>e.length>0);const i=e=>{const t=e.originalObject;return t?.fullyQualifiedName?t.fullyQualifiedName.substring(t.fullyQualifiedName.lastIndexOf("/")+1):""};const n=a.map(i);const o=new Set(t);const r=t.length===a.length&&o.size===t.length&&n.every(e=>o.has(e));if(r){const e=new Map(a.map(e=>[i(e),e]));a=t.map(t=>e.get(t))}}for(const e of a){const n=this.contextPath.getModel();const r=e.originalObject?.fullyQualifiedName;const l=r?.substring(r.lastIndexOf("/")+1);const m=n.createBindingContext(t.annotationPath+"Target/$AnnotationPath/Data/"+l);const d=s.getDelimiter(e.originalTemplate??"");const c=a.indexOf(e)!==a.length-1?ee`<Text
text="${d}"
class="sapUiSmallMarginBeginEnd"
width="100%"
/>`:"";const u=this.id?o.generate([this.id,"SemanticFormElement",t.key,e.originalObject?.Value.path]):"";const f=this.id?o.generate([this.id,t.key,"FieldValueHelp"]):"";const p=e.originalObject?.Value?.path?.valueOf();const h=e.originalObject?.Value?.$target?.annotations?.Common?.Label?.valueOf();let g="";let b="";if(this.id&&p&&h){g=o.generate([this.id,"AriaText",t.key,p]);b=ee`
					<core:InvisibleText
						text="${h}"
						id="${g}"
					/>
				`}let F="";F=ee`
                ${b}
				<macro:Field
                    idPrefix="${u}"
                    vhIdPrefix="${f}"
                    contextPath="${this.entitySet?.getPath()}"
                    metaPath="${m.getPath()}"
                    onChange="${this.onChange}"
                    ariaLabelledBy="${this.id?[o.generate([this.id,"SemanticFormElementLabel",t.key]),g]:""}"
                >
                    <formatOptions
                        textLinesEdit="${t.formatOptions?.textLinesEdit}"
                        textMaxLines="${t.formatOptions?.textMaxLines}"
                        textMaxCharactersDisplay="${t.formatOptions?.textMaxCharactersDisplay}"
                        textMaxLength="${t.formatOptions?.textMaxLength}"
                        textExpandBehaviorDisplay="${t.formatOptions?.textExpandBehaviorDisplay}"
                        textAlignMode="Form"
                        showEmptyIndicator="true"
                        fieldEditStyle="${t.formatOptions?.fieldEditStyle}"
                        radioButtonsHorizontalLayout="${t.formatOptions?.radioButtonsHorizontalLayout}"
                        createAssociatedAriaLabel="true"
						imageFitType="${t.formatOptions?.imageFitType}"
                    />
                    <macro:layoutData>
                        <FlexItemData growFactor="{= %{ui>/isEditable} ? 1 : 0}" />
                    </macro:layoutData>
                </macro:Field>
                ${c}
                `;i+=F}const n=Z(this.contextPath.getModel().createBindingContext(t.annotationPath??""));let r="";if(this.id){if(this.contentId){r=`${this.contentId}--${o.generate([this.id,"SemanticFormElement",t.key])}`}else{r=`${o.generate([this.id,"SemanticFormElement",t.key])}`}}const l=t.isPartOfPreview?W(n):"{= ${internal>showDetails} === true}";const m=d.generateBindingExpression(this.navigationPath,n);const c=n?.targetObject?.Target?.$target;const u=n?.targetObject?.annotations?.UI?.AdaptationHidden?"not-adaptable-tree":"sap/fe/macros/form/FormElement.designtime";const f=K(n)?.toString();return ee`
            <f:FormElement
                xmlns:f="sap.ui.layout.form"
                dt:designtime="${u}"
                id="${r}"
                visible="${l}"
                ${this.attr("binding",m)}
            >
                <f:label>
                    <Label
                    text="${c?.Label??t.label}"
                    id="${this.id?o.generate([this.id,"SemanticFormElementLabel",t.key]):""}"

                    />
                </f:label>
				<f:fields>
                    <controls:FieldWrapper required="${f}">
                        <HBox wrap="Wrap">
							${i}
                        </HBox>
                    </controls:FieldWrapper>
                </f:fields>
            </f:FormElement>
        `};i.getMultiValueFieldFormElement=function e(t){const i=Z(this.contextPath.getModel().createBindingContext(t.annotationPath??""));const a=t.isPartOfPreview?W(i):"{= ${internal>showDetails} === true}";const n=d.generateBindingExpression(this.navigationPath,i);const r=this.id?`${o.generate([this.id,"FormElement",t.key])}`:"undefined";const l=this.id?`${o.generate([this.id,"FormElement",t.key,"MultiValueField"])}`:"undefined";const s=this.id?o.generate([this.id,"FieldValueHelp"]):"";const m=i?.targetObject?.annotations?.UI?.AdaptationHidden?"not-adaptable-tree":"sap/fe/macros/form/FormElement.designtime";return ee`
												<f:FormElement
													xmlns:macros="sap.fe.macros"
													xmlns:multivaluefield="sap.fe.macros.multivaluefield"
													dt:designtime="${m}"
													id="${r}"
													label="${t.label}"
													visible="${a}"
													${this.attr("binding",n)}
												>
													<f:fields>
														<macros:MultiValueField
															id="${l}"
															vhIdPrefix="${s}"
															contextPath="${this.entitySet?.getPath()}"
															metaPath="${t.annotationPath}"
														>
															<macros:formatOptions>
																<multivaluefield:FormatOptions showEmptyIndicator="true" />
															</macros:formatOptions>
														</macros:MultiValueField>
													</f:fields>
												</f:FormElement>`};i.getFieldGroupFormElement=function e(t){let i="";for(const e of t.fieldGroupElements){const a=this.contextPath.getModel();const n=e.fullyQualifiedName;const r=n?.substring(n.lastIndexOf("/")+1);const l=a.createBindingContext(t.annotationPath+"Target/$AnnotationPath/Data/"+r);const s=Z(l);const m=this.id?`${o.generate([this.id,"CheckBoxGroup",t.key,s.targetObject?.Value?.path])}`:"";const d=s.targetObject?.Value?.$target?.type==="Edm.Boolean";const c=d?ee`
				<macro:Field
					idPrefix="${m}"
					contextPath="${this.entitySet?.getPath()}"
					metaPath="${l.getPath()}"
					onChange="${this.onChange}"
					ariaLabelledBy="${this.id?o.generate([this.id,"FieldGroupFormElementLabel",t.key]):""}"
				>
					<formatOptions isFieldGroupItem="true" textAlignMode="Form" />
				</macro:Field>
			`:"";i+=c}const a=Z(this.contextPath.getModel().createBindingContext(t.annotationPath??""));const n=t.isPartOfPreview?W(a):"{= ${internal>showDetails} === true}";const r=d.generateBindingExpression(this.navigationPath,a);let l="";let s="";if(this.id){if(this.contentId){l=`${this.contentId}--${o.generate([this.id,"FieldGroupFormElement",t.key])}`;s=`${this.contentId}--${o.generate([this.id,"FieldGroupFormElementLabel",t.key])}`}else{l=`${o.generate([this.id,"FieldGroupFormElement",t.key])}`;s=`${o.generate([this.id,"FieldGroupFormElementLabel",t.key])}`}}const m=a?.targetObject?.Target?.$target;const c=a?.targetObject?.annotations?.UI?.AdaptationHidden?"not-adaptable-tree":"sap/fe/macros/form/FormElement.designtime";return ee`
												<f:FormElement
													xmlns:f="sap.ui.layout.form"
													dt:designtime="${c}"
													id="${l}"
													visible="${n}"
													${this.attr("binding",r)}
												>
													<f:label>
														<Label
															text="${m?.Label??t.label}"
															id="${s}"
														/>
													</f:label>
													<f:fields>
														<controls:RequiredFlexBox>
															<FlexBox
																direction="${t.formatOptions?.fieldGroupHorizontalLayout===true?"Row":"Column"}"
																wrap="Wrap"
																columnGap="1rem"
															>
																<items>
																	${i}
																</items>
															</FlexBox>
														</controls:RequiredFlexBox>
													</f:fields>
												</f:FormElement>
											`};i.getFieldFormElement=function e(t){const i=Z(this.contextPath.getModel().createBindingContext(t.annotationPath??""));const a=d.generateBindingExpression(this.navigationPath,i);const n=o.generate([this.id,"FieldValueHelp"]);let r="undefined";const l=t.isPartOfPreview?W(i):"{= ${internal>showDetails} === true}";const s=this.id?`${o.generate([this.id,"FormElement",t.key])}`:"";if(this.id){if(this.contentId){r=`${this.contentId}--${o.generate([this.id,"FormElement",t.key])}`}else{r=`${o.generate([this.id,"FormElement",t.key])}`}}const m=i?.targetObject?.annotations?.UI?.AdaptationHidden?"not-adaptable-tree":"sap/fe/macros/form/FormElement.designtime";return ee`
												<f:FormElement
													xmlns:f="sap.ui.layout.form"
													dt:designtime="${m}"
													id="${r}"
													label="${t.label}"
													visible="${l}"
													${this.attr("binding",a)}
												>
													<f:fields>
<macro:Field
idPrefix="${s}"
vhIdPrefix="${n}"
contextPath="${this.contextPath.getPath()}"
metaPath="${t.annotationPath}"
onChange="${this.onChange}"
readOnly="${t.readOnly}"
semanticObject="${t.semanticObject}"
>
<formatOptions
textLinesEdit="${t.formatOptions?.textLinesEdit}"
textMaxLines="${t.formatOptions?.textMaxLines}"
textMaxLength="${t.formatOptions?.textMaxLength}"
textMaxCharactersDisplay="${t.formatOptions?.textMaxCharactersDisplay}"
textExpandBehaviorDisplay="${t.formatOptions?.textExpandBehaviorDisplay}"
textAlignMode="Form"
showEmptyIndicator="true"
fieldEditStyle="${t.formatOptions?.fieldEditStyle}"
radioButtonsHorizontalLayout="${t.formatOptions?.radioButtonsHorizontalLayout}"
dateTimePattern="${t.formatOptions?.pattern}"
useRadioButtonsForBoolean="${t.formatOptions?.useRadioButtonsForBoolean}"
imageFitType="${t.formatOptions?.imageFitType}"
/>
</macro:Field>
													</f:fields>
												</f:FormElement>
											`};i.getCustomFormElement=function e(t){const i=this.contextPath.getPath(t.propertyPath);const a=Z(this.contextPath.getModel().createBindingContext(i));const n=d.generateBindingExpression(this.navigationPath,a);let r="";if(this.id){if(this.contentId){r=`${this.contentId}--${o.generate([this.id,t.id])}`}else{r=`${o.generate([this.id,t.id])}`}}const l=a?.targetObject?.annotations?.UI?.AdaptationHidden?"not-adaptable-tree":"sap/fe/macros/form/FormElement.designtime";const s=o.generate([this.id,t.key]);return ee`
								<f:FormElement
										dt:designtime="${l}"
										id="${r}"
										label="${t.label}"
										${this.attr("visible",t.visible)}
										${this.attr("binding",n)}
									>
										<f:fields>
											<macroForm:CustomFormElement
												metaPath="${t.propertyPath}"
												contextPath="${this.contextPath.getPath()}"
												formElementKey="${s}"
											>
												<fpm:CustomFragment
													id="${s}"
													fragmentName="${t.template}"
													contextPath="${this.contextPath.getPath()}"
												/>
											</macroForm:CustomFormElement>
										</f:fields>
									</f:FormElement>
		`};i.getSlotColumn=function e(t){return ee`<slot name="${t.key}" />`};i.isMultiValueDataField=function e(t){let i=false;if(t.annotationPath){const e=this.contextPath.getModel().createBindingContext(t.annotationPath);const a=e.getObject()?.Value?.$Path;if(a){i=_(J(Z(e),a))}}return i};i.getDataFieldsForAnnotations=function e(){let t="";if(this.dataFieldCollection!==undefined){for(const e of this.dataFieldCollection){switch(e.type){case"Annotation":if(e.connectedFields&&e.connectedFields.length>0){t+=this.getConnectedFieldsFormElement(e)}else if(this.isMultiValueDataField(e)){t+=this.getMultiValueFieldFormElement(e)}else if(e.fieldGroupElements&&e.fieldGroupElements.length>0){t+=this.getFieldGroupFormElement(e)}else{t+=this.getFieldFormElement(e)}break;case"Default":t+=this.getCustomFormElement(e);break;default:t+=this.getSlotColumn(e);break}}}return ee`${t}`};return t}(i),I=se(w.prototype,"id",[u],{configurable:true,enumerable:true,writable:true,initializer:null}),D=se(w.prototype,"contextPath",[f],{configurable:true,enumerable:true,writable:true,initializer:null}),L=se(w.prototype,"entitySet",[p],{configurable:true,enumerable:true,writable:true,initializer:null}),T=se(w.prototype,"metaPath",[h],{configurable:true,enumerable:true,writable:true,initializer:null}),k=se(w.prototype,"dataFieldCollection",[g],{configurable:true,enumerable:true,writable:true,initializer:null}),A=se(w.prototype,"displayMode",[b],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),S=se(w.prototype,"title",[F],{configurable:true,enumerable:true,writable:true,initializer:null}),H=se(w.prototype,"titleLevel",[$],{configurable:true,enumerable:true,writable:true,initializer:function(){return"Auto"}}),j=se(w.prototype,"navigationPath",[x],{configurable:true,enumerable:true,writable:true,initializer:null}),z=se(w.prototype,"visible",[y],{configurable:true,enumerable:true,writable:true,initializer:null}),V=se(w.prototype,"hasUiHiddenAnnotation",[P],{configurable:true,enumerable:true,writable:true,initializer:null}),U=se(w.prototype,"designtimeSettings",[E],{configurable:true,enumerable:true,writable:true,initializer:function(){return"sap/fe/macros/form/FormContainer.designtime"}}),N=se(w.prototype,"actions",[v],{configurable:true,enumerable:true,writable:true,initializer:null}),G=se(w.prototype,"useSingleTextAreaFieldAsNotes",[O],{configurable:true,enumerable:true,writable:true,initializer:null}),R=se(w.prototype,"formElements",[C],{configurable:true,enumerable:true,writable:true,initializer:function(){return{}}}),Q=se(w.prototype,"onChange",[M],{configurable:true,enumerable:true,writable:true,initializer:null}),w))||B);q=de;return q},false);
//# sourceMappingURL=FormContainer.block.js.map