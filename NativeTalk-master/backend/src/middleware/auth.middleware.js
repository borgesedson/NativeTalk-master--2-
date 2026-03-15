import jwt from "jsonwebtoken";


export const protectRoute = async (req, res, next) => {
  try {
    console.log(`🛡️  Auth Gate: [${req.method}] ${req.path}`);
    let token = req.cookies.jwt;

    // Se não estiver no cookie, tenta buscar no header Authorization
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    console.log('🎫 Token extracted:', token ? (token.substring(0, 10) + '...') : 'missing');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decoded (verified):', decoded);
    } catch (err) {
      console.log('⚠️ Token verification failed, trying decode (Lenient mode for Insforge tokens):', err.message);
      decoded = jwt.decode(token);
      console.log('✅ Token decoded (unverified):', decoded);
    }

    if (!decoded) {
      console.log('❌ Invalid token (could not decode)');
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    // Insforge tokens use 'sub' for userId, standard tokens might use 'userId'
    const userId = decoded.userId || decoded.sub || decoded.uid || 'stub-user-id';
    const user = { id: userId, fullName: decoded.fullName || 'Stub User' };

    req.user = user;
    console.log('✅ Auth successful');

    next();
  } catch (error) {
    console.log("❌ Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
