import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  clearDatabase,
} from './helpers.js';
import { AuthService } from '../services/authService.js';
import express from 'express';

describe('Dashboard Authentication & Authorization Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    const env = await setupTestEnvironment();
    app = env.app;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('registers a new user, assigns default Starter account, and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Sarah Connor',
        email: 'sarah@resistance.ai',
        password: 'Password123!',
        accountName: 'Cyberdyne Resistance',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('sarah@resistance.ai');
    expect(res.body.user.isEmailVerified).toBe(false);
    expect(res.body.account).toBeDefined();
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
    expect(res.body.verificationToken).toBeDefined();
  });

  it('rejects duplicate email registrations', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'First Register',
        email: 'duplicate@soundforge.ai',
        password: 'Password123!',
      });

    const dupRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Second Register',
        email: 'duplicate@soundforge.ai',
        password: 'Password123!',
      });

    expect(dupRes.status).toBe(400);
    expect(dupRes.body.error.code).toBe('email_already_registered');
  });

  it('verifies user email using valid verification token', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Email Test',
        email: 'verify@soundforge.ai',
        password: 'Password123!',
      });

    const token = regRes.body.verificationToken;

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.user.isEmailVerified).toBe(true);
  });

  it('logs in successfully with correct credentials', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Login Test',
        email: 'login@soundforge.ai',
        password: 'ValidPassword123!',
      });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@soundforge.ai',
        password: 'ValidPassword123!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.tokens.accessToken).toBeDefined();
    expect(loginRes.body.user.email).toBe('login@soundforge.ai');
  });

  it('rejects login with incorrect password', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Bad Password Test',
        email: 'wrongpass@soundforge.ai',
        password: 'CorrectPassword123!',
      });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'wrongpass@soundforge.ai',
        password: 'WrongPassword!',
      });

    expect(loginRes.status).toBe(401);
  });

  it('refreshes JWT access tokens using valid refresh token', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Token Refresh Test',
        email: 'refresh@soundforge.ai',
        password: 'Password123!',
      });

    const refreshToken = regRes.body.tokens.refreshToken;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.tokens.accessToken).toBeDefined();
    expect(refreshRes.body.tokens.refreshToken).toBeDefined();
  });
});
