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
    // Create test users
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

    // Register users and get tokens
    const userAResponse = await request(app)
      .post('/api/auth/inscription')
      .send(userAData);

    const userBResponse = await request(app)
      .post('/api/auth/inscription')
      .send(userBData);

    const userCResponse = await request(app)
      .post('/api/auth/inscription')
      .send(userCData);

    // Extract user IDs and tokens from registration responses
    // Expected response structure: { success: true, message: string, data: { _id, nom, email, token } }
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
        // Link User A to User B
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
        // Link User A to User B
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        // Verify User A has User B as partner
        const userAResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(userAResponse.status).toBe(200);
        expect(userAResponse.body.data.partenaireId).toBeTruthy();
        expect(userAResponse.body.data.partenaireId._id).toBe(userBId);
        expect(userAResponse.body.data.partenaireId.nom).toBe('User B');

        // Verify User B has User A as partner
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
        // First, link User A to User B
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        // Now try to link User C to User A (who is already linked to B)
        const linkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userCToken}`)
          .send({ partenaireId: userAId });

        expect(linkResponse.status).toBe(400);
        expect(linkResponse.body).toEqual({});
      });

      it('should reject linking to a user who is already linked to someone else', async () => {
        // First, link User A to User B
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        // Now try to link User C to User B (who is already linked to A)
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
        // First, link User A to User B
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        // Verify they are linked
        const linkCheck = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userAToken}`);
        
        expect(linkCheck.body.data.partenaireId).toBeTruthy();

        // Now unlink User A from User B
        const unlinkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: null });

        expect(unlinkResponse.status).toBe(200);
        expect(unlinkResponse.body.success).toBe(true);
        expect(unlinkResponse.body.data.partenaireId).toBeFalsy();
      });

      it('should verify bidirectional unlinking after unlink request', async () => {
        // First, link User A to User B
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        // Unlink User A from User B
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: null });

        // Verify User A no longer has a partner
        const userAResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(userAResponse.status).toBe(200);
        expect(userAResponse.body.data.partenaireId).toBeFalsy();

        // Verify User B no longer has a partner
        const userBResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userBToken}`);

        expect(userBResponse.status).toBe(200);
        expect(userBResponse.body.data.partenaireId).toBeFalsy();
      });

      it('should allow unlinking using empty string', async () => {
        // First, link User A to User B
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        // Unlink using empty string
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
        // Try to unlink when no partner is set
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
        // Link User A to User B
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        // Now link User A to User C (should unlink from B and link to C)
        const relinkResponse = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userCId });

        expect(relinkResponse.status).toBe(200);
        expect(relinkResponse.body.success).toBe(true);
        expect(relinkResponse.body.data.partenaireId._id).toBe(userCId);

        // Verify User A is now linked to User C
        const userAResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(userAResponse.body.data.partenaireId._id).toBe(userCId);

        // Verify User B is no longer linked to User A
        const userBResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userBToken}`);

        expect(userBResponse.body.data.partenaireId).toBeFalsy();

        // Verify User C is linked to User A
        const userCResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userCToken}`);

        expect(userCResponse.body.data.partenaireId._id).toBe(userAId);
      });

      it('should handle multiple simultaneous link requests gracefully', async () => {
        // Simulate race condition: both users try to link to each other simultaneously
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
        
        // Both requests should succeed (or at least one should)
        const successCount = results.filter(r => r.status === 200).length;
        expect(successCount).toBeGreaterThan(0);

        // Verify final state: they should be linked
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
        // Link User A to User B
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        // Verify database state directly
        const userAFromDB = await User.findById(userAId);
        const userBFromDB = await User.findById(userBId);

        expect(userAFromDB?.partenaireId?.toString()).toBe(userBId);
        expect(userBFromDB?.partenaireId?.toString()).toBe(userAId);
      });

      it('should maintain data integrity during unlinking operations', async () => {
        // Link User A to User B
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: userBId });

        // Unlink them
        await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ partenaireId: null });

        // Verify database state directly
        const userAFromDB = await User.findById(userAId);
        const userBFromDB = await User.findById(userBId);

        expect(userAFromDB?.partenaireId).toBeFalsy();
        expect(userBFromDB?.partenaireId).toBeFalsy();
      });
    });
  });
}); 