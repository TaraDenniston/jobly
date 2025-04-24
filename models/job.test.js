"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 100000,
    equity: "0.05",
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(expect.objectContaining({
        title: "new",
        salary: 100000,
        equity: "0.05",
        companyHandle: "c1",
      }));

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 100000,
        equity: "0.05",
        company_handle: "c1"
      },
    ]);
  });

});


/************************************** find */

describe("find", function () {
  test("works with no filters", async function () {
    let jobs = await Job.find();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "t1-a",
        salary: 50000,
        equity: "0.050",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "t2-a",
        salary: 90000,
        equity: "0.095",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "t3-b",
        salary: 150000,
        equity: "0",
        companyHandle: "c2",
      },
    ]);
  });
  test("works with titleLike filter", async function () {
    let jobs = await Job.find({ titleLike: "a" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "t1-a",
        salary: 50000,
        equity: "0.050",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "t2-a",
        salary: 90000,
        equity: "0.095",
        companyHandle: "c1",
      },
    ]);
  });
  test("works with minSalary filter", async function () {
    let jobs = await Job.find({ minSalary: 70000 });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "t2-a",
        salary: 90000,
        equity: "0.095",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "t3-b",
        salary: 150000,
        equity: "0",
        companyHandle: "c2",
      },
    ]);
  });
  test("works with hasEquity filter", async function () {
    let jobs = await Job.find({ hasEquity: true });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "t1-a",
        salary: 50000,
        equity: "0.050",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "t2-a",
        salary: 90000,
        equity: "0.095",
        companyHandle: "c1",
      },
    ]);
  });
  test("works with multiple filters", async function () {
    let jobs = await Job.find({ titleLike: "a", minSalary: 60000, hasEquity: true });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "t2-a",
        salary: 90000,
        equity: "0.095",
        companyHandle: "c1",
      },
    ]);
  });
  test("throws BadRequestError if minSalary is not a number", async function () {
    try {
      await Job.find({ minSalary: "not-a-number" });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

});