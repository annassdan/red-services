const express = require('express');
const {HUBUNGAN_PANJANG_BERAT, ALL_WPP, ALL_RESOURCE} = require("../../helpers/constants");
const {
    generateGraphicImageName,
    loggingRequestBody,
    concatenateRscriptArguments,
    executeCommandLine,
    responseStatus,
    resolveRscriptCommand,
    rscript,
    normalizeEscapeString
} = require("../../helpers/utilities");
const {pool} = require("../../database/database");
const router = express.Router();

/**
 * Route to generate report result for Hubungan Panjang Berat Graphic
 */
router.post('/', async (req, res) => {
    const graphicImageName = generateGraphicImageName(HUBUNGAN_PANJANG_BERAT);
    loggingRequestBody(req.body);

    // const restArgs = concatenateRscriptArguments(req.body, [
    //     'wpp',
    //     'year',
    //     {prop: 'location', str: true},
    //     {prop: 'species', arr: true}
    // ]);
    const restArgs = concatenateRscriptArguments(req.body, [
        // 'wpp',
        {prop: 'wpp', str: true},
        {prop: 'location', str: true},
        {prop: 'start', str: true}, // start date
        {prop: 'end', str: true}, // end date
        {prop: 'resource', str: true},
        {prop: 'minLength', str: true},
        {prop: 'maxLength', str: true},
        {prop: 'minWeight', str: true},
        {prop: 'maxWeight', str: true},
        {prop: 'species', arr: true},
    ]);

    const command = `rscript ${rscript('hubungan_panjang_berat_original')} ${graphicImageName} ${restArgs}`;
    console.log(command);
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
 * Datasource for predefined data wpp on selected date range for Hubungan Panjang Berat Graphic
 */
router.post('/wpp', (req, res, next) => {
    const {start, end} = req.body;
    const query = `with source as (select trim(wpp) as wpp
                   from brpl_biologireproduksi
                   where tanggal_sampling between '${start}' and '${end}')
                   select wpp as value, wpp as label
                   from source
                   group by wpp
                   order by wpp`;

    pool.query(query, (error, {rows}) => {
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
 * Datasource for predefined data resource on selected date range for Hubungan Panjang Berat Graphic
 */
router.post('/resources', (req, res, next) => {
    const {start, end, wpp} = req.body;
    const query = `with source as (select trim(uuid_sumber_daya) as sumber_daya
                   from brpl_biologireproduksi
                   where (tanggal_sampling between '${start}' and '${end}') 
                   and ('${normalizeEscapeString(wpp)}' = '${ALL_WPP}' or trim(wpp) = trim('${normalizeEscapeString(wpp)}')) )
                   select sumber_daya as value, sumber_daya as label
                   from source
                   group by sumber_daya
                   order by sumber_daya`;
    console.log(query)

    pool.query(query, (error, {rows}) => {
        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        const responseBody = rows.length > 0 ? [
            {value: ALL_RESOURCE, label: ALL_RESOURCE},
            ...rows
        ] : [];
        res.status(200).json(responseBody);
    });
});

/**
 * Datasource for predefined data locations on selected date range for Hubungan Panjang Berat Graphic
 */
router.post('/locations', (req, res, next) => {
    const {start, end, wpp, resource} = req.body;
    const query = `with source as (select trim(nama_lokasi_sampling) as nama_lokasi_sampling
                   from brpl_biologireproduksi
                   where (tanggal_sampling between '${start}' and '${end}') 
                   and ('${normalizeEscapeString(wpp)}' = '${ALL_WPP}' or trim(wpp) = trim('${normalizeEscapeString(wpp)}'))
                   and ('${normalizeEscapeString(resource)}' = '${ALL_RESOURCE}' or trim(uuid_sumber_daya) = trim('${normalizeEscapeString(resource)}')) )
                   select nama_lokasi_sampling as value, nama_lokasi_sampling as label
                   from source
                   group by nama_lokasi_sampling
                   order by nama_lokasi_sampling`;

    pool.query(query, (error, {rows}) => {
        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        res.status(200).json(rows || []);
    });
});


/**
 * Datasource for predefined data species on selected date range for Hubungan Panjang Berat Graphic
 */
router.post('/species', (req, res, next) => {
    const {start, end, wpp, resource, location} = req.body;
    const query = `with source as (select trim(uuid_spesies) as spesies
                   from brpl_biologireproduksi
                   where (tanggal_sampling between '${start}' and '${end}')
                   and ('${normalizeEscapeString(wpp)}' = '${ALL_WPP}' or trim(wpp) = trim('${normalizeEscapeString(wpp)}')) 
                   and ('${normalizeEscapeString(resource)}' = '${ALL_RESOURCE}' or trim(uuid_sumber_daya) = trim('${normalizeEscapeString(resource)}'))
                   and trim(nama_lokasi_sampling) = trim('${normalizeEscapeString(location)}') )
                   select spesies as value, spesies as label
                   from source
                   group by spesies
                   order by spesies`;

    pool.query(query, (error, {rows}) => {
        if (error) {
            res.status(500).json('Gagal');
            return;
        }

        res.status(200).json(rows || []);
    });
});

module.exports = router;
