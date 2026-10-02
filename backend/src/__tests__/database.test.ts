import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
const { uuid_ossp } = require('@electric-sql/pglite/contrib/uuid_ossp');

const sql = (file: string) => readFileSync(resolve(__dirname, '../../../database', file), 'utf8');

for (const schema of ['schema.sql', 'schema-safe.sql']) {
  test(`budget and payment migration: ${schema}`, async (t) => {
    const db = new PGlite({ extensions: { uuid_ossp } });
    t.after(() => db.close());
    await db.exec(`
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id UUID PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS UUID AS $$ SELECT NULL::uuid $$ LANGUAGE sql;
    `);
    await db.exec(sql(schema));
    const user = '10000000-0000-4000-8000-000000000001';
    const otherUser = '10000000-0000-4000-8000-000000000002';
    await db.query('INSERT INTO auth.users (id) VALUES ($1), ($2)', [user, otherUser]);
    const categories = await db.query<{ id: string }>('SELECT id FROM expense_categories WHERE user_id = $1 ORDER BY order_index', [user]);
    const [food, ride] = categories.rows.map(row => row.id);
    const otherCategories = await db.query<{ id: string }>('SELECT id FROM expense_categories WHERE user_id = $1 LIMIT 1', [otherUser]);
    const otherFood = otherCategories.rows[0].id;
    const transaction = '20000000-0000-4000-8000-000000000001';
    await db.query(`INSERT INTO expenses (id, user_id, category_id, amount, date, transaction_type, status)
      VALUES ($1, $2, $3, 250, '2026-10-02', 'upi', 'confirmed')`, [transaction, user, food]);
    // Simulate the deployed schema without payment_mode; keep the expense intact.
    await db.exec('ALTER TABLE expenses DROP COLUMN payment_mode');
    await db.exec(sql('fix-app-bugs.sql'));
    await db.exec(sql('fix-app-bugs.sql'));

    const spend = async (category: string, month = '2026-10', userId = user) => {
      const result = await db.query<{ current_spend: string }>('SELECT current_spend FROM budgets WHERE category_id=$1 AND month_year=$2 AND user_id=$3', [category, month, userId]);
      return Number(result.rows[0].current_spend);
    };
    await t.test('migration is repeatable and preserves existing transactions', async () => {
      const result = await db.query<{ payment_mode: string; amount: string }>('SELECT payment_mode, amount FROM expenses WHERE id=$1', [transaction]);
      assert.equal(result.rows.length, 1);
      assert.equal(result.rows[0].payment_mode, 'UPI');
      assert.equal(Number(result.rows[0].amount), 250);
    });
    await db.query(`INSERT INTO budgets (user_id, category_id, monthly_limit, month_year) VALUES
      ($1, $2, 1000, '2026-10'), ($1, $3, 1000, '2026-10'), ($1, $3, 1000, '2026-09'), ($4, $5, 1000, '2026-10')`, [user, food, ride, otherUser, otherFood]);
    await t.test('new budgets include expenses that already exist', async () => {
      assert.equal(await spend(food), 250);
    });
    await t.test('moving an expense updates both categories and stays scoped to its user', async () => {
      await db.query('UPDATE expenses SET category_id=$1 WHERE id=$2', [ride, transaction]);
      assert.equal(await spend(food), 0);
      assert.equal(await spend(ride), 250);
      assert.equal(await spend(otherFood, '2026-10', otherUser), 0);
    });
    await t.test('moving an expense to another month settles both months', async () => {
      await db.query("UPDATE expenses SET date='2026-09-30' WHERE id=$1", [transaction]);
      assert.equal(await spend(ride), 0);
      assert.equal(await spend(ride, '2026-09'), 250);
    });
    await t.test('pending expenses do not affect confirmed spending', async () => {
      await db.query("UPDATE expenses SET status='pending' WHERE id=$1", [transaction]);
      assert.equal(await spend(ride, '2026-09'), 0);
      await db.query("UPDATE expenses SET status='confirmed' WHERE id=$1", [transaction]);
    });
    await t.test('direct writes cannot replace computed budget spending', async () => {
      await db.query("UPDATE budgets SET current_spend=999 WHERE category_id=$1 AND month_year='2026-09'", [ride]);
      assert.equal(await spend(ride, '2026-09'), 250);
    });
    await t.test('deleting an expense removes its spending without trigger errors', async () => {
      await db.query('DELETE FROM expenses WHERE id=$1', [transaction]);
      assert.equal(await spend(ride, '2026-09'), 0);
    });
    if (schema === 'schema-safe.sql') {
      await t.test('the safe bootstrap can also be rerun', async () => { await db.exec(sql(schema)); });
    }
  });
}
