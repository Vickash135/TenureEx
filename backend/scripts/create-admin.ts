require("dotenv").config();

const argon2 = require("argon2");
const { randomUUID } = require("crypto");
const { Pool } = require("pg");

const databaseUrl =
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing from backend/.env",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function main() {
  const email =
    "admin@tenureex.co.uk";

  const password =
    "Admin12345!";

  const existing =
    await pool.query(
      `
      SELECT
        "id",
        "email",
        "userType",
        "status"
      FROM "User"
      WHERE LOWER("email") = LOWER($1)
      LIMIT 1
      `,
      [email],
    );

  if (existing.rows.length > 0) {
    const user =
      existing.rows[0];

    console.log(
      "Admin account already exists.",
    );

    console.log(
      "ID:",
      user.id,
    );

    console.log(
      "Email:",
      user.email,
    );

    console.log(
      "User type:",
      user.userType,
    );

    console.log(
      "Status:",
      user.status,
    );

    return;
  }

  const passwordHash =
    await argon2.hash(
      password,
    );

  const id =
    randomUUID();

  const now =
    new Date();

  await pool.query(
    `
    INSERT INTO "User" (
      "id",
      "firstName",
      "lastName",
      "email",
      "phone",
      "passwordHash",
      "userType",
      "status",
      "emailVerified",
      "phoneVerified",
      "mustSetPassword",
      "mustChangePassword",
      "activatedAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      NULL,
      $5,
      'TENUREEX_ADMIN',
      'ACTIVE',
      TRUE,
      TRUE,
      FALSE,
      FALSE,
      $6,
      $6,
      $6
    )
    `,
    [
      id,
      "TenureEx",
      "Administrator",
      email,
      passwordHash,
      now,
    ],
  );

  console.log(
    "Admin account created successfully.",
  );

  console.log(
    "Admin ID:",
    id,
  );

  console.log(
    "Admin email:",
    email,
  );

  console.log(
    "Development password:",
    password,
  );
}

main()
  .catch((error) => {
    console.error(
      "Unable to create admin:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });