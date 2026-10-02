import {randomUUID,scrypt} from 'node:crypto';
import {Pool} from 'pg';
import {createInterface} from 'node:readline/promises';
// Explicit operator-only bootstrap; credentials are read interactively, never command arguments/env defaults.
const rl=createInterface({input:process.stdin,output:process.stdout});
const code=(await rl.question('Initial ADMIN participant code: ')).trim().toUpperCase();
if(!/^[A-Z][A-Z0-9-]{1,31}$/.test(code))throw Error('Invalid code');
const pin=await rl.question('New ADMIN PIN (8–12 digits; input visible in this operator terminal): ');rl.close();
if(!/^\d{8,12}$/.test(pin))throw Error('Use 8–12 digits');
const {randomBytes}=await import('node:crypto');const salt=randomBytes(16);
const key=await new Promise<Buffer>((ok,no)=>scrypt(pin,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024},(e,k)=>e?no(e):ok(k)));
const pool=new Pool({connectionString:process.env.DATABASE_URL});
try{const client=await pool.connect();try{await client.query('BEGIN');await client.query('LOCK TABLE users IN EXCLUSIVE MODE');if((await client.query("SELECT id FROM users WHERE role IN ('ADMIN','RESEARCHER') LIMIT 1")).rowCount)throw Error('Privileged account already exists; bootstrap refused');await client.query('INSERT INTO users (id,participant_code,pin_hash,role) VALUES ($1,$2,$3,\'ADMIN\')',[randomUUID(),code,`scrypt$32768$8$3$${salt.toString('hex')}$${key.toString('hex')}`]);await client.query('COMMIT');console.log('Initial account created. PIN is not retained.');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}finally{await pool.end();}
