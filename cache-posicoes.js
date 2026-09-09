// ========================================================
// ========================================================
// CACHE LOCAL — POSIÇÃO DE ENDEREÇOS (IndexedDB)
//
// A Posição de Endereços é um arquivo pesado que muda pouco
// (o usuário atualiza só de vez em quando — periodicamente).
// Depois da primeira vez que ele é processado, os dados já
// lidos ficam salvos no navegador (IndexedDB, sem limite de
// ~5MB do localStorage). Nas próximas vezes que a página for
// aberta, ele é recarregado sozinho — não é preciso selecionar
// o arquivo de novo.
//
// O Estoque Pulmão NÃO entra nesse cache: ele continua exigindo
// upload manual toda vez, porque muda várias vezes ao dia.
//
// Reaproveita a variável global `dadosPosicoes` já existente em
// script.js — este arquivo só cuida de persistir/restaurar ela.
// ========================================================
// ========================================================

const POSICOES_DB_NAME = "gerador-abastecimento-posicoes-db";
const POSICOES_STORE_NAME = "cache";
const POSICOES_CACHE_KEY = "posicoesAtuais";

// ---------- IndexedDB: abrir / salvar / carregar / limpar ----------

function posicoesAbrirDB(){

    return new Promise((resolve, reject)=>{

        const req = indexedDB.open(POSICOES_DB_NAME, 1);

        req.onupgradeneeded = ()=>
        req.result.createObjectStore(POSICOES_STORE_NAME);

        req.onsuccess = ()=> resolve(req.result);

        req.onerror = ()=> reject(req.error);

    });

}

async function posicoesSalvarCache(nomeArquivo, dados){

    const db = await posicoesAbrirDB();

    return new Promise((resolve, reject)=>{

        const tx = db.transaction(POSICOES_STORE_NAME, "readwrite");

        tx.objectStore(POSICOES_STORE_NAME).put(
            {
                nome: nomeArquivo,
                dados: dados,
                salvoEm: Date.now()
            },
            POSICOES_CACHE_KEY
        );

        tx.oncomplete = resolve;

        tx.onerror = ()=> reject(tx.error);

    });

}

async function posicoesCarregarCache(){

    const db = await posicoesAbrirDB();

    return new Promise((resolve, reject)=>{

        const tx = db.transaction(POSICOES_STORE_NAME, "readonly");

        const req =
        tx.objectStore(POSICOES_STORE_NAME).get(POSICOES_CACHE_KEY);

        req.onsuccess = ()=> resolve(req.result || null);

        req.onerror = ()=> reject(req.error);

    });

}

async function posicoesLimparCache(){

    const db = await posicoesAbrirDB();

    return new Promise((resolve, reject)=>{

        const tx = db.transaction(POSICOES_STORE_NAME, "readwrite");

        tx.objectStore(POSICOES_STORE_NAME).delete(POSICOES_CACHE_KEY);

        tx.oncomplete = resolve;

        tx.onerror = ()=> reject(tx.error);

    });

}

// ---------- UI ----------

function posicoesFormatarData(timestamp){

    return new Date(timestamp).toLocaleString("pt-BR");

}

function posicoesAtualizarBadgeUI(nomeArquivo, salvoEm){

    const el = document.getElementById("nomePosicoes");

    if(!el) return;

    el.innerHTML =
        "💾 " + nomeArquivo +
        "<br>" +
        "<span class=\"upload-nome-salvo\">" +
        "Salvo em " + posicoesFormatarData(salvoEm) +
        " — não precisa selecionar de novo" +
        "</span>";

    const btnEsquecer =
    document.getElementById("btnEsquecerPosicoes");

    if(btnEsquecer) btnEsquecer.style.display = "inline-block";

}

// Chamado pelo botão "Trocar / remover arquivo salvo" no HTML.
async function posicoesEsquecerArquivoSalvo(){

    const confirmar = confirm(
        "Remover a Posição de Endereços salva?\n\n" +
        "Você vai precisar selecionar o arquivo de novo para " +
        "usar Endereços Disponíveis, Liberação 2.10 etc."
    );

    if(!confirmar) return;

    await posicoesLimparCache();

    dadosPosicoes = [];

    const el = document.getElementById("nomePosicoes");

    if(el) el.innerText = "Nenhum arquivo selecionado";

    const btnEsquecer =
    document.getElementById("btnEsquecerPosicoes");

    if(btnEsquecer) btnEsquecer.style.display = "none";

}

// ---------- Restauração automática ao abrir a página ----------

(async function posicoesTentarRestaurar(){

    try{

        const cache = await posicoesCarregarCache();

        if(!cache || !cache.dados || !cache.dados.length) return;

        dadosPosicoes = cache.dados;

        posicoesAtualizarBadgeUI(cache.nome, cache.salvoEm);

        if(typeof popularFiltroPavilhao === "function"){

            popularFiltroPavilhao();

        }

    }catch(erro){

        console.error(
            "Erro ao restaurar Posição de Endereços salva:",
            erro
        );

    }

})();
