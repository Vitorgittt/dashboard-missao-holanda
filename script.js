const botaoCalcular = document.getElementById("botaoCalcular");
const botaoLimparHistorico = document.getElementById("botaoLimparHistorico");
const inputEuro = document.getElementById("valorEuro");
const inputPoupanca = document.getElementById("poupancaMensal");
const painelResultados = document.getElementById("painelResultados");
const resultadoReal = document.getElementById("resultadoReal");
const tempoMeta = document.getElementById("tempoMeta");
const valorCotacaoApi = document.getElementById("valorCotacaoApi");
const statusCotacao = document.getElementById("statusCotacao");
const listaHistorico = document.getElementById("listaHistorico");

let taxaCambioAtual = 0; 
const META_FINANCEIRA_TOTAL = 20000;
const APORTE_INICIAL = 10000;
let meuGrafico = null; 

let historicoSimulacoes = JSON.parse(localStorage.getItem("historicoAuPair")) || [];

function inicializarGraficoVazio() {
    const canvasElement = document.getElementById('graficoProjecao');
    if (!canvasElement) return; 

    const ctx = canvasElement.getContext('2d');
    
    if (meuGrafico) {
        meuGrafico.destroy();
    }

    if (typeof Chart === 'undefined') {
        console.error("Erro: A biblioteca Chart.js não foi carregada no HTML.");
        return;
    }

    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Agora'],
            datasets: [{
                label: 'Seu Capital (R$)',
                data: [APORTE_INICIAL],
                borderColor: '#ff4d00',
                backgroundColor: 'rgba(255, 77, 0, 0.1)',
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
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

async function buscarCotacaoEuro() {
    const url = "https://awesomeapi.com.br";
    try {
        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error();
        const dados = await resposta.json();
        taxaCambioAtual = parseFloat(dados.EURBRL.bid);

        statusCotacao.innerHTML = `<span>🟢 Câmbio Conectado</span>`;
        statusCotacao.className = "api-status success";
        valorCotacaoApi.innerText = taxaCambioAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        botaoCalcular.removeAttribute("disabled");
        
    } catch (erro) {
        statusCotacao.innerHTML = `<span>⚠️ Modo Offline (Taxa padrão)</span>`;
        statusCotacao.className = "api-status error";
        taxaCambioAtual = 6.20; 
        valorCotacaoApi.innerText = "R$ 6,20";
        botaoCalcular.removeAttribute("disabled");
    }
}

function atualizarInterfaceHistorico() {
    if (!listaHistorico) return;
    listaHistorico.innerHTML = "";
    if (historicoSimulacoes.length === 0) {
        listaHistorico.innerHTML = `<li class="empty-history">Nenhuma simulação realizada ainda.</li>`;
        return;
    }
    historicoSimulacoes.forEach(simulacao => {
        const itemLi = document.createElement("li");
        itemLi.className = "history-item";
        itemLi.innerHTML = `
            <span>Mesada: <strong>€ ${simulacao.euro}</strong> → R$ ${simulacao.conversao}</span>
            <span style="color: var(--text-muted); font-size: 11px;">Meta: ${simulacao.meses}m</span>
        `;
        listaHistorico.appendChild(itemLi);
    });
}

function atualizarGrafico(meses, aporteMensal) {
    if (!meuGrafico) return;

    const labels = ['Agora'];
    const dadosFinanceiros = [APORTE_INICIAL];
    let capitalAcumulado = APORTE_INICIAL;

    for (let i = 1; i <= meses; i++) {
        capitalAcumulado += aporteMensal;
        labels.push(`Mês ${i}`);
        dadosFinanceiros.push(capitalAcumulado);
    }

    meuGrafico.data.labels = labels;
    meuGrafico.data.datasets[0].data = dadosFinanceiros; 
    meuGrafico.update();
}

botaoCalcular.addEventListener("click", () => {
    const euros = parseFloat(inputEuro.value);
    const poupancaMensal = parseFloat(inputPoupanca.value);

    if (isNaN(euros) || euros <= 0 || isNaN(poupancaMensal) || poupancaMensal <= 0) {
        alert("Insira valores válidos!");
        return;
    }

    const valorConvertido = euros * taxaCambioAtual;
    resultadoReal.innerText = valorConvertido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const valorFaltante = META_FINANCEIRA_TOTAL - APORTE_INICIAL;
    const mesesNecessarios = Math.ceil(valorFaltante / poupancaMensal);
    tempoMeta.innerText = `${mesesNecessarios} meses`;

    painelResultados.classList.remove("empty-state");
    atualizarGrafico(mesesNecessarios, poupancaMensal);

    const novaSimulacao = {
        euro: euros,
        conversao: valorConvertido.toFixed(2),
        meses: mesesNecessarios
    };

    historicoSimulacoes.unshift(novaSimulacao);
    if (historicoSimulacoes.length > 4) historicoSimulacoes.pop();
    localStorage.setItem("historicoAuPair", JSON.stringify(historicoSimulacoes));
    atualizarInterfaceHistorico();
});

if (botaoLimparHistorico) {
    botaoLimparHistorico.addEventListener("click", () => {
        historicoSimulacoes = [];
        localStorage.removeItem("historicoAuPair");
        atualizarInterfaceHistorico();
        atualizarGrafico(0, 0);
    });
}

// EXECUÇÃO INICIAL GARANTIDA
inicializarGraficoVazio(); 
atualizarInterfaceHistorico(); 
buscarCotacaoEuro();
