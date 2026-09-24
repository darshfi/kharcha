import request from 'supertest';
import app from '../server';

describe('GET /api/health', () => {
  it('should return OK status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });
});