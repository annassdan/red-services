const HUBUNGAN_PANJANG_BERAT = 'hubungan_panjang_berat';
const CPUE = 'CPUE';
const LPUE = 'LPUE';
const HASIL_TANGKAPAN_PER_TRIP = 'hasil_tangkapan_per_trip';
const PRODUKSI_IKAN_PER_ALAT_TANGKAP = 'produksi_ikan_per_alat_tangkap';
const PRODUKSI_IKAN_PER_SUMBER_DAYA = 'produksi_ikan_per_sumber_daya';
const STRUKTUR_UKURAN_IKAN_TERTANGKAP = 'struktur_ukuran_ikan_tertangkap';
const HS_PERBANDINGAN_PANJANG_BERAT = 'hs_perbandingan_panjang_berat';
const REPORT_URLS = [
    HUBUNGAN_PANJANG_BERAT, CPUE, LPUE, HASIL_TANGKAPAN_PER_TRIP,
    PRODUKSI_IKAN_PER_ALAT_TANGKAP, PRODUKSI_IKAN_PER_SUMBER_DAYA, STRUKTUR_UKURAN_IKAN_TERTANGKAP,
    HS_PERBANDINGAN_PANJANG_BERAT
];
const ALL_WPP = 'Seluruh WPP';
const ALL_RESOURCE = 'Seluruh Sumber Daya';
const ALL_LOCATION = 'Seluruh Lokasi';
const ALL_SPECIES = 'Seluruh Spesies';
const API_FOR_ALL_SELECTED = 'Ht7fvF1yGXuHtrm9nEMV';
const AUTHORIZATION_URL = '/auth-red';

const RSCRIPT_PATH = 'r-scripts';
const PUBLIC_PATH = 'r-scripts\\images';
const APP_PORT = 4000;

module.exports = {
    HUBUNGAN_PANJANG_BERAT,
    CPUE,
    LPUE,
    HASIL_TANGKAPAN_PER_TRIP,
    PRODUKSI_IKAN_PER_ALAT_TANGKAP,
    PRODUKSI_IKAN_PER_SUMBER_DAYA,
    STRUKTUR_UKURAN_IKAN_TERTANGKAP,
    HS_PERBANDINGAN_PANJANG_BERAT,
    RSCRIPT_PATH,
    PUBLIC_PATH,
    APP_PORT,
    ALL_RESOURCE,
    ALL_WPP,
    ALL_LOCATION,
    ALL_SPECIES,
    API_FOR_ALL_SELECTED,
    REPORT_URLS,
    AUTHORIZATION_URL
}
