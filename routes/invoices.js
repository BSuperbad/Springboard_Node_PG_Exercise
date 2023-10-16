const express = require("express");
const router = express.Router();
const db = require('../db');
const ExpressError = require("../expressError");

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({
            invoices: results.rows
        })
    } catch (e) {
        return next(e);
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const {
            id
        } = req.params;
        const results = await db.query(`
        SELECT * FROM invoices 
        INNER JOIN companies 
        ON invoices.comp_code = companies.code 
        WHERE invoices.id=$1`, [id]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404)
        }
        const data = results.rows[0];
        const invoice = {
            id: data.id,
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description,
            }
        };
        return res.json({
            "invoice": invoice
        });
    } catch (e) {
        return next(e);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const {
            comp_code,
            amt
        } = req.body;
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`, [comp_code, amt]);
        return res.status(201).json({
            invoice: results.rows[0]
        })
    } catch (e) {
        return next(e)
    }
})
router.put('/:id', async (req, res, next) => {
    try {
        const {
            amt,
            paid
        } = req.body;
        const {
            id
        } = req.params;
        let paidDate = null;
        const currentResult = await db.query(`SELECT paid FROM invoices WHERE id = $1`, [id]);
        if (currentResult.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }
        const isPaid = currentResult.rows[0].paid;

        if (paid === true && !isPaid) {
            paidDate = new Date();
        } else if (paid === false && isPaid) {
            paidDate = null;
        } else {
            paidDate = currentResult.paid_date;
        }
        const updateResult = await db.query(
            'UPDATE invoices SET amt = $1, paid = $2, paid_date = $3 WHERE id = $4 RETURNING *',
            [amt, paid, paidDate, id]
        );

        if (updateResult.rows.length === 0) {
            throw new ExpressError(`Unable to update invoice with id: ${id}`, 500);
        }

        return res.json({
            invoice: updateResult.rows[0]
        });
    } catch (e) {
        return next(e);
    }
});


router.delete('/:id', async (req, res, next) => {
    try {
        const results = db.query(`DELETE FROM invoices WHERE id = $1`, [req.params.id]);
        return res.send({
            msg: 'Invoice Deleted'
        })
    } catch (e) {
        return next(e);
    }
})
module.exports = router;