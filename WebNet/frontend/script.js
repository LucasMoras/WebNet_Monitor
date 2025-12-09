const API_URL = "http://localhost:3000/api/dispositivos";

// Função para carregar dispositivos e exibir na tabela
document.addEventListener("DOMContentLoaded", () => {
  carregarDispositivos();
  document
    .getElementById("form-cadastro")
    .addEventListener("submit", cadastrarDispositivo);

  setInterval(carregarEExibirStatus, 10000);
});

// Função para cadastrar um novo dispositivo
async function cadastrarDispositivo(event) {
  event.preventDefault();
  const ip = document.getElementById("ip").value;
  const nome = document.getElementById("nome").value;
  const tipo = document.getElementById("tipo").value;
  const mensagemElement = document.getElementById("mensagem-cadastro");

  // Limpa mensagem anterior
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ip_address: ip,
        nome: nome,
        tipo_dispositivo: tipo,
      }),
    });

    // Verifica a resposta do servidor
    if (response.ok) {
      mensagemElement.textContent = "Dispositivo cadastrado com sucesso!";
      mensagemElement.style.color = "green";
      document.getElementById("form-cadastro").reset();
      carregarDispositivos();
    } else {
      const errorData = await response.json();
      mensagemElement.textContent = `Erro ao cadastrar: ${
        errorData.message || response.statusText
      }`;
      mensagemElement.style.color = "red";
    }

    // Trata erros de conexão
  } catch (error) {
    mensagemElement.textContent =
      "Erro de conexão com o servidor. Verifique se o backend está rodando.";
    mensagemElement.style.color = "red";
    console.error("Erro de conexão:", error);
  }
}

// Função para remover um dispositivo
async function removerDispositivo(id) {
  if (
    !confirm(
      "Tem certeza que deseja remover este dispositivo? Isso apagará todos os logs relacionados."
    )
  ) {
    return;
  }

  // Realiza a requisição DELETE para o backend
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    // Verifica a resposta do servidor
    if (response.ok) {
      alert("Dispositivo removido com sucesso!");
      carregarDispositivos(); // Recarrega a tabela
    } else {
      const errorData = await response.json();
      alert(`Erro ao remover: ${errorData.message}`);
    }

    // Trata erros de conexão
  } catch (error) {
    alert("Erro de conexão com o servidor ao tentar remover.");
    console.error("Erro de remoção:", error);
  }
}

// Função para carregar e exibir dispositivos na tabela
async function carregarDispositivos() {
  const tbody = document.querySelector("#tabela-dispositivos tbody");
  tbody.innerHTML = "";

  // Limpa a tabela antes de recarregar
  try {
    const response = await fetch(API_URL);
    const dispositivos = await response.json();

    // Verifica se há dispositivos cadastrados
    if (dispositivos.length === 0) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 6; // Ajustado para 6 colunas
      cell.textContent = "Nenhum dispositivo cadastrado.";
      return;
    }

    // Preenche a tabela com os dispositivos
    dispositivos.forEach((dispositivo) => {
      const row = tbody.insertRow();

      // Dados do dispositivo
      const status = dispositivo.status_recente || "Desconhecido";
      const ultimoPing = dispositivo.data_recente
        ? new Date(dispositivo.data_recente).toLocaleString("pt-BR")
        : "-";

      // Colunas de dados
      row.insertCell().textContent = dispositivo.nome;
      row.insertCell().textContent = dispositivo.ip_address;
      row.insertCell().textContent = dispositivo.tipo_dispositivo;

      // Coluna de status
      const statusCell = row.insertCell();
      statusCell.textContent = status;
      statusCell.classList.add(
        status === "Online" ? "status-online" : "status-offline"
      );

      // Coluna de último ping
      row.insertCell().textContent = ultimoPing;

      // Coluna de ação (botão remover)
      const acaoCell = row.insertCell();
      const removeButton = document.createElement("button");
      removeButton.textContent = "Remover";
      removeButton.onclick = () => removerDispositivo(dispositivo.id);
      removeButton.classList.add("botao-remover");
      acaoCell.appendChild(removeButton);
    });

    // Trata erros de carregamento
  } catch (error) {
    const row = tbody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = "Não foi possível carregar os dispositivos do servidor.";
    console.error("Erro ao carregar:", error);
  }
}

// Função para executar ping em todos os dispositivos e atualizar status
async function carregarEExibirStatus() {
  try {
    await fetch("http://localhost:3000/api/ping/todos");
    carregarDispositivos();

    // Trata erros de ping
  } catch (error) {
    console.warn("Não foi possível executar o ping periódico:", error);
  }
}
