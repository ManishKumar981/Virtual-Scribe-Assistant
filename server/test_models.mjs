import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const apiKey = process.env.GEMINI_API_KEY;

async function checkModels() {
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-exp'];
  
  for (const m of models) {
    console.log(`Checking ${m}...`);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with just "OK"' }] }],
        })
      });
      const txt = await res.text();
      console.log(`Model ${m} status:`, res.status, txt.slice(0, 120));
      if (res.status === 200) {
        console.log(`>>> SUCCESS WITH ${m}`);
        break;
      }
    } catch (e) {
      console.error(`Error with ${m}:`, e.message);
    }
  }
}

checkModels();
