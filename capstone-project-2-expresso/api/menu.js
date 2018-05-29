const express = require('express');
const menuRouter = express.Router();

const menuitemRouter = require('./menuitem.js');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//param middleware

menuRouter.param('menuId', (req, res, next, menuId) => {
  const sql = `SELECT * FROM Menu WHERE Menu.id = $menuId`;
  const value = {$menuId: menuId};

  db.get(sql, value, (error, menu) => {
    if(error) {
      next(error);
    } else if(menu) {
      req.menu = menu;
      next();
    } else {
      return res.sendStatus(404);
    }
  })
})

// routes
menuRouter.route('/')
.get( (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (error, menus) => {
    if(error) {
      next(error);
    } else {
      res.status(200).json({menus: menus});
    }
  })
})
.post( (req, res, next) => {
  const title = req.body.menu.title;
  if(!title) {
    return res.sendStatus(400);
  }

  const sql = `INSERT INTO Menu (title)
              VALUES ($title)`;
  const values = { $title: title };

  db.run(sql, values, function(error){
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
         (err, menu) => {
           if(err) {
             next(error);
           } else {
             res.status(201).json({menu: menu});
           }
         })
       }
     })
})

menuRouter.route('/:menuId')
.get( (req, res, next) => {
  res.status(200).json({menu: req.menu});
})
.put( (req, res, next) => {
  const title = req.body.menu.title,
        menuId = req.menu.id;

  if(!title) {
    return res.sendStatus(400);
  }

  const sql = `UPDATE Menu SET title = $title
              WHERE Menu.id = $menuId`;

  const values = {
     $title: title,
     $menuId: menuId
    };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.menu.id}`,
        (error, menu) => {
          res.status(200).json({menu: menu});
        });
    }
  });
})
.delete( (req, res, next) => {
  db.get(`SELECT * FROM MenuItem WHERE menu_id = ${req.menu.id} LIMIT 1`,
  (error, menuItem) => {
    if(error) {
      next(error);
    } else if(menuItem) {
      res.sendStatus(400);
    } else {
      const sql = `DELETE FROM Menu WHERE id = $menuId`;
      const values = {$menuId: req.menu.id};

      db.run(sql, values, (error) => {
        if(error) {
          next(error);
        } else {
          res.sendStatus(204);
        }
      })
    }
  })
})

menuRouter.use('/:menuId/menu-items', menuitemRouter);

module.exports = menuRouter;
