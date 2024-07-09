function createAgentSession(req, agent, action) {
    req.session.uid = agent._id.toString();
    req.session.isAdmin = agent.isAdmin;
    req.session.isEditor = agent.isEditor;
    req.session.save(action)
}

function destroyAgentAuthSession(req) {
    req.session.uid = null;
}

module.exports = {
    createAgentSession: createAgentSession,
    destroyAgentAuthSession: destroyAgentAuthSession
}