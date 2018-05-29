const express = require('express');
const menuitemRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// params middleware
menuitemRouter.param('menuItemId', (req, res, next, id) => {
  const sql = `SELECT * FROM MenuItem WHERE id = $menuItemId`
  const values = {$menuItemId: id};
  db.get(sql, values, (error, menuItem) => {
    if(error) {
      next(error);
    } else if (menuItem) {
      req.menuItem = menuItem;
      next();
    } else {
      return res.sendStatus(404);
    }
  })
})

//routes
menuitemRouter.route('/')
.get( (req, res, next) => {
  const sql = `SELECT * FROM MenuItem WHERE menu_id = $menuId`;
  const values = {$menuId: req.params.menuId};
  db.all(sql, values, (error, menuItems) => {
    if(error) {
      next(error);
    } else {
      res.status(200).json({menuItems: menuItems});
    }
  })
})
.post( (req, res, next) => {
  const name = req.body.menuItem.name,
        description = (req.body.menuItem.description) ? req.body.menuItem.description : null,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price,
        menuId = req.params.menuId;

  if(!name || !inventory || !price || !menuId) {
    return res.sendStatus(400);
  }

  const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id)
              VALUES ($name, $description, $inventory, $price, $menuId)`;

  const values = {
    $name: name,
    $description: description,
    $inventory: inventory,
    $price: price,
    $menuId: menuId
  };

  db.run(sql, values, function(error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`,
      (err, menuItem) => {
        res.status(201).json({menuItem: menuItem});
      })
    }
  })
})

menuitemRouter.route('/:menuItemId')
.put( (req, res, next) => {
  const name = req.body.menuItem.name,
        description = (req.body.menuItem.description) ? req.body.menuItem.description : null,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price,
        menuId = req.params.menuId,
        menuItemId = req.params.menuItemId;

  if(!name || !inventory || !price || !menuId) {
    return res.sendStatus(400);
  }

  const sql = `UPDATE MenuItem SET
              name = $name,
              description = COALESCE($description,description),
              inventory = $inventory,
              price = $price,
              menu_id = $menuId
              WHERE MenuItem.id = $menuItemId`;

  const values = {
    $name: name,
    $description: description,
    $inventory: inventory,
    $price: price,
    $menuId: menuId,
    $menuItemId: menuItemId
  };

  db.run(sql, values, (error) => {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${menuItemId}`,
      (error, menuItem) => {
        res.status(200).json({menuItem: menuItem});
      })
    }
  })
})
.delete( (req, res, next) => {
  const sql = `DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId`
  const values = {$menuItemId: req.params.menuItemId};

  db.run(sql, values, (error) => {
    if(error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  })
})

module.exports = menuitemRouter;
