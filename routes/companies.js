"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");


const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    //check if there's any query strings, if not, send all companies information
    if (Object.keys(req.query).length !== 0){
      const { nameLike } = req.query
      let { minEmployees, maxEmployees } = req.query

      if (minEmployees > maxEmployees){
        throw new BadRequestError('minEmployees number must be smaller than maxEmployees number');
      }
      
      //Check if nameLike is specified in query string:
      if (nameLike !== undefined){
        //if nameLike is specified:
        //Check if maxEmployees is specified
        if(maxEmployees !== undefined){
          if(minEmployees == undefined){
            minEmployees = 0;

          }else{
            //either minEmp is specified or not, run this
          const companies = await Company.filterByName(`${nameLike}`);
          const results = companies.filter(function (c) {
            return c.numEmployees >= minEmployees && c.numEmployees <= maxEmployees
          })
          return res.json({ companies: results });
          }
        }
        //if maxEmployees is not specified (=== undefined), filter with namelike & minEmp
        else{
          const companies = await Company.filterByName(`${nameLike}`);
          const results = companies.filter(function (c) {
            return c.numEmployees >= minEmployees
        })
          return res.json({ companies: results });
        }
      }
      else{
        //if nameLike is not specified:
      const companies = await Company.findAll();
      //if maxEmployees is specified
      if(maxEmployees !== undefined){
      //check if minEmployees is specified
       //if minEmployees is not specified, set it to 0
      if(minEmployees == undefined){
        minEmployees = 0;
      }
      const results = companies.filter(function (c) {
        return c.numEmployees >= minEmployees && c.numEmployees <= maxEmployees
    })
        return res.json({ companies: results });
    }else{
      //if maxEmployees is not specified, filter only with minEmployees
      const results = companies.filter(function (c) {
        return c.numEmployees >= minEmployees
    })
      return res.json({ companies: results });
    }    
  }
  }
  else{
    //if no query string is added, return all companies
    const companies = await Company.findAll();
      return res.json({ companies });
  }}
  catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
