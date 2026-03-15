import jwt from 'jsonwebtoken';

const secret = 'meusiteseguro';
const token = jwt.sign({ userId: 'test-user-id', fullName: 'Test User' }, secret);

async function test() {
  try {
    const res = await fetch('http://localhost:5001/api/chat/token', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

test();
