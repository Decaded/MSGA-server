/**
 * Express middleware to set common security-related HTTP headers.
 *
 * Sets the following headers:
 * - X-Content-Type-Options: Prevents MIME type sniffing.
 * - X-Frame-Options: Prevents the page from being displayed in a frame (clickjacking protection).
 * - Content-Security-Policy: Restricts sources for scripts, styles, images, fonts, and connections.
 *
 * @function
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';"
  );
  next();
};
exports.securityHeaders = securityHeaders;
