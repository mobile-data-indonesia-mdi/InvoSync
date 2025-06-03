import request from 'supertest';
import * as userService from '@services/user.service';
import app from '@app';

describe('POST /users/register', () => {
  it('should return 201 if valid input is given', async () => {
    const res = await request(app).post('/users/register').send({
      username: 'testuser',
      role: 'management',
      password: 'Test1234!',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Data successfully created');
  });

  it('should return 400 if input is invalid', async () => {
    const res = await request(app).post('/users/register').send({
      username: '',
      role: 'management',
      password: 'short',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid parameters');
  });

  it('should return 409 if username already exists', async () => {
    // Buat user terlebih dahulu
    await request(app).post('/users/register').send({
      username: 'testuser',
      role: 'management',
      password: 'Test1234!',
    });

    // Kirim lagi dengan username yang sama
    const res = await request(app).post('/users/register').send({
      username: 'testuser',
      role: 'management',
      password: 'Test1234!',
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Data already exists');
  });

  it('should return 500 on unexpected error', async () => {
    jest.spyOn(userService, 'registerService').mockImplementation(() => {
      throw new Error('Simulated failure');
    });

    const res = await request(app).post('/users/register').send({
      username: 'user',
      role: 'management',
      password: 'StrongPass123!',
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message', 'Internal server error');
  });
});
