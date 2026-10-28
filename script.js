// ==========================================================================
// 1. MAPEAMENTO DE ELEMENTOS DO DOM (Capturando os IDs do HTML)
// ==========================================================================
const botaoCalcular = document.getElementById("botaoCalcular");
const inputEuro = document.getElementById("valorEuro");
const inputPoupanca = document.getElementById("poupancaMensal");
const resultadoReal = document.getElementById("resultadoReal");
const tempoMeta = document.getElementById("tempoMeta");
const valorCotacaoApi = document.getElementById("valorCotacaoApi");
const statusCotacao = document.getElementById("statusCotacao");

// ==========================================================================
// 2. VARIÁVEIS GLOBAIS E METAS DO PLANEJAMENTO
// ==========================================================================
let taxaCambioAtual = 0; 
const META_FINANCEIRA_TOTAL = 20000; // Objetivo final de R$ 20k guardados para viajar seguro
const APORTE_INICIAL = 10000;         // Os R$ 10.000 que você já tem guardados hoje
let meuGrafico = null;               // Guardará a instância de desenho do Chart.js

// ==========================================================================
// 3. FUNÇÃO DE INICIALIZAÇÃO DO GRÁFICO (Chart.js)
// ==========================================================================
function inicializarGraficoVazio() {
    const canvasElement = document.getElementById('graficoProjecao');
    if (!canvasElement) return; 

    const ctx = canvasElement.getContext('2d');
    
    // Se o gráfico já existia na memória, destrói o antigo para evitar bugs visuais
    if (meuGrafico) {
        meuGrafico.destroy();
    }

    // Criando o gráfico de linhas com as cores do painel escuro
    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Agora'],
            datasets: [{
                label: 'Seu Capital (R$)',
                data: [APORTE_INICIAL],
                borderColor: '#ff4d00',           // Linha Laranja
                backgroundColor: 'rgba(255, 77, 0, 0.05)', // Sombra sutil abaixo da linha
                borderWidth: 3,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// ==========================================================================
// 4. REQUISIÇÃO ASSÍNCRONA DA API DE CÂMBIO (AwesomeAPI)
// ==========================================================================
async function buscarCotacaoEuro() {
    // URL oficial completa que devolve o arquivo JSON com a cotação real do Euro Comercial
    const url = "https://awesomeapi.com.br";
    
    try {
        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error("Falha na resposta do servidor");
        
        const dados = await resposta.json();
        
        // Puxa o valor numérico de compra ('bid') do Euro Comercial de dentro do JSON
        taxaCambioAtual = parseFloat(dados.EURBRL.bid);

        // Atualiza a barra de status para verde (Sucesso)
        statusCotacao.innerText = "🟢 Câmbio Conectado";
        statusCotacao.className = "api-status success";
        
        // Exibe o valor do Euro atualizado formatado em Real
        valorCotacaoApi.innerText = taxaCambioAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
    } catch (erro) {
        console.log("Modo de segurança ativado devido a restrições de rede local:", erro);
        
        // Se a internet falhar ou a rede bloquear, aplica a taxa segura de backup
        statusCotacao.innerText = "⚠️ Modo Offline (Taxa padrão aplicada)";
        statusCotacao.className = "api-status error";
        
        taxaCambioAtual = 6.20; 
        valorCotacaoApi.innerText = "R$ 6,20";
    }
}

// ==========================================================================
// 5. FUNÇÃO PARA ATUALIZAR A LINHA DO GRÁFICO APÓS O CÁLCULO
// ==========================================================================
function atualizarGrafico(meses, aporteMensal) {
    if (!meuGrafico) return;

    const labels = ['Agora'];
    const dadosFinanceiros = [APORTE_INICIAL];
    let capitalAcumulado = APORTE_INICIAL;

    // Loop que calcula o crescimento do seu bolo financeiro mês a mês
    for (let i = 1; i <= meses; i++) {
        capitalAcumulado += aporteMensal;
        labels.push(`Mês ${i}`);
        dadosFinanceiros.push(capitalAcumulado);
    }

    // Injeta os novos dados calculados dentro da estrutura do Chart.js e força o redesenho
    meuGrafico.data.labels = labels;
    meuGrafico.data.datasets[0].data = dadosFinanceiros; 
    meuGrafico.update();
}

// ==========================================================================
// 6. EVENTO DE CLIQUE DO BOTÃO (Processamento das informações)
// ==========================================================================
botaoCalcular.addEventListener("click", () => {
    const euros = parseFloat(inputEuro.value);
    const poupancaMensal = parseFloat(inputPoupanca.value);

    // Validação de segurança: Impede campos vazios ou números menores/iguais a zero
    if (isNaN(euros) || euros <= 0 || isNaN(poupancaMensal) || poupancaMensal <= 0) {
        alert("Por favor, insira valores válidos e maiores que zero em ambos os campos!");
        return;
    }

    // 1. Calcula o poder de compra da mesada em Reais
    const valorConvertido = euros * taxaCambioAtual;
    resultadoReal.innerText = valorConvertido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // 2. Calcula quantos meses faltam para bater a meta de R$ 20k usando a sobra do salário de porteiro
    const valorFaltante = META_FINANCEIRA_TOTAL - APORTE_INICIAL;
    const mesesNecessarios = Math.ceil(valorFaltante / poupancaMensal);
    tempoMeta.innerText = `${mesesNecessarios} meses`;

    // 3. Atualiza a linha do gráfico com a nova projeção do seu bolso
    atualizarGrafico(mesesNecessarios, poupancaMensal);
});

// ==========================================================================
// 7. ORDENAÇÃO DE EXECUÇÃO INICIAL (Garantia de estabilidade)
// ==========================================================================
inicializarGraficoVazio(); // 1º: Monta a caixa do gráfico vazia na tela
buscarCotacaoEuro();       // 2º: Conecta com a internet para pegar o Euro real
