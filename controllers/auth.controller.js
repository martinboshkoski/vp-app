const Agent = require("../models/agent.model");
const authUtil = require('../util/authentication')
// const validation = require('../util/validation');
const sessionFlash = require('../util/session-flash')

function getSignup(req, res) {
    let sessionData = sessionFlash.getSessionData(req);

    if (!sessionData) {
        sessionData = {
            email: '',
            password: '',
            confirmEmail: '',
            fullname: ''
        };
    }

  res.render("agents/auth/signup", {inputData: sessionData});
}

async function signup(req, res, next) {
    const enteredData = {
       email: req.body.email, 
       confirmEmail: req.body['confirm-email'],
       password:  req.body.password,
       fullname: req.body.fullname
    };

// if (
//     !validation.agentDetailsAreValid
//     (
//     req.body.email, 
//     req.body.password,
//     req.body.name
// ) || !validation.emailIsConfirmed(req.body.email, req.body['confirm-email'])
// ) {
//     sessionFlash.flashDataToSession(
//         req, 
//         {
//         errorMessage: 
//         'Please check your input. Password must be at least 6 characters long.',
//         ...enteredData,
//     }, 
//     function(){
//         console.log('I am here 1')
//         res.redirect('/signup')
//     }
// );
//     return;
// }

const agent = new Agent(
    req.body.email, 
    req.body.password, 
    req.body.fullname
);

    try{
        const existsAlready = await agent.existsAlready()

    if (existsAlready) {
        sessionFlash.flashDataToSession(
            req, 
            {
            errorMessage: 'Agent exists already',
            ...enteredData,
        }, function(){
            res.redirect('/signup')
        })
    return;
}    
        await agent.signup()
    }   catch(error) {
        next(error)
        return
    }
    res.redirect('/login');
}

function getLogin(req, res) {
    let sessionData = sessionFlash.getSessionData(req);

    if (!sessionData) {
        sessionData = {
            email: '',
            password: ''
        }
    }
    res.render('agents/auth/login', {inputData: sessionData})
}

async function login(req, res, next) {
    const agent = new Agent(req.body.email, req.body.password)
    let existingAgent;
    try {
        existingAgent = await agent.getAgentWithSameEmail();
    } catch (error) {
        next(error)
        return
    }

    const sessionErrorData = {
            errorMessage: 'Invalid credientals', 
            email: agent.email,
            password: agent.password
    }

    if (!existingAgent) {
        sessionFlash.flashDataToSession(req, sessionErrorData, function(){
            res.redirect('/login')
        })
        return
    }

    const passwordIsCorrect = await agent.hasMatchingPassword(existingAgent.password);
    if (!passwordIsCorrect) {
        sessionFlash.flashDataToSession(req, sessionErrorData, function(){
            res.redirect('/login')
        })
        return
    }
    authUtil.createAgentSession(req, existingAgent, function(){
        res.redirect('/')
    })
}

function logout(req, res) {
    authUtil.destroyAgentAuthSession(req)
    res.redirect('/login')
}

module.exports = {
  getSignup: getSignup,
  getLogin: getLogin,
  signup: signup,
  login:login,
  logout:logout
};
