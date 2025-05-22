"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */  

describe("POST /jobs", function () {
  const newJob = {
    title: "New",
    salary: 90000,
    equity: 0.01,
    companyHandle: "c3",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "New",
        salary: 90000,
        equity: "0.01",
        companyHandle: "c3"
      }
    });
  });

  test("unauth for non-admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "New",
          salary: 100000,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          equity: "not-a-number",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});


/************************************** GET /jobs */ 

describe("GET /jobs", function () {
  test("works with no filters", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "J1",
          salary: 50000,
          equity: "0",
          companyHandle: "c1"
        },
        {
          id: expect.any(Number),
          title: "J2",
          salary: 75000,
          equity: "0",
          companyHandle: "c1"
        },
        {
          id: expect.any(Number),
          title: "J3",
          salary: 100000,
          equity: "0.05",
          companyHandle: "c2"
        }
      ]
    });
  });

  test("works with titleLike filter", async function () {
    const resp = await request(app).get("/jobs").query({ titleLike: "1" });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "J1",
          salary: 50000,
          equity: "0",
          companyHandle: "c1"
        }
      ]
    });
  });

  test("works with minSalary filter", async function () {
    const resp = await request(app).get("/jobs").query({ minSalary: 75000 });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "J2",
          salary: 75000,
          equity: "0",
          companyHandle: "c1"
        },
        {
          id: expect.any(Number),
          title: "J3",
          salary: 100000,
          equity: "0.05",
          companyHandle: "c2"
        }
      ]
    });
  });

  test("works with hasEquity filter", async function () {
    const resp = await request(app).get("/jobs").query({ hasEquity: true });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "J3",
          salary: 100000,
          equity: "0.05",
          companyHandle: "c2"
        }
      ]
    });
  });

  test("works with multiple filters", async function () {
    const resp = await request(app).get("/jobs").query({ 
      titleLike: "J",
      minSalary: 90000,
      hasEquity: true
    });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "J3",
          salary: 100000,
          equity: "0.05",
          companyHandle: "c2"
        }
      ]
    });
  });

  test("bad request with invalid minSalary", async function () {
    const resp = await request(app).get("/jobs").query({ 
      minSalary: "not-a-number"
    });
    expect(resp.statusCode).toEqual(400);
  });
});


/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    let j1Job = await request(app).get("/jobs").query({ titleLike: "J1" });
    const resp = await request(app).get(`/jobs/${j1Job.body.jobs[0].id}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "J1",
        salary: 50000,
        equity: "0",
        companyHandle: "c1"
      }
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/99999`);
    expect(resp.statusCode).toEqual(404);
  });
});


/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    let j1Job = await request(app).get("/jobs").query({ titleLike: "J1" });
    const resp = await request(app)
        .patch(`/jobs/${j1Job.body.jobs[0].id}`)
        .send({
          title: "New-J1",
          salary: 100000,
          equity: 0.01
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "New-J1",
        salary: 100000,
        equity: "0.01",
        companyHandle: "c1"
      }
    });
  });

  test("unauth for non-admins", async function () {
    let j1Job = await request(app).get("/jobs").query({ titleLike: "J1" });
    const resp = await request(app)
        .patch(`/jobs/${j1Job.body.jobs[0].id}`)
        .send({
          title: "New-J1",
          salary: 100000,
          equity: 0.01
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/99999`)
        .send({
          title: "New-J1",
          salary: 100000,
          equity: 0.01
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    let j1Job = await request(app).get("/jobs").query({ titleLike: "J1" });
    const resp = await request(app)
        .patch(`/jobs/${j1Job.body.jobs[0].id}`)
        .send({
          id: 99999,
          title: "New-J1",
          salary: 100000,
          equity: 0.01
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    let j1Job = await request(app).get("/jobs").query({ titleLike: "J1" });
    const resp = await request(app)
        .patch(`/jobs/${j1Job.body.jobs[0].id}`)
        .send({
          salary: "not-a-number",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});
