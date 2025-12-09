const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const ping = require("ping");
const app = express();
const PORT = 3000;

// Configuração do banco de dados MySQL
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "WebNet_Monitor",
};

// Cria uma pool de conexões
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(cors());
app.use(express.json());
app.post("/api/dispositivos", async (req, res) => {
  const { ip_address, nome, tipo_dispositivo } = req.body;

  // Validação básica
  if (!ip_address || !nome || !tipo_dispositivo) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios." });
  }

  // Insere o novo dispositivo no banco de dados
  try {
    const query =
      "INSERT INTO Dispositivo (ip_address, nome, tipo_dispositivo, data_cadastro) VALUES (?, ?, ?, NOW())";
    const [result] = await pool.execute(query, [
      ip_address,
      nome,
      tipo_dispositivo,
    ]);

    // Retorna sucesso
    res.status(201).json({
      id: result.insertId,
      message: "Dispositivo cadastrado com sucesso.",
    });

    // Trata erros de duplicidade de IP
  } catch (error) {
    console.error("Erro ao cadastrar dispositivo:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "IP já cadastrado." });
    }
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota para listar todos os dispositivos com seu status mais recente
app.get("/api/dispositivos", async (req, res) => {
  try {
    const query = `
            SELECT 
                d.*, 
                lc.resultado AS status_recente, 
                lc.data_teste AS data_recente
            FROM Dispositivo d
            LEFT JOIN Log_Conectividade lc ON lc.id = (
                SELECT id 
                FROM Log_Conectividade 
                WHERE dispositivo_id = d.id 
                ORDER BY data_teste DESC 
                LIMIT 1
            )
        `;
    const [dispositivos] = await pool.execute(query);

    // Retorna a lista de dispositivos
    res.json(dispositivos);
  } catch (error) {
    console.error("Erro ao listar dispositivos:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota para remover um dispositivo e seus logs relacionados
app.delete("/api/dispositivos/:id", async (req, res) => {
  const dispositivoId = req.params.id;

  // Remove os logs relacionados primeiro
  try {
    const [result] = await pool.execute(
      "DELETE FROM Dispositivo WHERE id = ?",
      [dispositivoId]
    );

    // Verifica se algum dispositivo foi removido
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Dispositivo não encontrado." });
    }

    // Retorna sucesso
    res.status(200).json({
      message: "Dispositivo e logs relacionados removidos com sucesso.",
    });

    // Trata erros
  } catch (error) {
    console.error("Erro ao remover dispositivo:", error);
    res
      .status(500)
      .json({ message: "Erro interno ao tentar remover o dispositivo." });
  }
});

// Função para executar o ping e salvar o log
async function executarPingESalvarLog(dispositivo) {
  const { id, ip_address } = dispositivo;
  const resultadoPing = await ping.promise.probe(ip_address);

  // Prepara os dados do log
  const isOnline = resultadoPing.alive;
  const status = isOnline ? "Online" : "Offline";
  const mensagem = isOnline
    ? `Ping OK, tempo=${resultadoPing.time}ms`
    : `Host inacessível.`;

  // Salva o log no banco de dados
  try {
    const query =
      "INSERT INTO Log_Conectividade (dispositivo_id, data_teste, resultado, mensagem) VALUES (?, NOW(), ?, ?)";
    await pool.execute(query, [id, status, mensagem]);
    console.log(`Ping para ${ip_address} concluído: ${status}`);

    // Trata erros ao salvar o log
  } catch (error) {
    console.error(`Erro ao salvar log para ${ip_address}:`, error);
  }
}

// Rota para executar o ping em todos os dispositivos
app.get("/api/ping/todos", async (req, res) => {
  try {
    const [dispositivos] = await pool.execute(
      "SELECT id, ip_address FROM Dispositivo"
    );

    // Executa o ping para todos os dispositivos em paralelo
    const promises = dispositivos.map(executarPingESalvarLog);
    await Promise.all(promises);

    // Retorna sucesso
    res.json({
      message: "Testes de conectividade executados para todos os dispositivos.",
    });

    // Trata erros
  } catch (error) {
    console.error("Erro ao executar Pings:", error);
    res
      .status(500)
      .json({ message: "Erro ao executar testes de conectividade." });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
