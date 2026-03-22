const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
    try {
        // Try to get token from cookie first, then from Authorization header
        let token = req.cookies?.session_token;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({ detail: 'Not authenticated' });
        }

        try {
            // First, try to verify as JWT
            const decoded = jwt.verify(token, JWT_SECRET);
            // in jwt there are 2 things: jwt.verify() and the other one is jwt.decode()
            req.userId = decoded.userId;
            next();
        } catch (jwtError) {
            // If JWT verification fails, check if it's a session token in the database
            try {
                const session = await req.db.collection('user_sessions').findOne({ session_token: token }); // fallback system, validate expiry manually
                // fallback session mechanism using a database collection to support legacy sessions and provide an extra validation layer

                if (!session) {
                    return res.status(401).json({ detail: 'Invalid session' });
                }

                // Check if session is expired
                const expiresAt = new Date(session.expires_at);
                if (expiresAt < new Date()) {
                    return res.status(401).json({ detail: 'Session expired' });
                }

                req.userId = session.user_id;
                next();
            } catch (dbError) {
                console.error('Database error in authenticate:', dbError);
                return res.status(503).json({ detail: 'Database unavailable' });
            }
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ detail: 'Invalid token' });
    }
};

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    // token expiry time is set to 7 days 
};

module.exports = { authenticate, generateToken, JWT_SECRET };
