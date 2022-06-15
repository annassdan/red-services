const {REPORT_URLS, AUTHORIZATION_URL} = require("../helpers/constants");
const {generateGraphicImageName, responseStatus, removeImage, resolveImagePath} = require("../helpers/utilities");

/**
 * Create simple continuation storage
 */
const store = new Map();
function initializingCLS() {
    store.set('authorized_users', []);
}

const getCLS = (key) => {
    return store.get(key);
}

const setCLS = (key, value) => {
    return store.set(key, value);
}

function getAuthorizedUsers() {
    const users = getCLS('authorized_users');
    return users || [];
}

function generateAuthorizedRequestKey(email, tempKey) {
    const random = String(Math.random()).replace('.', '');
    // delete random[`${0}`];
    return `${email}_${tempKey}_${random}`;
}

function getAuthorizedUsersSplitMe(by, prop = 'email') {
    let users = getAuthorizedUsers();
    return {
        me: users.find((user) => user[prop] === by),
        others: users.filter((user) => user[prop] !== by)
    };
}

function assignNewUser(email, tempKey) {
    const {others: tempAuthorizedUsers, me} = getAuthorizedUsersSplitMe(email);
    const requestKey = generateAuthorizedRequestKey(email, tempKey);
    console.log(me)

    tempAuthorizedUsers.push({
        email,
        tempKey,
        requestKey,
        generatedImages: me ? [...me['generatedImages']] : []
    });
    setCLS('authorized_users', tempAuthorizedUsers);
    return requestKey;
}

function addGeneratedImage(requestKey, imageName) {
    const {me, others} = getAuthorizedUsersSplitMe(requestKey, 'requestKey');
    if (me) {
        others.push({
            ...me,
            generatedImages: [...me['generatedImages'], imageName]
        });
        setCLS('authorized_users', others);
    }
}

function guard() {
    return async (req, res, next) => {
        const graphic = String(req.originalUrl).replace(/\//g, '');
        const matched = REPORT_URLS.find((url) => graphic === url);
        if (req.originalUrl === AUTHORIZATION_URL) {
            const {email, tempKey} = req.body;
            console.log(email);
            if (email === 'info@intelion.co.id') {
                const requestKey = assignNewUser(email, tempKey);
                req.body = {...req.body, requestKey};
                next();
            } else {
                res.status(403).json({
                    status: responseStatus(0)
                });
            }
        } else if (matched) {
            const {requestKey} = req.body;
            const graphicImageName = generateGraphicImageName(graphic);
            const {me, others} = getAuthorizedUsersSplitMe(requestKey, 'requestKey');
            console.log(me);
            if (me) {
                const images = [...me['generatedImages']];
                const newGeneratedImages = [];
                // remove existing generated image
                for (let image of images) {
                    const removed = removeImage(resolveImagePath(image));
                    // const removed = false;
                    if (!removed) {
                        newGeneratedImages.push(image);
                    }
                }
                others.push({
                    ...me,
                    generatedImages: newGeneratedImages
                });
                setCLS('authorized_users', others);
            } else {
                res.status(403).json({
                    status: responseStatus(0)
                });
            }

            req.body = {...req.body, graphicImageName, requestKey};
            next();
        } else {
            next();
        }
    }
}

const authMiddleware = guard();

module.exports = {
    authMiddleware,
    addGeneratedImage,
    initializingCLS
}