const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
const dateValid = require('date-fns/isValid')
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
const PriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const Status = requestQuery => {
  return requestQuery.status !== undefined
}
const Priority = requestQuery => {
  return requestQuery.priority !== undefined
}
const CategoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const Category = requestQuery => {
  return requestQuery.category !== undefined
}
const CategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}
const checkQueries = (request, response, next) => {
  const {search_q = '', status, priority, category} = request.query
  if (status === undefined) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (priority === undefined) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (category === undefined) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (due_date !== undefined) {
    const myDate = new Date()
    const formattedDate = format(myDate, 'yyyy-MM-dd')
    if (!dateValid(formattedDate)) {
      response.status(400)
      response.send('Invalid Due Date')
    }
  } else {
    next()
  }
}
app.get('/todos/', checkQueries, async (request, response) => {
  let data = null
  let getQuery = ''
  const {search_q = '', status, priority, category} = request.query
  switch (true) {
    case PriorityAndStatus(request.query):
      getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%' and status='${status}' and priority='${priority}';`
      break
    case Priority(request.query):
      getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%' and priority='${priority}';`
      break
    case Status(request.query):
      getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%' and status='${status}';`
      break
    case CategoryAndStatus(request.query):
      getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%' and category='${category}' and status='${status}';`
      break
    case Category(request.query):
      getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%' and category='${category}';`
      break
    case CategoryAndPriority(request.query):
      getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%' and category='${category}' and priority='${priority}';`
      break
    default:
      getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where todo like '%${search_q}%';`
  }
  data = await db.all(getQuery)
  response.send(data)
})
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where id=${todoId};`
  const todo = await db.get(getQuery)
  response.send(todo)
})
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  const formattedDate = format(date, 'yyyy-MM-dd')
  const getQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where due_date='${formattedDate}';`
  const todos = await db.all(getQuery)
  response.send(todos)
})
app.post('/todos/', async (request, response) => {
  const requestBody = request.body
  const {id, todo, priority, status, category, dueDate} = requestBody
  const getQuery = `insert into todo (id,todo,priority,status,category,due_date) values (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`
  await db.run(getQuery)
  response.send('Todo Successfully Added')
})
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody=request.body;
  let updateColumn='';
  switch (true){
    case requestBody.status!==undefined:updateColumn="Status";
    break;
    case requestBody.priority!==undefined:updateColumn="Priority";
    break;
    case requestBody.todo!==undefined:updateColumn="Todo";
    break;
    case requestBody.category!==undefined:updateColumn="Category";
    break;
    case requestBody.dueDate!==undefined:updateColumn="Due Date";
  }
  const getQuery=`select id,todo,priority,status,category,due_date as dueDate from todo where id=${todoId};`;
  const previousTodo=await db.get(getQuery);
  const {
      id=previousTodo.id,
     todo=previousTodo.todo,
     priority=previousTodo.priority,
    status=previousTodo.status,
    category=previousTodo.category,
    dueDate=previousTodo.dueDate
  }=requestBody;
  const updateQuery=`update todo set id=${id},todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}';`;
  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
})
app.delete("/todos/:todoId/",async (request,response)=>{
  const {todoId}=request.params;
  const getQuery=`delete from todo where id=${todoId};`;
  await db.run(getQuery);
  response.send("Todo Deleted");
})
module.exports=app;