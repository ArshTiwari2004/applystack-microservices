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
            req.userId = decoded.userId;
            next();
        } catch (jwtError) {
            // If JWT verification fails, check if it's a session token in the database
            try {
                const session = await req.db.collection('user_sessions').findOne({ session_token: token });

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
};

module.exports = { authenticate, generateToken, JWT_SECRET };
