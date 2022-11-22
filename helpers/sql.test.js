//unit test for sqlForPartialUpdate

"use strict";

const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate function", () => {
    test("valid dataToUpdate", () => {
        const updateData = {
            firstName: "NewF",
          };

        const jsToSql = {
            firstName: "first_name",
          };

        const res = sqlForPartialUpdate(updateData, jsToSql);
        expect(res).toEqual({
          setCols: "\"first_name\"=$1",
          values: ["NewF"]
        });
    });

    test("invalid dataToUpdate", () => {
        const updateData = { };
        const jsToSql = {
            firstName: "first_name",
          };

        //check if it returns an error or not
        expect(() => {
            sqlForPartialUpdate(updateData, jsToSql);
        }).toThrow();
    })
})