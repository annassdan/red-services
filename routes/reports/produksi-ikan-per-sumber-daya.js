const express = require('express');
const {RSCRIPT_PATH, PRODUKSI_IKAN_PER_SUMBER_DAYA, ALL_WPP, ALL_RESOURCE, ALL_LOCATION} = require("../../helpers/constants");
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
const router = express.Router();

/**
 * Route to generate report result for Produksi Ikan Per Sumber Daya Graphic
 */
router.post('/', async (req, res) => {
    const graphicImageName = generateGraphicImageName(PRODUKSI_IKAN_PER_SUMBER_DAYA);
    loggingRequestBody(req.body);

    const restArgs = concatenateRscriptArguments(req.body, [
        // { prop = undefined, props = [], str = false, arr = false, between = false, sqlColumn = '', first: false},
        {props: ['start', 'end'], between: true, sqlColumn: 'tanggal_pendaratan', first: true},
        {prop: 'wpp', arr: true, sqlColumn: 'wpp'},
        {prop: 'resource', arr: true, sqlColumn: 'uuid_sumber_daya'},
        {prop: 'location', arr: true, sqlColumn: 'nama_lokasi_pendaratan'}
    ]);

    const command = `rscript ${rscript(PRODUKSI_IKAN_PER_SUMBER_DAYA)} ${graphicImageName} ${restArgs}`;
    const {stderr} = await executeCommandLine(resolveRscriptCommand(command));
    //
    if (stderr) {
        res.status(500).json({
            status: responseStatus(0),
            error: stderr
        });
        return;
    }

    res.status(200).json({
        status: responseStatus(1),
        graphicImageName: `${graphicImageName}${__image_extention}`
    });
});

/**
 * Datasource for predefined data wpp on selected date range for Produksi Ikan Per Sumber Daya  Graphic
 */
router.post('/wpp', (req, res, next) => {
    const {start, end} = req.body;
    const query = `with landing as (select trim(wpp) as wpp
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


router.post('/resources', (req, res, next) => {
    const {start, end, wpp} = req.body;
    const query = `with landing as (select trim(uuid_sumber_daya) as sumber_daya
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
 * Datasource for predefined data locations on selected date range for Produksi Ikan Per Sumber Daya Graphic
 */
router.post('/locations', (req, res, next) => {
    const {start, end, wpp, resource} = req.body;
    const query = `with landing as (select trim(nama_lokasi_pendaratan) as nama_lokasi_pendaratan
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
