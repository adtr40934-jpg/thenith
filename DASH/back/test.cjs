const { MongoClient } = require('mongodb');
async function run() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('thenith_db');
  const plans = await db.collection('plans').find().toArray();
  console.log(JSON.stringify(plans, null, 2));
  process.exit(0);
}
run();
