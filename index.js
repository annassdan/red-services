const createError = require('http-errors');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const {
    APP_PORT, PUBLIC_PATH, CPUE, HUBUNGAN_PANJANG_BERAT, HASIL_TANGKAPAN_PER_TRIP, PRODUKSI_IKAN_PER_ALAT_TANGKAP,
    PRODUKSI_IKAN_PER_SUMBER_DAYA, STRUKTUR_UKURAN_IKAN_TERTANGKAP, LPUE
} = require('./helpers/constants');
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

/**
 * Application root of BRPL RED
 */
app.get('/', (req, res) => {
    res.status(200).json({
        applicationName: 'BRPL RED'
    });
});

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
