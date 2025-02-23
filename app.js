const express = require('express')
const {open} = require('sqlite')
const sqlit3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())

let db = null

const initailizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlit3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log('DB Error : ${e,.message}')
    process.exit(1)
  }
}

initailizeDBAndServer()

//API 1
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  data = await db.all(getTodosQuery)
  response.send(data)
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getATodoQuery = `
  SELECT * 
  FROM todo
  WHERE 
  id=${todoId}
  `
  const getATodoResponse = await db.get(getATodoQuery)
  response.send(getATodoResponse)
})

//API 3
app.post('/todos/', async (request, response) => {
  const todoDetalis = request.body
  const {id, todo, priority, status} = todoDetalis
  const addTodoQuery = `
  INSERT INTO todo(id,todo,priority,status)
  VALUES (
    '${id}',
    '${todo}',
    '${priority}',
    '${status}'
    )
  `
  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

//API 4

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body

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
  }
  const previousTodoQuery = `
  SELECT
   *
  FROM 
  todo
  WHERE
  id=${todoId}
  `
  const previousTodo = await db.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateTodoQuery = `
  UPDATE 
  todo
  SET
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}'
  WHERE
  id=${todoId}
  `
  await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

//API 5
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE
    FROM 
  todo
    WHERE 
    id=${todoId}
  `
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
