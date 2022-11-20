"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");


const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, ensureAdmin, async (req, res, next) => {
    try{
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next (err);
    }
});

/** GET / => 
 *  { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 * 
 * Can filter on provided search filters:
 * - titleLike (will find case-insentitive, partial matches)
 * - minSalary
 * - hasEquity
 * 
 * Authorization required: none
 */
router.get("/", async (req, res, next) => {
    try{
        //check if there's any query strings, if not, send all companies information
        if (Object.keys(req.query).length !== 0){
            const { titleLike } = req.query
            let { minSalary, hasEquity } = req.query

            //Check if titleLike is specified in query string:
            if(titleLike !== undefined){
                //if titleLike is specified:
                //Check if hasEquity is specified:
                
                if (hasEquity !== undefined || hasEquity === true){
                    // hasEquity = true;
                    if(minSalary === undefined) minSalary = 0;
                        //regardless minSalary is specified or not, run this
                        const jobs = await Job.filterByTitle(`${titleLike}`);
                        const results = jobs.filter(function (j) {
                            return j.salary >= minSalary && parseFloat(j.equity) > 0
                        })
                        return res.json({ jobs: results });
                }//if hasEquity is noe specified (=== undefined) or false, filter with titleLike & minSalary
                else{
                    if(minSalary === undefined) minSalary = 0;
                    const jobs = await Job.filterByTitle(`${titleLike}`);
                    const results = jobs.filter(function (j) {
                        return j.salary >= minSalary;
                    })
                    return res.json({ jobs: results });
                }
            }else {
                //if titleLike is not specified:
                const jobs = await Job.findAll();

                //if hasEquity is specified:
                if(hasEquity !== undefined || hasEquity === true){
                    if(minSalary === undefined) minSalary = 0;
                    const results = jobs.filter(function (j) {
                        return j.salary >= minSalary && parseFloat(j.equity) > 0
                    })
                    return res.json({ jobs: results });
                }else{
                    //if hasEquity is not specified or false, filter with findAll & minSalary
                    const results = jobs.filter(function (j) {
                        return j.salary >= minSalary;
                    })
                    return res.json({ jobs: results });
                }
            }
        }
        //if no query string is added, return all jobs
        else{
            const jobs = await Job.findAll();
             return res.json({ jobs });
        }
    }catch (err) {
        return next (err);
    }
})


/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *  (where application is [{  }, ...])
 *
 * Authorization required: none
 */

 router.get("/:id", async function (req, res, next) {
    try {
      const job = await Job.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** PATCH /[id] { fld1, fld2, ... } => { job }
 * 
 * Patches job data.
 * 
 * fields can be { title, salary, equity, companyHandle }
 * 
 * Reruens { id, title, salary, equity, companyHandle }
 * 
 * Authorization required: login
*/

router.patch("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 */

 router.delete("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  });

module.exports = router;