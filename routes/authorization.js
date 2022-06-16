const {REPORT_URLS, AUTHORIZATION_URL} = require("../helpers/constants");
const {generateGraphicImageName, responseStatus, removeImage, resolveImagePath, normalizeEscapeString} = require("../helpers/utilities");
const kill = require('tree-kill');
const {pool} = require("../database/database");

/**
 * Create simple continuation storage
 */
const store = new Map();
function initializingCLS() {
    store.set('authorized_users', []);
}

/**
 * Get clas value
 * @param key
 * @returns {any}
 */
const getCLS = (key) => {
    return store.get(key);
}

/**
 * set cls value
 * @param key
 * @param value
 * @returns {Map<any, any>}
 */
const setCLS = (key, value) => {
    return store.set(key, value);
}

/**
 * get array of authorized users
 * @returns {*|*[]}
 */
function getAuthorizedUsers() {
    const users = getCLS('authorized_users');
    return users || [];
}


/**
 * Create request key for client
 * @param email
 * @param tempKey
 * @returns {string}
 */
function generateAuthorizedRequestKey(email, tempKey) {
    const random = String(Math.random()).replace('.', '');
    // delete random[`${0}`];
    return `${email}_${tempKey}_${random}`;
}


/**
 * Get object of client and other clients data
 * @param by
 * @param prop
 * @returns {{me: T, others: T[]}}
 */
function getAuthorizedUsersSplitMe(by, prop = 'email') {
    let users = getAuthorizedUsers();
    return {
        me: users.find((user) => user[prop] === by),
        others: users.filter((user) => user[prop] !== by)
    };
}

/**
 * If new user authorized to system
 * @param email
 * @param tempKey
 * @returns {{requestKey: string, me: {requestKey: string, generatedImages: *[], tempKey, pids: *[], email}}}
 */
function assignNewUser(email, tempKey) {
    let {others: tempAuthorizedUsers, me} = getAuthorizedUsersSplitMe(email);
    const requestKey = generateAuthorizedRequestKey(email, tempKey);
    me = {
        email,
        tempKey,
        requestKey,
        generatedImages: me ? [...me['generatedImages']] : [],
        pids: me ? [...me['pids']] : [],
    };

    tempAuthorizedUsers.push(me);

    setCLS('authorized_users', tempAuthorizedUsers);
    return {requestKey, me};
}

const check = async (email) => {
    const data = await pool.query(`select active from red_access where email = '${normalizeEscapeString(email)}'`);
    if (data) {
        const { rows } = data;
        if (rows.length > 0 && rows[0]['active'] === true) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

/**
 * Validate email to registered user emails
 * @param email
 * @param tempKey
 * @returns {{}|{requestKey: string, me: {requestKey: string, generatedImages: *[], tempKey, pids: *[], email}}}
 */
const validateUser = async (email, tempKey) => {
    const active = await check(email);
    if (active) {
        return assignNewUser(email, tempKey);
    }
    
    return {};
}

/**
 * Add generated image for specific user
 * @param requestKey
 * @param imageName
 */
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

/**
 * Add user PID for rscript operation
 * @param requestKey
 * @param pid
 */
function addPid(requestKey, pid) {
    const {me, others} = getAuthorizedUsersSplitMe(requestKey, 'requestKey');
    if (me) {
        others.push({
            ...me,
            pids: [...me['pids'], pid]
        });
        setCLS('authorized_users', others);
        // console.log(others);
    }
}

/**
 * Send SIGTERM and Kill PID
 * @param pid
 * @returns {boolean}
 */
function killPID(pid) {
    try {
        kill(pid);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * CLear all running rscript process by specific user
 * @param email
 */
function clearPids(email) {
    const {me, others} = getAuthorizedUsersSplitMe(email);
    if (me) {
        const pids = [...me['pids']];
        const newPids = [];
        // remove existing generated image
        for (let pid of pids) {
            const killed = killPID(pid);
            // const removed = false;
            if (!killed) {
                newPids.push(pid);
            }
        }
        others.push({
            ...me,
            pids: newPids
        });
        setCLS('authorized_users', others);
    }
}

/**
 * Remove all generated image by specific
 * @param me
 * @param others
 */
function removeImages(me, others) {
    const images = me ? [...me['generatedImages']] :  [];
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
}

/**
 * Middleware
 * @returns {(function(*, *, *): Promise<void>)|*}
 */
function guard() {
    return async (req, res, next) => {
        const graphic = String(req.originalUrl).replace(/\//g, '');
        const matched = REPORT_URLS.find((url) => graphic === url);
        if (req.originalUrl === AUTHORIZATION_URL) {
            const {email, tempKey} = req.body;
            // console.log(email, tempKey)
            const {requestKey} = await validateUser(email, tempKey);
            if (requestKey) {
                req.body = {...req.body, requestKey};
                next();
            } else {
                res.status(403).json({
                    status: responseStatus(0)
                });
            }
        } else if (matched) {
            let {requestKey, email, tempKey} = req.body;
            const graphicImageName = generateGraphicImageName(graphic);
            let {me, others} = getAuthorizedUsersSplitMe(requestKey, 'requestKey');
            if (!me) {
                const {requestKey: key, me: itsMe} = await validateUser(email, tempKey);
                me = itsMe;
                requestKey = key;
            }

            if (requestKey) {
                removeImages(me, others);
                req.body = {...req.body, graphicImageName, requestKey};
                next();
            } else {
                res.status(403).json({
                    status: responseStatus(0)
                });
            }
        } else {
            next();
        }
    }
}

const authMiddleware = guard();

module.exports = {
    authMiddleware,
    addGeneratedImage,
    initializingCLS,
    addPid,
    clearPids
}