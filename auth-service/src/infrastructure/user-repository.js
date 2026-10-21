const pool = require("./database");

async function createUser({
  username,
  passwordHash,
  email,
  phone
}) {
  const result = await pool.query(
    `INSERT INTO users (
       username, password_hash, email, phone, roleid
     )
     VALUES (
       $1, $2, $3, $4,
       (SELECT roleid FROM roles WHERE rolename = 'CUSTOMER')
     )
     RETURNING uid, username, email`,
    [username, passwordHash, email, phone]
  );

  return result.rows[0];
}

async function findByUsername(username) {
  const result = await pool.query(
    `SELECT
       u.uid,
       u.username,
       u.password_hash,
       r.rolename AS role
     FROM users u
     JOIN roles r ON r.roleid = u.roleid
     WHERE u.username = $1`,
    [username]
  );

  return result.rows[0] || null;
}

module.exports = {
  createUser,
  findByUsername
};