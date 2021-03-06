const express = require('express');
const {STRUKTUR_UKURAN_IKAN_TERTANGKAP, ALL_RESOURCE, ALL_WPP, ALL_SPECIES, ALL_LOCATION} = require("../../helpers/constants");
const {
    generateGraphicImageName,
    loggingRequestBody,
    concatenateRscriptArguments,
    executeCommandLine,
    responseStatus,
    resolveRscriptCommand,
    rscript, normalizeEscapeString, concatenateAsSqlBetween, concatenateAsSqlOr, predefineResponse
} = require("../../helpers/utilities");
const {pool} = require("../../database/database");
const {addGeneratedImage, addPid} = require("../authorization");
const {exec} = require("child_process");
const router = express.Router();

/**
 * Route to generate report result for Struktur Ukuran Ikan Tertangkap Graphic
 */
router.post('/', async (req, res) => {
    const {graphicImageName, requestKey} = req.body;
    loggingRequestBody(req.body);

    const restArgs = concatenateRscriptArguments(req.body, [
        // { prop = undefined, props = [], str = false, arr = false, between = false, sqlColumn = '', first: false},
        {props: ['start', 'end'], between: true, sqlColumn: 'tanggal_sampling', first: true},
        {prop: 'wpp', arr: true, sqlColumn: 'wpp'},
        {prop: 'resource', arr: true, sqlColumn: 'uuid_sumber_daya'},
        {prop: 'location', arr: true, sqlColumn: 'nama_lokasi_sampling'},
        {prop: 'species', arr: true, sqlColumn: 'uuid_spesies'},
        {props: ['minLength', 'maxLength'], between: true, sqlColumn: 'panjang'},
    ]);

    const command = `Rscript ${rscript(STRUKTUR_UKURAN_IKAN_TERTANGKAP)} ${graphicImageName} ${restArgs}`;
    const child = exec(resolveRscriptCommand(command), (err, stdout, stderr) => {
        if (err !== null) {
            console.log(err);
            res.status(500).json({ status: responseStatus(0) });
            return;
        }

        addGeneratedImage(requestKey, `${graphicImageName}${__image_extention}`);
        res.status(200).json({
            status: responseStatus(1),
            graphicImageName: `${graphicImageName}${__image_extention}`
        });
    });
    console.log(child.pid);
    addPid(requestKey, child.pid);
});


/**
 * Datasource for predefined data wpp on selected date range for Struktur Ukuran Ikan Tertangkap  Graphic
 */
router.post('/wpp', async (req, res, next) => {
    const {start, end} = req.body;
    const query = `with source as (select trim(wpp) as wpp
                                   from brpl_biologiukuran
                                   where ${concatenateAsSqlBetween('tanggal_sampling', start, end)})
                   select wpp as value, wpp as label
                   from source
                   group by wpp
                   order by wpp`;

    pool.query(query, (error, rows) => {
        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        predefineResponse(res, rows, ALL_WPP);
    });
});

/**
 * Datasource for predefined data resources on selected date range for Struktur Ukuran Ikan Tertangkap  Graphic
 */
router.post('/resources', async (req, res, next) => {
    const {start, end, wpp} = req.body;
    const query = `with source as (select trim(uuid_sumber_daya) as sumber_daya
                                   from brpl_biologiukuran
                                   where ${concatenateAsSqlBetween('tanggal_sampling', start, end)}
                       ${concatenateAsSqlOr('wpp', wpp)} )
    select sumber_daya as value, sumber_daya as label
    from source
    group by sumber_daya
    order by sumber_daya`;

    pool.query(query, (error, rows) => {
        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        predefineResponse(res, rows, ALL_RESOURCE);
    });
});


/**
 * Datasource for predefined data locations on selected date range for Struktur Ukuran Ikan Tertangkap  Graphic
 */
router.post('/locations', async (req, res, next) => {
    const {start, end, wpp, resource} = req.body;
    const query = `with source as (select trim(nama_lokasi_sampling) as nama_lokasi_sampling
                                   from brpl_biologiukuran
                                   where ${concatenateAsSqlBetween('tanggal_sampling', start, end)}
                       ${concatenateAsSqlOr('wpp', wpp)}
                       ${concatenateAsSqlOr('uuid_sumber_daya', resource)} )
    select nama_lokasi_sampling as value, nama_lokasi_sampling as label
    from source
    group by nama_lokasi_sampling
    order by nama_lokasi_sampling`;

    pool.query(query, (error, rows) => {
        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        predefineResponse(res, rows, ALL_LOCATION);
    });
});


/**
 * Datasource for predefined data species on selected date range for Struktur Ukuran Ikan Tertangkap  Graphic
 */
router.post('/species', async (req, res, next) => {
    const {start, end, wpp, resource, location} = req.body;
    const query = `with source as (select trim(bb.uuid_spesies) as spesies
                                   from brpl_biologiukuran bbu
                                            inner join brpl_biologiukurandetail bb on bbu.uuid = bb.uuid_biologiukuran
                                   where ${concatenateAsSqlBetween('tanggal_sampling', start, end)}
                       ${concatenateAsSqlOr('wpp', wpp)}
                       ${concatenateAsSqlOr('uuid_sumber_daya', resource)}
                       ${concatenateAsSqlOr('nama_lokasi_sampling', location)} )
    select spesies as value, spesies as label
    from source
    group by spesies
    order by spesies`;

    pool.query(query, (error, rows) => {
        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        predefineResponse(res, rows, ALL_SPECIES);
    });
});

module.exports = router;
