import 'server-only';
import {Pool} from 'pg';
export interface DB {query<T extends Record<string,unknown>=Record<string,unknown>>(sql:string,params?:unknown[]):Promise<T[]>;transaction<T>(run:(db:DB)=>Promise<T>):Promise<T>;}
let pool:Pool|undefined;
export function database():DB {
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required in POSTGRES mode');
 pool??=new Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
 const source=pool;
 return {query:async(sql,params)=> (await source.query(sql,params)).rows,transaction:async run=>{const c=await source.connect();try{await c.query('BEGIN');const db:DB={query:async(sql,params)=>(await c.query(sql,params)).rows,transaction:fn=>fn(db)};const v=await run(db);await c.query('COMMIT');return v;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}};
}
