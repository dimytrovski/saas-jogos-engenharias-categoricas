CREATE DATABASE IF NOT EXISTS micro_saas_gaming
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE micro_saas_gaming;

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- 1. Nome completo do usuário
    nome_completo VARCHAR(150) NOT NULL,

    -- 2. Gamertag / Nickname único na plataforma
    nickname VARCHAR(50) NOT NULL UNIQUE,

    -- 3. E-mail principal de acesso e notificações
    email VARCHAR(180) NOT NULL UNIQUE,

    -- 4. Hash da senha (nunca salvar senha em texto puro)
    senha_hash VARCHAR(255) NOT NULL,

    -- 5. CPF (somente números, útil para verificação e transações)
    cpf VARCHAR(11) NOT NULL UNIQUE,

    -- 6. Telefone / WhatsApp com DDD
    telefone_whatsapp VARCHAR(20) NOT NULL,

    -- 7. Data de nascimento (validação de idade/categorias)
    data_nascimento DATE NOT NULL,

    -- 8. Plataforma principal de jogo
    plataforma_principal ENUM('PC', 'PS5', 'XBOX_SERIES', 'CLOUD_GAMING') NOT NULL DEFAULT 'CLOUD_GAMING',

    -- 9. Posição preferida em campo (ex: Pro Clubs)
    posicao_preferida ENUM('GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA', 'FLEX') NOT NULL DEFAULT 'FLEX',

    -- 10. Chave Pix padrão para saques/premiações
    chave_pix VARCHAR(150) NULL,

    -- Controle e auditoria
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_usuarios_plataforma (plataforma_principal),
    INDEX idx_usuarios_posicao (posicao_preferida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
