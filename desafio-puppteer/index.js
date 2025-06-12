const pup = require('puppeteer');
const fs = require('fs');
const url = "https://www.adidas.com.br/calcados";

(async () => {
  const browser = await pup.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Aceita cookies (se aparecer)
  try {
    await page.waitForSelector('#glass-gdpr-default-consent-accept-button', { timeout: 5000 });
    await page.click('#glass-gdpr-default-consent-accept-button');
  } catch (e) {
    console.log("Botão de cookies não apareceu.");
  }

  let numPage = 1;
  const todosDados = [];

  while (true) {
    console.log(`Coletando dados da página ${numPage}...`);

    // Espera os produtos carregarem
    await page.waitForSelector('.product-card_product-card-content___bjeq');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Aguarda 10 segundos


    // Extrai os produtos da página atual
    const produtos = await page.$$eval('.product-card_product-card-content___bjeq', (cards) => {
      return cards.map((card) => {
        const nome = card.querySelector('.product-card-description_name__xHvJ2')?.innerText || null;
        const preco = card.querySelector('._priceComponent_1dbqy_14')?.innerText || null;
        const categoria = card.querySelector('.product-card-description_info__z_CcT')?.innerText || null;
        const imgUrl = card.querySelector('img')?.src || null;
        return { nome, preco, categoria, imgUrl };
      });
    });

    // Adiciona os dados coletados ao array geral
    todosDados.push(...produtos);
    console.log(`${produtos.length} produtos coletados.`);

 const btnmodal = await page.$('#gl-modal__close-mf-account-portal'); 
    if (btnmodal) 
      {
      await btnmodal.click();
    }


    // Tenta encontrar o botão "próximo"
    const btnProximo = await page.$('a[data-testid="pagination-next-button"]');
    if (!btnProximo) {
      console.log('Última página alcançada.');
      break; // Encerra o loop se não há mais páginas
    }

    // Salva URL atual e aguarda a próxima página
    const currentUrl = page.url();
    await Promise.all([
      btnProximo.click(),
      page.waitForFunction((oldUrl) => window.location.href !== oldUrl, {}, currentUrl)
    ]);

    numPage++;
  }

  // Salva os dados no arquivo JSON
  fs.writeFileSync('Dados.json', JSON.stringify(todosDados, null, 2), 'utf-8');
  console.log(`Dados de ${todosDados.length} produtos salvos em: Dados.json`);

  await browser.close();
})();
