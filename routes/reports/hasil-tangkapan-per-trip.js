const express = require('express');
const {RSCRIPT_PATH, HASIL_TANGKAPAN_PER_TRIP} = require("../../helpers/constants");
const {
    generateGraphicImageName,
    loggingRequestBody,
    concatenateRscriptArguments,
    executeCommandLine,
    responseStatus,
    resolveRscriptCommand,
    rscript
} = require("../../helpers/utilities");
const router = express.Router();

/**
 * Route to generate report result for Hubungan Panjang Berat Graphic
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

module.exports = router;