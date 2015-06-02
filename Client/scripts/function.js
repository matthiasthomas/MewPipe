function isInt(value) {
    if (!value)
        return;

    return !isNaN(value) &&
        parseInt(Number(value)) === value &&
        !isNaN(parseInt(value, 10));
}

function isFloat(value) {

    if (!value)
        return;

    return !isNaN(value) &&
        value.toString().indexOf('.') !== -1 ||
        value.toString().indexOf(',') !== -1 ||
        value % 1 === 0;
}

String.prototype.startsWith = function (needle) {
    return (this.indexOf(needle) == 0);
};

function lpad(str, padString, length) {
    while (str.length < length) {
        str = padString + str;

    }
    return str;
};

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (i == 0) return bytes + ' ' + sizes[i];
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
};