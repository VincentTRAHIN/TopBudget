import mongoose from 'mongoose';
import request from 'supertest';
import { createTestApp } from './setup.integration';
import User from '../models/user.model';

describe('Profile Integration Tests', () => {
  const app = createTestApp();
  let userAId: string;
  let userBId: string;
  let userCId: string;
  let userAToken: string;
  let userBToken: string;
  let userCToken: string;

  interface TestUser {
    nom: string;
    email: string;
    motDePasse: string;
  }

  beforeEach(async () => {
    const userAData: TestUser = {
      nom: 'User A',
      email: 'usera@example.com',
      motDePasse: 'Password123!'
    };

    const userBData: TestUser = {
      nom: 'User B',
      email: 'userb@example.com',
      motDePasse: 'Password123!'
    };

    const userCData: TestUser = {
      nom: 'User C',
      email: 'userc@example.com',
      motDePasse: 'Password123!'
    };

    const userAResponse = await request(app)
      .post('/api/auth/inscription')
      .send(userAData);

    const userBResponse = await request(app)
      .post('/api/auth/inscription')
      .send(userBData);

    const userCResponse = await request(app)
      .post('/api/auth/inscription')
      .send(userCData);

    userAId = userAResponse.body.data._id;
    userBId = userBResponse.body.data._id;
    userCId = userCResponse.body.data._id;
    userAToken = userAResponse.body.data.token;
    userBToken = userBResponse.body.data.token;
    userCToken = userCResponse.body.data.token;
  });

  describe('Profile Partner Linking', () => {
    describe('Test Case 1: Link two users', () => {
      it('should successfully link User A to User B', async () => {
        const linkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        expect(linkResponse.status).toBe(200);
        expect(linkResponse.body.success).toBe(true);
        expect(linkResponse.body.data.partenaireId).toBeTruthy();
        expect(linkResponse.body.data.partenaireId._id).toBe(userBId);
        expect(linkResponse.body.data.partenaireId.nom).toBe('User B');
        expect(linkResponse.body.data.partenaireId.email).toBe('userb@example.com');
      });

      it('should verify bidirectional connection after linking', async () => {
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        const userAResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(userAResponse.status).toBe(200);
        expect(userAResponse.body.data.partenaireId).toBeTruthy();
        expect(userAResponse.body.data.partenaireId._id).toBe(userBId);
        expect(userAResponse.body.data.partenaireId.nom).toBe('User B');

        const userBResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userBToken}`);

        expect(userBResponse.status).toBe(200);
        expect(userBResponse.body.data.partenaireId).toBeTruthy();
        expect(userBResponse.body.data.partenaireId._id).toBe(userAId);
        expect(userBResponse.body.data.partenaireId.nom).toBe('User A');
      });
    });

    describe('Test Case 2: Attempt to link to already linked user', () => {
      it('should reject linking to a user who is already linked to another user', async () => {
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        const linkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userCToken}`)
          .send({ partenaireId: userAId });

        expect(linkResponse.status).toBe(400);
        expect(linkResponse.body).toEqual({});
      });

      it('should reject linking to a user who is already linked to someone else', async () => {
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        const linkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userCToken}`)
          .send({ partenaireId: userBId });

        expect(linkResponse.status).toBe(400);
        expect(linkResponse.body).toEqual({});
      });
    });

    describe('Test Case 3: Unlink users', () => {
      it('should successfully unlink User A from User B', async () => {
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        const linkCheck = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userAToken}`);
        
        expect(linkCheck.body.data.partenaireId).toBeTruthy();

        const unlinkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: null });

        expect(unlinkResponse.status).toBe(200);
        expect(unlinkResponse.body.success).toBe(true);
        expect(unlinkResponse.body.data.partenaireId).toBeFalsy();
      });

      it('should verify bidirectional unlinking after unlink request', async () => {
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: null });

        const userAResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(userAResponse.status).toBe(200);
        expect(userAResponse.body.data.partenaireId).toBeFalsy();

        const userBResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userBToken}`);

        expect(userBResponse.status).toBe(200);
        expect(userBResponse.body.data.partenaireId).toBeFalsy();
      });

      it('should allow unlinking using empty string', async () => {
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        const unlinkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: '' });

        expect(unlinkResponse.status).toBe(200);
        expect(unlinkResponse.body.success).toBe(true);
        expect(unlinkResponse.body.data.partenaireId).toBeFalsy();
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should reject linking to self', async () => {
        const linkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userAId });

        expect(linkResponse.status).toBe(400);
        expect(linkResponse.body).toEqual({});
      });

      it('should reject linking to non-existent user', async () => {
        const fakeUserId = new mongoose.Types.ObjectId().toString();
        
        const linkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: fakeUserId });

        expect(linkResponse.status).toBe(404);
        expect(linkResponse.body).toEqual({});
      });

      it('should reject invalid partner ID format', async () => {
        const linkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: 'invalid-id' });

        expect(linkResponse.status).toBe(400);
        expect(linkResponse.body).toEqual({});
      });

      it('should handle unlinking when no partner exists', async () => {
        const unlinkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: null });

        expect(unlinkResponse.status).toBe(200);
        expect(unlinkResponse.body.success).toBe(true);
        expect(unlinkResponse.body.data.partenaireId).toBeFalsy();
      });

      it('should require authentication for profile updates', async () => {
        const linkResponse = await request(app)
          .put('/api/profile')
          .send({ partenaireId: userBId });

        expect(linkResponse.status).toBe(401);
        expect(linkResponse.body.message).toBe('Non autorisé, aucun token');
      });

      it('should reject requests with invalid token', async () => {
        const linkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', 'Bearer invalid-token')
          .send({ partenaireId: userBId });

        expect(linkResponse.status).toBe(401);
        expect(linkResponse.body.message).toBe('Non autorisé, token invalide');
      });
    });

    describe('Complex Scenarios', () => {
      it('should handle relinking to different partner', async () => {
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        const relinkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userCId });

        expect(relinkResponse.status).toBe(200);
        expect(relinkResponse.body.success).toBe(true);
        expect(relinkResponse.body.data.partenaireId._id).toBe(userCId);

        const userAResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(userAResponse.body.data.partenaireId._id).toBe(userCId);

        const userBResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userBToken}`);

        expect(userBResponse.body.data.partenaireId).toBeFalsy();

        const userCResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userCToken}`);

        expect(userCResponse.body.data.partenaireId._id).toBe(userAId);
      });

      it('should handle multiple simultaneous link requests gracefully', async () => {
        const linkPromises = [
          request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({ partenaireId: userBId }),
          request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${userBToken}`)
            .send({ partenaireId: userAId })
        ];

        const results = await Promise.all(linkPromises);
        
        const successCount = results.filter(r => r.status === 200).length;
        expect(successCount).toBeGreaterThan(0);

        const userAResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userAToken}`);

        const userBResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userBToken}`);

        expect(userAResponse.body.data.partenaireId._id).toBe(userBId);
        expect(userBResponse.body.data.partenaireId._id).toBe(userAId);
      });
    });

    describe('Data Integrity Tests', () => {
      it('should maintain data integrity during linking operations', async () => {
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        const userAFromDB = await User.findById(userAId);
        const userBFromDB = await User.findById(userBId);

        expect(userAFromDB?.partenaireId?.toString()).toBe(userBId);
        expect(userBFromDB?.partenaireId?.toString()).toBe(userAId);
      });

      it('should maintain data integrity during unlinking operations', async () => {
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: null });

        const userAFromDB = await User.findById(userAId);
        const userBFromDB = await User.findById(userBId);

        expect(userAFromDB?.partenaireId).toBeFalsy();
        expect(userBFromDB?.partenaireId).toBeFalsy();
      });
    });
  });
}); 