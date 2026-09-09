// =====================================
// VARIÁVEIS GLOBAIS
// =====================================

let dadosPedidos = [];
let dadosPosicoes = [];
let dadosEstoquePulmao = [];
let resultado = [];

let paginaAtual = 1;

// =====================================
// CONFIGURAÇÃO DE PAVILHÕES
// =====================================
// O pavilhão de cada SKU é definido pela Rua (CODRUA) da posição
// de apanha. As faixas abaixo foram extraídas da relação oficial
// enviada (Perecível.txt, Pavilhão_1.txt, Pavilhão_2.txt,
// Pavilhão_3.txt), por isso cada pavilhão é uma LISTA de
// intervalos [ruaInicio, ruaFim] — as ruas não são contínuas.
// Caso o layout do CD mude, basta atualizar os intervalos abaixo.

const PAVILHOES = [

    {
        nome:"Perecível",
        ruas:[
            [26,27],
            [29,31],
        ],
    },
    {
        nome:"Pavilhão 1",
        ruas:[
            [3,14],
            [21,24],
            [51,65],
        ],
    },
    {
        nome:"Pavilhão 2",
        ruas:[
            [71,106],
        ],
    },
    {
        nome:"Pavilhão 3",
        ruas:[
            [311,317],
        ],
    },

];

function obterPavilhao(rua){

    const r = Number(rua) || 0;

    const encontrado =
    PAVILHOES.find(p =>
        p.ruas.some(([ruaInicio, ruaFim]) =>
            r >= ruaInicio &&
            r <= ruaFim
        )
    );

    return encontrado
    ? encontrado.nome
    : "Sem Pavilhão";

}

function popularFiltroPavilhao(){

    const opcoes =
    document.getElementById("filtroPavilhaoOpcoes");

    if(!opcoes) return;

    const nomes =
    PAVILHOES
    .map(p => p.nome)
    .concat(["Sem Pavilhão"]);

    // Preserva a seleção atual do usuário. Essa função é chamada
    // de novo a cada reprocessamento (inclusive pela sincronização
    // automática, a cada 5s) — sem isso, todo checkbox voltava a
    // "marcado" e o filtro que o usuário tinha ajustado (ex.: um
    // pavilhão desmarcado) era descartado silenciosamente,
    // parecendo que o filtro "travava" ou "parava de funcionar".
    const estadoAnterior = new Map(
        Array.from(
            document.querySelectorAll(".filtroPavilhaoItem")
        )
        .map(chk => [chk.value, chk.checked])
    );

    const primeiraVez = estadoAnterior.size === 0;

    let html = `
    <label class="filtro-pavilhao-item filtro-pavilhao-todos">
        <input
            type="checkbox"
            id="filtroPavilhaoTodos"
            onchange="alternarTodosPavilhoes(this)">
        Todos Pavilhões
    </label>
    <div class="filtro-pavilhao-separador"></div>
    `;

    nomes.forEach(nome=>{

        // Mantém marcado/desmarcado como estava; só entra
        // marcado por padrão na primeiríssima montagem (ou se
        // for um pavilhão novo que não existia antes).
        const marcado =
        estadoAnterior.has(nome)
        ? estadoAnterior.get(nome)
        : true;

        html += `
        <label class="filtro-pavilhao-item">
            <input
                type="checkbox"
                class="filtroPavilhaoItem"
                value="${nome}"
                ${marcado ? "checked" : ""}
                onchange="atualizarSelecaoPavilhoes()">
            ${nome}
        </label>
        `;

    });

    opcoes.innerHTML = html;

    const chkTodos =
    document.getElementById("filtroPavilhaoTodos");

    if(chkTodos){

        chkTodos.checked =
        primeiraVez ||
        Array.from(
            document.querySelectorAll(".filtroPavilhaoItem")
        )
        .every(chk => chk.checked);

    }

    atualizarLabelPavilhao();

}

function togglePavilhaoDropdown(){

    const opcoes =
    document.getElementById("filtroPavilhaoOpcoes");

    if(!opcoes) return;

    opcoes.style.display =
    opcoes.style.display === "none"
    ? "block"
    : "none";

}

document.addEventListener("click", function(e){

    const container =
    document.getElementById("filtroPavilhaoMulti");

    const opcoes =
    document.getElementById("filtroPavilhaoOpcoes");

    if(!container || !opcoes) return;

    if(!container.contains(e.target)){

        opcoes.style.display = "none";

    }

});

function alternarTodosPavilhoes(chkTodos){

    document
    .querySelectorAll(".filtroPavilhaoItem")
    .forEach(chk=>{

        chk.checked = chkTodos.checked;

    });

    atualizarLabelPavilhao();

    if(typeof aplicarFiltros === "function"){

        aplicarFiltros();

    }

}

function atualizarSelecaoPavilhoes(){

    const itens =
    document.querySelectorAll(".filtroPavilhaoItem");

    const chkTodos =
    document.getElementById("filtroPavilhaoTodos");

    const todosMarcados =
    Array.from(itens)
    .every(chk => chk.checked);

    if(chkTodos){

        chkTodos.checked = todosMarcados;

    }

    atualizarLabelPavilhao();

    if(typeof aplicarFiltros === "function"){

        aplicarFiltros();

    }

}

function atualizarLabelPavilhao(){

    const label =
    document.getElementById("filtroPavilhaoLabel");

    if(!label) return;

    const itens =
    Array.from(
        document.querySelectorAll(".filtroPavilhaoItem")
    );

    const marcados =
    itens.filter(chk => chk.checked);

    if(marcados.length === 0){

        label.innerText = "Nenhum Pavilhão";

    }
    else if(marcados.length === itens.length){

        label.innerText = "Todos Pavilhões";

    }
    else{

        label.innerText =
        marcados
        .map(chk => chk.value)
        .join(", ");

    }

}

// Retorna a lista de pavilhões marcados. Array vazio (itens
// totalmente desmarcados) significa "nada selecionado" — os
// chamadores devem tratar isso como filtro vazio de resultado.
// Quando TODOS estão marcados, retorna [] (equivalente a "sem
// filtro", mesmo comportamento de antes com "Todos Pavilhões").
function obterPavilhoesFiltroAtual(){

    const itens =
    Array.from(
        document.querySelectorAll(".filtroPavilhaoItem")
    );

    if(!itens.length){

        return [];

    }

    const marcados =
    itens.filter(chk => chk.checked);

    if(marcados.length === itens.length){

        return []; // todos marcados = sem filtro

    }

    return marcados.map(chk => chk.value);

}

// =====================================
// INICIALIZAÇÃO
// =====================================

document
.getElementById("arquivoPedidos")
.addEventListener("change", function(){

    const arquivo = this.files[0];

    document
    .getElementById("nomePedidos")
    .innerText =
    arquivo
    ? arquivo.name
    : "Nenhum arquivo selecionado";

});

document
.getElementById("arquivoPosicoes")
.addEventListener("change", function(){

    const arquivo = this.files[0];

    document
    .getElementById("nomePosicoes")
    .innerText =
    arquivo
    ? arquivo.name
    : "Nenhum arquivo selecionado";

});

// =====================================
// LOADING
// =====================================

function mostrarLoading(){

    document
    .getElementById("loading")
    .style.display = "flex";

}

function ocultarLoading(){

    document
    .getElementById("loading")
    .style.display = "none";

}

// =====================================
// PROCESSAMENTO PRINCIPAL
// =====================================

async function processar(){

    try{

        mostrarLoading();

        const arquivoPedidos =
        document
        .getElementById("arquivoPedidos")
        .files[0];

        const arquivoPosicoes =
        document
        .getElementById("arquivoPosicoes")
        .files[0];

        // A Posição de Endereços só é obrigatória na primeira vez.
        // Depois de processada uma vez, ela fica salva no navegador
        // (cache local — ver cache-posicoes.js) e é reaproveitada
        // automaticamente nas próximas visitas. O usuário só precisa
        // selecionar o arquivo de novo quando quiser ATUALIZAR a
        // posição (algo periódico, não a cada uso do site).
        if(!arquivoPosicoes && !dadosPosicoes.length){

            alert(
                "Selecione ao menos o arquivo de Posição de Endereços " +
                "(só na primeira vez — depois disso ele fica salvo)."
            );

            ocultarLoading();

            return;

        }

        if(!arquivoPedidos){

            dadosPedidos = [];

        }

        else{

            dadosPedidos =
            await lerExcel(
                arquivoPedidos
            );

        }

        if(arquivoPosicoes){

            dadosPosicoes =
            await lerTXT(
                arquivoPosicoes
            );

            // Salva/atualiza a versão em cache local, para não
            // precisar selecionar o arquivo de novo nas próximas vezes.
            await posicoesSalvarCache(
                arquivoPosicoes.name,
                dadosPosicoes
            );

            posicoesAtualizarBadgeUI(
                arquivoPosicoes.name,
                Date.now()
            );

        }
        // Se nenhum arquivo novo foi selecionado, dadosPosicoes já
        // está preenchido com o que foi restaurado do cache local
        // ao abrir a página.

console.log(
    "PRIMEIRA LINHA POSICOES:"
);

console.log(
    dadosPosicoes[0]
);

console.log(
    Object.keys(
        dadosPosicoes[0]
    )
);
        
console.log(
    [...new Set(
        dadosPosicoes.map(
            x=>x.ESPECIE_END
        )
    )]
);

console.log(
    [...new Set(
        dadosPosicoes.map(
            x=>x.TIPEND_PULMAO
        )
    )]
);

console.log(
    [...new Set(
        dadosPosicoes.map(
            x=>x.STATUS_ENDERECO
        )
    )]
);
        
       gerarAbastecimento();

console.log("Processamento finalizado");

ocultarLoading();

if(!dadosPedidos.length){

    alert(
        "Posição de Endereços carregada com sucesso.\n\n" +
        "O Metabase Pedidos não foi selecionado, então o " +
        "abastecimento por SKU ficará zerado — mas você já pode " +
        "usar \"Endereços Disponíveis\" e \"Liberação de Endereços 2.10\" normalmente."
    );

}

    }

    catch(erro){

        console.error(erro);

        ocultarLoading();

        alert(
            "Erro ao processar arquivos."
        );

    }

}

    

// =====================================
// LEITURA EXCEL
// =====================================

function lerExcel(arquivo){

    return new Promise((resolve,reject)=>{

        const leitor =
        new FileReader();

        leitor.onload = e=>{

            const dados =
            new Uint8Array(
                e.target.result
            );

            const workbook =
            XLSX.read(
                dados,
                {type:"array"}
            );

            const aba =
            workbook
            .SheetNames[0];

            const json =
            XLSX.utils.sheet_to_json(
                workbook.Sheets[aba],
                {
                    defval:""
                }
            );

            resolve(json);

        };

        leitor.onerror = reject;

        leitor.readAsArrayBuffer(
            arquivo
        );

    });

}

// =====================================
// LEITURA TXT
// =====================================

function lerTXT(arquivo){

    return new Promise((resolve,reject)=>{

        Papa.parse(
            arquivo,
            {

                header:true,

                delimiter:";",

                skipEmptyLines:true,

                complete:resultado=>{

                    resolve(
                        resultado.data
                    );

                },

                error:erro=>{

                    reject(erro);

                }

            }

        );

    });

}

// =====================================
// ESTOQUE PULMÃO (upload independente)
// =====================================
// Arquivo leve — só endereços de Pulmão (ESPECIEENDERECO = "P"),
// com status (Disponivel/Ocupado/Reservado/Bloqueado/Inativo).
// Não tem a altura do endereço (TIPEND_PULMAO) — essa continua
// vindo da Posição de Endereços já carregada no upload do topo.
// Carrega assim que o arquivo é selecionado, sem precisar clicar
// em "Processar Dados" (que é só pro fluxo de Abastecimento).

async function carregarEstoquePulmao(){

    const arquivo =
    document
    .getElementById("arquivoEstoquePulmao")
    .files[0];

    if(!arquivo) return;

    try{

        mostrarLoading();

        dadosEstoquePulmao =
        await lerTXT(arquivo);

        document.getElementById("nomeEstoquePulmao").innerText =
        "✅ " + arquivo.name + " (" + dadosEstoquePulmao.length.toLocaleString("pt-BR") + " endereços)";

        ocultarLoading();

    }

    catch(erro){

        ocultarLoading();

        console.error(erro);

        alert(
            "Erro ao ler o arquivo Estoque Pulmão: " +
            (erro?.message || erro)
        );

    }

}

// =====================================
// CÁLCULO DE NORMA
// =====================================
// Aceita tanto um número simples (ex: "6") quanto o formato
// "caixas por nível x níveis" (ex: "3X2"), multiplicando os
// dois valores quando esse padrão existe no campo NORMA_APANHA.

function calcularNorma(normaRaw){

    const texto =
    String(normaRaw || "0").trim();

    const combinada =
    texto.match(/(\d+)\s*[xX]\s*(\d+)/);

    if(combinada){

        const a = Number(combinada[1]);
        const b = Number(combinada[2]);

        return {
            valor: a * b,
            texto: `${a}x${b} = ${a * b}`
        };

    }

    const numero =
    Number(texto.match(/\d+/)?.[0]) || 0;

    return {
        valor: numero,
        texto: String(numero)
    };

}

// =====================================
// VALIDADE (FEFO — First Expire, First Out)
// =====================================
// DTAVALIDADE chega no formato "AAAA-MM-DD-HH.MM.SS.ffffff".
// Convertemos para timestamp para poder ordenar os pulmões do
// vencimento mais próximo para o mais distante. Sem validade
// cadastrada (campo vazio ou formato não reconhecido) vai para
// o final da lista — não some, só não é priorizado.

function parseValidade(dtavalidade){

    const texto =
    String(dtavalidade || "").trim();

    if(!texto){
        return Infinity;
    }

    const match =
    texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if(!match){
        return Infinity;
    }

    const [, ano, mes, dia] = match;

    const timestamp =
    new Date(`${ano}-${mes}-${dia}T00:00:00`).getTime();

    return isNaN(timestamp) ? Infinity : timestamp;

}

// =====================================
// GERAR ABASTECIMENTO
// =====================================

function gerarAbastecimento(){

    console.log("Iniciando geração...");
    
    resultado = [];

    const pedidosAgrupados = {};

    // SOMA PEDIDOS POR SKU
    dadosPedidos.forEach(item=>{

       const sku =
String(
    item.Seqproduto
)
.replace(",00","")
.replace(".00","")
.trim();

        if(!pedidosAgrupados[sku]){

            pedidosAgrupados[sku] = {

                sku,
                descricao: item.Desccompleta,
                pedido: 0

            };

        }

        pedidosAgrupados[sku].pedido +=
        Number(item.Quantidade) || 0;

    });

    // CRUZAMENTO

   // =====================================
// MAPA DE APANHAS
// =====================================

const mapaApanhas = {};

const mapaPulmoes = {};

dadosPosicoes.forEach(p=>{

    const codigo =
    String(
        p.CODIGO || ""
    )
    .replace(",00","")
    .replace(".00","")
    .trim();

    const especie =
    String(
        p.ESPECIE_END || ""
    )
    .toUpperCase()
    .trim();

   if(

    especie.includes("APANHA")

    &&

    !mapaApanhas[codigo]

){

    mapaApanhas[codigo] = p;

}

if(

    especie.includes("PULM")

){

    if(!mapaPulmoes[codigo]){

        mapaPulmoes[codigo] = [];

    }

    mapaPulmoes[codigo].push(p);

}

});

// =====================================
// CRUZAMENTO
// =====================================

Object.values(
    pedidosAgrupados
)
.forEach(item=>{

    const posicao =
    mapaApanhas[
        item.sku
    ];

const pulmoes =
mapaPulmoes[
    item.sku
] || [];
    
        const saldo =
        Number(posicao?.QTD_END || 0);

        // EMBALAGEM = quantidade de unidades por caixa desse SKU
        // na posição de apanha. Usada para converter o pedido
        // (que vem em unidades) para volume em caixas.
        const embalagem =
        Number(posicao?.EMBALAGEM || 0);

        const caixasPedido =
        embalagem > 0
        ? item.pedido / embalagem
        : 0;

        const normaInfo =
        calcularNorma(
            posicao?.NORMA_APANHA
        );

        const norma = normaInfo.valor;

        let falta = 0;

        if(!posicao){

            falta = item.pedido;

        }else{

            falta = Math.max(
                item.pedido - saldo,
                0
            );

        }

        // ABASTECER nunca pode passar da Norma (capacidade
        // física da posição de apanha), mesmo que o pedido
        // seja maior. FALTA continua sendo o total que falta
        // para o pedido completo (pode exigir mais de uma
        // reposição quando maior que a Norma).
        const abastecer =
        !posicao
        ? falta
        : Math.max(
            Math.min(item.pedido, norma) - saldo,
            0
        );

        const endereco =
        posicao
        ?

        `${posicao.CODRUA}.${posicao.NROPREDIO}.${posicao.NROAPARTAMENTO}.${posicao.NROSALA}`

        :

        "Sem Apanha";

        let status = "OK";

        if(!posicao){

            status = "SEM APANHA";

        }
        else if(falta > 0){

            status = "ABASTECER";

        }




// =====================================
// TRATAMENTO DOS PULMÕES
// =====================================

const listaPulmoes = pulmoes.map(p=>{

    const endereco =
    `${p.CODRUA}.${p.NROPREDIO}.${p.NROAPARTAMENTO}.${p.NROSALA}`;

    return{

        rua:Number(p.CODRUA),

        predio:Number(p.NROPREDIO),

        apartamento:Number(p.NROAPARTAMENTO),

        sala:Number(p.NROSALA),

        endereco,

        quantidade:Number(p.QTD_END||0),

        validade:p.DTAVALIDADE || "",

        validadeTimestamp:parseValidade(p.DTAVALIDADE),

        livre:

            String(
                p.STATUS_ENDERECO||""
            )

            .toUpperCase()

            .includes("LIVRE"),

        objeto:p

    };

});

// =====================================
// ORDENA POR VALIDADE (FEFO)
// =====================================
// O pulmão que vai vencer primeiro sempre aparece
// primeiro na lista — isso é o que alimenta o texto
// "Pulmões" exibido/impresso (inclusive na impressão
// por volume). Pulmões com quantidade zero (vazios)
// vão para o final, pois não representam estoque físico
// disponível a ser priorizado na retirada.

listaPulmoes.sort((a,b)=>{

    const aVazio = a.quantidade <= 0;
    const bVazio = b.quantidade <= 0;

    if(aVazio !== bVazio){
        return aVazio ? 1 : -1;
    }

    return a.validadeTimestamp - b.validadeTimestamp;

});

let enderecoPulmao = "Sem Pulmão";

if(listaPulmoes.length){

    enderecoPulmao =

    listaPulmoes

    .slice(0,3)

    .map(p => p.endereco)

    .join(" | ");

    if(listaPulmoes.length > 3){

        enderecoPulmao +=
        ` (+${listaPulmoes.length - 3} mais)`;

    }

}
    
     resultado.push({

    sku:item.sku,

    descricao:item.descricao,

    pedido:item.pedido,

    endereco,

    pulmao:enderecoPulmao,
pulmoes:listaPulmoes,

ruaApanha:Number(
    posicao?.CODRUA || 0
),

enderecoApanha:endereco,

    pavilhao:
    obterPavilhao(posicao?.CODRUA),

    saldo,

    norma,

    embalagem,

    caixasPedido,

    normaTexto: normaInfo.texto,

    falta,

    abastecer,

    status,

    prioridade:
    falta >= norma
    ? "🔴 CRÍTICO"
    : falta > (norma * 0.5)
    ? "🟠 ALTA"
    : falta > 0
    ? "🟡 NORMAL"
    : "🟢 OK"

});
    });

console.log(
    "Pedidos:",
    dadosPedidos.length
);

console.log(
    "Posições:",
    dadosPosicoes.length
);

console.log(
    "Resultado:",
    resultado.length
);
    
    atualizarKPIs();

    popularFiltroPavilhao();

    // Reaplica os filtros que já estiverem ativos na tela
    // (SKU / Status / Pavilhão) em vez de forçar a tabela
    // sem filtro nenhum. Sem isso, toda vez que a sincronização
    // automática detecta uma mudança no arquivo e reprocessa
    // (a cada 5s), o filtro que o usuário tinha digitado era
    // descartado silenciosamente e a tabela voltava a mostrar
    // tudo — dando a impressão de que o filtro "travou".
    aplicarFiltros();

    console.log(resultado);

}

function atualizarKPIs(){

    document
    .getElementById("kpiSkus")
    .innerText =
    resultado.length;

    document
    .getElementById("kpiAbastecer")
    .innerText =
    resultado.filter(
        x=>x.status==="ABASTECER"
    ).length;

    document
    .getElementById("kpiUnidades")
    .innerText =
    Math.round(
        resultado.reduce(
            (s,x)=>s+(x.caixasPedido||0),
            0
        )
    ).toLocaleString("pt-BR");

    document
    .getElementById("kpiSemApanha")
    .innerText =
    resultado.filter(
        x=>x.status==="SEM APANHA"
    ).length;

    // Pedido geral, em CAIXAS, somando TODOS os SKUs do
    // pedido — independe de status/falta/saldo da apanha.
    // É o volume bruto que veio no pedido (convertido pela
    // embalagem de cada SKU), ponto.
    document
    .getElementById("kpiPedidoTotal")
    .innerText =
    Math.round(
        resultado.reduce(
            (s,x)=>s+(x.caixasPedido||0),
            0
        )
    ).toLocaleString("pt-BR");

}


function renderizarTabela(
    dados = resultado
){

    const tbody =
    document.getElementById(
        "tbodyResultados"
    );

    const selectLinhas =
    document.getElementById(
        "linhasPorPagina"
    );

    const linhasPorPagina =
    selectLinhas
    ? Number(selectLinhas.value)
    : 50;

    const totalPaginas =
    linhasPorPagina > 0
    ? Math.max(
        1,
        Math.ceil(dados.length / linhasPorPagina)
    )
    : 1;

    if(paginaAtual > totalPaginas){
        paginaAtual = totalPaginas;
    }

    if(paginaAtual < 1){
        paginaAtual = 1;
    }

    const dadosPagina =
    linhasPorPagina > 0
    ? dados.slice(
        (paginaAtual - 1) * linhasPorPagina,
        paginaAtual * linhasPorPagina
    )
    : dados;

    let html = "";

    dadosPagina.forEach(item=>{

        html += `
        <tr>

            <td>${item.sku}</td>
            <td>${item.descricao}</td>
            <td>${item.pedido}</td>
           <td>${item.endereco}</td>
           <td>${item.pulmao}</td>
           <td>${item.saldo}</td>
            <td>${item.norma}</td>
            <td>${item.falta}</td>
            <td>${item.status}</td>
            <td>${item.pavilhao}</td>
            <td>${item.prioridade}</td>

        </tr>
        `;

    });

    tbody.innerHTML = html ||
    `<tr><td colspan="11" style="text-align:center;">Nenhum resultado encontrado.</td></tr>`;

    renderizarPaginacao(
        totalPaginas,
        dados.length,
        linhasPorPagina
    );

}

// =====================================
// PAGINAÇÃO
// =====================================

function renderizarPaginacao(
    totalPaginas,
    totalItens,
    linhasPorPagina
){

    const container =
    document.getElementById(
        "paginasContainer"
    );

    const resumo =
    document.getElementById(
        "resumoPaginacao"
    );

    if(!container) return;

    if(totalItens === 0 || linhasPorPagina === 0){

        container.innerHTML = "";

        if(resumo){

            resumo.innerText =
            totalItens === 0
            ? "Nenhum resultado"
            : `Mostrando todos os ${totalItens} resultados`;

        }

        return;

    }

    // Janela de páginas exibidas ao redor da atual,
    // com reticências para não poluir a tela quando
    // há muitas páginas.

    const janela = 2;

    const paginas = [];

    for(let i = 1; i <= totalPaginas; i++){

        const dentroDaJanela =
        i === 1 ||
        i === totalPaginas ||
        (i >= paginaAtual - janela && i <= paginaAtual + janela);

        if(dentroDaJanela){

            paginas.push(i);

        }
        else if(paginas[paginas.length - 1] !== "..."){

            paginas.push("...");

        }

    }

    let html = `
    <button
        class="btn-pagina"
        ${paginaAtual === 1 ? "disabled" : ""}
        onclick="irParaPagina(${paginaAtual - 1})">
        ‹
    </button>
    `;

    paginas.forEach(p=>{

        if(p === "..."){

            html += `<span class="pagina-reticencias">…</span>`;

        }else{

            html += `
            <button
                class="btn-pagina ${p === paginaAtual ? "ativo" : ""}"
                onclick="irParaPagina(${p})">
                ${p}
            </button>
            `;

        }

    });

    html += `
    <button
        class="btn-pagina"
        ${paginaAtual === totalPaginas ? "disabled" : ""}
        onclick="irParaPagina(${paginaAtual + 1})">
        ›
    </button>
    `;

    container.innerHTML = html;

    if(resumo){

        const inicio =
        (paginaAtual - 1) * linhasPorPagina + 1;

        const fim =
        Math.min(paginaAtual * linhasPorPagina, totalItens);

        resumo.innerText =
        `Mostrando ${inicio}–${fim} de ${totalItens}`;

    }

}

function irParaPagina(pagina){

    paginaAtual = pagina;

    renderizarTabela(
        obterResultadoFiltrado()
    );

}


console.log("SCRIPT CARREGADO COM SUCESSO");


// =====================================
// FILTROS
// =====================================

window.addEventListener("load",()=>{

    document
    .getElementById("filtroSKU")
    .addEventListener(
        "input",
        aplicarFiltros
    );

    document
    .getElementById("filtroStatus")
    .addEventListener(
        "change",
        aplicarFiltros
    );

    document
    .getElementById("filtroPavilhao")
    .addEventListener(
        "change",
        aplicarFiltros
    );

    document
    .getElementById("linhasPorPagina")
    .addEventListener(
        "change",
        function(){

            paginaAtual = 1;

            aplicarFiltros();

        }
    );

    document
    .getElementById("filtroMovSKU")
    .addEventListener(
        "input",
        aplicarFiltrosSugestao
    );

    document
    .getElementById("filtroMovRua")
    .addEventListener(
        "input",
        aplicarFiltrosSugestao
    );

    document
    .getElementById("modalSugestao")
    .addEventListener("click", function(e){

        if(e.target === this){

            fecharModalSugestao();

        }

    });

    document
    .getElementById("filtroLiber210SKU")
    .addEventListener(
        "input",
        aplicarFiltrosLiberacao210
    );

    document
    .getElementById("filtroLiber210Rua")
    .addEventListener(
        "input",
        aplicarFiltrosLiberacao210
    );

    document
    .getElementById("modalLiberacao210")
    .addEventListener("click", function(e){

        if(e.target === this){

            fecharModalLiberacao210();

        }

    });

    document.addEventListener("keydown", function(e){

        if(e.key === "Escape"){

            fecharModalSugestao();

            fecharModalLiberacao210();

        }

    });

});

function obterResultadoFiltrado(){

    const skuFiltro =
    document
    .getElementById("filtroSKU")
    .value
    .toLowerCase()
    .trim();

    const statusFiltro =
    document
    .getElementById("filtroStatus")
    .value;

    const pavilhoesFiltro =
    obterPavilhoesFiltroAtual();

    return resultado.filter(item=>{

        const skuOk =

            item.sku
            .toString()
            .toLowerCase()
            .includes(skuFiltro);

        const statusOk =

            !statusFiltro ||

            item.status ===
            statusFiltro;

        const pavilhaoOk =

            !pavilhoesFiltro.length ||

            pavilhoesFiltro.includes(item.pavilhao);

        return skuOk && statusOk && pavilhaoOk;

    });

}

function aplicarFiltros(){

    paginaAtual = 1;

    renderizarTabela(
        obterResultadoFiltrado()
    );

}

// =====================================
// EXPORTAR EXCEL
// =====================================

function exportarExcel(){

    if(!resultado.length){

        alert(
            "Nenhum dado para exportar. Processe os arquivos primeiro."
        );

        return;

    }

    const dados =
    obterResultadoFiltrado();

    const linhas = dados.map(item=>({

        "SKU": item.sku,

        "Descrição": item.descricao,

        "Pedido": item.pedido,

        "Endereço Apanha": item.endereco,

        "Pulmão": item.pulmao,

        "Saldo Atual": item.saldo,

        "Norma": item.norma,

        "Falta": item.falta,

        "Status": item.status,

        "Pavilhão": item.pavilhao,

        "Prioridade": item.prioridade

    }));

    const planilha =
    XLSX.utils.json_to_sheet(linhas);

    const workbook =
    XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        planilha,
        "Abastecimento"
    );

    const dataHoje =
    new Date()
    .toISOString()
    .slice(0,10);

    XLSX.writeFile(
        workbook,
        `abastecimento_${dataHoje}.xlsx`
    );

}


// =====================================
// IMPRIMIR POR VOLUME (PEDIDO)
// =====================================
// Lista todos os itens a abastecer ordenados pelo
// volume do Pedido, sempre do maior para o menor,
// sem agrupar por rua ou qualquer outro critério.
function imprimirAbastecimentoPorVolume(){

    // Respeita o pavilhão selecionado em Filtros. Se estiver
    // em "Todos Pavilhões", imprime tudo como antes.
    const pavilhoesFiltro =
    obterPavilhoesFiltroAtual();

    const dadosImpressao =

    resultado

    .filter(item => item.status === "ABASTECER")

    .filter(item =>
        !pavilhoesFiltro.length ||
        pavilhoesFiltro.includes(item.pavilhao)
    )

    // Mesma regra da impressão por rua: só entram
    // itens que possuem pulmão cadastrado.
    .filter(item => item.pulmao !== "Sem Pulmão")

    // Sempre pelo Pedido (o número que aparece impresso),
    // do maior para o menor — nunca pelo saldo faltante,
    // que pode divergir do Pedido e confundir o operador.
    .sort((a,b)=> (b.pedido||0) - (a.pedido||0));

    let html = `

<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Gerador de Abastecimento PCP</title>

<style>

@page{

    size:A4 portrait;

    margin:34mm 8mm 14mm 8mm;

    @top-center{
        content: element(cabecalhoCorrente);
    }

}

/* Numeração de páginas — ímpar = frente, par = verso */
@page :right{

    @bottom-center{
        content:"Página " counter(page) " (frente)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

@page :left{

    @bottom-center{
        content:"Página " counter(page) " (verso)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

*{

    box-sizing:border-box;

}

body{

    font-family:Arial,Helvetica,sans-serif;

    color:#222;

    margin:0;

    padding:0;

}

h1{

    margin:0;

    text-align:center;

    color:#1e3a8a;

    font-size:18px;

    margin-bottom:8px;

}

.cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

    margin-bottom:8px;

    font-size:12px;

}

table{

    width:100%;

    border-collapse:collapse;

    table-layout:fixed;

    page-break-before:auto;

}


tr{

    page-break-inside:avoid;

}

th{

    background:#2563eb;

    color:white;

    padding:10px;

    border:1px solid #d9d9d9;

    font-size:12px;

}

td{

    border:1px solid #d9d9d9;

    padding:8px;

    vertical-align:top;

    font-size:11px;

}

.colSku{

    width:26%;

}

.colApanha{

    width:13%;

}

.colPulmao{

    width:24%;

}

.colReposicao{

    width:37%;

}

.cabecalho-corrente{

    position: running(cabecalhoCorrente);

}

.critico{

    background:#ffe5e5;

}

.alta{

    background:#fff4cf;

}

.normal{

    background:white;

}

.sku{

    font-size:20px;

    font-weight:bold;

    margin-bottom:6px;

}

.descricao{

    font-size:12px;

    line-height:17px;

}

.apanha{

    font-size:15px;

    font-weight:bold;

}

.pulmao{

    line-height:18px;

}

.reposicao{

    text-align:left;

    font-size:11px;

    line-height:16px;

}

.reposicao .pedido-linha{

    font-weight:bold;

    font-size:14px;

    margin-bottom:8px;

}

.reposicao .campo-manual{

    margin-top:8px;

}

.reposicao .rotulo-manual{

    display:block;

    font-size:10px;

    color:#555;

    margin-bottom:3px;

}

.reposicao .caixa-escrever{

    display:block;

    height:28px;

    border:1.5px solid #888;

    border-radius:4px;

    background:#fff;

}

.titulo-pagina{

    color:#1e3a8a;

    padding:0 0 8px 0;

    font-size:18px;

    font-weight:bold;

    text-align:center;

}

.meta-pagina{

    color:#222;

    border-bottom:2px solid #2563eb;

    padding:0 0 8px 0;

    font-size:12px;

    font-weight:normal;

    text-align:left;

}

.meta-pagina .cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

}

.validade-pulmao{

    color:#666;

    font-size:9.5px;

}

@media print{

    body{

        zoom:100%;

    }

    .critico,
    .alta,
    .titulo-pagina,
    .meta-pagina{

        -webkit-print-color-adjust:exact;

        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<div class="cabecalho-corrente">

    <div class="titulo-pagina">🚚 GERADOR DE ABASTECIMENTO PCP — POR VOLUME FALTANTE</div>

    <div class="meta-pagina">
        <div class="cabecalho">
            <div><b>Data:</b> ${new Date().toLocaleString("pt-BR")}</div>
            <div><b>Pavilhão:</b> ${pavilhoesFiltro.length ? pavilhoesFiltro.join(", ") : "Todos"}</div>
            <div><b>Total:</b> ${dadosImpressao.length} SKUs</div>
        </div>
    </div>

</div>

<table>

<thead>

<tr>

<th class="colSku">

SKU / Descrição

</th>

<th class="colApanha">

Apanha

</th>

<th class="colPulmao">

Pulmões

</th>

<th class="colReposicao">

Reposição

</th>

</tr>

</thead>


<tbody>

`;

dadosImpressao.forEach(item=>{

    let classe = "normal";

    if(item.prioridade === "🔴 CRÍTICO"){

        classe = "critico";

    }
    else if(item.prioridade === "🟠 ALTA"){

        classe = "alta";

    }

    const listaPulmoesItem = item.pulmoes || [];

    const pulmoesParaExibir =
    listaPulmoesItem.slice(0, 3);

    const pulmoesRestantes =
    listaPulmoesItem.length - pulmoesParaExibir.length;

    let pulmoes = "Sem Pulmão";

    if(pulmoesParaExibir.length){

        pulmoes =
        pulmoesParaExibir
        .map(p=>{

            const validadeTexto =
            p.validadeTimestamp !== Infinity
            ? new Date(p.validadeTimestamp).toLocaleDateString("pt-BR")
            : "s/ validade";

            return `• ${p.endereco} <span class="validade-pulmao">(val. ${validadeTexto})</span>`;

        })
        .join("<br>");

        if(pulmoesRestantes > 0){

            pulmoes +=
            `<br><b>(+${pulmoesRestantes} mais)</b>`;

        }

    }


    html += `

    <tr class="${classe}">

        <td>

            <div class="sku">

                ${item.sku}

            </div>

            <div class="descricao">

                ${item.descricao}

            </div>

        </td>

        <td class="apanha">

            ${item.endereco}

        </td>

        <td class="pulmao">

            ${pulmoes}

        </td>

        <td class="reposicao">

            <div class="pedido-linha">Pedido: ${item.pedido}</div>

            <div class="campo-manual">
                <span class="rotulo-manual">Volume abastecido</span>
                <span class="caixa-escrever"></span>
            </div>

            <div class="campo-manual">
                <span class="rotulo-manual">Ajuste apanha</span>
                <span class="caixa-escrever"></span>
            </div>

        </td>

    </tr>

    `;

});

html += `

</tbody>

</table>

<script>
window.PagedConfig = {
    after: () => {
        window.focus();
        window.print();
    }
};
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

</body>

</html>

`;
const janela = window.open("", "_blank");

if(!janela){

    alert("O navegador bloqueou a janela de impressão.");

    return;

}

janela.document.open();

janela.document.write(html);

janela.document.close();

}

// =====================================
// IMPRIMIR ITENS SEM PULMÃO
// =====================================
// Lista os itens que precisam de abastecimento (ABASTECER)
// mas não têm NENHUM endereço de pulmão cadastrado no CD —
// ou seja, não há de onde puxar reposição automaticamente.
// Precisam de verificação manual (pode ser falta de cadastro,
// SKU novo, ou estoque realmente zerado em todo o depósito).
function imprimirSemPulmao(){

    // Respeita o pavilhão selecionado em Filtros. Se estiver
    // em "Todos Pavilhões", imprime tudo como antes.
    const pavilhoesFiltro =
    obterPavilhoesFiltroAtual();

    const dadosImpressao =

    resultado

    .filter(item => item.status === "ABASTECER")

    .filter(item => item.pulmao === "Sem Pulmão")

    .filter(item =>
        !pavilhoesFiltro.length ||
        pavilhoesFiltro.includes(item.pavilhao)
    )

    .sort((a,b)=>{

        const ruaA =
        Number(a.endereco.split(".")[0]) || 0;

        const ruaB =
        Number(b.endereco.split(".")[0]) || 0;

        if(ruaA !== ruaB){

            return ruaA - ruaB;

        }

        return (b.pedido||0) - (a.pedido||0);

    });

    if(!dadosImpressao.length){

        alert("Nenhum item sem pulmão para imprimir (com os filtros atuais).");

        return;

    }

    let html = `

<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Gerador de Abastecimento PCP — Sem Pulmão</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm 8mm 14mm 8mm;

}

/* Numeração de páginas — ímpar = frente, par = verso */
@page :right{

    @bottom-center{
        content:"Página " counter(page) " (frente)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

@page :left{

    @bottom-center{
        content:"Página " counter(page) " (verso)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

*{

    box-sizing:border-box;

}

body{

    font-family:Arial,Helvetica,sans-serif;

    color:#222;

    margin:0;

    padding:0;

}

h1{

    margin:0;

    text-align:center;

    color:#b91c1c;

    font-size:18px;

    margin-bottom:8px;

}

.cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

    margin-bottom:8px;

    font-size:12px;

}

table{

    width:100%;

    border-collapse:collapse;

    table-layout:fixed;

    page-break-before:auto;

}


tr{

    page-break-inside:avoid;

}

th{

    background:#b91c1c;

    color:white;

    padding:10px;

    border:1px solid #d9d9d9;

    font-size:12px;

}

td{

    border:1px solid #d9d9d9;

    padding:8px;

    vertical-align:top;

    font-size:11px;

}

.colSku{

    width:30%;

}

.colApanha{

    width:15%;

}

.colAlerta{

    width:31%;

}

.colReposicao{

    width:24%;

}

.rua{

    background:#7f1d1d !important;

    color:#fff !important;

    font-size:18px;

    font-weight:bold;

    padding:12px;

    text-align:left;

}

.sku{

    font-size:20px;

    font-weight:bold;

    margin-bottom:6px;

}

.descricao{

    font-size:12px;

    line-height:17px;

}

.apanha{

    font-size:15px;

    font-weight:bold;

}

.alerta{

    line-height:16px;

    font-size:11px;

    font-weight:bold;

    color:#b91c1c;

}

.reposicao{

    text-align:left;

    font-size:11px;

    line-height:16px;

}

.reposicao .pedido-linha{

    font-weight:bold;

    font-size:14px;

    margin-bottom:8px;

}

.reposicao .campo-manual{

    margin-top:8px;

}

.reposicao .rotulo-manual{

    display:block;

    font-size:10px;

    color:#555;

    margin-bottom:3px;

}

.reposicao .caixa-escrever{

    display:block;

    height:28px;

    border:1.5px solid #888;

    border-radius:4px;

    background:#fff;

}

.titulo-pagina th{

    background:#fff !important;

    color:#b91c1c;

    border:none;

    padding:2px 0 8px 0;

    font-size:18px;

    font-weight:bold;

    text-align:center;

}

.meta-pagina th{

    background:#fff !important;

    color:#222;

    border:none;

    border-bottom:2px solid #b91c1c;

    padding:0 0 8px 0;

    font-size:12px;

    font-weight:normal;

    text-align:left;

}

.meta-pagina .cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

}

@media print{

    body{

        zoom:100%;

    }

    .rua,
    .titulo-pagina th,
    .meta-pagina th{

        -webkit-print-color-adjust:exact;

        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<table>

<thead>

<tr class="titulo-pagina">

<th colspan="4">⚠️ ITENS SEM PULMÃO — VERIFICAÇÃO MANUAL</th>

</tr>

<tr class="meta-pagina">

<th colspan="4">

    <div class="cabecalho">

        <div><b>Data:</b> ${new Date().toLocaleString("pt-BR")}</div>

        <div><b>Pavilhão:</b> ${pavilhoesFiltro.length ? pavilhoesFiltro.join(", ") : "Todos"}</div>

        <div><b>Total:</b> ${dadosImpressao.length} SKUs</div>

    </div>

</th>

</tr>

<tr>

<th class="colSku">

SKU / Descrição

</th>

<th class="colApanha">

Apanha

</th>

<th class="colAlerta">

Situação

</th>

<th class="colReposicao">

Reposição

</th>

</tr>

</thead>

<tbody>

`;

let ruaAtual = "";

dadosImpressao.forEach(item=>{

    const rua =
    item.endereco.split(".")[0];

    if(rua !== ruaAtual){

        ruaAtual = rua;

        html += `

        <tr>

            <td
                colspan="4"
                class="rua">

                📍 RUA ${rua}

            </td>

        </tr>

        `;

    }

    html += `

    <tr>

        <td>

            <div class="sku">

                ${item.sku}

            </div>

            <div class="descricao">

                ${item.descricao}

            </div>

        </td>

        <td class="apanha">

            ${item.endereco}

        </td>

        <td class="alerta">

            ⚠️ Nenhum pulmão cadastrado.<br>
            Verificar estoque manualmente.

        </td>

        <td class="reposicao">

            <div class="pedido-linha">Pedido: ${item.pedido}</div>

            <div class="campo-manual">
                <span class="rotulo-manual">Volume abastecido</span>
                <span class="caixa-escrever"></span>
            </div>

            <div class="campo-manual">
                <span class="rotulo-manual">Origem usada</span>
                <span class="caixa-escrever"></span>
            </div>

        </td>

    </tr>

    `;

});

html += `

</tbody>

</table>

<script>
window.PagedConfig = {
    after: () => {
        window.focus();
        window.print();
    }
};
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

</body>

</html>

`;
const janela = window.open("", "_blank");

if(!janela){

    alert("O navegador bloqueou a janela de impressão.");

    return;

}

janela.document.open();

janela.document.write(html);

janela.document.close();

}

// =====================================
// IMPRIMIR PEDIDO GERAL
// =====================================
// Lista TODOS os SKUs do pedido, de qualquer status
// (OK, ABASTECER, SEM APANHA) — sem descontar o saldo
// da apanha. É a visão bruta do pedido inteiro, igual
// ao KPI "Pedido Total (Unidades)".
function imprimirPedidoGeral(){

    // Respeita o pavilhão selecionado em Filtros. Se estiver
    // em "Todos Pavilhões", imprime tudo como antes.
    const pavilhoesFiltro =
    obterPavilhoesFiltroAtual();

    const dadosImpressao =

    resultado

    .filter(item =>
        !pavilhoesFiltro.length ||
        pavilhoesFiltro.includes(item.pavilhao)
    )

    // Sempre por quantidade pedida, do maior para o menor.
    .sort((a,b)=> (b.pedido||0) - (a.pedido||0));

    if(!dadosImpressao.length){

        alert("Nenhum SKU para imprimir (com os filtros atuais).");

        return;

    }

    const totalPedido =
    dadosImpressao.reduce(
        (s,x)=>s+(x.pedido||0),
        0
    );

    let html = `

<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Gerador de Abastecimento PCP — Pedido Geral</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm 8mm 14mm 8mm;

}

/* Numeração de páginas — ímpar = frente, par = verso */
@page :right{

    @bottom-center{
        content:"Página " counter(page) " (frente)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

@page :left{

    @bottom-center{
        content:"Página " counter(page) " (verso)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

*{

    box-sizing:border-box;

}

body{

    font-family:Arial,Helvetica,sans-serif;

    color:#222;

    margin:0;

    padding:0;

}

h1{

    margin:0;

    text-align:center;

    color:#1e3a8a;

    font-size:18px;

    margin-bottom:8px;

}

.cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

    margin-bottom:8px;

    font-size:12px;

}

table{

    width:100%;

    border-collapse:collapse;

    table-layout:fixed;

    page-break-before:auto;

}


tr{

    page-break-inside:avoid;

}

th{

    background:#2563eb;

    color:white;

    padding:10px;

    border:1px solid #d9d9d9;

    font-size:12px;

}

td{

    border:1px solid #d9d9d9;

    padding:8px;

    vertical-align:top;

    font-size:11px;

}

.colSku{

    width:26%;

}

.colApanha{

    width:13%;

}

.colPulmao{

    width:24%;

}

.colReposicao{

    width:37%;

}

.critico{

    background:#ffe5e5;

}

.alta{

    background:#fff4cf;

}

.normal{

    background:white;

}

.sku{

    font-size:20px;

    font-weight:bold;

    margin-bottom:6px;

}

.descricao{

    font-size:12px;

    line-height:17px;

}

.apanha{

    font-size:15px;

    font-weight:bold;

}

.pulmao{

    line-height:18px;

}

.reposicao{

    text-align:left;

    font-size:11px;

    line-height:16px;

}

.reposicao .pedido-linha{

    font-weight:bold;

    font-size:14px;

    margin-bottom:8px;

}

.reposicao .campo-manual{

    margin-top:8px;

}

.reposicao .rotulo-manual{

    display:block;

    font-size:10px;

    color:#555;

    margin-bottom:3px;

}

.reposicao .caixa-escrever{

    display:block;

    height:28px;

    border:1.5px solid #888;

    border-radius:4px;

    background:#fff;

}

.titulo-pagina th{

    background:#fff !important;

    color:#1e3a8a;

    border:none;

    padding:2px 0 8px 0;

    font-size:18px;

    font-weight:bold;

    text-align:center;

}

.meta-pagina th{

    background:#fff !important;

    color:#222;

    border:none;

    border-bottom:2px solid #2563eb;

    padding:0 0 8px 0;

    font-size:12px;

    font-weight:normal;

    text-align:left;

}

.meta-pagina .cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

}

@media print{

    body{

        zoom:100%;

    }

    .critico,
    .alta,
    .titulo-pagina th,
    .meta-pagina th{

        -webkit-print-color-adjust:exact;

        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<table>

<thead>

<tr class="titulo-pagina">

<th colspan="4">📋 GERADOR DE ABASTECIMENTO PCP — PEDIDO GERAL</th>

</tr>

<tr class="meta-pagina">

<th colspan="4">

    <div class="cabecalho">

        <div><b>Data:</b> ${new Date().toLocaleString("pt-BR")}</div>

        <div><b>Pavilhão:</b> ${pavilhoesFiltro.length ? pavilhoesFiltro.join(", ") : "Todos"}</div>

        <div><b>Total:</b> ${dadosImpressao.length} SKUs — ${totalPedido.toLocaleString("pt-BR")} unidades pedidas</div>

    </div>

</th>

</tr>

<tr>

<th class="colSku">

SKU / Descrição

</th>

<th class="colApanha">

Apanha

</th>

<th class="colPulmao">

Pulmões

</th>

<th class="colReposicao">

Reposição

</th>

</tr>

</thead>

<tbody>

`;

dadosImpressao.forEach(item=>{

    let classe = "normal";

    if(item.prioridade === "🔴 CRÍTICO"){

        classe = "critico";

    }
    else if(item.prioridade === "🟠 ALTA"){

        classe = "alta";

    }

    let pulmoes =
    item.pulmao;

    pulmoes =

    pulmoes

    .replace(/\s*\|\s*/g,"<br>• ")

    .replace(/^/,"• ")

    .replace("<br>• (+","<br><b>(+");

    html += `

    <tr class="${classe}">

        <td>

            <div class="sku">

                ${item.sku}

            </div>

            <div class="descricao">

                ${item.descricao}

            </div>

        </td>

        <td class="apanha">

            ${item.endereco}

        </td>

        <td class="pulmao">

            ${pulmoes}

        </td>

        <td class="reposicao">

            <div class="pedido-linha">Pedido: ${item.pedido}</div>

            <div class="campo-manual">
                <span class="rotulo-manual">Volume abastecido</span>
                <span class="caixa-escrever"></span>
            </div>

            <div class="campo-manual">
                <span class="rotulo-manual">Ajuste apanha</span>
                <span class="caixa-escrever"></span>
            </div>

        </td>

    </tr>

    `;

});

html += `

</tbody>

</table>

<script>
window.PagedConfig = {
    after: () => {
        window.focus();
        window.print();
    }
};
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

</body>

</html>

`;
const janela = window.open("", "_blank");

if(!janela){

    alert("O navegador bloqueou a janela de impressão.");

    return;

}

janela.document.open();

janela.document.write(html);

janela.document.close();

}

// =====================================
// MAPA DE PULMÕES LIVRES (PRÉ-CALCULADO)
// =====================================
// Antes: buscarPulmaoLivre() filtrava TODAS as
// dadosPosicoes a cada chamada. Como ela é chamada
// dentro de dois forEach aninhados (resultado x
// pulmoes), isso gerava centenas de milhares/milhões
// de comparações e travava a tela.
// Agora: montamos o mapa rua -> [candidatos livres]
// UMA ÚNICA VEZ, e a busca vira O(1).

function construirMapaPulmoesLivres(dadosPosicoes){

    const mapa = {};

    dadosPosicoes.forEach(p=>{

        const especie =
        String(
            p.ESPECIE_END || ""
        )
        .toUpperCase();

        if(!especie.includes("PULM")){
            return;
        }

        const status =
        String(
            p.STATUS_ENDERECO || ""
        )
        .toUpperCase()
        .trim();

        // Apenas endereços com status "Disponivel" podem
        // ser usados como destino. "Reservado" já está
        // comprometido para outra finalidade e não é
        // uma vaga real, mesmo estando com QTD_END vazio.
        const livre =
            status === "DISPONIVEL";

        if(!livre){
            return;
        }

        const rua = Number(p.CODRUA);

        if(!mapa[rua]){
            mapa[rua] = [];
        }

        mapa[rua].push(p);

    });

    // ordena cada rua por prédio, uma vez só
    Object.values(mapa).forEach(lista=>{

        lista.sort((a,b)=>
            Number(a.NROPREDIO) - Number(b.NROPREDIO)
        );

    });

    return mapa;

}

// =====================================
// BUSCAR MELHOR PULMÃO LIVRE (O(1) via mapa)
// =====================================

function buscarPulmaoLivre(rua, mapaPulmoesLivres){

    const candidatos =
    mapaPulmoesLivres[Number(rua)];

    if(!candidatos || !candidatos.length){

        return null;

    }

    // Remove o candidato da lista (splice) em vez de
    // apenas lê-lo (candidatos[0]). Assim, uma vez que
    // um endereço é dado como destino para uma linha,
    // ele deixa de existir no pool e não pode ser
    // sugerido novamente para outra linha até que a
    // movimentação real seja executada e a base
    // recarregada.
    return candidatos.shift();

}

// =====================================
// SUGESTÃO DE MOVIMENTAÇÃO
// =====================================

let sugestoesMovimentacao = [];

async function gerarSugestoesMovimentacao(){

    if(!resultado.length){

        alert(
            "Processe os arquivos primeiro."
        );

        return;

    }

    mostrarLoading();

    // libera a thread principal por um instante
    // para o navegador conseguir pintar o spinner
    // antes de começar o processamento pesado
    await new Promise(resolve=>setTimeout(resolve,50));

    try{

        sugestoesMovimentacao = [];

        const mapaPulmoesLivres =
        construirMapaPulmoesLivres(
            dadosPosicoes
        );

        // =====================================
        // 1) MONTA CANDIDATOS (sem reservar destino)
        // =====================================
        // Antes, o destino era reservado na mesma hora
        // em que o candidato era encontrado — como o loop
        // segue a ordem do arquivo (rua crescente), os
        // pulmões mais PRÓXIMOS acabavam consumindo os
        // endereços livres antes dos mais DISTANTES,
        // mesmo estes tendo mais economia a ganhar.

        const candidatos = [];

        resultado.forEach(item=>{

            // sem apanha cadastrada, não dá pra
            // comparar rua da apanha x rua do pulmão

            if(item.status === "SEM APANHA"){

                return;

            }

            if(
                !item.pulmoes ||
                !item.pulmoes.length
            ){

                return;

            }

            item.pulmoes.forEach(pulmao=>{

                if(pulmao.quantidade <= 0){

                    return; // pulmão vazio, nada a mover

                }

                // NÍVEL 1: só interessa quando a rua
                // do pulmão é DIFERENTE da rua da apanha

                if(pulmao.rua === item.ruaApanha){

                    return;

                }

                const economia =
                Math.abs(
                    pulmao.rua - item.ruaApanha
                );

                candidatos.push({
                    item,
                    pulmao,
                    economia
                });

            });

        });

        // =====================================
        // 2) PRIORIZA MAIOR ECONOMIA
        // =====================================
        // Reordena os candidatos por economia decrescente
        // ANTES de reservar qualquer endereço. Assim, quando
        // há poucas vagas livres numa rua, elas vão para quem
        // realmente ganha mais com a movimentação (pulmão
        // mais distante primeiro).

        candidatos.sort(
            (a,b)=>b.economia - a.economia
        );

        // =====================================
        // 3) RESERVA OS DESTINOS NESSA ORDEM
        // =====================================

        candidatos.forEach(({item,pulmao,economia})=>{

            const destino =
            buscarPulmaoLivre(
                item.ruaApanha,
                mapaPulmoesLivres
            );

            const enderecoDestino =
            destino
            ? `${destino.CODRUA}.${destino.NROPREDIO}.${destino.NROAPARTAMENTO}.${destino.NROSALA}`
            : null;

            sugestoesMovimentacao.push({

                sku: item.sku,

                descricao: item.descricao,

                ruaApanha: item.ruaApanha,

                ruaPulmao: pulmao.rua,

                enderecoApanha: item.enderecoApanha,

                enderecoPulmaoAtual: pulmao.endereco,

                moverPara: enderecoDestino,

                economia,

                quantidade: pulmao.quantidade

            });

        });

        // ordenação final só para exibição
        // (a alocação já respeitou a prioridade)

        sugestoesMovimentacao.sort(
            (a,b)=>b.economia - a.economia
        );

        abrirModalSugestao();

    }

    catch(erro){

        console.error(erro);

        alert(
            "Erro ao gerar sugestões de movimentação."
        );

    }

    finally{

        ocultarLoading();

    }

}

// =====================================
// MODAL DE SUGESTÃO
// =====================================

function abrirModalSugestao(){

    const modal =
    document.getElementById("modalSugestao");

    if(!modal){

        alert(
            "Modal de sugestão não encontrado no HTML."
        );

        return;

    }

    document.getElementById("filtroMovSKU").value = "";

    document.getElementById("filtroMovRua").value = "";

    atualizarKPIsSugestao();

    renderizarTabelaSugestoes(
        sugestoesMovimentacao
    );

    modal.classList.add("ativo");

}

function fecharModalSugestao(){

    document
    .getElementById("modalSugestao")
    .classList.remove("ativo");

}

function atualizarKPIsSugestao(){

    document.getElementById("movTotal").innerText =
    sugestoesMovimentacao.length;

    document.getElementById("movAlta").innerText =
    sugestoesMovimentacao.filter(
        x=>x.economia >= 20
    ).length;

    document.getElementById("movMedia").innerText =
    sugestoesMovimentacao.filter(
        x=>x.economia >= 10 && x.economia < 20
    ).length;

    document.getElementById("movUnidades").innerText =
    sugestoesMovimentacao.reduce(
        (s,x)=>s+x.economia,
        0
    );

}

function renderizarTabelaSugestoes(dados){

    const tbody =
    document.getElementById("tbodySugestoes");

    if(!dados.length){

        tbody.innerHTML =
        `<tr><td colspan="6" style="text-align:center;padding:30px;color:#6b7280;">
        Nenhuma sugestão encontrada. Todos os pulmões já estão na mesma rua da apanha.
        </td></tr>`;

        return;

    }

    let html = "";

    dados.forEach(item=>{

        const classe =

        item.economia >= 20
        ? "prioridade-alta"
        : item.economia >= 10
        ? "prioridade-media"
        : "prioridade-baixa";

        const moverParaTexto =

        item.moverPara

        ? item.moverPara

        : `<span style="color:#d32f2f;">Sem posição livre na rua ${String(item.ruaApanha).padStart(3,"0")}</span>`;

        html += `
        <tr>
            <td>${item.sku}</td>
            <td style="text-align:left;">${item.descricao}</td>
            <td>${item.enderecoApanha}</td>
            <td>${item.enderecoPulmaoAtual}</td>
            <td>${moverParaTexto}</td>
            <td class="${classe}">${item.economia} ${item.economia===1?"rua":"ruas"}</td>
        </tr>
        `;

    });

    tbody.innerHTML = html;

}

function obterSugestoesFiltradas(){

    const skuFiltro =
    document
    .getElementById("filtroMovSKU")
    .value
    .toLowerCase()
    .trim();

    const ruaFiltro =
    document
    .getElementById("filtroMovRua")
    .value
    .toLowerCase()
    .trim();

    return sugestoesMovimentacao.filter(item=>{

        const skuOk =
        item.sku
        .toString()
        .toLowerCase()
        .includes(skuFiltro);

        const ruaOk =

        !ruaFiltro ||

        String(item.ruaApanha)
        .toLowerCase()
        .includes(ruaFiltro) ||

        String(item.ruaPulmao)
        .toLowerCase()
        .includes(ruaFiltro);

        return skuOk && ruaOk;

    });

}

function aplicarFiltrosSugestao(){

    renderizarTabelaSugestoes(
        obterSugestoesFiltradas()
    );

}

function imprimirSugestoesModal(){

    if(!sugestoesMovimentacao.length){

        alert("Nenhuma sugestão para imprimir.");

        return;

    }

    const janela = window.open("", "_blank");

    if(!janela){

        alert("Permita pop-ups para este site.");

        return;

    }

    // Imprime respeitando o filtro de SKU/Rua que
    // estiver digitado na tela naquele momento. Se os
    // campos estiverem vazios, imprime tudo (comportamento
    // igual a antes).
    imprimirSugestoes(
        janela,
        obterSugestoesFiltradas()
    );

}

// =====================================
// IMPRIMIR SUGESTÕES
// =====================================
function imprimirSugestoes(janela, dadosBase){

    const base =
    dadosBase || sugestoesMovimentacao;

    // Na impressão, mostramos apenas sugestões que
    // realmente têm um pulmão livre para mover. Itens
    // sem posição livre continuam visíveis no modal em
    // tela, só não entram na versão impressa.
    const dados =
    base.filter(
        item => item.moverPara
    );

    if(!dados.length){

        alert("Nenhuma sugestão com posição livre para imprimir.");

        return;

    }

    // Ordena só por economia — quem está mais longe
    // (maior economia ao mover) vem primeiro, sem
    // agrupar/priorizar por rua.
    dados.sort((a,b)=> b.economia - a.economia);


    let html = `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Sugestão de Movimentação</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm 8mm 14mm 8mm;

}

/* Numeração de páginas — ímpar = frente, par = verso */
@page :right{

    @bottom-center{
        content:"Página " counter(page) " (frente)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

@page :left{

    @bottom-center{
        content:"Página " counter(page) " (verso)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

*{

    box-sizing:border-box;

}

body{

    font-family:Arial,Helvetica,sans-serif;

    margin:0;

    color:#222;

}

h1{

    margin:0;

    text-align:center;

    color:#0F4C81;

    font-size:22px;

}

.info{

    display:flex;

    justify-content:space-between;

    margin:15px 0;

    font-size:13px;

}

table{

    width:100%;

    border-collapse:collapse;

}

th{

    background:#0F4C81;

    color:#fff;

    padding:10px;

    border:1px solid #DDD;

    font-size:12px;

}

td{

    border:1px solid #DDD;

    padding:8px;

    font-size:11px;

}

.rua{

    background:#1E3A8A;

    color:white;

    font-weight:bold;

    font-size:15px;

}

.alta{

    background:#ffdede;

}

.media{

    background:#fff2d6;

}

.baixa{

    background:#ffffdd;

}

@media print{

    .rua,
    th,
    .alta,
    .media,
    .baixa{

        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<h1>

📦 SUGESTÃO DE MOVIMENTAÇÃO

</h1>

<div class="info">

<div>

<b>Data:</b>

${new Date().toLocaleString("pt-BR")}

</div>

<div>

<b>Total:</b>

${dados.length}

</div>

</div>

<table>

<thead>

<tr>

<th>SKU</th>

<th>Produto</th>

<th>Apanha</th>

<th>Pulmão Atual</th>

<th>Mover para</th>

<th>Economia</th>

</tr>

</thead>

<tbody>

`;

    dados.forEach(item=>{

        let classe="";

        if(item.economia>=20){

            classe="alta";

        }
        else if(item.economia>=10){

            classe="media";

        }
        else{

            classe="baixa";

        }

        html += `

<tr class="${classe}">

<td>

<b>${item.sku}</b>

</td>

<td>

${item.descricao}

</td>

<td>

${item.enderecoApanha}

</td>

<td>

${item.enderecoPulmaoAtual}

</td>

<td>

${item.moverPara || "Sem posição livre"}

</td>

<td style="text-align:center;">

<b>${item.economia} ${item.economia===1?"rua":"ruas"}</b>

</td>

</tr>

`;

    });

    html += `

</tbody>

</table>

<script>
window.PagedConfig = {
    after: () => {
        window.focus();
        window.print();
    }
};
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

</body>

</html>

`;



    janela.document.open();

    janela.document.write(html);

    janela.document.close();

}

// =====================================
// LIBERAÇÃO DE ENDEREÇOS 2.10
// =====================================
// Identifica pallets baixos (pouca quantidade) ocupando
// endereços de Pulmão do tipo "2.10" (posições altas) e
// sugere movê-los para um endereço livre do tipo "1.5"
// (posições baixas), liberando o espaço alto para pallets
// que realmente precisam da altura.
//
// Usa os mesmos dados de Posição de Endereços já carregados
// pelo upload único do topo da página (dadosPosicoes) — é a
// mesma base que alimenta o Resultado (pedido geral / apanha
// / abastecimento) e a Sugestão de Movimentação. Nenhum
// upload extra é necessário: as 3 funções leem a mesma base.
//
// O campo que identifica o tipo físico do endereço é o
// TIPEND (mesmo campo já logado no console ao processar). Como
// o texto exato gravado nesse campo pode variar no arquivo real
// (ex: "2.10", "2,10", "PULM 2.10"...), os padrões de busca
// ficam editáveis na tela — ajuste-os conforme o valor real que
// aparecer no console (F12) caso a lista venha vazia.

let liberacao210 = [];

function normalizarTipend(valor){

    return String(valor || "")
    .toUpperCase()
    .replace(",", ".")
    .replace(/\s+/g, "")
    .trim();

}

function enderecoCorrespondeAltura(tipendValor, padrao){

    const alvo = normalizarTipend(padrao);

    if(!alvo) return false;

    return normalizarTipend(tipendValor).includes(alvo);

}

function formatarCaixas(numero){

    return Number(numero || 0)
    .toLocaleString("pt-BR", {
        minimumFractionDigits:0,
        maximumFractionDigits:2
    });

}

// =====================================
// MAPA DE PULMÕES 1.5 LIVRES
// =====================================

function construirMapaPulmoes15Livres(dadosPosicoes, padraoBaixo){

    const mapa = {};

    dadosPosicoes.forEach(p=>{

        const especie =
        String(p.ESPECIE_END || "").toUpperCase();

        if(!especie.includes("PULM")){
            return;
        }

        const status =
        String(p.STATUS_ENDERECO || "")
        .toUpperCase()
        .trim();

        if(status !== "DISPONIVEL"){
            return;
        }

        if(!enderecoCorrespondeAltura(p.TIPEND_PULMAO, padraoBaixo)){
            return;
        }

        const rua = Number(p.CODRUA);

        if(!mapa[rua]){
            mapa[rua] = [];
        }

        mapa[rua].push(p);

    });

    Object.values(mapa).forEach(lista=>{

        lista.sort((a,b)=>
            Number(a.NROPREDIO) - Number(b.NROPREDIO)
        );

    });

    return mapa;

}

function buscarPulmao15Livre(rua, mapa){

    const candidatos = mapa[Number(rua)];

    if(!candidatos || !candidatos.length){
        return null;
    }

    return candidatos.shift();

}

// =====================================
// MAPA DE RUA DA APANHA POR SKU
// =====================================
// A liberação de 2.10 precisa saber, para cada SKU, em
// qual rua fica a posição de Apanha — é essa rua que manda
// na escolha do endereço de destino 1.5, não a rua onde o
// pulmão 2.10 está hoje.

function construirMapaApanhaPorSku(dadosPosicoes){

    const mapa = {};

    dadosPosicoes.forEach(p=>{

        const especie =
        String(p.ESPECIE_END || "").toUpperCase();

        if(!especie.includes("APANHA")){
            return;
        }

        const sku =
        String(p.CODIGO || "")
        .replace(",00","")
        .replace(".00","")
        .trim();

        if(!sku || mapa[sku] !== undefined){
            return;
        }

        mapa[sku] = Number(p.CODRUA);

    });

    return mapa;

}

// =====================================
// BUSCA DE DESTINO 1.5 — PRIORIZA RUA DA APANHA
// =====================================
// 1) Tenta primeiro um endereço 1.5 livre exatamente na
//    rua informada (a rua da apanha do SKU).
// 2) Se não encontrar, joga para a rua mais próxima da
//    apanha que ainda tiver endereço 1.5 livre — nunca
//    pela rua onde o pulmão 2.10 está hoje.

function buscarPulmao15MaisProximo(ruaAlvo, mapa){

    const direto =
    buscarPulmao15Livre(ruaAlvo, mapa);

    if(direto){
        return direto;
    }

    let melhorRua = null;
    let menorDistancia = Infinity;

    Object.keys(mapa).forEach(ruaChave=>{

        const rua = Number(ruaChave);
        const candidatos = mapa[rua];

        if(!candidatos || !candidatos.length){
            return;
        }

        const distancia =
        Math.abs(rua - Number(ruaAlvo));

        if(
            distancia < menorDistancia ||
            (distancia === menorDistancia && rua < melhorRua)
        ){
            menorDistancia = distancia;
            melhorRua = rua;
        }

    });

    if(melhorRua === null){
        return null;
    }

    return buscarPulmao15Livre(melhorRua, mapa);

}

// =====================================
// GERAR LIBERAÇÃO 2.10
// =====================================

async function gerarLiberacao210(){

    if(!dadosPosicoes.length){

        alert(
            "Processe os arquivos primeiro (carregue a Posição de Endereços)."
        );

        return;

    }

    mostrarLoading();

    await new Promise(resolve=>setTimeout(resolve,50));

    try{

        const padraoAlto =
        (document.getElementById("liber210PadraoAlto")?.value || "").trim()
        || "2.10";

        const padraoBaixo =
        (document.getElementById("liber210PadraoBaixo")?.value || "").trim()
        || "1.50";

        // Number("0") || 50 daria 50, porque 0 é "falsy" em JS —
        // isso fazia o campo "0" (sem limite de ocupação) virar
        // silenciosamente 50%. Aqui só cai no padrão de 50 quando
        // o campo está realmente vazio ou não é um número válido.
        const ocupacaoMaxInput =
        document.getElementById("liber210OcupacaoMax")?.value;

        const ocupacaoMax =
        ocupacaoMaxInput !== undefined &&
        ocupacaoMaxInput !== null &&
        String(ocupacaoMaxInput).trim() !== "" &&
        !isNaN(Number(ocupacaoMaxInput))
        ? Number(ocupacaoMaxInput)
        : 50;

        const temTipend =
        dadosPosicoes.some(p=>
            p.TIPEND_PULMAO !== undefined &&
            String(p.TIPEND_PULMAO).trim() !== ""
        );

        if(!temTipend){

            alert(
                "A Posição de Endereços carregada não tem a coluna TIPEND_PULMAO preenchida — " +
                "sem ela não é possível identificar quais endereços são 2.10 ou 1.5. " +
                "Confira no console (F12) o nome real dessa coluna no seu arquivo."
            );

            ocultarLoading();

            return;

        }

        const mapaPulmoes15 =
        construirMapaPulmoes15Livres(
            dadosPosicoes,
            padraoBaixo
        );

        const mapaApanhaPorSku =
        construirMapaApanhaPorSku(
            dadosPosicoes
        );

        liberacao210 = [];

        dadosPosicoes.forEach(p=>{

            const especie =
            String(p.ESPECIE_END || "").toUpperCase();

            if(!especie.includes("PULM")){
                return;
            }

            if(!enderecoCorrespondeAltura(p.TIPEND_PULMAO, padraoAlto)){
                return;
            }

            const qtdEnd = Number(p.QTD_END || 0);

            if(qtdEnd <= 0){
                return; // endereço vazio, nada a liberar
            }

            const embalagem = Number(p.EMBALAGEM || 0);

            // Conversão de unidades para caixas — sempre.
            const caixas =
            embalagem > 0
            ? qtdEnd / embalagem
            : 0;

            const normaInfo =
            calcularNorma(p.NORMA_PULMAO);

            const norma = normaInfo.valor;

            const ocupacao =
            norma > 0
            ? (caixas / norma) * 100
            : null;

            // Pouca quantidade = ocupação abaixo do limite definido
            // na tela. Sem norma conhecida, usa um piso conservador
            // de 5 caixas para não deixar de detectar o candidato.
            const baixaOcupacao =
            ocupacao !== null
            ? ocupacao <= ocupacaoMax
            : (caixas > 0 && caixas <= 5);

            if(!baixaOcupacao){
                return;
            }

            const enderecoAtual =
            `${p.CODRUA}.${p.NROPREDIO}.${p.NROAPARTAMENTO}.${p.NROSALA}`;

            const skuAtual =
            String(p.CODIGO || "").trim();

            // Rua da apanha desse SKU manda na escolha do
            // destino. Sem apanha cadastrada (raro), cai de
            // volta na rua do próprio pulmão como segurança.
            const ruaApanha =
            mapaApanhaPorSku[skuAtual] !== undefined
            ? mapaApanhaPorSku[skuAtual]
            : Number(p.CODRUA);

            const destino =
            buscarPulmao15MaisProximo(
                ruaApanha,
                mapaPulmoes15
            );

            const enderecoDestino =
            destino
            ? `${destino.CODRUA}.${destino.NROPREDIO}.${destino.NROAPARTAMENTO}.${destino.NROSALA}`
            : null;

            liberacao210.push({

                sku: skuAtual,

                descricao: p.DESCRICAO || "",

                rua: Number(p.CODRUA) || 0,

                ruaApanha,

                enderecoAtual,

                tipendAtual: String(p.TIPEND_PULMAO || "").trim(),

                caixas,

                embalagem,

                norma,

                ocupacao,

                enderecoDestino,

                tipendDestino:
                destino ? String(destino.TIPEND_PULMAO || "").trim() : ""

            });

        });

        liberacao210.sort((a,b)=> a.caixas - b.caixas);

        abrirModalLiberacao210();

    }

    catch(erro){

        console.error(erro);

        alert("Erro ao gerar liberação de endereços 2.10.");

    }

    finally{

        ocultarLoading();

    }

}

// =====================================
// MODAL DE LIBERAÇÃO 2.10
// =====================================

function abrirModalLiberacao210(){

    const modal =
    document.getElementById("modalLiberacao210");

    if(!modal){

        alert(
            "Modal de liberação de endereços não encontrado no HTML."
        );

        return;

    }

    document.getElementById("filtroLiber210SKU").value = "";

    document.getElementById("filtroLiber210Rua").value = "";

    atualizarKPIsLiberacao210();

    renderizarTabelaLiberacao210(
        liberacao210
    );

    modal.classList.add("ativo");

}

function fecharModalLiberacao210(){

    document
    .getElementById("modalLiberacao210")
    .classList.remove("ativo");

}

function atualizarKPIsLiberacao210(){

    document.getElementById("liber210Total").innerText =
    liberacao210.length;

    document.getElementById("liber210SemDestino").innerText =
    liberacao210.filter(x=>!x.enderecoDestino).length;

    document.getElementById("liber210ComDestino").innerText =
    liberacao210.filter(x=>x.enderecoDestino).length;

    document.getElementById("liber210Caixas").innerText =
    formatarCaixas(
        liberacao210.reduce((s,x)=>s+x.caixas,0)
    );

}

function renderizarTabelaLiberacao210(dados){

    const tbody =
    document.getElementById("tbodyLiber210");

    if(!dados.length){

        tbody.innerHTML =
        `<tr><td colspan="10" style="text-align:center;padding:30px;color:#6b7280;">
        Nenhum endereço 2.10 com pallet baixo encontrado com os critérios atuais.
        </td></tr>`;

        return;

    }

    let html = "";

    dados.forEach(item=>{

        const classe =

        item.ocupacao !== null && item.ocupacao <= 20
        ? "prioridade-alta"
        : item.ocupacao !== null && item.ocupacao <= 35
        ? "prioridade-media"
        : "prioridade-baixa";

        const ocupacaoTexto =
        item.ocupacao !== null
        ? `${item.ocupacao.toFixed(0)}%`
        : "N/D";

        const moverParaTexto =
        item.enderecoDestino
        ? item.enderecoDestino
        : `<span style="color:#d32f2f;">Sem endereço 1.5 livre em nenhuma rua</span>`;

        html += `
        <tr>
            <td>${item.sku}</td>
            <td style="text-align:left;">${item.descricao}</td>
            <td>${String(item.rua).padStart(3,"0")}</td>
            <td>${String(item.ruaApanha).padStart(3,"0")}</td>
            <td>${item.enderecoAtual}</td>
            <td style="font-size:.75rem;color:var(--text-muted);">${item.tipendAtual || "—"}</td>
            <td>${formatarCaixas(item.caixas)}</td>
            <td class="${classe}">${ocupacaoTexto}</td>
            <td>${moverParaTexto}</td>
            <td style="font-size:.75rem;color:var(--text-muted);">${item.tipendDestino || "—"}</td>
        </tr>
        `;

    });

    tbody.innerHTML = html;

}

function obterLiberacao210Filtrada(){

    const skuFiltro =
    (document.getElementById("filtroLiber210SKU")?.value || "")
    .toLowerCase()
    .trim();

    const ruaFiltro =
    (document.getElementById("filtroLiber210Rua")?.value || "")
    .toLowerCase()
    .trim();

    return liberacao210.filter(item=>{

        const skuOk =
        item.sku
        .toString()
        .toLowerCase()
        .includes(skuFiltro);

        const ruaOk =

        !ruaFiltro ||

        String(item.rua)
        .toLowerCase()
        .includes(ruaFiltro);

        return skuOk && ruaOk;

    });

}

function aplicarFiltrosLiberacao210(){

    renderizarTabelaLiberacao210(
        obterLiberacao210Filtrada()
    );

}

function imprimirLiberacao210Modal(){

    const dadosFiltrados =
    obterLiberacao210Filtrada();

    if(!dadosFiltrados.length){

        alert(
            "Nenhum item para imprimir com os filtros de SKU/Rua atuais."
        );

        return;

    }

    const janela = window.open("", "_blank");

    if(!janela){

        alert("Permita pop-ups para este site.");

        return;

    }

    imprimirLiberacao210(
        janela,
        dadosFiltrados
    );

}

// =====================================
// IMPRIMIR LIBERAÇÃO 2.10
// =====================================

function imprimirLiberacao210(janela, dadosBase){

    const dados =
    dadosBase || liberacao210;

    if(!dados.length){

        alert("Nenhum item para imprimir.");

        return;

    }

    let html = `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Liberação de Endereços 2.10</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm 8mm 14mm 8mm;

}

@page :right{

    @bottom-center{
        content:"Página " counter(page) " (frente)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

@page :left{

    @bottom-center{
        content:"Página " counter(page) " (verso)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

*{

    box-sizing:border-box;

}

body{

    font-family:Arial,Helvetica,sans-serif;

    margin:0;

    color:#222;

}

h1{

    margin:0;

    text-align:center;

    color:#0F4C81;

    font-size:22px;

}

.info{

    display:flex;

    justify-content:space-between;

    margin:15px 0;

    font-size:13px;

}

table{

    width:100%;

    border-collapse:collapse;

}

th{

    background:#0F4C81;

    color:#fff;

    padding:10px;

    border:1px solid #DDD;

    font-size:12px;

}

td{

    border:1px solid #DDD;

    padding:8px;

    font-size:11px;

}

.alta{

    background:#ffdede;

}

.media{

    background:#fff2d6;

}

.baixa{

    background:#ffffdd;

}

@media print{

    th,
    .alta,
    .media,
    .baixa{

        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<h1>

🧱 LIBERAÇÃO DE ENDEREÇOS 2.10

</h1>

<div class="info">

<div>

<b>Data:</b>

${new Date().toLocaleString("pt-BR")}

</div>

<div>

<b>Total:</b>

${dados.length}

</div>

</div>

<table>

<thead>

<tr>

<th>SKU</th>

<th>Produto</th>

<th>Rua</th>

<th>Rua Apanha</th>

<th>Endereço 2.10</th>

<th>TIPEND Atual</th>

<th>Caixas</th>

<th>Ocupação</th>

<th>Mover para (1.5)</th>

<th>TIPEND Destino</th>

</tr>

</thead>

<tbody>

`;

    dados.forEach(item=>{

        let classe = "baixa";

        if(item.ocupacao !== null && item.ocupacao <= 20){

            classe = "alta";

        }
        else if(item.ocupacao !== null && item.ocupacao <= 35){

            classe = "media";

        }

        html += `

<tr class="${classe}">

<td>

<b>${item.sku}</b>

</td>

<td>

${item.descricao}

</td>

<td style="text-align:center;">

${String(item.rua).padStart(3,"0")}

</td>

<td style="text-align:center;">

${String(item.ruaApanha).padStart(3,"0")}

</td>

<td>

${item.enderecoAtual}

</td>

<td style="text-align:center;font-size:9px;color:#666;">

${item.tipendAtual || "—"}

</td>

<td style="text-align:center;">

<b>${formatarCaixas(item.caixas)}</b>

</td>

<td style="text-align:center;">

${item.ocupacao !== null ? item.ocupacao.toFixed(0) + "%" : "N/D"}

</td>

<td>

${item.enderecoDestino || "Sem endereço 1.5 livre em nenhuma rua"}

</td>

<td style="text-align:center;font-size:9px;color:#666;">

${item.tipendDestino || "—"}

</td>

</tr>

`;

    });

    html += `

</tbody>

</table>

<script>
window.PagedConfig = {
    after: () => {
        window.focus();
        window.print();
    }
};
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

</body>

</html>

`;

    janela.document.open();

    janela.document.write(html);

    janela.document.close();

}

// =====================================
// ENDEREÇOS DISPONÍVEIS POR ALTURA
// =====================================
// Lista os endereços com STATUS_ENDERECO = "Disponivel" filtrando
// pela altura do PRÓPRIO endereço. A altura do endereço vem SEMPRE
// da coluna TIPEND_PULMAO — a TIPEND_PRODUTO é a altura do produto
// que ocupa o endereço (não existe produto num endereço disponível,
// então ela é ignorada de propósito aqui, mesmo que venha preenchida).

let enderecosDisponiveis = [];

async function gerarEnderecosDisponiveis(){

    if(!dadosPosicoes.length){

        alert(
            "Processe os arquivos primeiro (carregue ao menos a Posição de Endereços e clique em Processar Dados)."
        );

        return;

    }

    try{

        mostrarLoading();

        // Dá um respiro pro navegador desenhar o spinner antes do
        // processamento pesado (evita a sensação de "travou").
        await new Promise(resolve=>requestAnimationFrame(()=>
            requestAnimationFrame(resolve)
        ));

        enderecosDisponiveis =
        dadosPosicoes
        .filter(p=>{

            const status =
            String(p.STATUS_ENDERECO || "")
            .toUpperCase()
            .trim();

            return status === "DISPONIVEL";

        })
        .map(p=>{

            const especie =
            String(p.ESPECIE_END || "").toUpperCase();

            const rua = Number(p.CODRUA) || 0;

            return {

                endereco:
                `${p.CODRUA}.${p.NROPREDIO}.${p.NROAPARTAMENTO}.${p.NROSALA}`,

                deposito: p.DEPOSITO || "",

                // Pavilhão calculado pela RUA (mesma classificação
                // oficial usada no resto do sistema) — a coluna
                // PAVILHAO que vem da WMS não é confiável.
                pavilhao: obterPavilhao(rua),

                subdivisao: p.SUBDIVISAO || "",

                rua,

                especie: p.ESPECIE_END || "",

                especieNorm:
                especie.includes("PULM") ? "PULMAO" : "APANHA",

                // Altura do próprio endereço — SEMPRE TIPEND_PULMAO,
                // nunca TIPEND_PRODUTO (por instrução explícita).
                altura:
                String(p.TIPEND_PULMAO || "").trim()

            };

        });

        enderecosDisponiveis.sort((a,b)=>

            a.rua - b.rua ||
            a.endereco.localeCompare(b.endereco)

        );

        preencherFiltroAlturaDisponiveis();

        preencherFiltroPavilhaoDisponiveis();

        preencherFiltroSubdivisaoDisponiveis();

        abrirModalEnderecosDisponiveis();

    }

    catch(erro){

        console.error(erro);

        alert(
            "Erro ao gerar lista de endereços disponíveis: " +
            (erro?.message || erro)
        );

    }

    finally{

        ocultarLoading();

    }

}

function preencherFiltroAlturaDisponiveis(){

    const select =
    document.getElementById("filtroDispAltura");

    if(!select) return;

    const valorAtual = select.value;

    const alturas =
    [...new Set(
        enderecosDisponiveis
        .map(x=>x.altura)
        .filter(v=>v !== "")
    )]
    .sort();

    select.innerHTML =
    `<option value="">Todas as alturas</option>` +
    alturas
    .map(a=>`<option value="${a}">${a}</option>`)
    .join("");

    if(alturas.includes(valorAtual)){
        select.value = valorAtual;
    }

}

function preencherFiltroPavilhaoDisponiveis(){

    const select =
    document.getElementById("filtroDispPavilhao");

    if(!select) return;

    const valorAtual = select.value;

    // Ordem fixa (mesma ordem da config PAVILHOES), com
    // "Sem Pavilhão" só aparecendo se realmente houver endereços
    // fora das faixas conhecidas.
    const nomesConhecidos =
    PAVILHOES.map(p=>p.nome);

    const pavilhoesPresentes =
    new Set(
        enderecosDisponiveis.map(x=>x.pavilhao)
    );

    const pavilhoes =
    nomesConhecidos
    .filter(n=>pavilhoesPresentes.has(n))
    .concat(
        pavilhoesPresentes.has("Sem Pavilhão")
        ? ["Sem Pavilhão"]
        : []
    );

    select.innerHTML =
    `<option value="">Todos os pavilhões</option>` +
    pavilhoes
    .map(p=>`<option value="${p}">${p}</option>`)
    .join("");

    if(pavilhoes.includes(valorAtual)){
        select.value = valorAtual;
    }

}

// Subdivisões marcadas no dropdown de checkboxes. Guardamos por
// nome (string) — quando null, ainda não foi inicializado e o
// filtro trata como "todas selecionadas".
let subdivisoesSelecionadasDisponiveis = null;

function preencherFiltroSubdivisaoDisponiveis(){

    const lista =
    document.getElementById("dropdownDispSubdivisaoLista");

    if(!lista) return;

    const subdivisoes =
    [...new Set(
        enderecosDisponiveis
        .map(x=>x.subdivisao)
        .filter(v=>v !== "")
    )]
    .sort((a,b)=>a.localeCompare(b, "pt-BR"));

    // Sempre que a lista é (re)gerada, começa com tudo marcado —
    // simples e previsível para o usuário.
    subdivisoesSelecionadasDisponiveis = new Set(subdivisoes);

    if(!subdivisoes.length){

        lista.innerHTML =
        `<div class="dropdown-check-vazio">Nenhuma subdivisão encontrada</div>`;

    } else {

        lista.innerHTML =
        subdivisoes.map(s=>{

            const marcado =
            subdivisoesSelecionadasDisponiveis.has(s);

            const idSeguro =
            "chkSubdiv_" + s.replace(/[^a-zA-Z0-9]/g,"_");

            return `<label class="dropdown-check-item" for="${idSeguro}">
                <input
                    type="checkbox"
                    id="${idSeguro}"
                    value="${s}"
                    ${marcado ? "checked" : ""}
                    onchange="alternarSubdivisaoDisponiveis('${s.replace(/'/g,"\\'")}', this.checked)">
                <span>${s}</span>
            </label>`;

        }).join("");

    }

    atualizarLabelDropdownSubdivisaoDisponiveis(subdivisoes.length);

}

function atualizarLabelDropdownSubdivisaoDisponiveis(totalSubdivisoes){

    const label =
    document.getElementById("dropdownDispSubdivisaoLabel");

    if(!label) return;

    const total =
    totalSubdivisoes ??
    new Set(enderecosDisponiveis.map(x=>x.subdivisao).filter(v=>v!=="")).size;

    const selecionadas =
    subdivisoesSelecionadasDisponiveis
    ? subdivisoesSelecionadasDisponiveis.size
    : total;

    if(!total || selecionadas === total){
        label.textContent = "Todas as subdivisões";
    } else if(selecionadas === 0){
        label.textContent = "Nenhuma subdivisão";
    } else {
        label.textContent = `${selecionadas} de ${total} subdivisões`;
    }

}

function alternarSubdivisaoDisponiveis(nome, marcado){

    if(!subdivisoesSelecionadasDisponiveis){
        subdivisoesSelecionadasDisponiveis = new Set();
    }

    if(marcado){
        subdivisoesSelecionadasDisponiveis.add(nome);
    } else {
        subdivisoesSelecionadasDisponiveis.delete(nome);
    }

    atualizarLabelDropdownSubdivisaoDisponiveis();

    aplicarFiltrosEnderecosDisponiveis();

}

function marcarTodasSubdivisoesDisponiveis(marcarTudo){

    const subdivisoes =
    [...new Set(
        enderecosDisponiveis
        .map(x=>x.subdivisao)
        .filter(v=>v !== "")
    )];

    subdivisoesSelecionadasDisponiveis =
    marcarTudo
    ? new Set(subdivisoes)
    : new Set();

    const lista =
    document.getElementById("dropdownDispSubdivisaoLista");

    if(lista){

        lista
        .querySelectorAll("input[type=checkbox]")
        .forEach(chk=> chk.checked = marcarTudo);

    }

    atualizarLabelDropdownSubdivisaoDisponiveis();

    aplicarFiltrosEnderecosDisponiveis();

}

function alternarDropdownSubdivisaoDisponiveis(evento){

    evento.stopPropagation();

    const dropdown =
    document.getElementById("dropdownDispSubdivisao");

    if(!dropdown) return;

    const jaAberto =
    dropdown.classList.contains("aberto");

    dropdown.classList.toggle("aberto", !jaAberto);

    if(!jaAberto){

        // Fecha ao clicar fora — listener de uso único.
        setTimeout(()=>{

            document.addEventListener(
                "click",
                function fecharAoClicarFora(e){

                    if(!dropdown.contains(e.target)){

                        dropdown.classList.remove("aberto");

                        document.removeEventListener(
                            "click",
                            fecharAoClicarFora
                        );

                    }

                }
            );

        }, 0);

    }

}

function abrirModalEnderecosDisponiveis(){

    const modal =
    document.getElementById("modalEnderecosDisponiveis");

    if(!modal){

        alert(
            "Modal de endereços disponíveis não encontrado no HTML."
        );

        return;

    }

    const campoRua = document.getElementById("filtroDispRua");
    const campoEndereco = document.getElementById("filtroDispEndereco");
    const campoEspecie = document.getElementById("filtroDispEspecie");
    const campoPavilhao = document.getElementById("filtroDispPavilhao");

    if(campoRua) campoRua.value = "";
    if(campoEndereco) campoEndereco.value = "";
    if(campoEspecie) campoEspecie.value = "";
    if(campoPavilhao) campoPavilhao.value = "";

    document
    .getElementById("dropdownDispSubdivisao")
    ?.classList.remove("aberto");

    atualizarKPIsEnderecosDisponiveis(
        enderecosDisponiveis
    );

    renderizarTabelaEnderecosDisponiveis(
        enderecosDisponiveis
    );

    modal.classList.add("ativo");

}

function fecharModalEnderecosDisponiveis(){

    document
    .getElementById("modalEnderecosDisponiveis")
    .classList.remove("ativo");

}

function atualizarKPIsEnderecosDisponiveis(dados){

    document.getElementById("dispTotal").innerText =
    dados.length;

    document.getElementById("dispApanha").innerText =
    dados.filter(x=>x.especieNorm === "APANHA").length;

    document.getElementById("dispPulmao").innerText =
    dados.filter(x=>x.especieNorm === "PULMAO").length;

    document.getElementById("dispRuas").innerText =
    new Set(
        dados.map(x=>x.rua)
    ).size;

}

// Limite de linhas desenhadas de uma vez na tabela. Bases de
// posição costumam ter dezenas/centenas de milhares de linhas —
// montar uma tabela HTML gigante de uma vez trava a aba por vários
// segundos (parece "carregando infinitamente"). Acima do limite,
// mostramos um aviso pedindo para refinar pelos filtros.
const LIMITE_LINHAS_TABELA_DISP = 3000;

function renderizarTabelaEnderecosDisponiveis(dados){

    const tbody =
    document.getElementById("tbodyDisp");

    if(!tbody) return;

    if(!dados.length){

        tbody.innerHTML =
        `<tr><td colspan="7" style="text-align:center;padding:30px;color:#6b7280;">
        Nenhum endereço disponível encontrado com os critérios atuais.
        </td></tr>`;

        return;

    }

    const excedeLimite =
    dados.length > LIMITE_LINHAS_TABELA_DISP;

    const dadosParaExibir =
    excedeLimite
    ? dados.slice(0, LIMITE_LINHAS_TABELA_DISP)
    : dados;

    const linhas =
    dadosParaExibir.map(item=>

        `<tr>
            <td>${item.endereco}</td>
            <td>${item.deposito || "—"}</td>
            <td>${item.pavilhao || "—"}</td>
            <td>${item.subdivisao || "—"}</td>
            <td>${String(item.rua).padStart(3,"0")}</td>
            <td>${item.especie || "—"}</td>
            <td style="font-size:.75rem;color:var(--text-muted);">${item.altura || "—"}</td>
        </tr>`

    );

    if(excedeLimite){

        linhas.push(
            `<tr><td colspan="7" style="text-align:center;padding:16px;color:var(--amber);">
            Mostrando ${LIMITE_LINHAS_TABELA_DISP.toLocaleString("pt-BR")} de
            ${dados.length.toLocaleString("pt-BR")} endereços. Use os filtros
            (rua, espécie, altura ou endereço) para refinar a busca.
            </td></tr>`
        );

    }

    tbody.innerHTML = linhas.join("");

}

function obterEnderecosDisponiveisFiltrados(){

    const alturaFiltro =
    document.getElementById("filtroDispAltura")?.value || "";

    const especieFiltro =
    document.getElementById("filtroDispEspecie")?.value || "";

    const pavilhaoFiltro =
    document.getElementById("filtroDispPavilhao")?.value || "";

    const ruaFiltro =
    (document.getElementById("filtroDispRua")?.value || "")
    .toLowerCase()
    .trim();

    const enderecoFiltro =
    (document.getElementById("filtroDispEndereco")?.value || "")
    .toLowerCase()
    .trim();

    return enderecosDisponiveis.filter(item=>{

        const alturaOk =
        !alturaFiltro || item.altura === alturaFiltro;

        const especieOk =
        !especieFiltro || item.especieNorm === especieFiltro;

        const pavilhaoOk =
        !pavilhaoFiltro || item.pavilhao === pavilhaoFiltro;

        // Sem subdivisão marcada no dado (string vazia) sempre
        // passa — o filtro só restringe subdivisões conhecidas.
        const subdivisaoOk =
        !subdivisoesSelecionadasDisponiveis ||
        item.subdivisao === "" ||
        subdivisoesSelecionadasDisponiveis.has(item.subdivisao);

        const ruaOk =
        !ruaFiltro ||
        String(item.rua)
        .toLowerCase()
        .includes(ruaFiltro);

        const enderecoOk =
        !enderecoFiltro ||
        item.endereco
        .toLowerCase()
        .includes(enderecoFiltro);

        return alturaOk && especieOk && pavilhaoOk && subdivisaoOk && ruaOk && enderecoOk;

    });

}

function aplicarFiltrosEnderecosDisponiveis(){

    const filtrados =
    obterEnderecosDisponiveisFiltrados();

    atualizarKPIsEnderecosDisponiveis(
        filtrados
    );

    renderizarTabelaEnderecosDisponiveis(
        filtrados
    );

}

function imprimirEnderecosDisponiveisModal(){

    const dadosFiltrados =
    obterEnderecosDisponiveisFiltrados();

    if(!dadosFiltrados.length){

        alert(
            "Nenhum item para imprimir com os filtros atuais."
        );

        return;

    }

    const janela = window.open("", "_blank");

    if(!janela){

        alert("Permita pop-ups para este site.");

        return;

    }

    imprimirEnderecosDisponiveis(
        janela,
        dadosFiltrados
    );

}

// =====================================
// IMPRIMIR ENDEREÇOS DISPONÍVEIS
// =====================================

function imprimirEnderecosDisponiveis(janela, dadosBase){

    const dados =
    dadosBase || enderecosDisponiveis;

    if(!dados.length){

        alert("Nenhum item para imprimir.");

        return;

    }

    let html = `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Endereços Disponíveis</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm 8mm 14mm 8mm;

}

*{

    box-sizing:border-box;

}

body{

    font-family:Arial,Helvetica,sans-serif;

    margin:0;

    color:#222;

}

h1{

    margin:0;

    text-align:center;

    color:#0F4C81;

    font-size:22px;

}

.info{

    display:flex;

    justify-content:space-between;

    margin:15px 0;

    font-size:13px;

}

table{

    width:100%;

    border-collapse:collapse;

}

th{

    background:#0F4C81;

    color:#fff;

    padding:10px;

    border:1px solid #DDD;

    font-size:12px;

}

td{

    border:1px solid #DDD;

    padding:8px;

    font-size:11px;

}

@media print{

    th{

        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<h1>

🟩 ENDEREÇOS DISPONÍVEIS POR ALTURA

</h1>

<div class="info">

<div>

<b>Data:</b>

${new Date().toLocaleString("pt-BR")}

</div>

<div>

<b>Total:</b>

${dados.length}

</div>

</div>

<table>

<thead>

<tr>

<th>Endereço</th>

<th>Depósito</th>

<th>Pavilhão</th>

<th>Subdivisão</th>

<th>Rua</th>

<th>Espécie</th>

<th>Altura (TIPEND Pulmão)</th>

</tr>

</thead>

<tbody>

`;

    dados.forEach(item=>{

        html += `

<tr>

<td>

<b>${item.endereco}</b>

</td>

<td>

${item.deposito || "—"}

</td>

<td>

${item.pavilhao || "—"}

</td>

<td>

${item.subdivisao || "—"}

</td>

<td style="text-align:center;">

${String(item.rua).padStart(3,"0")}

</td>

<td>

${item.especie || "—"}

</td>

<td style="text-align:center;font-size:9px;color:#666;">

${item.altura || "—"}

</td>

</tr>

`;

    });

    html += `

</tbody>

</table>

<script>
window.PagedConfig = {
    after: () => {
        window.focus();
        window.print();
    }
};
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

</body>

</html>

`;

    janela.document.open();

    janela.document.write(html);

    janela.document.close();

}

// =====================================
// ESTOQUE PULMÃO — DISPONIBILIDADE POR ALTURA
// =====================================
// Mesma ideia de "Endereços Disponíveis", mas usando o arquivo leve
// Estoque Pulmão (só Pulmão, atualiza rápido) como base de STATUS,
// e a Posição de Endereços (já carregada no upload do topo) só como
// dicionário de altura (TIPEND_PULMAO) e subdivisão por endereço —
// assim não é preciso reexportar/reprocessar o arquivo pesado toda
// vez que só a disponibilidade muda.

let estoquePulmao = [];

let subdivisoesSelecionadasEstoquePulmao = null;

function construirMapaAlturaSubdivisaoPorEndereco(){

    const mapa = {};

    dadosPosicoes.forEach(p=>{

        const chave =
        `${p.CODRUA}.${p.NROPREDIO}.${p.NROAPARTAMENTO}.${p.NROSALA}`;

        mapa[chave] = {

            altura:
            String(p.TIPEND_PULMAO || "").trim(),

            subdivisao: p.SUBDIVISAO || ""

        };

    });

    return mapa;

}

async function gerarEstoquePulmao(){

    if(!dadosPosicoes.length){

        alert(
            "Carregue a Posição de Endereços primeiro (upload do topo) — " +
            "é ela que fornece a altura (TIPEND_PULMAO) de cada endereço."
        );

        return;

    }

    if(!dadosEstoquePulmao.length){

        alert(
            "Carregue o arquivo Estoque Pulmão (upload do topo) — é ele " +
            "que fornece a disponibilidade atual, de forma bem mais leve " +
            "do que reprocessar a Posição de Endereços inteira."
        );

        return;

    }

    try{

        mostrarLoading();

        await new Promise(resolve=>requestAnimationFrame(()=>
            requestAnimationFrame(resolve)
        ));

        const mapaAltura =
        construirMapaAlturaSubdivisaoPorEndereco();

        estoquePulmao =
        dadosEstoquePulmao.map(p=>{

            const rua = Number(p.CODRUA) || 0;

            const endereco =
            `${p.CODRUA}.${p.NROPREDIO}.${p.NROAPARTAMENTO}.${p.NROSALA}`;

            const info =
            mapaAltura[endereco] || { altura:"", subdivisao:"" };

            return {

                endereco,

                deposito: p.CODDEPOSITO || "",

                pavilhao: obterPavilhao(rua),

                subdivisao: info.subdivisao,

                rua,

                altura: info.altura,

                status:
                String(p.STATUS || "").trim(),

                statusNorm:
                String(p.STATUS || "").toUpperCase().trim()

            };

        });

        estoquePulmao.sort((a,b)=>

            a.rua - b.rua ||
            a.endereco.localeCompare(b.endereco)

        );

        preencherFiltroAlturaEstoquePulmao();

        preencherFiltroPavilhaoEstoquePulmao();

        preencherFiltroSubdivisaoEstoquePulmao();

        abrirModalEstoquePulmao();

    }

    catch(erro){

        console.error(erro);

        alert(
            "Erro ao gerar Estoque Pulmão: " +
            (erro?.message || erro)
        );

    }

    finally{

        ocultarLoading();

    }

}

function preencherFiltroAlturaEstoquePulmao(){

    const select =
    document.getElementById("filtroEstPulAltura");

    if(!select) return;

    const valorAtual = select.value;

    const alturas =
    [...new Set(
        estoquePulmao
        .map(x=>x.altura)
        .filter(v=>v !== "")
    )]
    .sort();

    select.innerHTML =
    `<option value="">Todas as alturas</option>` +
    alturas
    .map(a=>`<option value="${a}">${a}</option>`)
    .join("");

    if(alturas.includes(valorAtual)){
        select.value = valorAtual;
    }

}

function preencherFiltroPavilhaoEstoquePulmao(){

    const select =
    document.getElementById("filtroEstPulPavilhao");

    if(!select) return;

    const valorAtual = select.value;

    const nomesConhecidos =
    PAVILHOES.map(p=>p.nome);

    const pavilhoesPresentes =
    new Set(
        estoquePulmao.map(x=>x.pavilhao)
    );

    const pavilhoes =
    nomesConhecidos
    .filter(n=>pavilhoesPresentes.has(n))
    .concat(
        pavilhoesPresentes.has("Sem Pavilhão")
        ? ["Sem Pavilhão"]
        : []
    );

    select.innerHTML =
    `<option value="">Todos os pavilhões</option>` +
    pavilhoes
    .map(p=>`<option value="${p}">${p}</option>`)
    .join("");

    if(pavilhoes.includes(valorAtual)){
        select.value = valorAtual;
    }

}

function preencherFiltroSubdivisaoEstoquePulmao(){

    const lista =
    document.getElementById("dropdownEstPulSubdivisaoLista");

    if(!lista) return;

    const subdivisoes =
    [...new Set(
        estoquePulmao
        .map(x=>x.subdivisao)
        .filter(v=>v !== "")
    )]
    .sort((a,b)=>a.localeCompare(b, "pt-BR"));

    subdivisoesSelecionadasEstoquePulmao = new Set(subdivisoes);

    if(!subdivisoes.length){

        lista.innerHTML =
        `<div class="dropdown-check-vazio">Nenhuma subdivisão encontrada</div>`;

    } else {

        lista.innerHTML =
        subdivisoes.map(s=>{

            const marcado =
            subdivisoesSelecionadasEstoquePulmao.has(s);

            const idSeguro =
            "chkSubdivEstPul_" + s.replace(/[^a-zA-Z0-9]/g,"_");

            return `<label class="dropdown-check-item" for="${idSeguro}">
                <input
                    type="checkbox"
                    id="${idSeguro}"
                    value="${s}"
                    ${marcado ? "checked" : ""}
                    onchange="alternarSubdivisaoEstoquePulmao('${s.replace(/'/g,"\\'")}', this.checked)">
                <span>${s}</span>
            </label>`;

        }).join("");

    }

    atualizarLabelDropdownSubdivisaoEstoquePulmao(subdivisoes.length);

}

function atualizarLabelDropdownSubdivisaoEstoquePulmao(totalSubdivisoes){

    const label =
    document.getElementById("dropdownEstPulSubdivisaoLabel");

    if(!label) return;

    const total =
    totalSubdivisoes ??
    new Set(estoquePulmao.map(x=>x.subdivisao).filter(v=>v!=="")).size;

    const selecionadas =
    subdivisoesSelecionadasEstoquePulmao
    ? subdivisoesSelecionadasEstoquePulmao.size
    : total;

    if(!total || selecionadas === total){
        label.textContent = "Todas as subdivisões";
    } else if(selecionadas === 0){
        label.textContent = "Nenhuma subdivisão";
    } else {
        label.textContent = `${selecionadas} de ${total} subdivisões`;
    }

}

function alternarSubdivisaoEstoquePulmao(nome, marcado){

    if(!subdivisoesSelecionadasEstoquePulmao){
        subdivisoesSelecionadasEstoquePulmao = new Set();
    }

    if(marcado){
        subdivisoesSelecionadasEstoquePulmao.add(nome);
    } else {
        subdivisoesSelecionadasEstoquePulmao.delete(nome);
    }

    atualizarLabelDropdownSubdivisaoEstoquePulmao();

    aplicarFiltrosEstoquePulmao();

}

function marcarTodasSubdivisoesEstoquePulmao(marcarTudo){

    const subdivisoes =
    [...new Set(
        estoquePulmao
        .map(x=>x.subdivisao)
        .filter(v=>v !== "")
    )];

    subdivisoesSelecionadasEstoquePulmao =
    marcarTudo
    ? new Set(subdivisoes)
    : new Set();

    const lista =
    document.getElementById("dropdownEstPulSubdivisaoLista");

    if(lista){

        lista
        .querySelectorAll("input[type=checkbox]")
        .forEach(chk=> chk.checked = marcarTudo);

    }

    atualizarLabelDropdownSubdivisaoEstoquePulmao();

    aplicarFiltrosEstoquePulmao();

}

function alternarDropdownSubdivisaoEstoquePulmao(evento){

    evento.stopPropagation();

    const dropdown =
    document.getElementById("dropdownEstPulSubdivisao");

    if(!dropdown) return;

    const jaAberto =
    dropdown.classList.contains("aberto");

    dropdown.classList.toggle("aberto", !jaAberto);

    if(!jaAberto){

        setTimeout(()=>{

            document.addEventListener(
                "click",
                function fecharAoClicarFora(e){

                    if(!dropdown.contains(e.target)){

                        dropdown.classList.remove("aberto");

                        document.removeEventListener(
                            "click",
                            fecharAoClicarFora
                        );

                    }

                }
            );

        }, 0);

    }

}

function abrirModalEstoquePulmao(){

    const modal =
    document.getElementById("modalEstoquePulmao");

    if(!modal){

        alert(
            "Modal de Estoque Pulmão não encontrado no HTML."
        );

        return;

    }

    const campoRua = document.getElementById("filtroEstPulRua");
    const campoEndereco = document.getElementById("filtroEstPulEndereco");
    const campoPavilhao = document.getElementById("filtroEstPulPavilhao");
    const campoStatus = document.getElementById("filtroEstPulStatus");

    if(campoRua) campoRua.value = "";
    if(campoEndereco) campoEndereco.value = "";
    if(campoPavilhao) campoPavilhao.value = "";

    // Abre já filtrado por "Disponível" — é o uso principal desta
    // tela — mas o usuário pode trocar pra ver outros status.
    if(campoStatus) campoStatus.value = "DISPONIVEL";

    document
    .getElementById("dropdownEstPulSubdivisao")
    ?.classList.remove("aberto");

    const filtrados =
    obterEstoquePulmaoFiltrados();

    atualizarKPIsEstoquePulmao(filtrados);

    renderizarTabelaEstoquePulmao(filtrados);

    modal.classList.add("ativo");

}

function fecharModalEstoquePulmao(){

    document
    .getElementById("modalEstoquePulmao")
    .classList.remove("ativo");

}

function atualizarKPIsEstoquePulmao(dados){

    document.getElementById("estPulTotal").innerText =
    dados.length;

    document.getElementById("estPulDisponiveis").innerText =
    dados.filter(x=>x.statusNorm === "DISPONIVEL").length;

    document.getElementById("estPulOcupados").innerText =
    dados.filter(x=>x.statusNorm === "OCUPADO").length;

    document.getElementById("estPulRuas").innerText =
    new Set(
        dados.map(x=>x.rua)
    ).size;

}

const LIMITE_LINHAS_TABELA_ESTPUL = 3000;

function renderizarTabelaEstoquePulmao(dados){

    const tbody =
    document.getElementById("tbodyEstPul");

    if(!tbody) return;

    if(!dados.length){

        tbody.innerHTML =
        `<tr><td colspan="7" style="text-align:center;padding:30px;color:#6b7280;">
        Nenhum endereço encontrado com os critérios atuais.
        </td></tr>`;

        return;

    }

    const excedeLimite =
    dados.length > LIMITE_LINHAS_TABELA_ESTPUL;

    const dadosParaExibir =
    excedeLimite
    ? dados.slice(0, LIMITE_LINHAS_TABELA_ESTPUL)
    : dados;

    const linhas =
    dadosParaExibir.map(item=>

        `<tr>
            <td>${item.endereco}</td>
            <td>${item.deposito || "—"}</td>
            <td>${item.pavilhao || "—"}</td>
            <td>${item.subdivisao || "—"}</td>
            <td>${String(item.rua).padStart(3,"0")}</td>
            <td>${item.status || "—"}</td>
            <td style="font-size:.75rem;color:var(--text-muted);">${item.altura || "—"}</td>
        </tr>`

    );

    if(excedeLimite){

        linhas.push(
            `<tr><td colspan="7" style="text-align:center;padding:16px;color:var(--amber);">
            Mostrando ${LIMITE_LINHAS_TABELA_ESTPUL.toLocaleString("pt-BR")} de
            ${dados.length.toLocaleString("pt-BR")} endereços. Use os filtros
            (rua, status, altura ou endereço) para refinar a busca.
            </td></tr>`
        );

    }

    tbody.innerHTML = linhas.join("");

}

function obterEstoquePulmaoFiltrados(){

    const alturaFiltro =
    document.getElementById("filtroEstPulAltura")?.value || "";

    const statusFiltro =
    document.getElementById("filtroEstPulStatus")?.value || "";

    const pavilhaoFiltro =
    document.getElementById("filtroEstPulPavilhao")?.value || "";

    const ruaFiltro =
    (document.getElementById("filtroEstPulRua")?.value || "")
    .toLowerCase()
    .trim();

    const enderecoFiltro =
    (document.getElementById("filtroEstPulEndereco")?.value || "")
    .toLowerCase()
    .trim();

    return estoquePulmao.filter(item=>{

        const alturaOk =
        !alturaFiltro || item.altura === alturaFiltro;

        const statusOk =
        !statusFiltro || item.statusNorm === statusFiltro;

        const pavilhaoOk =
        !pavilhaoFiltro || item.pavilhao === pavilhaoFiltro;

        const subdivisaoOk =
        !subdivisoesSelecionadasEstoquePulmao ||
        item.subdivisao === "" ||
        subdivisoesSelecionadasEstoquePulmao.has(item.subdivisao);

        const ruaOk =
        !ruaFiltro ||
        String(item.rua)
        .toLowerCase()
        .includes(ruaFiltro);

        const enderecoOk =
        !enderecoFiltro ||
        item.endereco
        .toLowerCase()
        .includes(enderecoFiltro);

        return alturaOk && statusOk && pavilhaoOk && subdivisaoOk && ruaOk && enderecoOk;

    });

}

function aplicarFiltrosEstoquePulmao(){

    const filtrados =
    obterEstoquePulmaoFiltrados();

    atualizarKPIsEstoquePulmao(filtrados);

    renderizarTabelaEstoquePulmao(filtrados);

}

function imprimirEstoquePulmaoModal(){

    const dadosFiltrados =
    obterEstoquePulmaoFiltrados();

    if(!dadosFiltrados.length){

        alert(
            "Nenhum item para imprimir com os filtros atuais."
        );

        return;

    }

    const janela = window.open("", "_blank");

    if(!janela){

        alert("Permita pop-ups para este site.");

        return;

    }

    imprimirEstoquePulmao(
        janela,
        dadosFiltrados
    );

}

// =====================================
// IMPRIMIR ESTOQUE PULMÃO
// =====================================

function imprimirEstoquePulmao(janela, dadosBase){

    const dados =
    dadosBase || estoquePulmao;

    if(!dados.length){

        alert("Nenhum item para imprimir.");

        return;

    }

    let html = `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Estoque Pulmão</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm 8mm 14mm 8mm;

}

*{

    box-sizing:border-box;

}

body{

    font-family:Arial,Helvetica,sans-serif;

    margin:0;

    color:#222;

}

h1{

    margin:0;

    text-align:center;

    color:#0F4C81;

    font-size:22px;

}

.info{

    display:flex;

    justify-content:space-between;

    margin:15px 0;

    font-size:13px;

}

table{

    width:100%;

    border-collapse:collapse;

}

th{

    background:#0F4C81;

    color:#fff;

    padding:10px;

    border:1px solid #DDD;

    font-size:12px;

}

td{

    border:1px solid #DDD;

    padding:8px;

    font-size:11px;

}

@media print{

    th{

        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<h1>

🔵 ESTOQUE PULMÃO — DISPONIBILIDADE POR ALTURA

</h1>

<div class="info">

<div>

<b>Data:</b>

${new Date().toLocaleString("pt-BR")}

</div>

<div>

<b>Total:</b>

${dados.length}

</div>

</div>

<table>

<thead>

<tr>

<th>Endereço</th>

<th>Depósito</th>

<th>Pavilhão</th>

<th>Subdivisão</th>

<th>Rua</th>

<th>Status</th>

<th>Altura (TIPEND Pulmão)</th>

</tr>

</thead>

<tbody>

`;

    dados.forEach(item=>{

        html += `

<tr>

<td>

<b>${item.endereco}</b>

</td>

<td>

${item.deposito || "—"}

</td>

<td>

${item.pavilhao || "—"}

</td>

<td>

${item.subdivisao || "—"}

</td>

<td style="text-align:center;">

${String(item.rua).padStart(3,"0")}

</td>

<td>

${item.status || "—"}

</td>

<td style="text-align:center;font-size:9px;color:#666;">

${item.altura || "—"}

</td>

</tr>

`;

    });

    html += `

</tbody>

</table>

<script>
window.PagedConfig = {
    after: () => {
        window.focus();
        window.print();
    }
};
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

</body>

</html>

`;

    janela.document.open();

    janela.document.write(html);

    janela.document.close();

}
