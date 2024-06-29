const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
const isValid = require('date-fns/isValid')
const toDate = require("date-fns/toDate");
var format = require('date-fns/format')
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
app.use(express.json())
let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at 3000')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()
const checkRequestsQueries = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date)

      const formatedDate = format(new Date(date), 'yyyy-MM-dd')
      console.log(formatedDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      console.log(result, 'r')
      console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'V')
      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.todoId = todoId
  request.search_q = search_q

  next()
}

const checkRequestsBody = (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params

  if (category !== undefined) {
    categoryArray = ['WORK', 'HOME', 'LEARNING']
    categoryIsInArray = categoryArray.includes(category)

    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      const formatedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatedDate)
      const result = toDate(new Date(formatedDate))
      const isValidDate = isValid(result)
      console.log(isValidDate)
      console.log(isValidDate)
      if (isValidDate === true) {
        request.dueDate = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todo = todo
  request.id = id

  request.todoId = todoId

  next()
}

app.get('/todos/', checkRequestsQueries, async (request, response) => {
  const {search_q="",status="",priority="",category=""}=request.query;
  const getQuery=`select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%' and priority like '%${priority}%' and status like '%${status}%' and category like '%${category}%';`;
  data = await db.all(getQuery)
  response.send(data)
})
app.get('/todos/:todoId/', checkRequestsQueries, async (request, response) => {
  const {todoId} = request.params
  const getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where id=${todoId};`
  const todo = await db.get(getQuery)
  response.send(todo)
})
app.get('/agenda/', checkRequestsQueries, async (request, response) => {
  const {date} = request.query
  const formatedDate=format(new Date(date),"yyyy-MM-dd")
  const result=toDate(new Date(formatedDate));
  const getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where due_date='${date}';`;
  const todos = await db.all(getQuery)
  if (isValid(result)===true){
      response.send(todos);    
  }
  else{
    response.status(400);
    response.send("Invalid Due Date");
  }
})
app.post('/todos/', checkRequestsBody, async (request, response) => {
  const requestBody = request.body
  const {id,todo,category,priority, status, dueDate} = requestBody
  const getQuery = `insert into todo (id,todo,category,priority,status,due_date) values (${id},'${todo}','${category}','${priority}','${status}','${dueDate}');`;
  await db.run(getQuery)
  response.send('Todo Successfully Added')
})
app.put('/todos/:todoId/', checkRequestsBody, async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateColumn = ''
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
    case requestBody.category !== undefined:
      updateColumn = 'Category'
      break
    case requestBody.dueDate !== undefined:
      updateColumn = 'Due Date'
  }
  const getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where id=${todoId};`
  const previousTodo = await db.get(getQuery)
  const {
    id = previousTodo.id,
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = requestBody
  const updateQuery = `update todo set id=${id},todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}' where id=${todoId};`;
  await db.run(updateQuery)
  response.send(`${updateColumn} Updated`)
})
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getQuery = `delete from todo where id=${todoId};`
  await db.run(getQuery)
  response.send('Todo Deleted')
})
module.exports = app
