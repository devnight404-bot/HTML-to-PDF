/**
 * Validates incoming PDF conversion requests.
 *
 * Checks two things:
 * 1. API key is present and correct (security)
 * 2. HTML field is present and not empty (validation)
 */
function validateRequest(req, res, next) {
  // Check API key from the Authorization header
  const authHeader = req.headers['authorization'];
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    // If API_KEY env var is not set, reject all requests (fail safe)
    return res.status(500).json({ error: 'Server misconfigured: API_KEY not set' });
  }

  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing API key' });
  }

  // Check that html field exists and is not empty
  const { html } = req.body;

  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    return res.status(400).json({ error: 'Bad request: "html" field is required and cannot be empty' });
  }

  // All good — pass to the next handler (the route)
  next();
}

module.exports = validateRequest;
