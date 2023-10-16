process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');


let testInvoice;
let testCompany;
let companySetupDone = false;

// beforeEach(async () => {
//     if (!companySetupDone) {
//         const cResult = await db.query(`
//       INSERT INTO companies (code, name, description)
//       VALUES ('apple', 'Apple Computer', 'Maker of OSX.')
//       RETURNING *`);

//         testCompany = cResult.rows[0];
//         companySetupDone = true;
//     }
//     const result = await db.query(`
//     INSERT INTO invoices (comp_code, amt, paid, paid_date)
//     VALUES ($1, 1000, true, '2023-10-15')
//     RETURNING *
//   `, [testCompany.code]);

//     testInvoice = result.rows[0];
// });

beforeEach(async () => {
    // Create a company
    const cResult = await db.query(`
      INSERT INTO companies (code, name, description)
      VALUES ('apple', 'Apple Computer', 'Maker of OSX.')
      RETURNING *
    `);
    testCompany = cResult.rows[0];

    // Create an invoice associated with the created company
    const result = await db.query(`
      INSERT INTO invoices (comp_code, amt, paid, paid_date)
      VALUES ($1, 1000, true, '2023-10-15')
      RETURNING *
    `, [testCompany.code]);

    testInvoice = result.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
    await db.end();
});

describe('GET /invoices', () => {
    test('Get a list with one invoice', async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);

        const expectedInvoice = {
            id: testInvoice.id,
            comp_code: testCompany.code,
            amt: 1000,
            paid: true,
            add_date: '2023-10-15T07:00:00.000Z',
            paid_date: '2023-10-15T07:00:00.000Z',
        };

        expect(res.body).toEqual({
            invoices: [expectedInvoice],
        });
    });
})

describe('GET /invoices/:id', () => {
    test('Get a single invoice', async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        const expectedInvoice = {
            id: testInvoice.id,
            company: {
                code: testCompany.code,
                name: testCompany.name,
                description: testCompany.description,
            },
            amt: 1000,
            paid: true,
            add_date: '2023-10-15T07:00:00.000Z',
            paid_date: '2023-10-15T07:00:00.000Z',
        };
        expect(res.body).toEqual({
            invoice: expectedInvoice
        });
    });
    test('Responds with 404 for invalid id', async () => {
        const res = await request(app).get(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    });
})

describe('POST /invoices', () => {
    test('Creates a single invoice', async () => {
        const res = await request(app).post('/invoices').send({
            comp_code: testCompany.code,
            amt: 1500,
            paid: false,
        });

        const expectedInvoice = {
            id: expect.any(Number),
            comp_code: testCompany.code,
            amt: 1500,
            paid: false,
            paid_date: null,
            add_date: "2023-10-15T07:00:00.000Z"
        };

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            invoice: expectedInvoice,
        });
    });
});

describe('PUT /invoices/:id', () => {
    test('Update a single invoice', async () => {
        const updatedData = {
            amt: 1500,
            paid: false
        };
        const res = await request(app)
            .put(`/invoices/${testInvoice.id}`)
            .send(updatedData);
        // expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: {
                id: testInvoice.id,
                comp_code: testCompany.code,
                amt: 1500,
                paid: false,
                add_date: '2023-10-15T07:00:00.000Z',
                paid_date: null,
            }
        });
    });
    test('Responds with 404 for invalid id', async () => {
        const res = await request(app).get(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    });
})

describe('DELETE /invoices/:id', () => {
    test('Deletes a single invoice', async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            msg: 'Invoice Deleted'
        });
    })
})