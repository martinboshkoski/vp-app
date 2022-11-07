function agentDetailsAreValid(email, password, name) {
    return email && email.includes('@') && 
    password && 
    password.trim().lenght >= 6 &&
    name &&
    name.trim() !== ""
}

function emailIsConfirmed(email, confirmEmail) {
    return email === confirmEmail
}

module.exports = {
    emailIsConfirmed: emailIsConfirmed, 
    agentDetailsAreValid: agentDetailsAreValid
}


