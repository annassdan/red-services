const express = require('express');
const app = express();
const port = 4000;
const { exec } = require("child_process");
const util  = require("util");
const execPromise = util.promisify(exec);
const cors = require('cors');
const performanceNow = require("performance-now");

const rscriptPath = 'r-scripts';
const publicPath = 'r-scripts/images';

// allow cors
app.use(cors());

// serve static folder that available publicly
app.use('/static', express.static(publicPath));


app.get('/', (req, res) => {
    res.status(200).send({
        applicationName: 'RED!'
    });
});

app.delete('/delete-image/:imageName', async (req, res) => {
    try {
        // do som file deletion here
        res.status(200).send({
            status: 'SUCCESS'
        });
    } catch (e) {
        res.status(500).send({
            status: 'ERROR'
        });
    }
});

app.post('/execute-graphic/:graphicName', async (req, res) => {
    const graphicName = req.params['graphicName'];
    console.log(graphicName);
    console.log(req.body);
    try {
        await execPromise(`rscript ${rscriptPath}/panjang_x_berat.R ${concatenateGraphicParam(graphicName, req.body)}`);
        res.status(200).send({
            status: 'SUCCESS'
        });
    } catch (e) {
        res.status(500).send({
            status: 'ERROR'
        });
    }
});


function generateGraphicImageName(graphicName) {
    let loadTimeInMS = Date.now();
    const times = (loadTimeInMS + performanceNow()) * 1000;
    return `${graphicName}_${times}_${Math.random()}`;
}

/**
 * Concatenate request params as string, used for R Script file arguments
 * @param graphicName
 * @param params
 */
function concatenateGraphicParam(graphicName, params) {
    return `${generateGraphicImageName(graphicName)} ${params.selectedWpp} `
}

app.listen({
    port,
    cors: '*'
}, () => {
    console.log(`Example app listening on port ${port}`);
});
