const express = require('express');
const router = express.Router();
const {responseStatus, removeImage, resolveImagePath} = require("../helpers/utilities");

router.delete('/remove/:imageName', (req, res) => {
    const {imageName} = req.params;
    const path = resolveImagePath(imageName);
    removeImage(path);

    res.status(200).json({
        status: responseStatus(1)
    });
});

module.exports = router;
