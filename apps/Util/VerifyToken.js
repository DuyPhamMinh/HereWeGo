var jsonwebtoken = require('jsonwebtoken');
const config = require(global.__basedir + '/config/config');

function verifyToken(req, res, next) {
    if(req.headers['authorization'] == null){
        return res.status(401).send({ auth: false, message: 'No token provided.' });
    }

    var temp = req.headers['authorization'].split(" ");
    if(temp.length < 2){
        return res.status(401).send({ auth: false, message: 'No token provided.' });
    }

    token = temp[1];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    try{
        const decoded = jsonwebtoken.verify(token, config.jwt.secret);

        let details = (req.userData = {
            user: decoded.user,
            roles: decoded.roles,
            claims: decoded.claims,
            userId: decoded.userId
        });
        next();
    }
    catch(err){
        return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    }
}

module.exports = verifyToken;
