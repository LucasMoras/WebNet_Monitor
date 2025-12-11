const express = require("express"); // 1. Importa o framework Express para criar a aplicação web.
const cors = require("cors"); // 2. Importa o middleware CORS (Cross-Origin Resource Sharing) para permitir requisições de diferentes origens.
const mysql = require("mysql2/promise"); // 3. Importa o driver MySQL, com suporte a Promises para uso com async/await.
const ping = require("ping"); // 4. Importa o módulo 'ping' para realizar testes de conectividade (ICMP).
const app = express(); // 5. Cria a instância principal da aplicação Express.
const PORT = 3000; // 6. Define a porta em que o servidor irá escutar.

// Configuração do banco de dados MySQL
const dbConfig = {
  // 7. Objeto com as configurações de conexão ao banco de dados.
  host: "localhost", // 8. Endereço do servidor MySQL.
  user: "root", // 9. Nome de usuário do MySQL.
  password: "", // 10. Senha do usuário (vazia neste caso).
  database: "WebNet_Monitor", // 11. Nome do banco de dados a ser utilizado.
};

// Cria uma pool de conexões
const pool = mysql.createPool(dbConfig); // 12. Cria um pool de conexões para gerenciar e reutilizar conexões eficientemente.

// Middleware
app.use(cors()); // 13. Aplica o middleware CORS a todas as rotas.
app.use(express.json()); // 14. Aplica o middleware para que a aplicação possa parsear corpos de requisições JSON.

// Rota POST para cadastrar um novo dispositivo
app.post("/api/dispositivos", async (req, res) => {
  // 15. Define a rota POST para adicionar novos dispositivos. É assíncrona.
  const { ip_address, nome, tipo_dispositivo } = req.body; // 16. Desestrutura os dados (IP, nome, tipo) do corpo da requisição.

  // Validação básica
  if (!ip_address || !nome || !tipo_dispositivo) {
    // 17. Verifica se algum campo obrigatório está faltando.
    return res // 18. Se sim, retorna um status 400 (Bad Request).
      .status(400) // 19. Define o status HTTP como 400.
      .json({ message: "Todos os campos são obrigatórios." }); // 20. Envia uma resposta JSON com a mensagem de erro.
  }

  // Insere o novo dispositivo no banco de dados
  try {
    // 21. Inicia o bloco try para lidar com operações que podem gerar erros (como a query SQL).
    const query = // 22. Define a query SQL de inserção. O 'NOW()' insere a data/hora atual.
      "INSERT INTO Dispositivo (ip_address, nome, tipo_dispositivo, data_cadastro) VALUES (?, ?, ?, NOW())";
    const [result] = await pool.execute(query, [
      // 23. Executa a query com os valores fornecidos (evitando injeção SQL).
      ip_address, // 24. Valor para o primeiro placeholder (ip_address).
      nome, // 25. Valor para o segundo placeholder (nome).
      tipo_dispositivo, // 26. Valor para o terceiro placeholder (tipo_dispositivo).
    ]);

    // Retorna sucesso
    res.status(201).json({
      // 27. Se a inserção for bem-sucedida, retorna status 201 (Created).
      id: result.insertId, // 28. Inclui o ID gerado para o novo dispositivo.
      message: "Dispositivo cadastrado com sucesso.", // 29. Mensagem de sucesso.
    });

    // Trata erros de duplicidade de IP
  } catch (error) {
    // 30. Captura quaisquer erros que ocorreram no bloco try.
    console.error("Erro ao cadastrar dispositivo:", error); // 31. Loga o erro completo no console do servidor.
    if (error.code === "ER_DUP_ENTRY") {
      // 32. Verifica se o erro é especificamente uma entrada duplicada (ex: IP já cadastrado).
      return res.status(409).json({ message: "IP já cadastrado." }); // 33. Retorna status 409 (Conflict) com mensagem específica.
    }
    res.status(500).json({ message: "Erro interno do servidor." }); // 34. Para outros erros, retorna status 500 (Internal Server Error).
  }
});

// Rota para listar todos os dispositivos com seu status mais recente
app.get("/api/dispositivos", async (req, res) => {
  // 35. Define a rota GET para listar todos os dispositivos.
  try {
    // 36. Inicia o bloco try para a operação de leitura no DB.
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
    const [dispositivos] = await pool.execute(query); // 48. Executa a query e desestrutura o resultado (o primeiro elemento é o array de linhas).

    // Retorna a lista de dispositivos
    res.json(dispositivos); // 49. Retorna a lista de dispositivos com o status recente em formato JSON.
  } catch (error) {
    // 50. Captura erros na operação de listagem.
    console.error("Erro ao listar dispositivos:", error); // 51. Loga o erro.
    res.status(500).json({ message: "Erro interno do servidor." }); // 52. Retorna status 500.
  }
});

// Rota para remover um dispositivo e seus logs relacionados
app.delete("/api/dispositivos/:id", async (req, res) => {
  // 53. Define a rota DELETE, que espera o ID do dispositivo no parâmetro da URL.
  const dispositivoId = req.params.id; // 54. Extrai o ID do dispositivo dos parâmetros da URL.

  // Remove o dispositivo (e logs, se houver ON DELETE CASCADE configurado no DB)
  try {
    // 55. Inicia o bloco try.
    const [result] = await pool.execute(
      // 56. Executa a query de exclusão na tabela Dispositivo.
      "DELETE FROM Dispositivo WHERE id = ?", // 57. Query de exclusão.
      [dispositivoId] // 58. Passa o ID para a query.
    );

    // Verifica se algum dispositivo foi removido
    if (result.affectedRows === 0) {
      // 59. Verifica se a operação afetou 0 linhas (ou seja, o ID não existia).
      return res.status(404).json({ message: "Dispositivo não encontrado." }); // 60. Se não encontrado, retorna status 404.
    }

    // Retorna sucesso
    res.status(200).json({
      // 61. Se removido com sucesso, retorna status 200 (OK).
      message: "Dispositivo e logs relacionados removidos com sucesso.", // 62. Mensagem de sucesso.
    });

    // Trata erros
  } catch (error) {
    // 63. Captura erros durante a exclusão.
    console.error("Erro ao remover dispositivo:", error); // 64. Loga o erro.
    res // 65. Retorna status 500.
      .status(500)
      .json({ message: "Erro interno ao tentar remover o dispositivo." });
  }
});

// Função para executar o ping e salvar o log
async function executarPingESalvarLog(dispositivo) {
  // 66. Define a função assíncrona que realiza o ping e salva o resultado. Recebe o objeto dispositivo.
  const { id, ip_address } = dispositivo; // 67. Desestrutura o ID e o endereço IP do dispositivo.
  const resultadoPing = await ping.promise.probe(ip_address); // 68. Executa o ping assíncrono para o IP.

  // Prepara os dados do log
  const isOnline = resultadoPing.alive; // 69. Verifica se o host está vivo (true/false).
  const status = isOnline ? "Online" : "Offline"; // 70. Define o status como "Online" ou "Offline".
  const mensagem = isOnline // 71. Define a mensagem com detalhes do ping (tempo) ou erro.
    ? `Ping OK, tempo=${resultadoPing.time}ms`
    : `Host inacessível.`;

  // Salva o log no banco de dados
  try {
    // 72. Inicia o bloco try para salvar o log.
    const query = // 73. Query SQL para inserir o log de conectividade.
      "INSERT INTO Log_Conectividade (dispositivo_id, data_teste, resultado, mensagem) VALUES (?, NOW(), ?, ?)";
    await pool.execute(query, [id, status, mensagem]); // 74. Executa a query, inserindo o ID, status e mensagem.
    console.log(`Ping para ${ip_address} concluído: ${status}`); // 75. Loga o resultado do ping no console do servidor.

    // Trata erros ao salvar o log
  } catch (error) {
    // 76. Captura erros ao salvar o log (se o DB estiver offline, por exemplo).
    console.error(`Erro ao salvar log para ${ip_address}:`, error); // 77. Loga o erro específico.
  }
}

// Rota para executar o ping em todos os dispositivos
app.get("/api/ping/todos", async (req, res) => {
  // 78. Define a rota GET para iniciar o teste de conectividade em massa.
  try {
    // 79. Inicia o bloco try.
    const [dispositivos] = await pool.execute(
      // 80. Seleciona o ID e o IP de todos os dispositivos cadastrados.
      "SELECT id, ip_address FROM Dispositivo"
    );

    // Executa o ping para todos os dispositivos em paralelo
    const promises = dispositivos.map(executarPingESalvarLog); // 81. Cria um array de Promises, uma para cada execução de ping.
    await Promise.all(promises); // 82. Espera que TODOS os pings e logs sejam concluídos.

    // Retorna sucesso
    res.json({
      // 83. Retorna uma resposta JSON de sucesso para o cliente.
      message: "Testes de conectividade executados para todos os dispositivos.",
    });

    // Trata erros
  } catch (error) {
    // 84. Captura erros durante a busca de dispositivos ou na execução do Promise.all.
    console.error("Erro ao executar Pings:", error); // 85. Loga o erro.
    res // 86. Retorna status 500.
      .status(500)
      .json({ message: "Erro ao executar testes de conectividade." });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  // 87. Inicia o servidor Express para escutar na porta definida (3000).
  console.log(`Servidor rodando em http://localhost:${PORT}`); // 88. Loga uma mensagem de confirmação no console após o servidor iniciar.
});

