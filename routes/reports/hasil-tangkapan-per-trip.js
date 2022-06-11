const express = require('express');
const {RSCRIPT_PATH, HASIL_TANGKAPAN_PER_TRIP, ALL_WPP} = require("../../helpers/constants");
const {
    generateGraphicImageName,
    loggingRequestBody,
    concatenateRscriptArguments,
    executeCommandLine,
    responseStatus,
    resolveRscriptCommand,
    rscript, normalizeEscapeString
} = require("../../helpers/utilities");
const {pool} = require("../../database/database");
const router = express.Router();

/**
 * Route to generate report result for Hasil Tangkapan Per Trip Graphic
 */
router.post('/', async (req, res) => {
    const graphicImageName = generateGraphicImageName(HASIL_TANGKAPAN_PER_TRIP);
    loggingRequestBody(req.body);

    const restArgs = concatenateRscriptArguments(req.body, [
        'wpp',
        {prop: 'location', str: true},
        {prop: 'start', str: true}, // start date
        {prop: 'end', str: true} // end date
    ]);

    const command = `rscript ${rscript(HASIL_TANGKAPAN_PER_TRIP)} ${graphicImageName} ${restArgs}`;
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
 * Datasource for predefined data wpp on selected date range for Hasil Tangkapan Per Trip  Graphic
 */
router.post('/wpp', (req, res, next) => {
    const {start, end} = req.body;
    pool.query(`with landing as (select trim(wpp) as wpp
                from brpl_pendaratan
                where tanggal_pendaratan between '${start}' and '${end}')
                select wpp as value, wpp as label
                from landing
                group by wpp
                order by wpp`, (error, {rows}) => {

        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        const responseBody = rows.length > 0 ? [
            {value: ALL_WPP, label: ALL_WPP},
            ...rows
        ] : [];
        res.status(200).json(responseBody);
    });
});


/**
 * Datasource for predefined data locations on selected date range for Hasil Tangkapan Per Trip Graphic
 */
router.post('/locations', (req, res, next) => {
    const {start, end, wpp} = req.body;
    // and ('${normalizeEscapeString(resource)}' = '${ALL_RESOURCE}' or trim(uuid_sumber_daya) = trim('${normalizeEscapeString(resource)}'))
    const query = `with landing as (select trim(nama_lokasi_pendaratan) as nama_lokasi_pendaratan
                   from brpl_pendaratan
                   where (tanggal_pendaratan between '${start}' and '${end}') 
                   and ('${normalizeEscapeString(wpp)}' = '${ALL_WPP}' or trim(wpp) = trim('${normalizeEscapeString(wpp)}')) )
                   select nama_lokasi_pendaratan as value, nama_lokasi_pendaratan as label
                   from landing
                   group by nama_lokasi_pendaratan
                   order by nama_lokasi_pendaratan`;

    pool.query(query, (error, {rows}) => {
        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        res.status(200).json(rows || []);
    });
});

module.exports = router;
