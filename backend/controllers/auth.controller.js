const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma.config');
const crypto = require('crypto'); // Ensure crypto is imported for future use if needed

/**
 * Handles new user registration.
 * Hashes the password and saves the new user to the database.
 */
const register = async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ data: { email, password: hashedPassword } });
        res.status(201).json({ id: user.id, email: user.email });
    } catch (error) {
        res.status(400).json({ error: "User with this email already exists." });
    }
};

/**
 * Handles user login.
 * Verifies credentials and sets a secure, httpOnly cookie for session management.
 * Uses a production-ready cookie policy.
 */
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials." });
        }
        
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        // --- THIS IS THE FINAL FIX ---
        // Use different cookie settings for production vs. development.
        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('token', token, {
            httpOnly: true,
            // 'secure' must be true in production so cookies are only sent over HTTPS.
            // It must be false for localhost HTTP.
            secure: isProduction,
            // 'sameSite' must be 'none' for cross-domain cookies in production.
            // 'lax' is the default and works perfectly for localhost development.
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
        // -----------------------
        
        res.status(200).json({ message: "Login successful." });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed." });
    }
};

/**
 * Handles user logout by clearing the authentication cookie.
 */
const logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: "Logged out successfully." });
};

/**
 * Handles password changes for an authenticated user.
 * Verifies the old password before updating to the new one.
 */
const changePassword = async (req, res) => {
    const { userId } = req.user;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Old and new passwords are required." });
    }

    if (newPassword.length <= 6) {
        return res.status(400).json({ error: "New password must be longer than 6 characters." });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect old password." });
        }
        
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });

        res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ error: "An error occurred while changing the password." });
    }
};

module.exports = { register, login, logout, changePassword };