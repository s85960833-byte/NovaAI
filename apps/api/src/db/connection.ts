import {Pool} from "pg";import {drizzle} from "drizzle-orm/node-postgres";
const connectionString=process.env.DATABASE_URL;
export const pool=connectionString?new Pool({connectionString,max:5,connectionTimeoutMillis:2500,idleTimeoutMillis:10000,ssl:connectionString.includes("supabase")?{rejectUnauthorized:true}:undefined}):null;
export const db=pool?drizzle(pool):null;
export async function databaseHealth(){if(!pool)return {configured:false,ok:false};try{await pool.query("select 1");return {configured:true,ok:true};}catch{return {configured:true,ok:false};}}