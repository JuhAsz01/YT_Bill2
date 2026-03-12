const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const session = require("express-session");
const cron = require("node-cron");

const app = express();
const db = new sqlite3.Database("database.db");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "titok",
  resave: false,
  saveUninitialized: true
}));

db.serialize(() => {

  db.run(`CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    role TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS debts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    amount INTEGER
  )`);

  // ADMIN FELHASZNÁLÓ
  db.run(`
    INSERT OR IGNORE INTO users (id, username, password, role)
    VALUES (1, 'admin', 'admin', 'admin')
  `);

  db.run(`
    INSERT OR IGNORE INTO users (id, username, password, role)
    VALUES (2, 'user', 'user', 'user')
  `);

  // 4 SZEMÉLY
  db.run(`
    INSERT OR IGNORE INTO debts (id, name, amount)
    VALUES (1, 'Somi', 800)
  `);

  db.run(`
    INSERT OR IGNORE INTO debts (id, name, amount)
    VALUES (2, 'Nejbi', 800)
  `);

  db.run(`
    INSERT OR IGNORE INTO debts (id, name, amount)
    VALUES (3, 'Dave', 800)
  `);

});

app.post("/login",(req,res)=>{

  const {username,password}=req.body;

  db.get(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username,password],
    (err,user)=>{

      if(!user){
        return res.send("Hibás login");
      }

      req.session.user=user;

      if(user.role==="admin"){
        res.redirect("/admin.html");
      }else{
        res.redirect("/index.html");
      }

    }
  )

});

app.get("/debts",(req,res)=>{

  db.all("SELECT * FROM debts",(err,rows)=>{
    res.json(rows);
  })

});

app.post("/pay",(req,res)=>{

  const {id,amount}=req.body;

  db.run(
    "UPDATE debts SET amount = amount - ? WHERE id=?",
    [amount,id],
    ()=>res.redirect("/admin.html")
  )

});

const PORT = process.env.PORT || 3000;

cron.schedule("1 * * * *", () => {

console.log("Havi tartozás növelés");

db.run(`
UPDATE debts
SET amount = amount + 800
`);

});

app.listen(PORT,()=>{
  console.log("Server fut");
});