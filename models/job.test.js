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
const e = require("cors");

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

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let t1Job = await Job.find({ titleLike: "t1" });
    let job = await Job.get(t1Job[0].id);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "t1-a",
      salary: 50000,
      equity: "0.050",
      companyHandle: "c1",
    });
  });
  test("not found if no such job", async function () {
    try {
      await Job.get(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */
describe("update", function () {
  const updateData = {
    title: "new",
    salary: 100000,
    equity: "0.06",
  };

  test("works", async function () {
    let t1Job = await Job.find({ titleLike: "t1" });
    let job = await Job.update(t1Job[0].id, updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      ...updateData,
      companyHandle: "c1",
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [t1Job[0].id]);
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 100000,
        equity: "0.06",
        company_handle: "c1"
      },
    ]);
  });

  test("works: null fields", async function () {
    let t1Job = await Job.find({ titleLike: "t1" });
    const updateDataSetNull = {
      title: "new",
      salary: null,
      equity: null,
    };
    let job = await Job.update(t1Job[0].id, updateDataSetNull);
    expect(job).toEqual({
      id: expect.any(Number),
      ...updateDataSetNull,
      companyHandle: "c1",
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [t1Job[0].id]);
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: null,
        equity: null,
        company_handle: "c1"
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    let t1Job = await Job.find({ titleLike: "t1" });
    try {
      await Job.update(t1Job[0].id, {});
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */
describe("remove", function () {
  test("works", async function () {
    let t1Job = await Job.find({ titleLike: "t1" });
    await Job.remove(t1Job[0].id);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [t1Job[0].id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});