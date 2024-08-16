import { AkeboshiHimari, Database } from './lib'

const table = `
    CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        display varchar(40),
        name TEXT
    );

    CREATE TABLE IF NOT EXISTS profile (
        uid INTEGER PRIMARY KEY,
        alias TEXT
    );

    CREATE TABLE IF NOT EXISTS affiliation (
        uid INTEGER PRIMARY KEY,
        name TEXT
    );

    INSERT INTO user (name) VALUES ('Himari');
    INSERT INTO profile (uid, alias) VALUES (1, 'Tensai Bishoujo Hacker');
    INSERT INTO affiliation (uid, name) VALUES (1, 'Paranormal Affairs Department');

    INSERT INTO user (name) VALUES ('Rio');
    INSERT INTO profile (uid, alias) VALUES (2, 'Big Sister');
    INSERT INTO affiliation (uid, name) VALUES (2, 'Seminar');
`

const db = new AkeboshiHimari(new Database(':memory:'), table)

const result = db.all(`
    SELECT
        u.name,
        a.name as affiliation,
        p.alias
    FROM user as u
    JOIN
        profile p ON u.id = p.uid
    JOIN
        affiliation a ON u.id = a.uid
`)

console.log(result)
