"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
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
        equity: '0.1',
        companyHandle: "c1"
    };

    test("works", async () => {
        const job = await Job.create(newJob);
        expect(job).toEqual({
            ...newJob,
            id: expect.any(Number)
        });
    });
})

 /************************************** findAll */

 describe("findAll", () => {
    test("works: no filter", async () => {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "j1", 
                salary: 999999, 
                equity: '0.1',
                companyHandle: "c1",
                companyName: "C1"
            },
            {
                id: testJobIds[1],
                title: "j2", 
                salary: 888888, 
                equity: '0.2',
                companyHandle: "c1",
                companyName: "C1"
            },
            {
                id: testJobIds[2],
                title: "j3", 
                salary: 777777, 
                equity: '0',
                companyHandle: "c1",
                companyName: "C1"
            },
            {
                id: testJobIds[3],
                title: "j4", 
                salary: null,
                equity: null,
                companyHandle: "c1",
                companyName: "C1"
            }
        ]);
    });

    test("works: by min salary", async () => {
        let jobs = await Job.findAll({ minSalary: 999999 });
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "j1", 
                salary: 999999, 
                equity: '0.1',
                companyHandle: "c1",
                companyName: "C1"
            }
        ]);
    });

    test("works: by equity", async () => {
        let jobs = await Job.findAll({ hasEquity: true });
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "j1", 
                salary: 999999, 
                equity: '0.1',
                companyHandle: "c1",
                companyName: "C1"
            },
            {
                id: testJobIds[1],
                title: "j2", 
                salary: 888888, 
                equity: '0.2',
                companyHandle: "c1",
                companyName: "C1"
            }
        ])
    });

    test("works: by min salary & equity", async () => {
        let jobs = await Job.findAll({ minSalary: 999999, hasEquity: true });
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "j1", 
                salary: 999999, 
                equity: '0.1',
                companyHandle: "c1",
                companyName: "C1"
            }
        ]);
    });

    test("works: by name", async() => {
        let jobs = await Job.findAll({ title: "j1" });
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "j1",
                salary: 999999, 
                equity: '0.1',
                companyHandle: "c1",
                companyName: "C1"
            }
        ]);
    });
 });
 

 /************************************** get */

 describe("get", () => {
    test("works", async () => {
        const job = await Job.get(testJobIds[0]);
        expect(job).toEqual({
            id: testJobIds[0], 
            title: "j1",
            salary: 999999, 
            equity: '0.1', 
            company: {
                handle: "c1",
                name: "C1",
                description: "Desc1",
                numEmployees: 1,
                logoUrl: "http://c1.img"
            }
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

//  describe("filterByTitle", () => {
//     test("works", async () => {
//         const jobs = await Job.filterByTitle("j3");
//         expect(jobs).toHaveLength(1);
//     });

//  })

 /************************************** update */

 describe("update", () => {

    const updateData = {
        title: "new job",
        salary: 999999,
    };

    test("works", async () => {
        const job = await Job.update(testJobIds[0], updateData);
        expect(job).toEqual({
            id: testJobIds[0],
            companyHandle: "c1",
            equity: "0.1",
            title: "new job",
            salary: 999999
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS companyHandle
             FROM jobs
             WHERE id = ${testJobIds[0]}`);
        expect(result.rows).toEqual([{
            id: testJobIds[0],
            title: 'new job',
            salary: 999999,
            equity: '0.1',
            companyhandle: 'c1'
        }]);

    })

    test("works: null field", async () => {
        const updateDataSetNulls = {
            title: "New",
            salary: null,
            equity: null
        };

        const job = await Job.update(testJobIds[0], updateDataSetNulls);
        expect(job).toEqual({
            id: testJobIds[0],
            companyHandle: "c1",
            ...updateDataSetNulls
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS companyHandle
             FROM jobs
             WHERE id = ${testJobIds[0]}`);

        expect(result.rows).toEqual([{
            id: testJobIds[0],
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
