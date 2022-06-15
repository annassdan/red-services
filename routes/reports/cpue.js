const express = require('express');
const {CPUE, ALL_WPP, ALL_LOCATION, ALL_RESOURCE} = require("../../helpers/constants");
const {
    generateGraphicImageName,
    loggingRequestBody,
    concatenateRscriptArguments,
    executeCommandLine,
    responseStatus,
    resolveRscriptCommand,
    rscript, normalizeEscapeString, concatenateAsSqlBetween, concatenateAsSqlOr, predefineResponse, selectSqlColumn
} = require("../../helpers/utilities");
const {pool} = require("../../database/database");
const {addGeneratedImage, addPid} = require("../authorization");
const router = express.Router();
const {exec} = require("child_process");

/**
 * Route to generate report result for CPUE Graphic
 */
router.post('/', async (req, res) => {
    const {graphicImageName, requestKey} = req.body;
    loggingRequestBody(req.body);

    const restArgs = concatenateRscriptArguments(req.body, [
        // { prop = undefined, props = [], str = false, arr = false, between = false, sqlColumn = '', first: false},
        {props: ['start', 'end'], between: true, sqlColumn: 'tanggal_pendaratan', first: true},
        {prop: 'wpp', arr: true, sqlColumn: 'wpp'},
        {prop: 'resource', arr: true, sqlColumn: 'uuid_sumber_daya'},
        {prop: 'location', arr: true, sqlColumn: 'nama_lokasi_pendaratan'}
    ]);

    const command = `Rscript ${rscript(CPUE)} ${graphicImageName} ${restArgs}`;

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
 * Datasource for predefined data wpp on selected date range for CPUE  Graphic
 */
router.post('/wpp', async (req, res, next) => {
    const {start, end} = req.body;
    const query = `with landing as (select ${selectSqlColumn('wpp')} as wpp
                                    from brpl_pendaratan
                                    where ${concatenateAsSqlBetween('tanggal_pendaratan', start, end)})
                   select wpp as value, wpp as label
                   from landing
                   group by wpp
                   order by wpp`;

    pool.query(query, (error, {rows}) => {
        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        predefineResponse(res, rows, ALL_WPP);
    });
});


router.post('/resources', async (req, res, next) => {
    const {start, end, wpp} = req.body;
    const query = `with landing as (select ${selectSqlColumn('uuid_sumber_daya')} as sumber_daya
                                    from brpl_pendaratan 
                                    where ${concatenateAsSqlBetween('tanggal_pendaratan', start, end)}
                       ${concatenateAsSqlOr('wpp', wpp)} )
    select sumber_daya as value, sumber_daya as label
    from landing
    group by sumber_daya
    order by sumber_daya`;

    pool.query(query, (error, {rows}) => {
        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        predefineResponse(res, rows, ALL_RESOURCE);
    });
});


/**
 * Datasource for predefined data locations on selected date range for CPUE Graphic
 */
router.post('/locations', async (req, res, next) => {
    const {start, end, wpp, resource} = req.body;
    const query = `with landing as (select ${selectSqlColumn('nama_lokasi_pendaratan')} as nama_lokasi_pendaratan
                                    from brpl_pendaratan
                                    where ${concatenateAsSqlBetween('tanggal_pendaratan', start, end)}
                       ${concatenateAsSqlOr('wpp', wpp)}
                       ${concatenateAsSqlOr('uuid_sumber_daya', resource)} )
    select nama_lokasi_pendaratan as value, nama_lokasi_pendaratan as label
    from landing
    group by nama_lokasi_pendaratan
    order by nama_lokasi_pendaratan`

    pool.query(query, (error, {rows}) => {
        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        predefineResponse(res, rows, ALL_LOCATION);
    });
});


module.exports = router;
