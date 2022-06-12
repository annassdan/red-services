const createError = require('http-errors');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const {
    APP_PORT, PUBLIC_PATH, CPUE, HUBUNGAN_PANJANG_BERAT, HASIL_TANGKAPAN_PER_TRIP, PRODUKSI_IKAN_PER_ALAT_TANGKAP,
    PRODUKSI_IKAN_PER_SUMBER_DAYA, STRUKTUR_UKURAN_IKAN_TERTANGKAP, LPUE, RSCRIPT_PATH
} = require('./helpers/constants');
const hubunganPanjangBerat = require('./routes/reports/hubungan-panjang-berat');
const cpue = require('./routes/reports/cpue');
const lpue = require('./routes/reports/lpue');
const hasilTangkapanPerTrip = require('./routes/reports/hasil-tangkapan-per-trip');
const produksiIkanPerAlatTangkap = require('./routes/reports/produksi-ikan-per-alat-tangkap');
const produksiIkanPerSumberDaya = require('./routes/reports/produksi-ikan-per-sumber-daya');
const strukturUkuranIkanTertangkap = require('./routes/reports/struktur-ukuran-ikan-tertangkap');

// temporary
const performanceNow = require("performance-now");
const { exec } = require("child_process");
const util  = require("util");
const execPromise = util.promisify(exec);
// ========

global.__project_root = __dirname;
global.__image_extention = '.jpg';

/**
 * Setup requirement for internal process on express
 */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/**
 * Application root of BRPL RED
 */
app.get('/', (req, res) => {
    res.status(200).json({
        applicationName: 'BRPL RED'
    });
});

app.post('/execute-graphic/:graphicName', async (req, res) => {
    const graphicName = req.params['graphicName'];
    const graphicImageName = generateGraphicImageName(graphicName);
    console.log(req.body);
    const rscript = `rscript ${RSCRIPT_PATH}/hubungan_panjang_berat.R ${graphicImageName} ${concatenateGraphicParam(graphicName, req.body)}`;
    try {
        await execPromise(rscript);
        console.log(`Generate R Report Selesai`);
        res.status(200).send({
            status: 'SUCCESS',
            graphicImageName: `${graphicImageName}.jpg`
        });
    } catch (e) {
        console.log(e)
        res.status(500).send({
            status: 'ERROR'
        });
    }
});

/**
 * Generate graphic image name for each request
 * @param graphicName
 * @returns {string}
 */
function generateGraphicImageName(graphicName) {
    let loadTimeInMS = Date.now();
    const times = (loadTimeInMS + performanceNow()) * 1000;
    return `${graphicName}_${times.toFixed(0)}_${String(Math.random()).replace('.', '')}`;
}

/**
 * Concatenate request params as string, used for R Script file arguments
 * @param graphicName
 * @param params
 */
function concatenateGraphicParam(graphicName, params) {
    return `${params['wpp']} ${params['year']} "${params['location']}" "${params['species'][0]}"`;
}

// Define URLs
app.use('/static/', express.static(PUBLIC_PATH));
app.use(`/${HUBUNGAN_PANJANG_BERAT}`, hubunganPanjangBerat);
app.use(`/${CPUE}`, cpue);
app.use(`/${LPUE}`, lpue);
app.use(`/${HASIL_TANGKAPAN_PER_TRIP}`, hasilTangkapanPerTrip);
app.use(`/${PRODUKSI_IKAN_PER_ALAT_TANGKAP}`, produksiIkanPerAlatTangkap);
app.use(`/${PRODUKSI_IKAN_PER_SUMBER_DAYA}`, produksiIkanPerSumberDaya);
app.use(`/${STRUKTUR_UKURAN_IKAN_TERTANGKAP}`, strukturUkuranIkanTertangkap);

/**
 * Catch 404 and forward to error handler
 */
app.use(function (req, res, next) {
    next(createError(404));
});

/**
 * Start the application
 */
app.listen({
    port: APP_PORT,
    cors: '*'
}, () => {
    console.log(`BRPL RED Handler app listening on port ${APP_PORT}`);
    // console.log(`BRPL RED Handler app listening on port 4000`);
});
