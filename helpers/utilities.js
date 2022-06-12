const performanceNow = require("performance-now");
const util = require("util");
const {exec} = require("child_process");
const execPromise = util.promisify(exec);
const {RSCRIPT_PATH, API_FOR_ALL_SELECTED} = require("./constants");

/**
 * Execute string command to terminal command or command prompt
 * @param command
 * @param args
 * @returns {Promise<{stdout: undefined, stderr}|{stdout: (*|string), stderr: (*|undefined)}>}
 */
function executeCommandLine(command, args = undefined) {
    // console.log(command);
    return execPromise(command)
        .then(({stdout}) => {
            // console.log(stdout);
            return {
                stdout,
                stderr: undefined
            }
        })
        .catch(({stdout, stderr, cmd}) => {
            return {
                stdout,
                stderr,
                cmd
            }
        });
}

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
 * @param body
 */
function concatenateRscriptArguments(body, params) {
    return params.reduce((accumulator, currentValue) => {
        const defaultObject = { sqlColumn: undefined, first: false, ...currentValue };
        const {prop, props, str, arr, between, sqlColumn, first} = defaultObject;

        if (arr) {
            const list = body[prop];
            if (sqlColumn) {
                const sql = concatenateAsSqlOr(sqlColumn, list, true, false);
                return `${accumulator} ${asStringArg(sql)}`;
            } else {
                const adder = list.reduce((str, current) => (typeof current === 'string' ? `${str} ${asStringArg(current)}` : `${str} ${current}`), '');
                return `${accumulator}${adder}`;
            }
        }

        if (between && sqlColumn) {
            const sql = concatenateAsSqlBetween(sqlColumn, body[props[0]], body[props[1]], !first);
            return `${accumulator} ${asStringArg(sql)}`;
        }

        if (str) {
            if (sqlColumn) {
                const sql = concatenateAsSqlOr(sqlColumn, body[prop]);
                return `${accumulator} ${asStringArg(sql)}`;
            } else {
                return `${accumulator} ${asStringArg(body[currentValue['prop']])}`;
            }
        }
    }, '');
}

/**
 * Logging a request body
 * @param body request body
 */
function loggingRequestBody(body) {
    console.log(body);
}

/**
 * Convert binary number to standard status string response
 * @param bin actually a binary 0 or 1
 */
function responseStatus(bin) {
    return bin === 1 ? 'SUCCESS' : 'ERROR';
}

/**
 * Wrap with double quote to handle string that contain whitespace
 * @param value
 * @returns {string}
 */
function asStringArg(value) {
    return `"${normalizeEscapeString(value === undefined ? undefined : String(value).trim())}"`;
}

/**
 * Used to resolve rscript path separator on different platform
 * @param command
 * @returns {*}
 */
function resolveRscriptCommand(command) {
    if (process.platform === 'win32') {
        return command;
    } else {
        return command.replace(/\\/g, '/');
    }
}

/**
 * Resolve R Script source as string that used to terminal
 * @param reportFileName
 */
function rscript(reportFileName) {
    let rscriptPath = `${__project_root}\\${RSCRIPT_PATH}\\${reportFileName}.R`;
    if (rscriptPath.includes(' ')) {
        return resolveRscriptCommand(`"${rscriptPath}"`);
    }

    return resolveRscriptCommand(rscriptPath);
}

/**
 * Normalize given string from escaped character
 * @param str
 * @returns {string}
 */
function normalizeEscapeGlobalString(str) {
    return String(str).replace(/'/g, `''`);
}

function normalizeEscapeString(str) {
    return String(str).replace(/^'/, `''`);
}

/**
 * Utilities to delay some process
 * @param ms
 * @returns {Promise<unknown>}
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * concatenate string array as sql or statement
 * @param columnTarget
 * @param list
 * @param andPrefix
 * @param escapeGlobal
 * @returns {string|*}
 */
function concatenateAsSqlOr(columnTarget, list = [], andPrefix = true, escapeGlobal = true) {
    if (list === null || list.length === 0 || list.length === 1 && list[0] === API_FOR_ALL_SELECTED) {
        return '';
    }

    return  list.reduce((accumulator, currentValue, currentIndex) => {
        if (typeof currentValue === 'number') {
            return `${accumulator} ${columnTarget} = ${normalizeEscapeString(currentValue)} ${currentIndex < list.length - 1 ? 'or' : ')'}`;
        } else {
            const value = escapeGlobal ? normalizeEscapeGlobalString(currentValue) : normalizeEscapeString(currentValue);
            return `${accumulator} trim(${columnTarget}) = trim('${value}') ${currentIndex < list.length - 1 ? 'or' : ')'}`;
        }
    }, andPrefix ? 'and (' : ' (');
}

/**
 * concatenate as sql between statement
 * @param columnTarget
 * @param start
 * @param end
 * @param andPrefix
 */
function concatenateAsSqlBetween(columnTarget, start, end, andPrefix = false) {
    if (typeof start === 'number' && typeof end === 'number') {
        return `${andPrefix ? 'and (' : ' ('} ${columnTarget} between ${start} and ${end})`;
    } else {
        return `${andPrefix ? 'and (' : ' ('} ${columnTarget} between '${start}' and '${end}')`;
    }
}

/**
 *
 * @param columnTarget
 * @param value
 * @param andPrefix
 * @param escapeGlobal
 * @returns {string}
 */
function concatenateAsSql(columnTarget, value, andPrefix = false, escapeGlobal = true) {
    if (typeof value === 'number') {
        return `${andPrefix ? 'and (' : ' ('} ${columnTarget} = ${value})`;
    } else {
        const c = escapeGlobal ? normalizeEscapeGlobalString(value) : normalizeEscapeString(value);
        return `${andPrefix ? 'and (' : ' ('} trim('${columnTarget}') = trim('${c}'))`;
    }
}


module.exports = {
    executeCommandLine,
    generateGraphicImageName,
    concatenateRscriptArguments,
    loggingRequestBody,
    responseStatus,
    resolveRscriptCommand,
    rscript,
    normalizeEscapeString,
    delay,
    concatenateAsSqlOr,
    concatenateAsSqlBetween
};
