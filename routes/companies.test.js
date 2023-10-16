process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;

beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('micro', 'Microsoft', 'personal computers')
    RETURNING *`);
    testCompany = result.rows[0]
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
    await db.end();
});

describe('GET /companies', () => {
    test('Get a list with one company', async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            companies: [testCompany]
        })
    })
})

describe('GET /companies/:code', () => {
    test('Get a single company', async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('company');
        expect(res.body.company).toHaveProperty('code', testCompany.code);
        expect(res.body.company).toHaveProperty('name');
        expect(res.body.company).toHaveProperty('description');
        expect(res.body.company).toHaveProperty('invoices')
    })
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app).get(`/company/ibm`);
        expect(res.statusCode).toBe(404);
    })
})

describe('POST /company', () => {
    test('Creates a single company', async () => {
        const res = await request(app).post('/companies').send({
            code: 'ibm',
            name: 'IBM',
            description: 'does computing stuff'
        });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            company: {
                code: 'ibm',
                name: 'IBM',
                description: 'does computing stuff'
            }
        });
    })
})

describe('PUT /companies/:code', () => {
    test('Updates a single company', async () => {
        const res = await request(app).put(`/companies/${testCompany.code}`).send({
            name: 'Microsoft Office',
            description: 'Microsoft Office Suite'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: {
                code: testCompany.code,
                name: 'Microsoft Office',
                description: 'Microsoft Office Suite'
            }
        });
    })
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app).patch(`/companies/apple`).send({
            name: 'Apple',
            description: 'iPhones'
        });
        expect(res.statusCode).toBe(404);
    })
})


describe('DELETE /companies/:code', () => {
    test('Deletes a single company', async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            msg: 'Company Deleted'
        });
    })
})