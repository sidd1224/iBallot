// backend/__tests__/integration/auth.test.js
const request = require('supertest');
const app = require('../../app'); // Assuming app.js is in backend/

const VALID_TOKEN = process.env.ADMIN_TOKEN;

describe('POST /admin/auth/login', () => {
  it('should return 400 when no token is provided', async () => {
    const res = await request(app).post('/admin/auth/login');
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: 'Token is required',
    });
  });

  it('should return 401 when invalid token is provided', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      success: false,
      error: 'Invalid admin token',
    });
  });

  it('should return 200 when valid token is provided in body', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ token: VALID_TOKEN });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Admin authenticated',
    });
  });
});
