import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

console.log(process.env.DB_USER)

class Database {
    constructor() {
        if (!Database.instance) {
            this.pool = new Pool({
                user: process.env.DB_USER,
                host: process.env.HOST,
                database: process.env.DATABASE,
                password: process.env.PASSWORD,
                port: process.env.PORT,
            });
            Database.instance = this;
        }
        return Database.instance;
    }

    async query(text, params) {
        const client = await this.pool.connect();
        try {
            const res = await client.query(text, params);
            return res;
        } finally {
            client.release();
        }
    }
}

const instance = new Database();
Object.freeze(instance);

export default instance;
