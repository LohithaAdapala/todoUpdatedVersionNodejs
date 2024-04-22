const express = require('express')
const app = express()
app.use(express.json())
const sqlite3 = require('sqlite3')
const path = require('path')
const {open} = require('sqlite')
var isValid = require('date-fns/isValid')
const {format} = require('date-fns')
let db = null
const filePath = path.join(__dirname, 'todoApplication.db')

const initialize = async () => {
  db = await open({
    filename: filePath,
    driver: sqlite3.Database,
  })
  app.listen(3000, () => {
    console.log('App is running at 3000....')
  })
}

initialize()
function tofun(ans) {
  return {
    id: ans.id,
    todo: ans.todo,
    priority: ans.priority,
    status: ans.status,
    category: ans.category,
    dueDate: ans.due_date,
  }
}
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `select * from todo where id=${todoId}`
  const ans = await db.get(query)
  response.send(tofun(ans))
})

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  const formattedDate = new Date(year, month - 1, day) // month - 1 because months are zero-indexed in JavaScript dates
  return format(formattedDate, 'yyyy-MM-dd')
}

function isvalid(dueDate) {
  const date = formatDate(dueDate)
  return isValid(new Date(date))
}
app.get('/agenda/', async (request, response) => {
  const date = request.query

  const modifieddate = formatDate(date.date)
  if(isvalid(modifieddate)===false){
    response.status(400)
    response.send("Invalid Due Date")

  }else{

  
  const query = `select * from todo where due_date='${modifieddate}'`
  const ans = await db.all(query)
  response.send(ans.map(x => tofun(x)))
  }
})

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const query = `delete from todo where id=${todoId}`
  await db.run(query)
  response.send('Todo Deleted')
})

app.post('/todos/', async (request, response) => {
  const body = request.body
  const {id, todo, priority, status, category, dueDate} = body
  if (status !== 'TO DO' && status !== 'IN PROGRESS' && status !== 'DONE') {
    response.status(400)
    response.send('Invalid Todo Status')
  }
  else if (priority !== 'HIGH' && priority !== 'MEDIUM' && priority !== 'LOW') {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
  else if (category !== 'LEARNING' && category !== 'WORK' && category !== 'HOME') {
    response.status(400)
    response.send('Invalid Todo Category')
  }
  else if (isvalid(formatDate(dueDate)) === false) {
    response.status(400)
    response.send('Invalid Due Date')
  }else{
  newDate = formatDate(dueDate)
  const query = `insert into todo(id,todo,category,priority,status,due_date) values(${id},'${todo}','${category}','${priority}','${status}','${newDate}') `
  await db.run(query)

  response.send('Todo Successfully Added')
  }
})


app.put('/todos/:todoId/',async (request,response)=>{
  const {todoId} = request.params
  const{status='',priority='',todo='',category='',dueDate=''}=request.body
  if(status!==''){
    if (status !== 'TO DO' && status !== 'IN PROGRESS' && status !== 'DONE') {
    response.status(400)
    response.send('Invalid Todo Status')
    }else{
      const query = `update todo set status='${status}' where id=${todoId}`;
      await db.run(query)
      response.send("Status Updated")
    }

  }else if(priority!==''){

    if (priority !== 'HIGH' && priority !== 'MEDIUM' && priority !== 'LOW') {
    response.status(400)
    response.send('Invalid Todo Priority')
    }else{
      const query = `update todo set priority='${priority}' where id=${todoId}`;
      await db.run(query)
      response.send("Priority Updated")

    }
  }else if(todo!==''){
    const query = `update todo set todo='${todo}' where id=${todoId}`;
      await db.run(query)
      response.send("Todo Updated")

  }else if(category!==''){
    if (category !== 'LEARNING' && category !== 'WORK' && category !== 'HOME') {
    response.status(400)
    response.send('Invalid Todo Category')
        }else{
          const query = `update todo set category='${category}' where id=${todoId}`;
            await db.run(query)
            response.send("Category Updated")

        }

  }else if(dueDate!==''){
    if (isvalid(formatDate(dueDate))=== false) {
    response.status(400)
    response.send('Invalid Due Date')
  }else{
    const query = `update todo set due_date='${formatDate(dueDate)}' where id=${todoId}`;
      await db.run(query)
      response.send("Due Date Updated")

  }

  }
})


app.get('/todos/',async (request,response)=>{
    let {priority='',status='',search_q='',category=''}=request.query
    priority = decodeURIComponent(priority);
    status=decodeURIComponent(status)
    search_q=decodeURIComponent(search_q)
    category=decodeURIComponent(category)
    if(category!=='' && priority!==''){
      if(priority !== 'HIGH' && priority !== 'MEDIUM' && priority !== 'LOW'){
        response.status(400)
        response.send("Invalid Todo Priority")
      }else if(category !== 'LEARNING' && category !== 'WORK' && category !== 'HOME'){
        response.status(400)
        response.send('Invalid Todo Category')
      }else{
        const query=`select * from todo where priority='${priority}' and category='${category}'`
        const ans = await db.all(query)
        response.send(ans.map(x=>tofun(x)))
      }

    }
    else if(category!=='' && status!==''){
      if (category !== 'LEARNING' && category !== 'WORK' && category !== 'HOME') {
      response.status(400)
      response.send('Invalid Todo Category')
      }else if (status !== 'TO DO' && status !== 'IN PROGRESS' && status !== 'DONE') {
        response.status(400)
        response.send('Invalid Todo Status')
        }else{
          const query=`select * from todo where status='${status}' and category='${category}'`
          const ans = await db.all(query)
          response.send(ans.map(x=>tofun(x)))

        }
    }
    else if(category!==''){
      if (category !== 'LEARNING' && category !== 'WORK' && category !== 'HOME') {
            response.status(400)
            response.send('Invalid Todo Category')
          }else{
            const query=`select * from todo where category='${category}'`
                const ans = await db.all(query)
                response.send(ans.map(x=>tofun(x)))


          }
    }
    else if(search_q!==''){
            const query=`select * from todo where todo like '%${search_q}%'`
              const ans = await db.all(query)
              response.send(ans.map(x=>tofun(x)))

          }
    else if(priority!=='' && status!==''){
            if (priority !== 'HIGH' && priority !== 'MEDIUM' && priority !== 'LOW') {
          response.status(400)
          response.send('Invalid Todo Priority')
          }
              else if (status !== 'TO DO' && status !== 'IN PROGRESS' && status !== 'DONE') {
              response.status(400)
              response.send('Invalid Todo Status')
              }else{

                  const query=`select * from todo where status='${status}' and priority='${priority}'`    
                  const ans = await db.all(query)
                  response.send(ans.map(x=>tofun(x)))
              }

    }
    else if(priority!==''){
            if (priority !== 'HIGH' && priority !== 'MEDIUM' && priority !== 'LOW') {
          response.status(400)
          response.send('Invalid Todo Priority')
          }else{
            const query=`select * from todo where priority='${priority}'`
              const ans = await db.all(query)
              response.send(ans.map(x=>tofun(x)))

          }

    }
    
    else if(status!==''){
              if (status !== 'TO DO' && status !== 'IN PROGRESS' && status !== 'DONE') {
            response.status(400)
            response.send('Invalid Todo Status')
            }else{
              const query=`select * from todo where status='${status}'`
                const ans = await db.all(query)
                response.send(ans.map(x=>tofun(x)))

            }

    }

})

module.exports=app
