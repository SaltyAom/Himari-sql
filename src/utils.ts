export type _ =
	| '\u{9}' // '\t'
	| '\u{A}' // '\n'
	| '\u{20}' // ' '

export type TrimLeft<
	V extends string,
	Replace extends string = _
> = V extends `${Replace}${infer R}` ? TrimLeft<R> : V

export type TrimRight<
	V extends string,
	Replace extends string = _
> = V extends `${infer R}${Replace}` ? TrimRight<R> : V

export type TrimRightRemoveEmpty<V extends string> =
	TrimRight<V> extends infer Value ? (Value extends '' ? null : Value) : null

export type Trim<V extends string, Replace extends string = _> = TrimLeft<
	TrimRight<V, Replace>,
	Replace
>

export type And<T extends boolean, R extends boolean> = T extends true
	? R
	: false

export type Or<T extends boolean, R extends boolean> = T extends true ? true : R

export type Prettify<T> = {
	[K in keyof T]: T[K]
} & {}

export type Filter<T extends unknown[], ToFilter> = T extends [
	infer A,
	...infer Rest
]
	? A extends ToFilter
		? Filter<Rest, ToFilter>
		: [A, ...Filter<Rest, ToFilter>]
	: T

export type FilterCast<Target, T extends unknown[], ToFilter> =
	Filter<T, ToFilter> extends infer Value extends Target ? Value : never

export type Split<
	T extends string,
	By extends string,
	Acc extends string[] = []
> = T extends `${infer First}${By}${infer Rest}`
	? Split<Rest, By, [...Acc, First]>
	: [...Acc, T]

export type Count<
	T extends string,
	By extends string,
	Acc extends number[] = []
> = T extends `${string}${By}${infer Rest}` ? Count<Rest, By, [...Acc, 0]> : Acc

export type CountStartWith<
	T extends string,
	By extends string,
	Acc extends number[] = []
> = T extends `${By}${infer Rest}` ? CountStartWith<Rest, By, [...Acc, 0]> : Acc

export type CreateCharacter<
	Char extends string,
	Count extends number[] = [],
	Acc extends string = ''
> = Count['length'] extends 0
	? Acc
	: CreateCharacter<
			Char,
			Count extends [number, ...infer Rest] ? Rest : never,
			`${Acc}${Char}`
		>

export type CreateBracketPattern<
	T extends number[] = [],
	Pattern extends string = ''
> = T['length'] extends 0
	? Pattern
	: T extends [number, ...infer Rest extends number[]]
		? CreateBracketPattern<Rest, `${Pattern}${string})`>
		: never

export type BalanceBracket<T extends string> =
	T extends `${string}(${infer Content})${infer Rest}`
		? Count<Content, '('> extends infer Iteration extends number[]
			? Iteration['length'] extends 0
				? Content
				: `${Content})${`)${Rest}` extends `${CreateBracketPattern<Iteration>}${infer Capture}`
						? Rest extends `${infer Part}${Capture}`
							? `${Part}${CreateCharacter<')', CountStartWith<Capture, ')'>>}${BalanceBracket<`(${TrimLeft<Capture, ')'>}`>}`
							: never
						: never}`
			: never
		: T
