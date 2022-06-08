const createError = require('http-errors');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const {APP_PORT, PUBLIC_PATH} = require('./helpers/constants');
const hubunganPanjangBerat = require('./routes/reports/hubungan-panjang-berat');
const cpue = require('./routes/reports/cpue');
const lpue = require('./routes/reports/lpue');
const hasilTangkapanPerTrip = require('./routes/reports/hasil-tangkapan-per-trip');
const produksiIkanPerAlatTangkap = require('./routes/reports/produksi-ikan-per-alat-tangkap');
const produksiIkanPerSumberDaya = require('./routes/reports/produksi-ikan-per-sumber-daya');
const strukturUkuranIkanTertangkap = require('./routes/reports/struktur-ukuran-ikan-tertangkap');

global.__project_root = __dirname;
global.__image_extention = '.jpg';

/**
 * Setup requirement for internal process on express
 */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Define URLs
app.use('/static/', express.static(PUBLIC_PATH));
app.use('/hubungan-panjang-berat', hubunganPanjangBerat);
app.use('/cpue', cpue);
app.use('/lpue', lpue);
app.use('/hasil-tangkapan-per-trip', hasilTangkapanPerTrip);
app.use('/produksi-ikan-per-alat-tangkap', produksiIkanPerAlatTangkap);
app.use('/produksi-ikan-per-sumber-daya', produksiIkanPerSumberDaya);
app.use('/struktur-ukuran-ikan-tertangkap', strukturUkuranIkanTertangkap);

/**
 * Catch 404 and forward to error handler
 */
app.use(function (req, res, next) {
    next(createError(404));
});

/**
 * Application root of BRPL RED
 */
app.get('/', (req, res) => {
    res.status(200).json({
        applicationName: 'BRPL RED'
    });
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
