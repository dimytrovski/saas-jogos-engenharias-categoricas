const http = require("http");
const pool = require("./db");

const PORT = 3000;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("JSON inválido"));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: "ok" }));
  }

  if (req.method === "GET" && req.url === "/users") {
    try {
      const [rows] = await pool.execute(
        "SELECT id, email, plan_status, created_at FROM users ORDER BY id DESC"
      );
      res.writeHead(200);
      return res.end(JSON.stringify({ users: rows }));
    } catch (err) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  if (req.method === "POST" && req.url === "/users") {
    try {
      const { email, password_hash } = await readJsonBody(req);
      if (!email || !password_hash) {
        res.writeHead(400);
        return res.end(
          JSON.stringify({ error: "Os campos email e password_hash são obrigatórios." })
        );
      }

      const [result] = await pool.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        [email, password_hash]
      );

      res.writeHead(201);
      return res.end(
        JSON.stringify({
          id: result.insertId,
          email,
          plan_status: "free",
        })
      );
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        res.writeHead(409);
        return res.end(JSON.stringify({ error: "Esse e-mail já está registado." }));
      }
      res.writeHead(500);
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Rota não encontrada." }));
});

server.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
