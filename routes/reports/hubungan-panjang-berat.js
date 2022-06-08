const express = require('express');
const {RSCRIPT_PATH, HUBUNGAN_PANJANG_BERAT} = require("../../helpers/constants");
const {
    generateGraphicImageName,
    loggingRequestBody,
    concatenateRscriptArguments,
    executeCommandLine,
    responseStatus,
    resolveRscriptCommand
} = require("../../helpers/utilities");
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

    const command = `rscript ${__project_root}\\${RSCRIPT_PATH}\\${HUBUNGAN_PANJANG_BERAT}.R ${graphicImageName} ${restArgs}`;
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

module.exports = router;
