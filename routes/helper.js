const express = require('express');
const router = express.Router();
const {responseStatus, removeImage, resolveImagePath} = require("../helpers/utilities");
const {clearPids} = require("./authorization");
const kill = require('tree-kill');

router.delete('/remove/:imageName', (req, res) => {
    const {imageName} = req.params;
    const path = resolveImagePath(imageName);
    removeImage(path);

    res.status(200).json({
        status: responseStatus(1)
    });
});


router.delete('/kill/:email/', (req, res) => {
    const {email} = req.params;
    clearPids(email);
    res.status(200).json({
        status: responseStatus(1)
    });
});

module.exports = router;
