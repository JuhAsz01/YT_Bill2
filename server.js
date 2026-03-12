const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const session = require("express-session");
const cron = require("node-cron");

const app = express();
const db = new sqlite3.Database("database.db");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/data.html", requireLogin, (req,res)=>{
res.sendFile(__dirname + "/public/data.html");
});
app.get("/admin.html", requireAdmin, (req,res)=>{
res.sendFile(__dirname + "/public/admin.html");
});

app.use(session({
  secret: "titok",
  resave: false,
  saveUninitialized: true
}));

function requireLogin(req,res,next){

if(!req.session.user){
return res.redirect("/login.html");
}

next();

}

function requireAdmin(req,res,next){

if(!req.session.user){
return res.redirect("/login.html");
}

if(req.session.user.role !== "admin"){
return res.redirect("/index.html");
}

next();

}

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
    VALUES (1, 'admin', 'retek7253', 'admin')
  `);

  db.run(`
    INSERT OR IGNORE INTO users (id, username, password, role)
    VALUES (2, 'user', 'hüllő', 'user')
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

  const {password}=req.body;

  db.get(
    "SELECT * FROM users WHERE password=?",
    [password],
    (err,user)=>{

      if(!user){
        return res.send("Hibás login");
      }

      req.session.user=user;

      if(user.role==="admin"){
        res.redirect("/admin.html");
      }else{
        res.redirect("/data.html");
      }

    }
  )

});

app.get("/debts", requireLogin, (req,res)=>{

db.all("SELECT * FROM debts",(err,rows)=>{
res.json(rows);
});

});

app.post("/pay", requireAdmin,(req,res)=>{

const {id,amount}=req.body;

db.run(
"UPDATE debts SET amount = amount - ? WHERE id=?",
[amount,id],
()=>res.send("ok")
);

});

const PORT = process.env.PORT || 3000;

cron.schedule("0 0 1 * *", () => {

console.log("Havi tartozás növelés");

db.run(`
UPDATE debts
SET amount = amount - 800
`);

});

app.listen(PORT,()=>{
  console.log("Server fut");
});

app.get("/logout",(req,res)=>{

req.session.destroy(()=>{
res.redirect("/index.html");
});

});