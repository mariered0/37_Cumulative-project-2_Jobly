"use strict";

const db = require("../db");
const {
    BadRequestError, NotFoundError
} = require("../expressError");
const {
    sqlForPartialUpdate
} = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
     * 
     * data should be { title, salary, equity, companyHandle  }
     * 
     * Returns { id, title, salary, equity, companyHandle }
     * 
     * Throws BadRequestError if job already in database.
     */

    static async create({
        title,
        salary,
        equity,
        companyHandle
    }) {
        const duplicateCheck = await db.query(
            `SELECT title, company_handle AS "companyHandle"
             FROM jobs
             WHERE title = $1 AND company_handle = $2`,
            [title, companyHandle]);

        if (duplicateCheck.rows[0]){
            throw new BadRequestError(`Duplicate job: ${title} & ${companyHandle}`);
        }
        const result = await db.query(
            `INSERT INTO jobs
             (title, salary, equity, company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [title, salary, equity, companyHandle]
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     * 
     * Returns [{ id, title, salary, equity, companyHandle }, ...]
     */

    static async findAll() {
        const jobRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
             FROM jobs`);
        return jobRes.rows;
    }

    /** Given a job id, return data about the job.
     * 
     * Returns { id, title, salary, equity, companyHandle }
     * 
     * Throws NodFoundError if not found.
     */

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
                    title, 
                    salary, 
                    equity, 
                    company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
            [id]);
        
        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job with id of: ${id}`);

        return job;
    }

    //####################################
    // methods for filtering
    //####################################

   /** filter by job title.
    * 
    * This filters jobs by title.
    * 
    * Returns [{ id, title, salary, equity, company_handle }, ...]
    * 
    * Throws NotFoundError if not found.
    */

    static async filterByTitle(searchWord) {
        const results = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE title ILIKE '%${searchWord}%'`
        );

        if (results.rows.length === 0) {
            throw new NotFoundError(`No job found with the keyword: ${searchWord}`)
        };

        return results.rows;
    }


    /** Update job data with 'data'.
     * 
     * This is a "partial update" --- it's fine if data doesn't contain all the fields; this only changes provided ones.
     * 
     * Data can include: { title, salary, equity, companyHandle }
     * 
     * Returns { id, title, salary, equity, companyHandle }
     * 
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                company_handle: "companyHandle"
            });
        const idVarIdx = "$" + (values.length +1);

        const querySql = `UPDATE jobs
                          SET ${setCols}
                          WHERE id = ${idVarIdx}
                          RETURNING id,
                                    title,
                                    salary,
                                    equity,
                                    company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) {
            throw new NotFoundError(`No job with id of: ${id}`)
        };

        return job;
    }

    /** Delete given job from database; returns undefined.
     * 
     * Throws NotFoundError if job not found.
     */

    static async remove(id) {
        const result = await db.query(
            `DELETE
             FROM jobs
             WHERE id = $1
             RETURNING id`,
        [id]);
        const job = result.rows[0];

        if(!job) throw new NotFoundError(`No job with id: ${id}`);
    }

    
}

module.exports = Job;