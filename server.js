'use strict';

const express = require('express')
const app = express()

require('dotenv').config();

const cors = require('cors')
app.use(cors())
const pg = require('pg')

const sa = require('superagent')
const methodOverride = require('method-override')

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const port = process.env.PORT || 4000



app.get('/', homeHandler)
app.post('/getCountryResult', getcountryHandler)
app.get('/allcountries', allcountriesHandler)
app.get('/MyRecords', getrecordHandler)
app.post('/MyRecords', recordHandler)
app.get('/detail/:id', detailsHandler)
app.put('/detail/:id', updateHandler)
app.delete('/detail/:id', deleteHandler)
app.get('*',(req,res)=>{
    res.render('pages/error')
})

function deleteHandler(req, res) {
    let SQL = `DELETE FROM country WHERE id=${req.params.id}`

    client.query(SQL)
    .then(()=>{
        res.redirect('/MyRecords')
    })
}

function updateHandler(req, res) {

    let SQL = `UPDATE country SET country=$1,totalconfirmed=$2,totaldeaths=$3,totalrecovered=$4,date=$5 WHERE id=${req.params.id}`

    let { country, totalconfirmed, totaldeaths, totalrecovered, date } = req.body
    let safevalues = [country, totalconfirmed, totaldeaths, totalrecovered, date]
    
    client.query(SQL, safevalues)
        .then(() => {
            res.redirect(`/detail/${req.params.id}`)
        })

}


function detailsHandler(req, res) {
    let SQL = `SELECT * FROM country WHERE id=${req.params.id}`

    client.query(SQL)
        .then(result => {
            res.render('pages/RecordDetail', { DATA: result.rows[0] })
        })
}

function getrecordHandler(req, res) {
    let SQL = `SELECT * FROM country`

    client.query(SQL)
        .then(result => {

            res.render('pages/MyRecords', { DATA: result.rows })
        })
}

function recordHandler(req, res) {
    let SQL = `INSERT INTO country (country,totalconfirmed,totaldeaths,totalrecovered,date) VALUES ($1,$2,$3,$4,$5)`
    let Body = req.body
    let safevalues = [Body.country, Body.totalconfirmed, Body.totaldeaths, Body.totalrecovered, Body.date]

    client.query(SQL, safevalues)
        .then(() => {
            res.redirect('/MyRecords')
        })
}

function allcountriesHandler(req, res) {
    let url = `https://api.covid19api.com/summary`
    sa.get(url)
        .then(result => {
            let CountryArr = result.body.Countries.map(val => {
                return new Country(val)
            })
            res.render('pages/AllCountries', { DATA: CountryArr })

        })
}

function getcountryHandler(req, res) {
    let from = req.body.from
    let to = req.body.to
    let country = req.body.search

    let url = `https://api.covid19api.com/country/${country}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00Z`
    sa.get(url)
        .then(result => {
            res.render('pages/getCountryResult', { DATA: result.body })
        })

}

function homeHandler(req, res) {
    let url = `https://api.covid19api.com/world/total`

    sa.get(url)
        .then(result => {

            res.render('pages/homepage', { DATA: result.body })
        })
}

function Country(val) {
    this.Country = val.Country
    this.TotalConfirmed = val.TotalConfirmed
    this.TotlaDeaths = val.TotalDeaths
    this.TotalRecovered = val.TotalRecovered
    this.Date = val.Date
}











client.connect()
    .then(() => {
        app.listen(port, () => {
            console.log(`heared from port ${port}`)
        })
    })