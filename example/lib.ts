import { Database } from 'bun:sqlite'

import type * as Himari from '../src/index'
import type { Prettify } from '../src/utils'

export { Database }

export class AkeboshiHimari<
	const TableSQL extends string = '',
	const Source extends Object = Himari.Create<TableSQL>
> {
	constructor(
		public db: Database,
		table: TableSQL = '' as TableSQL
	) {
		this.run = db.run.bind(db)

		if (table) db.run(table)
	}

	run: Database['run']
	'~source'?: Source

	create<const SQL extends string>(
		sql: SQL
	): AkeboshiHimari<
		`${TableSQL}\n${SQL}`,
		Prettify<Source & Himari.Create<SQL>>
	> {
		this.db.run(sql)

		return this
	}

	one<const SQL extends string>(sql: SQL): Himari.Select<SQL, Source> | null {
		return this.db.query(sql).get() as any
	}

	all<const SQL extends string>(
		sql: SQL
	): Himari.Select<SQL, Source>[] | null {
		return this.db.query(sql).all() as any
	}
}
