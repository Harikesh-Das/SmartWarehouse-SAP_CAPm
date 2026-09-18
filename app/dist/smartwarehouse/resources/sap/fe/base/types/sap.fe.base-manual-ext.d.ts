declare namespace JSX {
	export type CommandProperties = `cmd:${string}|${string}`;
	export type Ref<T> = {
		current?: T;
		setCurrent(oControlInstance: T): void;
	};
	interface IntrinsicElements {
		div: { id?: string; class?: string; ref?: Ref<never>; tabindex?: number; role?: string };
		span: { id?: string; class?: string; ref?: Ref<never>; role?: string };
		slot: { name: string };
	}
	interface IntrinsicClassAttributes<T> {
		id?: string;
		class?: string;
		binding?: string | Record<string, string>;
		["xmlns:fl"]?: string;
		["core:require"]?: string;
		["log:sourcePath"]?: string;
		["customData:entityType"]?: string;
		["fl:delegate"]?: string | { name: string; delegateType: string };
		["dt:designtime"]?: string | { name: string; delegateType: string };
		["fl:flexibility"]?: string;
		ref?: Ref<T>;
		["jsx:command"]?: CommandProperties;
	}
}

declare module "sap/fe/base/BindingToolkit" {
	export type PathInModelExpression<K> = never;
	export type ConstantExpression<K> = never;
	export type BindingToolkitExpression<K> = never;
	export type PrimitiveType = string | number | bigint | boolean | object | null | undefined;
}
