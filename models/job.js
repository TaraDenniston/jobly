"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   * (Requirements: salary must be >= 0, equity must be between 0 and 1,
   * companyHandle must exist in the database)
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws error if data does not match requirements
   * */

  static async create({ title, salary, equity, companyHandle }) {
    // Validate data
    if (salary < 0) {   
      throw new BadRequestError(`Salary cannot be negative: ${salary}`);
    }
    if (equity < 0 || equity > 1) {
      throw new BadRequestError(`Equity must be between 0 and 1: ${equity}`);
    }
    const companyCheck = await db.query(   
        `SELECT handle
         FROM companies
         WHERE handle = $1`,
        [companyHandle],
        );
    if (!companyCheck.rows[0]) {
      throw new NotFoundError(`Company not found: ${companyHandle}`);
    }

    // Add job to database
    const result = await db.query(
      `INSERT INTO jobs
       (title, salary, equity, company_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle],
    );

    const job = result.rows[0];

    return job;
  }
}

module.exports = Job;