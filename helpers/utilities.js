const performanceNow = require("performance-now");
const util = require("util");
const {exec} = require("child_process");
const execPromise = util.promisify(exec);
const {RSCRIPT_PATH} = require("./constants");

/**
 * Execute string command to terminal command or command prompt
 * @param command
 * @param args
 * @returns {Promise<{stdout: undefined, stderr}|{stdout: (*|string), stderr: (*|undefined)}>}
 */
function executeCommandLine(command, args = undefined) {
    console.log(command);
    return execPromise(command)
        .then(() => {
            return {
                stdout: `Eksekusi ${args || ''} Berhasil.`,
                stderr: undefined
            }
        })
        .catch((e) => {
            return {
                stdout: undefined,
                stderr: e
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
    return params.reduce((accumulator, currentValue, currentIndex, arr) => {
        if (typeof currentValue === 'string') {
            return `${accumulator} ${body[currentValue]}`;
        } else if ((typeof currentValue === 'object')) {
            const arr = currentValue['arr'];
            if (arr) {
                const loop = body[currentValue['prop']];
                const adder = loop.reduce((str, current) => (typeof current === 'string' ? `${str} ${asStringArg(current)}` : `${str} ${current}`), '');
                return `${accumulator}${adder}`;
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
    return `"${value}"`;
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
        return resolveRscriptCommand(asStringArg(rscriptPath));
    }

    return resolveRscriptCommand(rscriptPath);
}



module.exports = {
    executeCommandLine,
    generateGraphicImageName,
    concatenateRscriptArguments,
    loggingRequestBody,
    responseStatus,
    resolveRscriptCommand,
    rscript
};
