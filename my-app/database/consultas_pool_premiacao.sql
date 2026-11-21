USE micro_saas_gaming;

-- 1. Calcular o pool total arrecadado e o valor reservado para premiação de um campeonato
-- Substitua o ID (ex.: 1) pelo ID do campeonato desejado
SELECT
    c.id AS campeonato_id,
    c.titulo,
    c.valor_inscricao,
    c.percentual_premio,
    COUNT(i.id) AS total_inscritos_pagos,
    COALESCE(SUM(i.valor_pago), 0.00) AS total_arrecadado,
    ROUND(
        COALESCE(SUM(i.valor_pago), 0.00) * (c.percentual_premio / 100),
        2
    ) AS pool_premiacao_total,
    ROUND(
        COALESCE(SUM(i.valor_pago), 0.00) * (1 - (c.percentual_premio / 100)),
        2
    ) AS receita_plataforma
FROM campeonatos c
LEFT JOIN inscricoes i
    ON i.campeonato_id = c.id
    AND i.status_pagamento = 'PAGO'
WHERE c.id = 1
GROUP BY
    c.id,
    c.titulo,
    c.valor_inscricao,
    c.percentual_premio;

-- 2. Simular divisão por colocação (ex.: 60% 1º lugar, 25% 2º lugar, 15% 3º lugar sobre o pool)
WITH pool_calculado AS (
    SELECT
        c.id AS campeonato_id,
        ROUND(
            COALESCE(SUM(i.valor_pago), 0.00) * (c.percentual_premio / 100),
            2
        ) AS pool_total
    FROM campeonatos c
    LEFT JOIN inscricoes i
        ON i.campeonato_id = c.id
        AND i.status_pagamento = 'PAGO'
    WHERE c.id = 1
    GROUP BY c.id, c.percentual_premio
)
SELECT
    campeonato_id,
    pool_total,
    ROUND(pool_total * 0.60, 2) AS premio_1_lugar,
    ROUND(pool_total * 0.25, 2) AS premio_2_lugar,
    ROUND(pool_total * 0.15, 2) AS premio_3_lugar
FROM pool_calculado;
