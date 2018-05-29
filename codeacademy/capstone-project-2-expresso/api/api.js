const express = require('express');
const apiRouter = express.Router();
const employeeRouter = require('./employee.js');
const menuRouter = require('./menu.js');

apiRouter.use('/employees', employeeRouter);
apiRouter.use('/menus', menuRouter);

module.exports = apiRouter;
