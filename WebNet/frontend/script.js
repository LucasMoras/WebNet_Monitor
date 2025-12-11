const API_URL = "http://localhost:3000/api/dispositivos"; // 1. Define a URL base da API REST para a gestão de dispositivos.

// Função para carregar dispositivos e exibir na tabela
document.addEventListener("DOMContentLoaded", () => {
  // 2. Adiciona um listener para garantir que o código só execute após o HTML estar completamente carregado.
  carregarDispositivos(); // 3. Chama a função para carregar e exibir os dispositivos logo no início.
  document // 4. Seleciona o formulário de cadastro pelo ID.
    .getElementById("form-cadastro")
    .addEventListener("submit", cadastrarDispositivo); // 5. Adiciona um listener para o evento de submissão do formulário, chamando a função de cadastro.

  setInterval(carregarEExibirStatus, 10000); // 6. Configura um temporizador que chama a função de atualização de status a cada 10.000 milissegundos (10 segundos).
});

// Função para cadastrar um novo dispositivo
async function cadastrarDispositivo(event) {
  // 7. Define a função assíncrona para lidar com o cadastro de dispositivos.
  event.preventDefault(); // 8. Previne o comportamento padrão do formulário (que é recarregar a página).
  const ip = document.getElementById("ip").value; // 9. Obtém o valor do campo IP.
  const nome = document.getElementById("nome").value; // 10. Obtém o valor do campo Nome.
  const tipo = document.getElementById("tipo").value; // 11. Obtém o valor do campo Tipo.
  const mensagemElement = document.getElementById("mensagem-cadastro"); // 12. Seleciona o elemento onde as mensagens de feedback serão exibidas.

  // Limpa mensagem anterior
  // 13. O código não limpa explicitamente, mas a próxima atribuição no try/catch o fará.
  try {
    // 14. Inicia o bloco try para a requisição de cadastro.
    const response = await fetch(API_URL, {
      // 15. Envia uma requisição POST assíncrona para a API_URL.
      method: "POST", // 16. Define o método HTTP como POST.
      headers: {
        // 17. Define o cabeçalho para indicar que o corpo da requisição é JSON.
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 18. Converte os dados do formulário em uma string JSON para o corpo da requisição.
        ip_address: ip,
        nome: nome,
        tipo_dispositivo: tipo,
      }),
    });

    // Verifica a resposta do servidor
    if (response.ok) {
      // 19. Verifica se o status da resposta está na faixa 200-299 (sucesso).
      mensagemElement.textContent = "Dispositivo cadastrado com sucesso!"; // 20. Exibe mensagem de sucesso.
      mensagemElement.style.color = "green"; // 21. Define a cor da mensagem como verde.
      document.getElementById("form-cadastro").reset(); // 22. Limpa os campos do formulário.
      carregarDispositivos(); // 23. Recarrega a lista para mostrar o novo dispositivo.
    } else {
      // 24. Se a resposta não for de sucesso (ex: 400, 409, 500).
      const errorData = await response.json(); // 25. Tenta extrair a mensagem de erro do corpo da resposta JSON.
      mensagemElement.textContent = `Erro ao cadastrar: ${
        // 26. Exibe a mensagem de erro específica do backend.
        errorData.message || response.statusText
      }`;
      mensagemElement.style.color = "red"; // 27. Define a cor da mensagem como vermelho.
    }

    // Trata erros de conexão
  } catch (error) {
    // 28. Captura erros que impedem a requisição de ser completada (ex: servidor offline).
    mensagemElement.textContent = // 29. Exibe uma mensagem de erro de conexão.
      "Erro de conexão com o servidor. Verifique se o backend está rodando.";
    mensagemElement.style.color = "red";
    console.error("Erro de conexão:", error); // 30. Loga o erro no console do navegador.
  }
}

// Função para remover um dispositivo
async function removerDispositivo(id) {
  // 31. Define a função assíncrona para remover um dispositivo, recebendo o ID como argumento.
  if (
    // 32. Exibe uma caixa de diálogo de confirmação ao usuário.
    !confirm(
      "Tem certeza que deseja remover este dispositivo? Isso apagará todos os logs relacionados."
    )
  ) {
    return; // 33. Se o usuário clicar em "Cancelar", a função é encerrada.
  }

  // Realiza a requisição DELETE para o backend
  try {
    // 34. Inicia o bloco try para a requisição DELETE.
    const response = await fetch(`${API_URL}/${id}`, {
      // 35. Envia uma requisição DELETE para a URL específica do dispositivo (ex: /api/dispositivos/5).
      method: "DELETE", // 36. Define o método HTTP como DELETE.
    });

    // Verifica a resposta do servidor
    if (response.ok) {
      // 37. Verifica se a remoção foi bem-sucedida (status 200).
      alert("Dispositivo removido com sucesso!"); // 38. Exibe um alerta de sucesso.
      carregarDispositivos(); // 39. Recarrega a tabela para remover o item visualmente.
    } else {
      // 40. Se a resposta não for de sucesso (ex: 404).
      const errorData = await response.json(); // 41. Tenta obter a mensagem de erro.
      alert(`Erro ao remover: ${errorData.message}`); // 42. Exibe o erro.
    }

    // Trata erros de conexão
  } catch (error) {
    // 43. Captura erros de conexão.
    alert("Erro de conexão com o servidor ao tentar remover.");
    console.error("Erro de remoção:", error);
  }
}

// Função para carregar e exibir dispositivos na tabela
async function carregarDispositivos() {
  // 44. Define a função assíncrona principal para buscar e renderizar a tabela.
  const tbody = document.querySelector("#tabela-dispositivos tbody"); // 45. Seleciona o corpo da tabela onde as linhas serão inseridas.
  tbody.innerHTML = ""; // 46. Limpa o conteúdo da tabela para evitar duplicatas ao recarregar.

  // Limpa a tabela antes de recarregar
  try {
    // 47. Inicia o bloco try para a requisição GET.
    const response = await fetch(API_URL); // 48. Envia a requisição GET para buscar a lista de dispositivos.
    const dispositivos = await response.json(); // 49. Converte a resposta em um array de objetos JavaScript.

    // Verifica se há dispositivos cadastrados
    if (dispositivos.length === 0) {
      // 50. Verifica se o array de dispositivos está vazio.
      const row = tbody.insertRow(); // 51. Insere uma nova linha na tabela.
      const cell = row.insertCell(); // 52. Insere uma célula na linha.
      cell.colSpan = 6; // 53. Define que a célula deve ocupar a largura de 6 colunas.
      cell.textContent = "Nenhum dispositivo cadastrado."; // 54. Exibe a mensagem de que não há dispositivos.
      return; // 55. Encerra a função.
    }

    // Preenche a tabela com os dispositivos
    dispositivos.forEach((dispositivo) => {
      // 56. Itera sobre cada dispositivo retornado pelo backend.
      const row = tbody.insertRow(); // 57. Cria uma nova linha para o dispositivo atual.

      // Dados do dispositivo
      const status = dispositivo.status_recente || "Desconhecido"; // 58. Obtém o status, ou define como 'Desconhecido' se não houver log.
      const ultimoPing = dispositivo.data_recente // 59. Verifica se há data de log.
        ? new Date(dispositivo.data_recente).toLocaleString("pt-BR") // 60. Formata a data e hora do log para o formato local.
        : "-"; // 61. Se não houver data, exibe um traço.

      // Colunas de dados
      row.insertCell().textContent = dispositivo.nome; // 62. Insere a célula do Nome.
      row.insertCell().textContent = dispositivo.ip_address; // 63. Insere a célula do IP.
      row.insertCell().textContent = dispositivo.tipo_dispositivo; // 64. Insere a célula do Tipo.

      // Coluna de status
      const statusCell = row.insertCell(); // 65. Cria a célula para o Status.
      statusCell.textContent = status;
      statusCell.classList.add(
        // 66. Adiciona uma classe CSS para estilizar a célula com base no status.
        status === "Online" ? "status-online" : "status-offline"
      );

      // Coluna de último ping
      row.insertCell().textContent = ultimoPing; // 67. Insere a célula da data do último ping.

      // Coluna de ação (botão remover)
      const acaoCell = row.insertCell(); // 68. Cria a célula para o botão de ação.
      const removeButton = document.createElement("button"); // 69. Cria o elemento HTML <button>.
      removeButton.textContent = "Remover";
      removeButton.onclick = () => removerDispositivo(dispositivo.id); // 70. Associa a função de remoção (com o ID correto) ao evento de clique.
      removeButton.classList.add("botao-remover"); // 71. Adiciona uma classe CSS ao botão.
      acaoCell.appendChild(removeButton); // 72. Adiciona o botão à célula de ação.
    });

    // Trata erros de carregamento
  } catch (error) {
    // 73. Captura erros na requisição GET (ex: servidor offline).
    const row = tbody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = "Não foi possível carregar os dispositivos do servidor.";
    console.error("Erro ao carregar:", error);
  }
}

// Função para executar ping em todos os dispositivos e atualizar status
async function carregarEExibirStatus() {
  // 74. Define a função para o ping periódico.
  try {
    // 75. Inicia o bloco try.
    await fetch("http://localhost:3000/api/ping/todos"); // 76. Envia uma requisição para a rota que dispara o ping em todos os dispositivos no backend.
    carregarDispositivos(); // 77. Após o backend atualizar os logs, recarrega a tabela para exibir os novos status.

    // Trata erros de ping
  } catch (error) {
    // 78. Captura erros na requisição periódica (ex: se o servidor ficar offline).
    console.warn("Não foi possível executar o ping periódico:", error); // 79. Loga um aviso em vez de um erro fatal.
  }
}
