const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(request.body.password, 5);
  const userQuery = `
    SELECT *
    FROM
    user
    WHERE
    username = ${username};`;

  const dbResponse = await db.get(userQuery);

  if (dbResponse === undefined) {
    const insertQuery = `
            INSERT INTO 
            user (username,name,password,gender,location)
            VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
    if (password.length > 4) {
      await db.run(insertQuery);
      response.send("User created successfully");
    } else {
      response.status = 400;
      response.send("Password is too short");
    }
  } else {
    response.status = 400;
    response.send("User already exits");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const userQuery = `
    SELECT *
    FROM
    user
    WHERE
    username = ${username};`;

  const dbResponse = await db.get(userQuery);

  if (dbResponse === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPssMatch = await bcrypt.compare(password === dbResponse.password);
    if (isPssMatch) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

        const user = await database.run(updatePasswordQuery);

        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
