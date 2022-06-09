const express = require('express');
const {HUBUNGAN_PANJANG_BERAT} = require("../../helpers/constants");
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
    const graphicImageName = generateGraphicImageName(HUBUNGAN_PANJANG_BERAT);
    loggingRequestBody(req.body);

    const restArgs = concatenateRscriptArguments(req.body, [
        'wpp',
        'year',
        {prop: 'location', str: true},
        {prop: 'species', arr: true}
    ]);
    // const restArgs = concatenateRscriptArguments(req.body, [
    //     'wpp',
    //     {prop: 'location', str: true},
    //     {prop: 'start', str: true}, // start date
    //     {prop: 'end', str: true}, // end date
    //     {prop: 'resource', str: true},
    //     {prop: 'minLength', str: true},
    //     {prop: 'maxLength', str: true},
    //     {prop: 'minWeight', str: true},
    //     {prop: 'maxWeight', str: true},
    //     {prop: 'species', arr: true},
    // ]);

    const command = `rscript ${rscript(HUBUNGAN_PANJANG_BERAT)} ${graphicImageName} ${restArgs}`;
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
    pool.query(`with source as (select trim(wpp) as wpp
                from brpl_biologireproduksi
                where tanggal_sampling between '${start}' and '${end}')
                select wpp as value, wpp as label
                from source
                group by wpp
                order by wpp`, (error, {rows}) => {

        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        res.status(200).json(rows || []);
    });
});

router.post('/locations', (req, res, next) => {
    const {start, end, wpp} = req.body;
    pool.query(`with source as (select trim(nama_lokasi_sampling) as nama_lokasi_sampling
                from brpl_biologireproduksi
                where tanggal_sampling between '${start}' and '${end}' and trim(wpp) = trim('${wpp}'))
                select nama_lokasi_sampling as value, nama_lokasi_sampling as label
                from source
                group by nama_lokasi_sampling
                order by nama_lokasi_sampling`, (error, {rows}) => {

        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        res.status(200).json(rows || []);
    });
});


router.post('/species', (req, res, next) => {
    const {start, end, wpp, location} = req.body;
    pool.query(`with source as (select trim(uuid_spesies) as spesies
                    from brpl_biologireproduksi
                    where tanggal_sampling between '${start}' and '${end}'
                    and trim(wpp) = trim('${wpp}') and trim(nama_lokasi_sampling) = trim('${location}'))
                    select spesies as value, spesies as label
                    from source
                    group by spesies
                    order by spesies`, (error, {rows}) => {

        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        res.status(200).json(rows || []);
    });
});

module.exports = router;
