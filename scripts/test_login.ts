// Use the global fetch provided by Node.js (v18+ / v24)
async function main() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'AdminPass123' }),
    });
    console.log('Status:', res.status);
    const txt = await res.text();
    console.log('Body:', txt);
  } catch (err) {
    console.error('Request failed:', err);
    process.exitCode = 1;
  }
}

main();
