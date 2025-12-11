CREATE DATABASE WebNet_Monitor;

USE WebNet_Monitor;

CREATE TABLE Dispositivo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    tipo_dispositivo VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    data_cadastro DATETIME NOT NULL
);

CREATE TABLE Log_Conectividade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT NOT NULL,
    data_teste DATETIME NOT NULL,
    resultado VARCHAR(10) NOT NULL,
    mensagem TEXT,
    
    FOREIGN KEY (dispositivo_id) 
        REFERENCES Dispositivo(id)
        ON DELETE CASCADE
);