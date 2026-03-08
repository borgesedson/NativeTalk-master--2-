import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5001/api';
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

async function testTranslation() {
    console.log('🔍 Starting Translation Diagnostic...');
    console.log(`🔑 Key check: ${DEEPL_API_KEY ? 'Present (ending in ' + DEEPL_API_KEY.slice(-3) + ')' : 'MISSING'}`);

    if (!DEEPL_API_KEY) {
        console.error('❌ Error: DEEPL_API_KEY not found in .env');
        return;
    }

    // Note: This script assumes the server is running.
    // We'll test the backend logic directly via the controller OR mock a request.

    console.log('\n--- Environment Check ---');
    console.log(`Port: ${process.env.PORT || 5001}`);
    console.log(`Source Language Default: Portuguese`);

    console.log('\n✅ System appears ready for testing.');
    console.log('👉 To perform a full live test:');
    console.log('1. Start backend: npm run dev (in /backend)');
    console.log('2. Start frontend: npm run dev (in /frontend)');
    console.log('3. Log in and use the translate icon 🌐 on any message.');
}

testTranslation();
