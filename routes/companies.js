const express = require("express");
const router = express.Router();
const db = require('../db');
const ExpressError = require("../expressError");
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({
            companies: results.rows
        })
    } catch (e) {
        return next(e);
    }
})

router.get('/:code', async (req, res, next) => {
    try {
        const {
            code
        } = req.params;
        const query = `
        SELECT c.code, c.name, c.description, i.id, i.amt, i.paid, i.add_date, i.paid_date, ind.industry
        FROM companies c
        LEFT JOIN invoices i ON c.code = i.comp_code
        LEFT JOIN company_industry ci ON c.code = ci.company_code
        LEFT JOIN industries ind ON ci.industry_code = ind.code
        WHERE c.code = $1
    `;
        const result = await db.query(query, [code]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404)
        }

        const company = result.rows[0];
        const invoices = result.rows;
        const industryNames = invoices.map((row) => row.industry);

        const response = {
            company: {
                code: company.code,
                name: company.name,
                description: company.description,
                invoices: invoices,
                industries: industryNames,
            },
        };
        return res.json(response)
    } catch (e) {
        return next(e);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const {
            name,
            description
        } = req.body;
        const code = slugify(name, {
            lower: true,
            remove: /[$*_+~.()'"!\-:@]/g
        });
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`, [code, name, description]);
        return res.status(201).json({
            company: results.rows[0]
        })
    } catch (e) {
        return next(e)
    }
})

router.put('/:code', async (req, res, next) => {
    try {
        const {
            code
        } = req.params;
        const {
            name,
            description
        } = req.body;
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code =$3 RETURNING *`, [name, description, code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404)
        }
        return res.json({
            company: results.rows[0]
        })
    } catch (e) {
        return next(e);
    }
})

router.delete('/:code', async (req, res, next) => {
    try {
        const results = db.query(`DELETE FROM companies WHERE code = $1`, [req.params.code]);
        return res.send({
            msg: 'Company Deleted'
        })
    } catch (e) {
        return next(e);
    }
})
module.exports = router;