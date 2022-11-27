"use strict";

const request = require("supertest");


const app = require("../app");


const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  testJobIds,
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
    expect(resp.statusCode).toEqual(201);
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
          equity: '0.1',
          companyHandle: "c1",
          companyName: "C1"
        },
        {
          id: expect.any(Number),
          title: "j2",
          salary: 888888,
          equity: '0.2',
          companyHandle: "c1",
          companyName: "C1"
        },
        {
          id: expect.any(Number),
          title: "j3",
          salary: 777777,
          equity: null,
          companyHandle: "c1",
          companyName: "C1"
        }
      ]
    })
  })

  test("works: filtering", async () => {
    const resp = await request(app)
        .get(`/jobs`)
        .query({ hasEquity: true });
    expect(resp.body).toEqual({
          jobs: [
            {
              id: expect.any(Number),
              title: "j1",
              salary: 999999,
              equity: "0.1",
              companyHandle: "c1",
              companyName: "C1",
            },
            {
              id: expect.any(Number),
              title: "j2",
              salary: 888888,
              equity: "0.2",
              companyHandle: "c1",
              companyName: "C1",
            },
          ],
        },
    );
  })

  test("works: filtering on 2 filters", async function () {
    const resp = await request(app)
        .get(`/jobs`)
        .query({ minSalary: 2, title: "3" });
    expect(resp.body).toEqual({
          jobs: [
            {
              id: expect.any(Number),
              title: "j3",
              salary: 777777,
              equity: null,
              companyHandle: "c1",
              companyName: "C1",
            },
          ],
        },
    );
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
        equity: '0.1',
        companyHandle: 'c1',
        companyName: "C1"
      }]
    })
  })

  test("bad request on invalid filter key", async function () {
    const resp = await request(app)
        .get(`/jobs`)
        .query({ minSalary: 888888, nope: "nope" });
    expect(resp.statusCode).toEqual(400);
  });

})

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", () => {
  test("works for anon", async () => {
    const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
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
      }
    });
  });

  test("not found for no such job", async () => {
    const resp = await request(app).get(`/jobs/9999`);
    expect(resp.statusCode).toEqual(404);
  });

});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", () => {
  test("works for users with admin flag", async () => {
    const resp = await request(app)
    .patch(`/jobs/${testJobIds[0]}`)
    .send({
      title: "Updated"
    })
    .set("authorization", `Bearer ${u1Token}`);
  expect(resp.body).toEqual({
    job: {
      id: testJobIds[0],
      title: "Updated",
      salary: 999999,
      equity: '0.1',
      companyHandle: "c1"
    }
  });
  });

  test("unauth for anon", async () =>  {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
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
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          salary: "invalid" 
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("request with none-admin user", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
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
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${testJobIds[0]}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/999999`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("request with none-admin user", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({"error": {"message": "Unauthorized", "status": 401}})
    });
});
