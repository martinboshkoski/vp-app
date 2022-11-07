function protectRoutes(req, res, next) {
    // if(!res.locals.isAuth) {
    //     return res.redirect('/401')
    // }

    if (req.path.startsWith('/all-clients') && !res.locals.isAuth) { 
        return res.redirect('/403')
    }
    if (req.path.startsWith('/debt-clients') && !res.locals.isAuth) { 
        return res.redirect('/403')
    }
    if (req.path.startsWith('/admin') && !res.locals.isAdmin) {
        return res.redirect('/403')
    }
    next()
}

module.exports = protectRoutes;