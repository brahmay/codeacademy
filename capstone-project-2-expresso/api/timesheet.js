const express = require('express');
const timesheetRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// params middleware
timesheetRouter.param('timesheetId', (req, res, next, id) => {
  const sql = `SELECT * FROM Timesheet WHERE id = $timesheetId`
  const values = {$timesheetId: id};
  db.get(sql, values, (error, timesheet) => {
    if(error) {
      next(error);
    } else if (timesheet) {
      req.timesheet = timesheet;
      next();
    } else {
      return res.sendStatus(404);
    }
  })
})

//routes
timesheetRouter.route('/')
.get( (req, res, next) => {
  const sql = `SELECT * FROM Timesheet WHERE employee_id = $employeeId`;
  const values = {$employeeId: req.params.employeeId};
  db.all(sql, values, (error, timesheets) => {
    if(error) {
      next(error);
    } else {
      res.status(200).json({timesheets: timesheets});
    }
  })
})
.post( (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.params.employeeId;

  if(!hours || !rate || !date || !employeeId) {
    return res.sendStatus(400);
  }

  const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id)
              VALUES ($hours, $rate, $date, $employeeId)`;

  const values = {
    $hours: hours,
    $rate: rate,
    $date: date,
    $employeeId: employeeId
  };

  db.run(sql, values, function (error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`,
      (err, timesheet) => {
        res.status(201).json({timesheet: timesheet});
      })
    }
  })
})

timesheetRouter.route('/:timesheetId')
.put( (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.params.employeeId,
        timesheetId = req.params.timesheetId;

  if(!hours || !rate || !date || !employeeId) {
    return res.sendStatus(400);
  }

  const sql = `UPDATE Timesheet SET
              hours = $hours,
              rate = $rate,
              date = $date,
              employee_id = $employeeId
              WHERE Timesheet.id = $timesheetId`;

  const values = {
    $hours: hours,
    $rate: rate,
    $date: date,
    $employeeId: employeeId,
    $timesheetId: timesheetId
  };

  db.run(sql, values, (error) => {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${timesheetId}`,
      (error, timesheet) => {
        res.status(200).json({timesheet: timesheet});
      })
    }
  })
})
.delete( (req, res, next) => {
  const sql = `DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId`
  const values = {$timesheetId: req.params.timesheetId};

  db.run(sql, values, (error) => {
    if(error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  })
})

module.exports = timesheetRouter;
