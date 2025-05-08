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


  /** Find jobs based on optional filters. If no filters are provided, 
   * return all jobs.
   * 
   * Optional filters:
   *   - titleLike (case-insensitive, partial matches)
   *   - minSalary (minimum salary amount)
   *   - hasEquity (if true: jobs with non-zero equity; if false or 
   *       absent: all jobs)
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async find( {titleLike, minSalary, hasEquity} = {}) {
    // Data validation for minSalary 
    if (minSalary !== undefined && typeof minSalary !== "number") {
      throw new BadRequestError(`minSalary must be a number: ${minSalary}`);
    }

    // Base query
    let query = `SELECT id,
                        title,
                        salary,
                        equity,
                        company_handle AS "companyHandle"
                FROM jobs`;
    const whereClauses = [];
    const values = [];

    // If filters are provided, update whereClauses and values
    if (titleLike) {
      values.push(`%${titleLike}%`);
      whereClauses.push(`title ILIKE $${values.length}`);
    }
    if (minSalary !== undefined) {
      values.push(minSalary);
      whereClauses.push(`salary >= $${values.length}`);
    }
    if (hasEquity) {
      whereClauses.push(`equity > 0`);
    }

    // Add WHERE clauses to query if there are any filters
    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    // Add ORDER BY clause to query
    query += " ORDER BY id";

    const jobsRes = await db.query(query, values);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
       FROM jobs
       WHERE id = $1`,
      [id],
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }
}

module.exports = Job;