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

describe("create", () => {
    const newJob = {
        title: "New",
        salary: 999999,
        equity: '0',
        companyHandle: "c1"
    };

    test("works", async () => {
        const job = await Job.create(newJob);
        

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
             FROM jobs
             WHERE title = 'New'`);
        expect(job).toEqual({
            id: expect.any(Number),
                title: "New", 
                salary: 999999, 
                equity: '0',
                companyHandle: "c1"
        });
        expect(result.rows).toEqual([
            {
                title: "New", 
                salary: 999999, 
                equity: '0',
                company_handle: "c1"
            }]);
    });

    test("bad request with duplicate", async () => {
        try {
          await Job.create(newJob);
          await Job.create(newJob);
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
})

 /************************************** findAll */

 describe("findAll", () => {
    test("works: no filter", async () => {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "j1", 
                salary: 999999, 
                equity: '0',
                companyHandle: "c1"
            },
            {
                id: expect.any(Number),
                title: "j2", 
                salary: 888888, 
                equity: '0',
                companyHandle: "c2"
            },
            {
                id: expect.any(Number),
                title: "j3", 
                salary: 777777, 
                equity: '0',
                companyHandle: "c3"
            }
        ]);
    });
 });
 

 /************************************** get */

 describe("get", () => {
    test("works", async () => {
        const id = await db.query(`
            SELECT id
            FROM jobs
            WHERE title = 'j1'`)
        const job = await Job.get(id.rows[0].id);
        expect(job).toEqual({
            id: expect.any(Number), 
            title: "j1",
            salary: 999999, 
            equity: '0', 
            companyHandle: "c1"
        })
    });

    test("not found if no such job", async () => {
        try{
            await Job.get('1000');
            fail();
        }catch (err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
 })


 /************************************** filterByName */

 describe("filterByTitle", () => {
    test("works", async () => {
        const jobs = await Job.filterByTitle("j3");
        expect(jobs).toHaveLength(1);
    });

 })

 /************************************** update */

 describe("update", () => {

    const updateData = {
        title: "new job",
        salary: 999999,
    };

    test("works", async () => {
        const id = await db.query(`
            SELECT id
            FROM jobs
            WHERE title = 'j1'`);
        const job = await Job.update(id.rows[0].id, updateData);
        expect(job).toEqual({
            id: id.rows[0].id,
            companyHandle: "c1",
            equity: "0",
            title: "new job",
            salary: 999999
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS companyHandle
             FROM jobs
             WHERE id = ${id.rows[0].id}`);
        expect(result.rows).toEqual([{
            id: expect.any(Number),
            title: 'new job',
            salary: 999999,
            equity: '0',
            companyhandle: 'c1'
        }]);

    })

    test("works: null field", async () => {
        const id = await db.query(`
            SELECT id
            FROM jobs
            WHERE title = 'j1'`);

        const updateDataSetNulls = {
            title: "New",
            salary: null,
            equity: null
        };

        const job = await Job.update(id.rows[0].id, updateDataSetNulls);
        expect(job).toEqual({
            id: id.rows[0].id,
            companyHandle: "c1",
            ...updateDataSetNulls
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS companyHandle
             FROM jobs
             WHERE id = ${id.rows[0].id}`);

        expect(result.rows).toEqual([{
            id: id.rows[0].id,
            title: "New",
            salary: null,
            equity: null,
            companyhandle: "c1"
        }]);
    });

    test("Not found if no such job", async () => {
        try{
            const result = await Job.update(99999, updateData);
            fail();
        }catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });

    test("Bad request with no data", async () => {
        try{
            await Job.update("c1", {});
            fail();
        }catch(err){
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    })
 })

 /************************************** remove */

 describe("remove", () => {
    test("works", async () => {
        const id = await db.query(`
            SELECT id
            FROM jobs
            WHERE title = 'j1'`);

        await Job.remove(id.rows[0].id);
        const res = await db.query(
            `SELECT id FROM jobs WHERE id = ${id.rows[0].id}`
        );
        expect(res.rows.length).toEqual(0);
    });

    test("Not found if no such job", async () => {
        try{
            await Job.remove(99999);
            fail();
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
 });
