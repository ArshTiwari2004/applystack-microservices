const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../middleware/auth');

// Cookie options based on environment
const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction, // Only secure in production (HTTPS)
        sameSite: isProduction ? 'none' : 'lax', // 'lax' for localhost, 'none' for cross-origin in prod
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
    };
};

const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ detail: 'Email, password, and name are required' });
        }

        // Check if user already exists
        const existingUser = await req.db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ detail: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userId = `user_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
        const user = {
            user_id: userId,
            email,
            name,
            password: hashedPassword,
            picture: null,
            created_at: new Date().toISOString()
        };

        await req.db.collection('users').insertOne(user);

        // Generate JWT token
        const token = generateToken(userId);

        // Set cookie with proper options
        res.cookie('session_token', token, getCookieOptions());

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ detail: 'Email and password are required' });
        }

        // Find user
        const user = await req.db.collection('users').findOne({ email });
        if (!user) {
            return res.status(401).json({ detail: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ detail: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = generateToken(user.user_id);

        // Set cookie with proper options
        res.cookie('session_token', token, getCookieOptions());

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        delete userWithoutPassword._id;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await req.db.collection('users').findOne(
            { user_id: req.userId },
            { projection: { _id: 0, password: 0 } }
        );

        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.cookies?.session_token;

        if (token) {
            // Try to delete session from database (for legacy sessions)
            await req.db.collection('user_sessions').deleteOne({ session_token: token });
        }

        res.clearCookie('session_token', { path: '/' });
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.clearCookie('session_token', { path: '/' });
        res.json({ message: 'Logged out successfully' });
    }
};

const nodemailer = require('nodemailer');

// ... existing code ...

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ detail: 'Email is required' });
        }

        const user = await req.db.collection('users').findOne({ email });
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in separate collection or user document. 
        // Using a separate collection 'otps' is cleaner.
        await req.db.collection('otps').insertOne({
            email,
            otp,
            expiresAt: otpExpires,
            createdAt: new Date()
        });

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'OTP sent to your email' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ detail: 'Error sending OTP' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ detail: 'Email, OTP, and new password are required' });
        }

        // Verify OTP
        const validOtp = await req.db.collection('otps').findOne({
            email,
            otp,
            expiresAt: { $gt: new Date() }
        });

        if (!validOtp) {
            return res.status(400).json({ detail: 'Invalid or expired OTP' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await req.db.collection('users').updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );

        // Delete used OTP (and potentially all OTPs for this email to prevent reuse)
        await req.db.collection('otps').deleteMany({ email });

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ detail: 'Error resetting password' });
    }
};

module.exports = {
    register,
    login,
    getMe,
    logout,
    forgotPassword,
    resetPassword
};
