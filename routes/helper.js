const express = require('express');
const router = express.Router();
const fs = require('fs');
const {responseStatus, resolvePath} = require("../helpers/utilities");
const {PUBLIC_PATH} = require("../helpers/constants");

router.delete('/remove/:imageName', (req, res) => {
    const {imageName} = req.params;
    const path = resolvePath(`${__project_root}\\${PUBLIC_PATH}\\${imageName}`);
    try {
        fs.unlinkSync(path)
    } catch(err) {
        console.error(err)
    }

    res.status(200).json({
        status: responseStatus(1)
    });
});


module.exports = router;
