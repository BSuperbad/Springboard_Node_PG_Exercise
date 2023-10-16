const express = require("express");
const router = express.Router();
const db = require('../db');
const ExpressError = require("../expressError");
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
    try {
        const query = `
            SELECT industries.code, industries.industry, array_agg(company_industry.company_code) AS company_codes
            FROM industries
            LEFT JOIN company_industry ON industries.code = company_industry.industry_code
            GROUP BY industries.code, industries.industry
        `;
        const results = await db.query(query);
        return res.json({
            industries: results.rows
        })
    } catch (e) {
        return next(e);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const {
            industry
        } = req.body;
        const code = slugify(industry, {
            lower: true,
            remove: /[$*_+~.()'"!\-:@]/g
        });
        const results = await db.query(`INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING *`, [code, industry]);
        return res.status(201).json({
            industry: results.rows[0]
        })
    } catch (e) {
        return next(e)
    }
})

router.post("/associate", async (req, res, next) => {
    try {
        const {
            company_code,
            industry_code
        } = req.body;

        const results = await db.query(
            `INSERT INTO company_industry (company_code, industry_code) VALUES ($1, $2) RETURNING *`,
            [company_code, industry_code]
        );

        return res.status(201).json({
            industry: results.rows[0]
        });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;