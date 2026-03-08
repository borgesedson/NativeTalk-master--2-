import jwt from "jsonwebtoken";


export const protectRoute = async (req, res, next) => {
  try {
    let token = req.cookies.jwt;

    // Se não estiver no cookie, tenta buscar no header Authorization
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    console.log('🔐 protectRoute - Checking auth...');
    console.log('🎫 Token:', token ? 'exists' : 'missing');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', decoded);

    if (!decoded) {
      console.log('❌ Invalid token');
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    // Bypassing MongoDB lookup
    const user = { _id: decoded.userId || 'stub-user-id', fullName: 'Stub User' };

    req.user = user;
    console.log('✅ Auth successful');

    next();
  } catch (error) {
    console.log("❌ Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
