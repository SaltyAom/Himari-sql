import type {
	_,
	Prettify,
	Trim,
	TrimLeft,
	Split,
	BalanceBracket
} from './utils'

export const CREATE_ERROR_SYMBOL = Symbol('CREATE_ERROR')
export type CREATE_ERROR_SYMBOl = typeof CREATE_ERROR_SYMBOL

type CreateError<Message extends string = string> = {
	[CREATE_ERROR_SYMBOL]: Message
}

type CreateMetadata = Record<
	string,
	Record<string, unknown> & { [CREATE_ERROR_SYMBOL]?: string }
>

export type Create<SQL extends string> =
	TrimLeft<SQL, _ | ';'> extends infer SQL extends string
		? SQL extends `${
				| 'CREATE'
				| 'create'}${string}${'TABLE' | 'table'}${_}${'IF' | 'if'}${_}${'NOT' | 'not'}${_}${'EXISTS' | 'exists'}${_}${infer Table} ${infer Rest}`
			? InferCreate<Table, Rest>
			: SQL extends `${
						| 'CREATE'
						| 'create'}${string}${'TABLE' | 'table'}${_}${infer Table} ${infer Rest}`
				? InferCreate<Table, Rest>
				: {}
		: {}

type InferCreate<Table extends string, Rest extends string> =
	BalanceBracket<Rest> extends infer Fields extends string
		? Prettify<
				Record<Table, Prettify<ResolveFields<Fields>>> &
					(Rest extends `${string}${Fields}${infer OtherTable}`
						? Create<TrimLeft<OtherTable, ')' | ';'>>
						: {})
			>
		: CreateError<Rest>

type ResolveFields<Fields extends string> = {
	[Key in TrimLeft<
		Split<Trim<Fields>, ','>[number]
	> as Key extends `${infer Name}${_}${string}`
		? Name
		: never]-?: Key extends `${string}${_}${infer Type}${_}${string}`
		? ResolveType<Type>
		: Key extends `${string}${_}${infer Type}`
			? ResolveType<Type>
			: never
}

type ResolveType<Type extends string> =
	Uppercase<Type> extends `${infer Type}(${string}`
		? Type extends keyof TypeMap
			? TypeMap[Type]
			: unknown
		: Uppercase<Type> extends keyof TypeMap
			? TypeMap[Uppercase<Type>]
			: unknown

interface TypeMap {
	// SQLite
	TEXT: string
	NUMERIC: number
	INTEGER: number
	REAL: number
	BLOB: string
	// PostgreSQL
	CHAR: string
	VARCHAR: string
	INT: number
	SMALLINT: number
	BIGINT: number
	DECIMAL: number
	DOUBLE: number
	SERIAL: number
	BOOLEAN: boolean
	DATE: string
	TIME: string
	TIMESTAMP: string
	INTERVAL: string
}
