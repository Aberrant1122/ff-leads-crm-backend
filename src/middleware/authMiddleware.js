const { verifyAccessToken } = require('../utils/tokenUtils');
const { errorResponse } = require('../utils/responseUtils');

/**
 * Authentication middleware - Verify JWT access token
 */
const authMiddleware = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 401, 'Access token is required');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyAccessToken(token);

        // Attach user data to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        return errorResponse(res, 401, error.message || 'Invalid or expired token');
    }
};

module.exports = authMiddleware;
