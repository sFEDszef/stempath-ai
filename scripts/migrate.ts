import {Pool} from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import {migrate} from 'drizzle-orm/node-postgres/migrator';
async function main(){
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required');
const pool=new Pool({connectionString:process.env.DATABASE_URL});
try{await migrate(drizzle(pool),{migrationsFolder:'drizzle'});console.log('Database migrations applied.');}finally{await pool.end();}

}
void main().catch(()=>{console.error('Migration failed; check the database configuration and operator diagnostics.');process.exitCode=1;});
