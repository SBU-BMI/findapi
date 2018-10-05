var jwt = require('jsonwebtoken');
var secret = process.env.JWT_SECRET || "UvhwwajYs5N9IPdi1LmjLtaFe6PLjp7uaL5KMCrGojudjhhm6Qd0SguaaYTJyuC"; // super secret

// TEMPORARY fail page
function authFail(res) {
    res.writeHead(401, {'content-type': 'text/html'});
    return res.end("Temporary 'unauthorized' page... send back to login."); // send to login
}

// create JWT
function generateToken() {
    // PTF: Fake user, self-signed token.
    var user = {id: 3};
    var token = jwt.sign({user: user.id}, secret);
    console.log('gen token', token);
    return token;
}

const getToken = function(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') { // Authorization: Bearer g1jipjgi1ifjioj
        // Handle token presented as a Bearer token in the Authorization header
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        // Handle token presented as URI param
        return req.query.token;
    } else if (req.cookies && req.cookies.token) {
        // Handle token presented as a cookie parameter
        return req.cookies.token;
    }
    else if (req.headers.cookie) {
        // Handle token set as 'Set-Cookie': 'token=' + token
        var token = '';
        if (cookie.indexOf(';') > -1) {
            var cookieArray = cookie.split(';');
            for (var i = 0; i < cookieArray.length; i++) {
                if (cookieArray[i].indexOf('access_token=') > -1) {
                    token = cookieArray[i].substring('access_token='.length + 1);
                    console.log('token', token);
                }
            }
        }
        else {
            token = cookie;
        }
        return token;
    }
};

function verify(token) {
    var decoded = false;
    try {
        decoded = jwt.verify(token, secret);
    } catch (e) {
        decoded = false; // still false
    }
    return decoded;
}

function validate(req) {
    var token = getToken(req);
    console.log('token', token);

    var decoded = verify(token);
    if (!decoded) {
        return false;
    } else {
        return true;
    }
}

module.exports = {
    authFail,
    generateToken,
    authFail,
    validate
};
