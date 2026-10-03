import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { createHash } from 'node:crypto';
const { uuid_ossp } = require('@electric-sql/pglite/contrib/uuid_ossp');
const sql = (name: string) => readFileSync(resolve(__dirname, '../../../database', name), 'utf8');
const owner='10000000-0000-4000-8000-000000000001';
const other='10000000-0000-4000-8000-000000000002';
const eventId=(name: string) => createHash('sha256').update(name).digest('hex');

test('atomic capture migration and account isolation', async t => {
  const db=new PGlite({ extensions: { uuid_ossp } });
  t.after(() => db.close());
  await db.exec(`CREATE SCHEMA auth; CREATE TABLE auth.users(id UUID PRIMARY KEY);
    CREATE ROLE authenticated; CREATE ROLE anon;
    CREATE FUNCTION auth.uid() RETURNS UUID AS $$ SELECT nullif(current_setting('app.user',true),'')::uuid $$ LANGUAGE sql;`);
  await db.exec(sql('schema.sql'));
  await db.exec(sql('fix-app-bugs.sql'));
  await db.query('INSERT INTO auth.users(id) VALUES($1),($2)',[owner,other]);
  await db.exec(sql('automatic-capture.sql'));
  await db.exec(sql('automatic-capture.sql'));
  await db.query("SELECT set_config('app.user',$1,false)",[owner]);
  const capture = (event: string, reference: string, kind='expense', amount=250, expected=owner, source='com.phonepe.app') =>
    db.query<{ result: { outcome: string; id: string; type: string } }>(`SELECT public.import_notification_transaction($1,$2,$3,$4,$5,current_date,'UPI',$6,5000) AS result`,[eventId(event),source,kind,amount,reference,expected]);
  const first=(await capture('a','426812345678')).rows[0].result;
  await t.test('confirmed amount is separate from bank balance and uses owned category',async () => {
    const result=await db.query<{ amount: string; balance_after: string; status: string; user_id: string; category_id: string }>('SELECT * FROM expenses WHERE id=$1',[first.id]);
    const row=result.rows[0];
    assert.equal(Number(row.amount),250); assert.equal(Number(row.balance_after),5000); assert.equal(row.status,'confirmed');
    const category=await db.query<{ user_id: string }>('SELECT user_id FROM expense_categories WHERE id=$1',[row.category_id]);
    assert.equal(category.rows[0].user_id,owner);
  });
  await t.test('event retries and references across source apps produce one ledger row',async () => {
    assert.equal((await capture('a','426812345678')).rows[0].result.outcome,'duplicate');
    assert.equal((await capture('b','426812345678','expense',250,owner,'com.google.android.apps.messaging')).rows[0].result.id,first.id);
    const results=await Promise.all([capture('c','426812345679'),capture('d','426812345679'),capture('e','426812345679')]);
    assert.equal(results.filter(r => r.rows[0].result.outcome==='imported').length,1);
    assert.equal(new Set(results.map(r => r.rows[0].result.id)).size,1);
    assert.equal((await db.query('SELECT * FROM expenses')).rows.length,2);
  });
  await t.test('deleted ledger rows keep permanent dedupe receipts',async () => {
    await db.query('DELETE FROM expenses WHERE id=$1',[first.id]);
    assert.equal((await capture('f','426812345678')).rows[0].result.id,first.id);
    assert.equal((await db.query('SELECT * FROM expenses WHERE id=$1',[first.id])).rows.length,0);
  });
  await t.test('conflicting amounts fail without ledger writes',async () => {
    await assert.rejects(capture('g','426812345678','expense',999),/Conflicting amount/);
    assert.equal((await db.query("SELECT * FROM capture_events WHERE event_id=$1",[eventId('g')])).rows.length,0);
  });
  await t.test('existing manual UPI references dedupe into a permanent receipt',async () => {
    const result=await db.query<{ id: string }>("INSERT INTO expenses(user_id,amount,date,upi_ref_number,status) VALUES($1,99,current_date,'MANUAL123','confirmed') RETURNING id",[owner]);
    const imported=(await capture('h','MANUAL123','expense',99)).rows[0].result;
    assert.equal(imported.outcome,'duplicate'); assert.equal(imported.id,result.rows[0].id);
  });
  await t.test('credits insert only into incomes',async () => {
    const result=(await capture('i','426812345680','income',1000)).rows[0].result;
    assert.equal(result.type,'income');
    assert.equal((await db.query('SELECT * FROM incomes WHERE id=$1',[result.id])).rows.length,1);
    assert.equal((await db.query('SELECT * FROM expenses WHERE id=$1',[result.id])).rows.length,0);
  });
  await t.test('one-rupee own-account debit and credit share a reference without losing either direction',async () => {
    const debit=(await capture('one-rupee-debit','123456789099','expense',1)).rows[0].result;
    const credit=(await capture('one-rupee-credit','123456789099','income',1)).rows[0].result;
    assert.equal(debit.outcome,'imported'); assert.equal(credit.outcome,'imported');
    assert.notEqual(debit.id,credit.id);
    assert.equal((await capture('one-rupee-debit-retry','123456789099','expense',1)).rows[0].result.outcome,'duplicate');
    assert.equal((await capture('one-rupee-credit-retry','123456789099','income',1)).rows[0].result.outcome,'duplicate');
    const expense=await db.query<{ amount: string }>('SELECT amount FROM expenses WHERE id=$1',[debit.id]);
    const income=await db.query<{ amount: string }>('SELECT amount FROM incomes WHERE id=$1',[credit.id]);
    assert.equal(Number(expense.rows[0].amount),1); assert.equal(Number(income.rows[0].amount),1);
  });
  await t.test('expected account prevents switch races and user spoofing',async () => {
    await assert.rejects(capture('j','426812345681','expense',250,other),/Account changed/);
    await db.query("SELECT set_config('app.user',$1,false)",[other]);
    await assert.rejects(capture('j','426812345681'),/Account changed/);
    const result=(await capture('a','426812345678','expense',250,other)).rows[0].result;
    assert.equal(result.outcome,'imported'); assert.notEqual(result.id,first.id);
  });
  await t.test('anonymous caller and invalid precision are rejected',async () => {
    await db.query("SELECT set_config('app.user','',false)");
    await assert.rejects(capture('k','426812345682'),/Authentication required/);
    await db.query("SELECT set_config('app.user',$1,false)",[owner]);
    await assert.rejects(capture('k','426812345682','expense',1.001),/Invalid captured transaction/);
  });
  await t.test('authenticated clients cannot directly forge import receipts',async () => {
    await db.exec('SET ROLE authenticated');
    await assert.rejects(db.query('INSERT INTO capture_events(user_id,event_id,transaction_kind,reference_key,amount,ledger_id) VALUES($1,$2,$3,$4,1,$5)',[owner,'z'.repeat(64),'expense','FORGED123',first.id]),/permission denied/);
    const ownRows=await db.query<{ user_id: string }>('SELECT user_id FROM capture_events');
    assert.ok(ownRows.rows.every(r => r.user_id===owner));
    // RPC SECURITY DEFINER still enforces auth.uid()/expected owner and cannot accept category/user overrides.
    assert.equal((await capture('l','426812345683')).rows[0].result.outcome,'imported');
    await db.exec('RESET ROLE');
  });
});
