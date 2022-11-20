"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "POST Job",
    salary: 999999,
    equity: 0,
    companyHandle: "c1"
  };

  test("ok for users with admin flag", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    // expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "POST Job",
        salary: 999999,
        equity: "0",
        companyHandle: "c1"
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 999999,
          company_handle: "c1"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: 'nope'
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("request with none-admin user", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({"error": {"message": "Unauthorized", "status": 401}})
  });
});

/************************************** GET /jobs */

describe("GET /jobs", () => {
  test("ok for anon", async () => {
    const resp = await request(app).get("/jobs");

    expect(resp.body).toEqual({
      jobs:
      [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 999999,
          equity: '1',
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
      ]
    })
  })

  test("titleLike, minSalary, hasEquity = true are specified in query", async () => {
    const resp = await request(app)
      .get('/jobs/')
      .query({ titleLike: "j", minSalary: 999999, hasEquity: true })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      jobs: [{
        id: expect.any(Number),
        title: 'j1',
        salary: 999999,
        equity: '1',
        companyHandle: 'c1'
      }]
    })
  })

  test("titleLike and minSalary are specified in query", async () => {
    const resp = await request(app)
      .get('/jobs/')
      .query({ titleLike: "j", minSalary: 888888 })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      jobs: [{
        id: expect.any(Number),
        title: 'j1',
        salary: 999999,
        equity: '1',
        companyHandle: 'c1'
      },
      {
        id: expect.any(Number),
        title: 'j2',
        salary: 888888,
        equity: '0',
        companyHandle: 'c2'
      }]
    })
  });

  test("only minSalary is specified in query", async () => {
    const resp = await request(app)
        .get('/jobs/')
        .query({ minSalary: 999999 })
        .set('authorization', `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      jobs :[{
        id: expect.any(Number),
        title: 'j1',
        salary: 999999,
        equity: '1',
        companyHandle: 'c1'
      }]
    })
  })

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

})

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", () => {
  test("works for anon", async () => {
    const job = await Job.filterByTitle("j1");
    const resp = await request(app).get(`/jobs/${job[0].id}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "j1",
        salary: 999999,
        equity: '1',
        companyHandle: "c1"
      }
    });
  });

  // test("works for anon: job w/o application?")

  test("not found for no such job", async () => {
    const resp = await request(app).get(`/jobs/9999`);
    expect(resp.statusCode).toEqual(404);
  });

});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", () => {
  test("works for users with admin flag", async () => {
    const job = await Job.filterByTitle("j1");
    const resp = await request(app)
    .patch(`/jobs/${job[0].id}`)
    .send({
      title: "Updated"
    })
    .set("authorization", `Bearer ${u1Token}`);
  expect(resp.body).toEqual({
    job: {
      id: job[0].id,
      title: "Updated",
      salary: 999999,
      equity: '1',
      companyHandle: "c1"
    }
  });
  });

  test("unauth for anon", async () =>  {
    const job = await Job.filterByTitle("j1");
    const resp = await request(app)
        .patch(`/jobs/${job[0].id}`)
        .send({
          title: "J1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/99999`)
        .send({
          title: "new job"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on invalid data", async function () {
    const job = await Job.filterByTitle("j1");
    const resp = await request(app)
        .patch(`/jobs/${job[0].id}`)
        .send({
          salary: "invalid" 
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("request with none-admin user", async function () {
    const job = await Job.filterByTitle("j1");
    const resp = await request(app)
        .patch(`/jobs/${job[0].id}`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({"error": {"message": "Unauthorized", "status": 401}})
    });

})

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for users with admin flag", async function () {
    const job = await Job.filterByTitle("j1");
    const resp = await request(app)
        .delete(`/jobs/${job[0].id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${job[0].id}` });
  });

  test("unauth for anon", async function () {
    const job = await Job.filterByTitle("j1");
    const resp = await request(app)
        .delete(`/jobs/${job[0].id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/999999`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("request with none-admin user", async function () {
    const job = await Job.filterByTitle("j1");
    const resp = await request(app)
        .delete(`/jobs/${job[0].id}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({"error": {"message": "Unauthorized", "status": 401}})
    });
});
