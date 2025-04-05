"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
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
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** find */

describe("find", function () {
  test("works with no filters", async function () {
    let companies = await Company.find();
    expect(companies).toEqual([
      {
        handle: "c3",
        name: "AnotherNet",
        description: "Desc3",
        numEmployees: 200,
        logoUrl: "http://c3.img",
      },
      {
        handle: "c1",
        name: "Company1",
        description: "Desc1",
        numEmployees: 50,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "NetCompany",
        description: "Desc2",
        numEmployees: 100,
        logoUrl: "http://c2.img",
      },
      
    ]);
  });
  test("works with nameLike filter", async function () {
    let companies = await Company.find({ nameLike: "net" });
    expect(companies).toEqual([
      {
        handle: "c3",
        name: "AnotherNet",
        description: "Desc3",
        numEmployees: 200,
        logoUrl: "http://c3.img",
      },
      {
        handle: "c2",
        name: "NetCompany",
        description: "Desc2",
        numEmployees: 100,
        logoUrl: "http://c2.img",
      }
    ]);
  });
  test("works with minEmployees filter", async function () {
    let companies = await Company.find({ minEmployees: 100 });
    expect(companies).toEqual([
      {
        handle: "c3",
        name: "AnotherNet",
        description: "Desc3",
        numEmployees: 200,
        logoUrl: "http://c3.img",
      },
      {
        handle: "c2",
        name: "NetCompany",
        description: "Desc2",
        numEmployees: 100,
        logoUrl: "http://c2.img",
      },
    ]);
  });
  test("works with maxEmployees filter", async function () {
    let companies = await Company.find({ maxEmployees: 99 });
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "Company1",
        description: "Desc1",
        numEmployees: 50,
        logoUrl: "http://c1.img",
      },
    ]);
  });
  test("works with all filters", async function () {
    let companies = await Company.find(
      {
        nameLike: "net",
        minEmployees: 50,
        maxEmployees: 150,
      }
    );
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "NetCompany",
        description: "Desc2",
        numEmployees: 100,
        logoUrl: "http://c2.img",
      },
    ]);
  });
  test("throws error if minEmployees > maxEmployees", async () => {
    try {
      let resp = await Company.find(
        { 
          minEmployees: 200, 
          maxEmployees: 100 
        }
      );
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "Company1",
      description: "Desc1",
      numEmployees: 50,
      logoUrl: "http://c1.img",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
        "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
