const express = require('express');
const employeeRouter = express.Router();

const timesheetRouter = require('./timesheet.js');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// param middleware
employeeRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = `SELECT * FROM Employee WHERE id = $employeeId`;
  const values = {$employeeId: employeeId};
  db.get(sql, values, (error, employee) => {
    if(error) {
      next(error);
    } else if(employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  })
})

employeeRouter.route('/')
.get( (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (err, employees) => {
    if(err) {
      next(err);
    } else {
      res.status(200).json({employees: employees});
    }
  })
})
.post( (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentlyEmployed = req.body.employee.is_current_employee === 0 ? 0 : 1;

  if(!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = `INSERT INTO Employee (name, position, wage, is_current_employee)
              VALUES ($name, $position, $wage, $isCurrentlyEmployed)`;
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentlyEmployed: isCurrentlyEmployed
  };
  db.run(sql, values, function(error){
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
         (err, employee) => {
           if(err) {
             next(error);
           } else {
             res.status(201).json({employee: employee});
           }
         })
       }
     })
   })

employeeRouter.route('/:employeeId')
.get( (req, res, next) => {
  res.status(200).json({employee: req.employee});
})
.put( (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentlyEmployed = req.body.employee.is_current_employee === 0 ? 0 : 1,
        employeeId = req.employee.id;

  if(!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = `UPDATE Employee SET name = $name, position = $position,
              wage = $wage, is_current_employee = $isCurrentlyEmployed
              WHERE Employee.id = $employeeId`;

  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentlyEmployed: isCurrentlyEmployed,
    $employeeId: employeeId
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${req.employee.id}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
})
.delete( (req, res, next) => {
  const sql = `UPDATE Employee SET is_current_employee = 0 WHERE id = $employeeId`;
  const values = {$employeeId: req.employee.id};

  db.run(sql, values, (error) => {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${req.employee.id}`,
      (error, employee) => {
        res.status(200).json({employee: employee});
      })
    }
  })
})

employeeRouter.use('/:employeeId/timesheets', timesheetRouter);

module.exports = employeeRouter;
