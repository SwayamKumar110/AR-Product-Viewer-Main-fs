// test-connection.js - Test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...\n');
console.log('Connection string (password hidden):');
const uri = process.env.MONGO_URI;
if (uri) {
  // Hide password in output
  const hiddenUri = uri.replace(/:(.*?)@/, ':****@');
  console.log(hiddenUri);
} else {
  console.log('❌ MONGO_URI not found in .env file!');
  process.exit(1);
}

console.log('\nAttempting to connect...\n');

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log('✅ Connected to:', mongoose.connection.name);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection failed!\n');
    
    if (err.message.includes('authentication failed')) {
      console.log('🔍 AUTHENTICATION ERROR - Possible issues:');
      console.log('   1. Wrong password in .env file');
      console.log('   2. Password contains special characters that need URL encoding');
      console.log('   3. Wrong username');
      console.log('   4. User does not exist in MongoDB Atlas\n');
      console.log('💡 Solutions:');
      console.log('   - Double-check your password in MongoDB Atlas');
      console.log('   - If password has special chars, URL encode them:');
      console.log('     @ → %40, # → %23, $ → %24, % → %25, & → %26');
      console.log('   - Make sure username is: adeebainul4_db_user');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      console.log('🔍 NETWORK ERROR - Cannot reach MongoDB Atlas');
      console.log('   - Check your internet connection');
      console.log('   - Verify cluster name: fsproject.bofyu98.mongodb.net');
    } else if (err.message.includes('timeout')) {
      console.log('🔍 TIMEOUT ERROR - Connection timed out');
      console.log('   - Check MongoDB Atlas IP whitelist');
      console.log('   - Add your IP or 0.0.0.0/0 to Network Access');
    }
    
    console.log('\nFull error:', err.message);
    process.exit(1);
  });

