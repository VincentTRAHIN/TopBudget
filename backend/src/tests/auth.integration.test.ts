import request from "supertest";
import { Application } from "express";
import mongoose from "mongoose";
import { createTestApp } from "./setup.integration";
import User from "../models/user.model";

interface TestUser {
  nom: string;
  email: string;
  motDePasse: string;
  role: string;
}

describe("Auth Integration Tests", () => {
  let app: Application;
  let testUser: TestUser;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    testUser = {
      nom: "Test User",
      email: "test@example.com",
      motDePasse: "password123",
      role: "Perso",
    };
  });

  describe("POST /api/auth/inscription", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/inscription")
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.nom).toBe(testUser.nom);
      expect(response.body.user.role).toBe(testUser.role);
      expect(response.body.user).not.toHaveProperty("motDePasse");

      const createdUser = await User.findOne({ email: testUser.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser?.nom).toBe(testUser.nom);
    });

    it("should return 400 for invalid email format", async () => {
      const invalidUser = { ...testUser, email: "invalid-email" };

      const response = await request(app)
        .post("/api/auth/inscription")
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "email",
            msg: expect.stringContaining("email"),
          }),
        ])
      );
    });

    it("should return 400 for weak password", async () => {
      const weakPasswordUser = { ...testUser, motDePasse: "123" };

      const response = await request(app)
        .post("/api/auth/inscription")
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "motDePasse",
          }),
        ])
      );
    });

    it("should return 400 for missing required fields", async () => {
      const incompleteUser = { nom: "Test User" };

      const response = await request(app)
        .post("/api/auth/inscription")
        .send(incompleteUser)
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it("should return 400 for duplicate email", async () => {
      await User.create(testUser);

      const duplicateUser = { ...testUser, nom: "Another User" };

      const response = await request(app)
        .post("/api/auth/inscription")
        .send(duplicateUser)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("existe déjà");
    });

    it("should handle invalid role values", async () => {
      const invalidRoleUser = { ...testUser, role: "InvalidRole" };

      const response = await request(app)
        .post("/api/auth/inscription")
        .send(invalidRoleUser)
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("POST /api/auth/connexion", () => {
    beforeEach(async () => {
      await User.create(testUser);
    });

    it("should login with valid credentials", async () => {
      const loginData = {
        email: testUser.email,
        motDePasse: testUser.motDePasse,
      };

      const response = await request(app)
        .post("/api/auth/connexion")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty("motDePasse");
      expect(typeof response.body.token).toBe("string");
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it("should return 401 for invalid email", async () => {
      const loginData = {
        email: "wrong@example.com",
        motDePasse: testUser.motDePasse,
      };

      const response = await request(app)
        .post("/api/auth/connexion")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("invalides");
    });

    it("should return 401 for invalid password", async () => {
      const loginData = {
        email: testUser.email,
        motDePasse: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/connexion")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("invalides");
    });

    it("should return 400 for missing email", async () => {
      const loginData = {
        motDePasse: testUser.motDePasse,
      };

      const response = await request(app)
        .post("/api/auth/connexion")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 for missing password", async () => {
      const loginData = {
        email: testUser.email,
      };

      const response = await request(app)
        .post("/api/auth/connexion")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 for invalid email format in login", async () => {
      const loginData = {
        email: "invalid-email",
        motDePasse: testUser.motDePasse,
      };

      const response = await request(app)
        .post("/api/auth/connexion")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("GET /api/auth/me", () => {
    let authToken: string;
    let userId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      const createdUser = await User.create(testUser);
      userId = createdUser._id as mongoose.Types.ObjectId;

      const loginResponse = await request(app)
        .post("/api/auth/connexion")
        .send({
          email: testUser.email,
          motDePasse: testUser.motDePasse,
        });

      authToken = loginResponse.body.token;
    });

    it("should return user info for authenticated user", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.nom).toBe(testUser.nom);
      expect(response.body.user).not.toHaveProperty("motDePasse");
      expect(response.body.user._id).toBe(userId.toString());
    });

    it("should return 401 for missing authorization header", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Accès refusé");
    });

    it("should return 401 for invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });

    it("should return 401 for malformed authorization header", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "InvalidFormat token")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });

    it("should return 401 for expired token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer expired.token.here")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });

    it("should return 404 for deleted user with valid token", async () => {
      await User.findByIdAndDelete(userId);

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Utilisateur non trouvé");
    });
  });

  describe("Authentication Flow Integration", () => {
    it("should complete full registration and login flow", async () => {
      const registrationResponse = await request(app)
        .post("/api/auth/inscription")
        .send(testUser)
        .expect(201);

      expect(registrationResponse.body).toHaveProperty("token");
      const registrationToken = registrationResponse.body.token;

      const meResponse1 = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${registrationToken}`)
        .expect(200);

      expect(meResponse1.body.user.email).toBe(testUser.email);

      const loginResponse = await request(app)
        .post("/api/auth/connexion")
        .send({
          email: testUser.email,
          motDePasse: testUser.motDePasse,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty("token");
      const loginToken = loginResponse.body.token;

      const meResponse2 = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${loginToken}`)
        .expect(200);

      expect(meResponse2.body.user.email).toBe(testUser.email);

      expect(registrationToken).not.toBe(loginToken);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON in request body", async () => {
      const response = await request(app)
        .post("/api/auth/inscription")
        .set("Content-Type", "application/json")
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should handle empty request body", async () => {
      const response = await request(app)
        .post("/api/auth/inscription")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it("should return 404 for non-existent auth endpoints", async () => {
      const response = await request(app)
        .post("/api/auth/nonexistent")
        .send(testUser)
        .expect(404);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Route non trouvée");
    });
  });
});
