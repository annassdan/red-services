const express = require('express');
const {CPUE} = require("../../helpers/constants");
const {
    generateGraphicImageName,
    loggingRequestBody,
    concatenateRscriptArguments,
    executeCommandLine,
    responseStatus,
    resolveRscriptCommand,
    rscript
} = require("../../helpers/utilities");
const {pool} = require("../../database/database");
const router = express.Router();

/**
 * Route to generate report result for Hubungan Panjang Berat Graphic
 */
router.post('/', async (req, res) => {
    const graphicImageName = generateGraphicImageName(CPUE);
    loggingRequestBody(req.body);

    const restArgs = concatenateRscriptArguments(req.body, [
        'wpp',
        {prop: 'location', str: true},
        {prop: 'start', str: true}, // start date
        {prop: 'end', str: true} // end date
    ]);

    const command = `rscript ${rscript(CPUE)} ${graphicImageName} ${restArgs}`;
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

        res.status(200).json(rows || []);
    });
});

router.post('/location', (req, res, next) => {
    const {start, end, wpp} = req.body;
    pool.query(`with landing as (select nama_lokasi_pendaratan as nama_lokasi_pendaratan
                from brpl_pendaratan
                where tanggal_pendaratan between '${start}' and '${end}' and wpp = '${wpp}')
                select nama_lokasi_pendaratan as value, nama_lokasi_pendaratan as label
                from landing
                group by nama_lokasi_pendaratan
                order by nama_lokasi_pendaratan`, (error, {rows}) => {

        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        res.status(200).json(rows || []);
    });
});


module.exports = router;