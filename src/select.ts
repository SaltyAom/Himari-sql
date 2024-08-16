import type { _, FilterCast, Prettify, Trim, TrimLeft, TrimRight, TrimRightRemoveEmpty } from "./utils"

export const SELECT_ERROR_SYMBOL = Symbol('SELECT_ERROR')
export type SELECT_ERROR_SYMBOl = typeof SELECT_ERROR_SYMBOL

type SelectError<Message extends string = string> = {
    [SELECT_ERROR_SYMBOL]: Message
}

interface SelectMetadata extends ResolvableTable {
    table: string
    prefix?: 'DISTINCT' | 'ALL' | null
    fields: string[] | SelectError
    [SELECT_ERROR_SYMBOL]?: string
}

interface ResolvableTable {
    table: string | null
    alias: string | null
    join?: ResolvableTable
}

export type Select<
    SQL extends string,
    Source extends Object
> = InferSelect<SQL> extends infer Data extends SelectMetadata
    ? Data['fields'] extends SelectError
        ? SelectError<Data['fields'][SELECT_ERROR_SYMBOl]>
        : ApplySelectType<
              Data['table'],
              FilterCast<
                  string[],
                  Extract<Data['fields'], string[]>,
                  SelectError
              >,
              ResolveTable<Data, Source>
          >
    : never

export type InferSelect<SQL extends string> = TrimLeft<SQL> extends `${
    | 'SELECT'
    | 'select'}${_}${infer Fields}${_}${'FROM' | 'from'}${_}${infer TableOrSubQuery}`
    ? ExtractTableAlias<TableOrSubQuery> extends infer Table extends ExtractTableAliasResult
        ? Table &
              ExtractSelectFields<Fields> &
              (Table['next'] extends string ? InferJoin<Table['next']> : {})
        : never
    : never

type ExtractTableAliasResult = {
    table: string | null
    alias: string | null
    next: string | null
}

type ExtractTableAlias<TableAlias extends string> =
    TrimLeft<TableAlias> extends infer TableAlias extends string
        ? TableAlias extends `${infer Table} ${
              | 'as'
              | 'AS'} ${infer Alias} ${infer Rest}`
            ? {
                  table: TrimRight<Table>
                  alias: TrimRightRemoveEmpty<Alias>
                  next: TrimLeft<Rest>
              }
            : TableAlias extends `${infer Table} ${'as' | 'AS'} ${infer Alias}`
            ? {
                  table: TrimRight<Table>
                  alias: TrimRightRemoveEmpty<Alias>
                  next: null
              }
            : TableAlias extends `${infer Table} ${infer Alias} ${infer Rest}`
            ? {
                  table: TrimRight<Table>
                  alias: TrimRightRemoveEmpty<Alias>
                  next: TrimLeft<Rest>
              }
            : TableAlias extends `${infer Table} ${infer Alias}`
            ? {
                  table: TrimRight<Table>
                  alias: TrimRight<Alias>
                  next: null
              }
            : {
                  table: TrimRight<TableAlias>
                  alias: null
                  next: null
              }
        : never

type SelectType = 'DISTINCT' | 'distinct' | 'ALL' | 'all'

type ExtractSelectFields<Fields extends string> =
    Fields extends `${SelectType}${_}${infer Rest}`
        ? {
              fields: ResolveFields<Rest>
          }
        : {
              fields: ResolveFields<Fields>
          }

type InferJoin<JoinClause extends string> =
    JoinClause extends `${infer JoinClause}${_}JOIN${_}${infer JoinConstraint}`
        ? {
              join: ExtractJoinConstraintTableAlias<JoinConstraint>
          }
        : {}

// type JoinOperator = 'LEFT' | 'RIGHT' | 'FULL' | 'INNER' | 'CROSS'

// type ExtractJoinClauseTableAlias<JoinClause extends string> =
//     JoinClause extends `${infer TableAlias} NATURAL ${
//         | JoinOperator
//         | ''}${string}`
//         ? TableAlias
//         : JoinClause extends `${infer TableAlias} ${JoinOperator | ''}${string}`
//         ? TableAlias
//         : null

type ExtractJoinConstraintTableAlias<JoinConstraint extends string> =
    JoinConstraint extends `${infer Table} ON ${infer Rest}`
        ? Prettify<ExtractTableAlias<Table> & InferJoin<Rest>>
        : JoinConstraint extends `${infer Table}`
        ? ExtractTableAlias<Table>
        : {
              table: null
              alias: null
          }

type GetFirstWord<T extends string> = T extends `${infer First}${_}${string}`
    ? First
    : T

type ResolveFieldAs<T extends string> = T extends `${infer Fn}(${string} ${
    | 'as'
    | 'AS'}${_}${infer Alias}`
    ? `${GetFirstWord<Alias>}!${Fn}`
    : T extends `${infer Field} ${'as' | 'AS'} ${infer Alias}`
    ? Field extends `${infer Table}.${infer Field}`
        ? `${Table}.${Field}#${GetFirstWord<Alias>}`
        : GetFirstWord<Alias>
    : GetFirstWord<T>

type _ResolveFields<T extends string> = T extends `${infer First},${infer Rest}`
    ? [ResolveFieldAs<Trim<First>>, ..._ResolveFields<Rest>]
    : ResolveFieldAs<Trim<T>> extends ''
    ? [SelectError<'Unexpected trailing comma between SELECT and FROM'>]
    : [ResolveFieldAs<Trim<T>>]

export type ResolveFields<T extends string> =
    _ResolveFields<T> extends infer Fields extends string[]
        ? Fields
        : SelectError<'Unexpected error between SELECT and FROM'>

type ResolveTable<
    Resolvable extends ResolvableTable | null | undefined,
    Source extends Object,
    Carry extends Record<string, unknown> = {}
> = Resolvable extends null | undefined
    ? Carry
    : NonNullable<Resolvable> extends infer Resolvable extends ResolvableTable
    ? Resolvable['table'] extends keyof Source
        ? {
              [table in Resolvable['table']]: Source[table]
          } & (Resolvable['alias'] extends string
              ? {
                    [alias in Resolvable['alias']]: Source[Resolvable['table']]
                }
              : {}) &
              ResolveTable<Resolvable['join'], Source, Carry>
        : Carry
    : Carry

interface ApplyAggregateFunctionMap {
    AVG: number
    COUNT: number
    GROUP_CONCAT: string
    STRING_AGG: string
    MAX: number
    MIN: number
    SUM: number
    TOTAL: number
}

type ApplyAggregateFunctionType<Fn extends string> =
    Uppercase<Fn> extends keyof ApplyAggregateFunctionMap
        ? ApplyAggregateFunctionMap[Uppercase<Fn>]
        : unknown

type ApplySelectType<
    MainTable extends string,
    Fields extends string[],
    Source extends Object
> = Prettify<
    Fields extends ['*']
        ? MainTable extends keyof Source
            ? Source[MainTable]
            : {}
        : {
              [Field in Fields[number] as Field extends `${infer Table}.${infer Column}#${infer Alias}`
                  ? Alias
                  : Field extends `${infer Table}.${infer Column}`
                  ? Column
                  : Field extends `${infer Alias}!${infer Fn}`
                  ? Alias
                  : Field]: Field extends `${infer Alias}!${infer Fn}`
                  ? ApplyAggregateFunctionType<Fn>
                  : Field extends `${infer Table}.${infer Column}`
                  ? Table extends keyof Source
                      ? Column extends `${infer Name}#${infer Alias}`
                          ? Name extends keyof Source[Table]
                              ? Source[Table][Name]
                              : unknown
                          : Column extends keyof Source[Table]
                          ? Source[Table][Column]
                          : unknown
                      : unknown
                  : Field extends `${infer Column}`
                  ? MainTable extends keyof Source
                      ? Column extends `${infer Name}#${infer Alias}`
                          ? Name extends keyof Source[MainTable]
                              ? Source[MainTable][Name]
                              : unknown
                          : Column extends keyof Source[MainTable]
                          ? Source[MainTable][Column]
                          : unknown
                      : unknown
                  : unknown
          }
>
